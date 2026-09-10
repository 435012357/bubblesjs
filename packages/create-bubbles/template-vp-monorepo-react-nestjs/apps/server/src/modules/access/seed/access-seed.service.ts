import { Inject, Injectable, type OnModuleInit } from '@nestjs/common'
import { DRIZZLE, type DrizzleDB } from '@/database/db.module'
import {
  accessBootstrap,
  auditLogs,
  cleanupTombstones,
  companies,
  menus,
  menuVersions,
  permissions,
  projects,
  rolePermissions,
  roles,
  userRoles,
  users,
} from '@/database/schema'
import { and, eq, sql } from 'drizzle-orm'
import type { AccessScope } from 'shared/types'
import {
  ACCESS_PERMISSION_CATALOG,
  ACCESS_PROTECTED_ROUTE_KEYS,
  getBuiltinPermissionKeys,
  normalizeAccount,
} from 'shared/utils'
import { AppException } from '@/common/exceptions/app.exception'
import { ACCESS_ERRORS } from '../access.errors'
import { lockAccess, scopeColumns, scopeFilter, type AccessTx } from '../access.store'

@Injectable()
export class AccessSeedService implements OnModuleInit {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}
  async onModuleInit() {
    await this.db.transaction(async (tx) => {
      await lockAccess(tx)
      await this.sync(tx)
    })
  }

  async ensureRoles(tx: AccessTx, scope: AccessScope) {
    for (const builtin of ['administrator', 'member'] as const) {
      await tx
        .insert(roles)
        .values({
          ...scopeColumns(scope),
          name: builtin === 'administrator' ? '内置管理员' : '内置普通成员',
          builtin,
        })
        .onConflictDoNothing()
    }
    const found = await tx.select().from(roles).where(scopeFilter(scope))
    const tombstones = new Set(
      (await tx.select().from(cleanupTombstones)).map((t) => t.permissionKey),
    )
    for (const role of found.filter((r) => r.builtin)) {
      const keys = getBuiltinPermissionKeys({
        scopeType: scope.type,
        builtin: role.builtin!,
      }).filter((k) => !tombstones.has(k))
      const current = await tx
        .select()
        .from(rolePermissions)
        .where(eq(rolePermissions.roleId, role.id))
      const additions = keys.filter((k) => !current.some((p) => p.permissionKey === k))
      if (additions.length) {
        await tx
          .insert(rolePermissions)
          .values(additions.map((permissionKey) => ({ roleId: role.id, permissionKey })))
          .onConflictDoNothing()
        await tx
          .update(roles)
          .set({ version: sql`${roles.version} + 1`, updatedAt: new Date() })
          .where(eq(roles.id, role.id))
      }
    }
    return found.filter((r) => r.builtin)
  }

  async sync(tx: AccessTx) {
    const tombstones = new Set(
      (await tx.select().from(cleanupTombstones)).map((t) => t.permissionKey),
    )
    const catalog = ACCESS_PERMISSION_CATALOG.filter((p) => !tombstones.has(p.key))
    for (const scope of ['platform', 'company', 'project'] as const)
      await tx.insert(menuVersions).values({ scopeType: scope }).onConflictDoNothing()
    for (const item of catalog)
      await tx
        .insert(permissions)
        .values(item)
        .onConflictDoUpdate({ target: permissions.key, set: item })
    for (const item of catalog.filter((p) => !p.deprecated)) {
      const [existing] = await tx.select().from(menus).where(eq(menus.permissionKey, item.key))
      if (existing) continue
      const [parent] = item.pagePermissionKey
        ? await tx.select().from(menus).where(eq(menus.permissionKey, item.pagePermissionKey))
        : []
      await tx.insert(menus).values({
        scopeType: item.scopeType,
        type: item.kind,
        name: item.title,
        routeKey: item.routeKey,
        permissionKey: item.key,
        parentId: parent?.id ?? null,
        protected: (ACCESS_PROTECTED_ROUTE_KEYS as readonly string[]).includes(item.routeKey),
        sort: catalog.indexOf(item),
      })
      await tx
        .update(menuVersions)
        .set({ version: sql`${menuVersions.version} + 1` })
        .where(eq(menuVersions.scopeType, item.scopeType))
    }
    await this.ensureRoles(tx, { type: 'platform' })
    for (const company of await tx.select({ id: companies.id }).from(companies))
      await this.ensureRoles(tx, { type: 'company', companyId: company.id })
    for (const project of await tx
      .select({ id: projects.id, companyId: projects.companyId })
      .from(projects))
      await this.ensureRoles(tx, {
        type: 'project',
        companyId: project.companyId,
        projectId: project.id,
      })
  }

  async initialize(account: string) {
    return this.db.transaction(async (tx) => {
      await lockAccess(tx)
      const [user] = await tx
        .select()
        .from(users)
        .where(and(eq(users.account, normalizeAccount(account)), eq(users.status, 'active')))
        .for('share')
      if (!user) throw new AppException(ACCESS_ERRORS.INVALID_MEMBER_ACCOUNT)
      const [bootstrap] = await tx.select().from(accessBootstrap)
      if (bootstrap && bootstrap.initializedAdminUserId !== user.id)
        throw new AppException(ACCESS_ERRORS.ALREADY_INITIALIZED)
      await this.sync(tx)
      if (!bootstrap) {
        const [role] = await tx
          .select()
          .from(roles)
          .where(and(scopeFilter({ type: 'platform' }), eq(roles.builtin, 'administrator')))
        await tx.insert(userRoles).values({ userId: user.id, roleId: role!.id })
        await tx.insert(accessBootstrap).values({ id: 1, initializedAdminUserId: user.id })
        await tx.insert(auditLogs).values({
          actorUserId: user.id,
          actorAccount: user.account,
          actorName: user.name,
          scopeType: 'platform',
          action: 'access.initialize',
          objectType: 'platform',
          objectId: 'platform',
          summary: { targetUserId: user.id },
          requestId: crypto.randomUUID(),
        })
      }
      return { initialized: true, account: user.account, alreadyInitialized: !!bootstrap }
    })
  }
}
