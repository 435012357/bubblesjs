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
  /** 根据公司或项目作用域选择成员表；平台作用域没有成员记录，调用时拒绝访问。 */
  table(scope: AccessScope) {
    if (scope.type === 'platform') throw new AppException(ACCESS_ERRORS.NOT_FOUND)
    return scope.type === 'company' ? companyMembers : projectMembers
  }
  /** 生成公司或项目成员的作用域查询条件，平台作用域返回 undefined。 */
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

  /**
   * 查找规范化账号对应的有效用户；添加项目成员时还要求其是该公司的有效成员。
   *
   * @throws 账号不存在、停用或缺少有效公司成员关系时抛出账号不可加入异常。
   */
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

  /** 读取指定作用域内的成员详情，聚合账号状态、成员状态及直接分配的角色。 */
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

  /**
   * 在当前事务内创建或重新启用成员；新成员同时分配内置普通成员角色。
   *
   * 现有停用成员恢复时递增版本并保留原角色，调用方负责验证账号和上级成员资格。
   * @returns 已有或新建成员的标识。
   */
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

  /**
   * 验证角色属于当前作用域且授权未越权，然后全量替换用户在该作用域的角色。
   *
   * 管理员角色增删必须由管理员执行，新增普通角色的权限不得超出操作者权限。
   * 调用方负责后续版本、最后一位管理员保护和审计检查。
   */
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

  /** 在成员读取权限下分页查询当前作用域成员，按状态、姓名或账号筛选并批量聚合角色。 */
  list(input: { actor: AccessActor; scope: AccessScope; query: EntityPageQuery }) {
    return this.access.read(
      { ...input, permission: `${input.scope.type}.members.read` },
      /** 在一致性快照内分页读取成员，并批量查询本页用户的作用域角色。 */
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
        /** 将批量查询的角色映射回成员，分别保留账号状态与成员状态。 */
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
  /** 验证账号与上级成员资格后添加新成员、分配默认角色并记录审计；已有成员不重复添加。 */
  add(input: { actor: AccessActor; scope: AccessScope; body: AddMemberRequest }) {
    return this.access.write(
      { ...input, permission: `${input.scope.type}.members.add` },
      /** 将账号资格检查、成员去重、默认角色初始化和审计记录放入同一事务。 */
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
  /**
   * 在权限与版本校验后修改成员状态、替换角色或移除成员，并保护变更前有效的管理员作用域。
   *
   * 移除公司成员会同步删除其项目成员关系和公司内全部角色分配。所有数据库变更与审计同事务提交。
   * @returns 删除标记或变更后的成员详情。
   */
  change(input: {
    actor: AccessActor
    scope: AccessScope
    memberId: string
    body: StatusRequest | AssignMemberRolesRequest | { expectedVersion: number }
    action: 'status' | 'roles' | 'remove'
  }) {
    return this.access.write(
      { ...input, permission: `${input.scope.type}.members.${input.action}` },
      /** 保存变更前有效管理员范围，修改成员或角色后复核该范围并记录审计。 */
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
