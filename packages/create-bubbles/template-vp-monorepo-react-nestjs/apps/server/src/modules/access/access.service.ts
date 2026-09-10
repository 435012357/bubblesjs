import { Inject, Injectable } from '@nestjs/common'
import { DRIZZLE, type DrizzleDB } from '@/database/db.module'
import {
  auditLogs,
  companies,
  companyMembers,
  menus,
  menuVersions,
  projects,
  projectMembers,
  roles,
  rolePermissions,
  userRoles,
  users,
} from '@/database/schema'
import { and, eq, exists, inArray, or, sql } from 'drizzle-orm'
import { AppException } from '@/common/exceptions/app.exception'
import { AUTH_ERRORS } from '../auth/auth.errors'
import { ACCESS_ERRORS } from './access.errors'
import { lockAccess, scopeColumns, scopeFilter, type AccessDb, type AccessTx } from './access.store'
import type {
  AccessContext,
  AccessScope,
  AuditRecord,
  MenuNode,
  ScopeType,
  UserSummary,
} from 'shared/types'
import {
  ACCESS_PERMISSION_CATALOG as FUNCTION_CATALOG,
  ACCESS_CATALOG_VERSION as CATALOG_VERSION,
} from 'shared/utils'

export interface AccessActor {
  userId: string
  requestId: string
}
export interface AccessRequirement {
  actor: AccessActor
  scope: AccessScope
  permission?: string | string[]
  adminOnly?: boolean
}
export interface VerifiedAccess {
  user: UserSummary
  scope: AccessScope
  administrator: ScopeType | null
  permissionKeys: string[]
  allMenus: MenuNode[]
  menuVersion: number
}

@Injectable()
export class AccessService {
  constructor(@Inject(DRIZZLE) readonly db: DrizzleDB) {}

  async roleAssignments(db: AccessDb, scope: AccessScope, userId: string) {
    return db
      .select({ role: roles })
      .from(userRoles)
      .innerJoin(roles, eq(roles.id, userRoles.roleId))
      .where(and(eq(userRoles.userId, userId), scopeFilter(scope)))
  }

  async isAdministrator(db: AccessDb, scope: AccessScope, userId: string): Promise<boolean> {
    return this.hasAdministrator(db, scope, userId)
  }

  private async hasAdministrator(db: AccessDb, scope: AccessScope, userId?: string) {
    const companyMembership =
      scope.type === 'platform'
        ? undefined
        : exists(
            db
              .select({ value: sql`1` })
              .from(companyMembers)
              .where(
                and(
                  eq(companyMembers.companyId, scope.companyId),
                  eq(companyMembers.userId, users.id),
                  eq(companyMembers.status, 'active'),
                ),
              ),
          )
    const validRole =
      scope.type !== 'project'
        ? scopeFilter(scope)
        : or(
            scopeFilter({ type: 'company', companyId: scope.companyId }),
            and(
              scopeFilter(scope),
              exists(
                db
                  .select({ value: sql`1` })
                  .from(projectMembers)
                  .where(
                    and(
                      eq(projectMembers.companyId, scope.companyId),
                      eq(projectMembers.projectId, scope.projectId),
                      eq(projectMembers.userId, users.id),
                      eq(projectMembers.status, 'active'),
                    ),
                  ),
              ),
            ),
          )
    const [found] = await db
      .select({ id: users.id })
      .from(userRoles)
      .innerJoin(roles, eq(roles.id, userRoles.roleId))
      .innerJoin(users, eq(users.id, userRoles.userId))
      .where(
        and(
          eq(users.status, 'active'),
          eq(roles.builtin, 'administrator'),
          userId ? eq(users.id, userId) : undefined,
          companyMembership,
          validRole,
        ),
      )
      .limit(1)
    return !!found
  }

  async effectiveAdministratorScopes(
    db: AccessDb,
    options: {
      companyId?: string
      projectId?: string
      userId?: string
      platformOnly?: boolean
    } = {},
  ) {
    const scopes: AccessScope[] = [{ type: 'platform' }]
    if (!options.platformOnly) {
      const affected = options.userId
        ? await db.select().from(companyMembers).where(eq(companyMembers.userId, options.userId))
        : null
      const activeCompanies = await db
        .select()
        .from(companies)
        .where(
          and(
            eq(companies.status, 'active'),
            options.companyId ? eq(companies.id, options.companyId) : undefined,
          ),
        )
      for (const company of activeCompanies.filter(
        (c) => !affected || affected.some((m) => m.companyId === c.id),
      )) {
        if (!options.projectId) scopes.push({ type: 'company', companyId: company.id })
        const activeProjects = await db
          .select()
          .from(projects)
          .where(
            and(
              eq(projects.companyId, company.id),
              eq(projects.status, 'active'),
              options.projectId ? eq(projects.id, options.projectId) : undefined,
            ),
          )
        for (const project of activeProjects)
          scopes.push({ type: 'project', companyId: company.id, projectId: project.id })
      }
    }
    const effective: AccessScope[] = []
    for (const scope of scopes) if (await this.hasAdministrator(db, scope)) effective.push(scope)
    return { scopes, effective }
  }
  async assertAdministrators(
    db: AccessDb,
    options: {
      companyId?: string
      projectId?: string
      userId?: string
      platformOnly?: boolean
      previous?: AccessScope[]
    } = {},
  ) {
    const state = await this.effectiveAdministratorScopes(db, options)
    const expected = options.previous ?? state.scopes
    for (const scope of expected) {
      if (!state.effective.some((current) => JSON.stringify(current) === JSON.stringify(scope)))
        throw new AppException(ACCESS_ERRORS.LAST_ADMINISTRATOR)
    }
  }

  async authorize(db: AccessDb, requirement: AccessRequirement): Promise<VerifiedAccess> {
    const { actor, scope } = requirement
    const [user] = await db
      .select({ id: users.id, name: users.name, account: users.account, status: users.status })
      .from(users)
      .where(eq(users.id, actor.userId))
    if (!user || user.status !== 'active') throw new AppException(AUTH_ERRORS.SESSION_INVALID)
    const assignments = await this.roleAssignments(db, scope, user.id)
    let administrator: ScopeType | null = assignments.some(
      ({ role }) => role.builtin === 'administrator',
    )
      ? scope.type
      : null
    if (scope.type === 'platform') {
      if (!assignments.length) throw new AppException(ACCESS_ERRORS.FORBIDDEN)
    } else {
      const [company] = await db.select().from(companies).where(eq(companies.id, scope.companyId))
      const [member] = await db
        .select()
        .from(companyMembers)
        .where(
          and(eq(companyMembers.companyId, scope.companyId), eq(companyMembers.userId, user.id)),
        )
      if (!company || !member) throw new AppException(ACCESS_ERRORS.NOT_FOUND)
      if (company.status !== 'active' || member.status !== 'active')
        throw new AppException(ACCESS_ERRORS.FORBIDDEN)
      if (scope.type === 'project') {
        const [project] = await db
          .select()
          .from(projects)
          .where(and(eq(projects.companyId, scope.companyId), eq(projects.id, scope.projectId)))
        const companyAdmin = await this.isAdministrator(
          db,
          { type: 'company', companyId: scope.companyId },
          user.id,
        )
        const [projectMember] = await db
          .select()
          .from(projectMembers)
          .where(
            and(
              eq(projectMembers.companyId, scope.companyId),
              eq(projectMembers.projectId, scope.projectId),
              eq(projectMembers.userId, user.id),
            ),
          )
        if (!project || (!companyAdmin && !projectMember))
          throw new AppException(ACCESS_ERRORS.NOT_FOUND)
        if (project.status !== 'active' || (!companyAdmin && projectMember?.status !== 'active'))
          throw new AppException(ACCESS_ERRORS.FORBIDDEN)
        if (companyAdmin) administrator = 'company'
      }
    }
    const catalog = FUNCTION_CATALOG.filter((p) => p.scopeType === scope.type && !p.deprecated)
    const grants = assignments.length
      ? await db
          .select()
          .from(rolePermissions)
          .where(
            inArray(
              rolePermissions.roleId,
              assignments.map(({ role }) => role.id),
            ),
          )
      : []
    const granted = new Set(
      administrator ? catalog.map((p) => p.key) : grants.map((g) => g.permissionKey),
    )
    const menuRows = await db.select().from(menus).where(eq(menus.scopeType, scope.type))
    const byId = new Map(menuRows.map((m) => [m.id, m]))
    const enabled = (id: string): boolean => {
      const visited = new Set<string>()
      let node = byId.get(id)
      while (node) {
        if (visited.has(node.id) || node.status !== 'active') return false
        visited.add(node.id)
        node = node.parentId ? byId.get(node.parentId) : undefined
      }
      return true
    }
    const enabledKeys = new Set(
      menuRows.filter((m) => m.permissionKey && enabled(m.id)).map((m) => m.permissionKey),
    )
    const permissionKeys = catalog
      .filter(
        (p) =>
          granted.has(p.key) &&
          enabledKeys.has(p.key) &&
          (!p.pagePermissionKey ||
            (granted.has(p.pagePermissionKey) && enabledKeys.has(p.pagePermissionKey))),
      )
      .map((p) => p.key)
    if (requirement.adminOnly && !administrator) throw new AppException(ACCESS_ERRORS.FORBIDDEN)
    const needed =
      typeof requirement.permission === 'string' ? [requirement.permission] : requirement.permission
    if (needed && !needed.some((key) => permissionKeys.includes(key)))
      throw new AppException(ACCESS_ERRORS.FORBIDDEN)
    const [version] = await db
      .select()
      .from(menuVersions)
      .where(eq(menuVersions.scopeType, scope.type))
    return {
      user: { id: user.id, name: user.name, account: user.account },
      scope,
      administrator,
      permissionKeys,
      menuVersion: version?.version ?? 1,
      allMenus: this.tree(menuRows),
    }
  }

  tree(rows: Omit<MenuNode, 'children'>[]): MenuNode[] {
    const build = (parentId: string | null): MenuNode[] =>
      rows
        .filter((m) => m.parentId === parentId)
        .sort((a, b) => a.sort - b.sort || a.id.localeCompare(b.id))
        .map((m) => ({
          id: m.id,
          scopeType: m.scopeType,
          parentId: m.parentId,
          type: m.type,
          name: m.name,
          icon: m.icon,
          sort: m.sort,
          hidden: m.hidden,
          status: m.status,
          routeKey: m.routeKey,
          permissionKey: m.permissionKey,
          protected: m.protected,
          children: build(m.id),
        }))
    return build(null)
  }

  context(access: VerifiedAccess): AccessContext {
    const filter = (nodes: MenuNode[]): MenuNode[] =>
      nodes
        .filter(
          (m) =>
            m.status === 'active' &&
            !m.hidden &&
            (!m.permissionKey || access.permissionKeys.includes(m.permissionKey)),
        )
        .map((m) => ({ ...m, children: filter(m.children) }))
        .filter((m) => m.type !== 'directory' || m.children.length > 0)
    return {
      user: access.user,
      scope: access.scope,
      administrator: access.administrator,
      permissionKeys: access.permissionKeys,
      menus: filter(access.allMenus),
      menuVersion: access.menuVersion,
      catalogVersion: CATALOG_VERSION,
    }
  }

  read<T>(
    requirement: AccessRequirement,
    operation: (tx: AccessTx, access: VerifiedAccess) => Promise<T>,
  ) {
    return this.db.transaction(async (tx) => operation(tx, await this.authorize(tx, requirement)), {
      isolationLevel: 'repeatable read',
      accessMode: 'read only',
    })
  }
  write<T>(
    requirement: AccessRequirement,
    operation: (tx: AccessTx, access: VerifiedAccess) => Promise<T>,
  ) {
    return this.db.transaction(async (tx) => {
      await lockAccess(tx)
      return operation(tx, await this.authorize(tx, requirement))
    })
  }
  async audit(
    tx: AccessTx,
    input: {
      actor: AccessActor
      access: VerifiedAccess
      action: string
      objectType: string
      objectId: string
      summary?: AuditRecord['summary']
    },
  ) {
    await tx.insert(auditLogs).values({
      ...scopeColumns(input.access.scope),
      actorUserId: input.access.user.id,
      actorAccount: input.access.user.account,
      actorName: input.access.user.name,
      action: input.action,
      objectType: input.objectType,
      objectId: input.objectId,
      summary: input.summary ?? {},
      requestId: input.actor.requestId.slice(0, 128),
    })
  }
}
