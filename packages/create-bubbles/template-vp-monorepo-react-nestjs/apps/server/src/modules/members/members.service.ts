import { Injectable } from '@nestjs/common'
import { and, count, desc, eq, inArray, sql } from 'drizzle-orm'
import {
  companyMembers,
  projectMembers,
  rolePermissions,
  roles,
  userRoles,
  users,
} from '@/database/schema'
import { AppException } from '@/common/exceptions/app.exception'
import type {
  AccessScope,
  AddMemberRequest,
  AssignMemberRolesRequest,
  EntityPageQuery,
  MemberRecord,
  StatusRequest,
} from 'shared/types'
import { normalizeAccount } from 'shared/utils'
import {
  AccessService,
  type AccessActor,
  type VerifiedAccess,
} from '@/modules/access/access.service'
import { AccessSeedService } from '@/modules/access/seed/access-seed.service'
import { ACCESS_ERRORS } from '@/modules/access/access.errors'
import {
  checkVersion,
  pageWindow,
  requireFound,
  scopeFilter,
  searchSql,
  type AccessDb,
  type AccessTx,
} from '@/modules/access/access.store'

@Injectable()
export class MembersService {
  constructor(
    private readonly access: AccessService,
    private readonly seed: AccessSeedService,
  ) {}
  table(scope: AccessScope) {
    if (scope.type === 'platform') throw new AppException(ACCESS_ERRORS.NOT_FOUND)
    return scope.type === 'company' ? companyMembers : projectMembers
  }
  filter(scope: AccessScope) {
    return scope.type === 'company'
      ? eq(companyMembers.companyId, scope.companyId)
      : scope.type === 'project'
        ? and(
            eq(projectMembers.companyId, scope.companyId),
            eq(projectMembers.projectId, scope.projectId),
          )
        : undefined
  }

  async userForAccount(db: AccessDb, scope: AccessScope, account: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.account, normalizeAccount(account)), eq(users.status, 'active')))
    if (!user) throw new AppException(ACCESS_ERRORS.INVALID_MEMBER_ACCOUNT)
    if (scope.type === 'project') {
      const [companyMember] = await db
        .select()
        .from(companyMembers)
        .where(
          and(
            eq(companyMembers.companyId, scope.companyId),
            eq(companyMembers.userId, user.id),
            eq(companyMembers.status, 'active'),
          ),
        )
      if (!companyMember) throw new AppException(ACCESS_ERRORS.INVALID_MEMBER_ACCOUNT)
    }
    return user
  }

  async record(db: AccessDb, scope: AccessScope, memberId: string): Promise<MemberRecord> {
    const table = this.table(scope)
    const [row] = await db
      .select({
        member: table,
        user: { account: users.account, name: users.name, status: users.status },
      })
      .from(table)
      .innerJoin(users, eq(users.id, table.userId))
      .where(and(this.filter(scope), eq(table.id, memberId)))
    const { member, user } = requireFound(row)
    const assigned = await this.access.roleAssignments(db, scope, member.userId)
    return {
      id: member.id,
      userId: member.userId,
      name: user.name,
      account: user.account,
      status: member.status,
      accountStatus: user.status,
      version: member.version,
      roleIds: assigned.map((a) => a.role.id),
      roleNames: assigned.map((a) => a.role.name),
      createdAt: member.createdAt.toISOString(),
      updatedAt: member.updatedAt.toISOString(),
    }
  }

  async ensureMember(tx: AccessTx, scope: AccessScope, userId: string) {
    const table = this.table(scope)
    const [existing] = await tx
      .select()
      .from(table)
      .where(and(this.filter(scope), eq(table.userId, userId)))
    let memberId = existing?.id
    if (existing) {
      if (existing.status !== 'active')
        await tx
          .update(table)
          .set({ status: 'active', version: sql`${table.version} + 1`, updatedAt: new Date() })
          .where(eq(table.id, existing.id))
    } else {
      const values =
        scope.type === 'project'
          ? { companyId: scope.companyId, projectId: scope.projectId, userId }
          : { companyId: (scope as { companyId: string }).companyId, userId }
      const [created] =
        scope.type === 'project'
          ? await tx
              .insert(projectMembers)
              .values(values as typeof projectMembers.$inferInsert)
              .returning()
          : await tx.insert(companyMembers).values(values).returning()
      memberId = created!.id
      const builtins = await this.seed.ensureRoles(tx, scope)
      await tx
        .insert(userRoles)
        .values({ userId, roleId: builtins.find((r) => r.builtin === 'member')!.id })
        .onConflictDoNothing()
    }
    return memberId!
  }

  async validateRoleAssignment(
    tx: AccessTx,
    input: { access: VerifiedAccess; userId: string; roleIds: string[] },
  ) {
    const { access, userId, roleIds } = input
    const available = await tx.select().from(roles).where(scopeFilter(access.scope))
    if (roleIds.some((id) => !available.some((role) => role.id === id)))
      throw new AppException(ACCESS_ERRORS.NOT_FOUND)
    const previous = await this.access.roleAssignments(tx, access.scope, userId)
    const affectedAdmin = available
      .filter((r) => r.builtin === 'administrator')
      .some((r) => roleIds.includes(r.id) !== previous.some((p) => p.role.id === r.id))
    if (affectedAdmin && !access.administrator) throw new AppException(ACCESS_ERRORS.FORBIDDEN)
    const added = roleIds.filter((id) => !previous.some((p) => p.role.id === id))
    for (const id of added) {
      const role = available.find((r) => r.id === id)!
      if (role.builtin === 'administrator') {
        if (!access.administrator) throw new AppException(ACCESS_ERRORS.FORBIDDEN)
        continue
      }
      const grants = await tx.select().from(rolePermissions).where(eq(rolePermissions.roleId, id))
      if (grants.some((p) => !access.permissionKeys.includes(p.permissionKey)))
        throw new AppException(ACCESS_ERRORS.FORBIDDEN)
    }
    const scopeIds = available.map((r) => r.id)
    if (scopeIds.length)
      await tx
        .delete(userRoles)
        .where(and(eq(userRoles.userId, userId), inArray(userRoles.roleId, scopeIds)))
    if (roleIds.length)
      await tx.insert(userRoles).values(roleIds.map((roleId) => ({ roleId, userId })))
  }

  list(input: { actor: AccessActor; scope: AccessScope; query: EntityPageQuery }) {
    return this.access.read(
      { ...input, permission: `${input.scope.type}.members.read` },
      async (tx) => {
        const table = this.table(input.scope)
        const { page, pageSize, offset } = pageWindow(input.query)
        const condition = and(
          this.filter(input.scope),
          input.query.status ? eq(table.status, input.query.status) : undefined,
          searchSql([users.name, users.account], input.query.query),
        )
        const [total] = await tx
          .select({ value: count() })
          .from(table)
          .innerJoin(users, eq(users.id, table.userId))
          .where(condition)
        const rows = await tx
          .select({
            member: table,
            user: { account: users.account, name: users.name, status: users.status },
          })
          .from(table)
          .innerJoin(users, eq(users.id, table.userId))
          .where(condition)
          .orderBy(desc(table.createdAt), desc(table.id))
          .limit(pageSize)
          .offset(offset)
        const assignments = rows.length
          ? await tx
              .select({ userId: userRoles.userId, roleId: roles.id, roleName: roles.name })
              .from(userRoles)
              .innerJoin(roles, eq(roles.id, userRoles.roleId))
              .where(
                and(
                  scopeFilter(input.scope),
                  inArray(
                    userRoles.userId,
                    rows.map((r) => r.member.userId),
                  ),
                ),
              )
          : []
        const items: MemberRecord[] = rows.map(({ member, user }) => {
          const assigned = assignments.filter((a) => a.userId === member.userId)
          return {
            id: member.id,
            userId: member.userId,
            name: user.name,
            account: user.account,
            status: member.status,
            accountStatus: user.status,
            version: member.version,
            createdAt: member.createdAt.toISOString(),
            updatedAt: member.updatedAt.toISOString(),
            roleIds: assigned.map((a) => a.roleId),
            roleNames: assigned.map((a) => a.roleName),
          }
        })
        return { page, pageSize, total: total!.value, items }
      },
    )
  }
  add(input: { actor: AccessActor; scope: AccessScope; body: AddMemberRequest }) {
    return this.access.write(
      { ...input, permission: `${input.scope.type}.members.add` },
      async (tx, access) => {
        const user = await this.userForAccount(tx, input.scope, input.body.account)
        const table = this.table(input.scope)
        const [existing] = await tx
          .select()
          .from(table)
          .where(and(this.filter(input.scope), eq(table.userId, user.id)))
        if (existing) throw new AppException(ACCESS_ERRORS.DUPLICATE_RESOURCE)
        const id = await this.ensureMember(tx, input.scope, user.id)
        await this.access.audit(tx, {
          ...input,
          access,
          action: 'member.add',
          objectType: 'member',
          objectId: id,
          summary: { targetUserId: user.id },
        })
        return this.record(tx, input.scope, id)
      },
    )
  }
  change(input: {
    actor: AccessActor
    scope: AccessScope
    memberId: string
    body: StatusRequest | AssignMemberRolesRequest | { expectedVersion: number }
    action: 'status' | 'roles' | 'remove'
  }) {
    return this.access.write(
      { ...input, permission: `${input.scope.type}.members.${input.action}` },
      async (tx, access) => {
        const member = await this.record(tx, input.scope, input.memberId)
        checkVersion(member.version, input.body.expectedVersion)
        const administratorOptions = {
          companyId: input.scope.type === 'platform' ? undefined : input.scope.companyId,
          projectId: input.scope.type === 'project' ? input.scope.projectId : undefined,
        }
        const previous = (await this.access.effectiveAdministratorScopes(tx, administratorOptions))
          .effective
        const table = this.table(input.scope)
        if (input.action === 'roles')
          await this.validateRoleAssignment(tx, {
            access,
            userId: member.userId,
            roleIds: (input.body as AssignMemberRolesRequest).roleIds,
          })
        if (input.action === 'remove') {
          const affectedRoles = await tx
            .select({ id: roles.id })
            .from(roles)
            .where(
              input.scope.type === 'company'
                ? eq(roles.companyId, input.scope.companyId)
                : scopeFilter(input.scope),
            )
          if (affectedRoles.length)
            await tx.delete(userRoles).where(
              and(
                eq(userRoles.userId, member.userId),
                inArray(
                  userRoles.roleId,
                  affectedRoles.map((r) => r.id),
                ),
              ),
            )
          if (input.scope.type === 'company')
            await tx
              .delete(projectMembers)
              .where(
                and(
                  eq(projectMembers.companyId, input.scope.companyId),
                  eq(projectMembers.userId, member.userId),
                ),
              )
          await tx.delete(table).where(and(this.filter(input.scope), eq(table.id, input.memberId)))
        } else {
          await tx
            .update(table)
            .set({
              ...('status' in input.body ? { status: input.body.status } : {}),
              version: sql`${table.version} + 1`,
              updatedAt: new Date(),
            })
            .where(and(this.filter(input.scope), eq(table.id, input.memberId)))
        }
        await this.access.assertAdministrators(tx, { ...administratorOptions, previous })
        await this.access.audit(tx, {
          ...input,
          access,
          action: `member.${input.action}`,
          objectType: 'member',
          objectId: member.id,
          summary: {
            targetUserId: member.userId,
            ...('roleIds' in input.body ? { roleIds: input.body.roleIds } : {}),
            ...('status' in input.body
              ? { fromStatus: member.status, toStatus: input.body.status }
              : {}),
          },
        })
        return input.action === 'remove'
          ? { deleted: true as const }
          : this.record(tx, input.scope, member.id)
      },
    )
  }
}
