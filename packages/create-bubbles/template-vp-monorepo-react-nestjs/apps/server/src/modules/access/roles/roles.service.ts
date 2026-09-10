import { Injectable } from '@nestjs/common'
import { and, count, desc, eq, sql } from 'drizzle-orm'
import { rolePermissions, roles, userRoles } from '@/database/schema'
import type {
  AccessScope,
  CreateRoleRequest,
  PageQuery,
  PermissionTreeResult,
  RoleRecord,
  SetRolePermissionsRequest,
  UpdateRoleRequest,
} from 'shared/types'
import { ACCESS_CATALOG_VERSION, ACCESS_PERMISSION_CATALOG } from 'shared/utils'
import { AppException } from '@/common/exceptions/app.exception'
import { AccessService, type AccessActor, type VerifiedAccess } from '../access.service'
import { ACCESS_ERRORS } from '../access.errors'
import {
  checkVersion,
  pageWindow,
  requireFound,
  scopeColumns,
  scopeFilter,
  searchSql,
  toScope,
  type AccessDb,
  type AccessTx,
} from '../access.store'

@Injectable()
export class RolesService {
  constructor(private readonly access: AccessService) {}
  readPermissions(scope: AccessScope) {
    return [
      `${scope.type}.roles.read`,
      scope.type === 'platform' ? 'platform.accounts.roles' : `${scope.type}.members.roles`,
    ]
  }
  async record(db: AccessDb, access: VerifiedAccess, id: string): Promise<RoleRecord> {
    const [row] = await db
      .select()
      .from(roles)
      .where(and(scopeFilter(access.scope), eq(roles.id, id)))
    const role = requireFound(row)
    const grants = await db
      .select()
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, role.id))
    const members = await db.select().from(userRoles).where(eq(userRoles.roleId, role.id))
    const permissionKeys = grants.map((p) => p.permissionKey)
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      scope: toScope(role),
      builtin: role.builtin,
      permissionKeys,
      version: role.version,
      memberCount: members.length,
      assignable:
        role.builtin === 'administrator'
          ? !!access.administrator
          : permissionKeys.every((p) => access.permissionKeys.includes(p)),
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
    }
  }
  validatePermissions(access: VerifiedAccess, keys: string[]) {
    for (const key of keys) {
      const p = ACCESS_PERMISSION_CATALOG.find((p) => p.key === key)
      if (
        !p ||
        p.scopeType !== access.scope.type ||
        p.adminOnly ||
        p.deprecated ||
        (p.pagePermissionKey && !keys.includes(p.pagePermissionKey))
      )
        throw new AppException(ACCESS_ERRORS.INVALID_PERMISSION_SET)
      if (!access.permissionKeys.includes(key)) throw new AppException(ACCESS_ERRORS.FORBIDDEN)
    }
  }
  async replacePermissions(tx: AccessTx, roleId: string, permissionKeys: string[]) {
    await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId))
    if (permissionKeys.length)
      await tx
        .insert(rolePermissions)
        .values(permissionKeys.map((permissionKey) => ({ roleId, permissionKey })))
  }
  list(input: { actor: AccessActor; scope: AccessScope; query: PageQuery }) {
    return this.access.read(
      { ...input, permission: this.readPermissions(input.scope) },
      async (tx, access) => {
        const { page, pageSize, offset } = pageWindow(input.query)
        const condition = and(scopeFilter(input.scope), searchSql([roles.name], input.query.query))
        const [total] = await tx.select({ value: count() }).from(roles).where(condition)
        const selected = await tx
          .select()
          .from(roles)
          .where(condition)
          .orderBy(desc(roles.createdAt), desc(roles.id))
          .limit(pageSize)
          .offset(offset)
        return {
          page,
          pageSize,
          total: total!.value,
          items: await Promise.all(selected.map((r) => this.record(tx, access, r.id))),
        }
      },
    )
  }
  get(input: { actor: AccessActor; scope: AccessScope; roleId: string }) {
    return this.access.read(
      { ...input, permission: this.readPermissions(input.scope) },
      (tx, access) => this.record(tx, access, input.roleId),
    )
  }
  permissions(input: { actor: AccessActor; scope: AccessScope }) {
    return this.access.read(
      { ...input, permission: this.readPermissions(input.scope) },
      async (_tx, access): Promise<PermissionTreeResult> => ({
        catalogVersion: ACCESS_CATALOG_VERSION,
        items: access.allMenus,
        permissions: ACCESS_PERMISSION_CATALOG.filter((p) => p.scopeType === input.scope.type).map(
          (p) => ({ ...p }),
        ),
        grantablePermissionKeys: ACCESS_PERMISSION_CATALOG.filter(
          (p) =>
            p.scopeType === input.scope.type &&
            !p.adminOnly &&
            !p.deprecated &&
            access.permissionKeys.includes(p.key),
        ).map((p) => p.key),
      }),
    )
  }
  create(input: { actor: AccessActor; scope: AccessScope; body: CreateRoleRequest }) {
    return this.access.write(
      { ...input, permission: `${input.scope.type}.roles.create` },
      async (tx, access) => {
        this.validatePermissions(access, input.body.permissionKeys ?? [])
        const [existing] = await tx
          .select()
          .from(roles)
          .where(and(scopeFilter(input.scope), eq(roles.name, input.body.name)))
        if (existing) throw new AppException(ACCESS_ERRORS.DUPLICATE_RESOURCE)
        const [role] = await tx
          .insert(roles)
          .values({
            ...scopeColumns(input.scope),
            name: input.body.name,
            description: input.body.description ?? '',
          })
          .returning()
        await this.replacePermissions(tx, role!.id, input.body.permissionKeys ?? [])
        await this.access.audit(tx, {
          ...input,
          access,
          action: 'role.create',
          objectType: 'role',
          objectId: role!.id,
          summary: { permissionKeys: input.body.permissionKeys ?? [] },
        })
        return this.record(tx, access, role!.id)
      },
    )
  }
  change(input: {
    actor: AccessActor
    scope: AccessScope
    roleId: string
    body: UpdateRoleRequest | SetRolePermissionsRequest | { expectedVersion: number }
    action: 'update' | 'permissions' | 'delete'
  }) {
    return this.access.write(
      { ...input, permission: `${input.scope.type}.roles.${input.action}` },
      async (tx, access) => {
        const role = await this.record(tx, access, input.roleId)
        if (role.builtin) throw new AppException(ACCESS_ERRORS.BUILTIN_ROLE_IMMUTABLE)
        checkVersion(role.version, input.body.expectedVersion)
        if (input.action === 'delete') {
          if (role.memberCount) throw new AppException(ACCESS_ERRORS.RESOURCE_IN_USE)
          await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, role.id))
          await tx.delete(roles).where(and(scopeFilter(input.scope), eq(roles.id, role.id)))
        } else {
          if ('permissionKeys' in input.body) {
            this.validatePermissions(access, input.body.permissionKeys)
            await this.replacePermissions(tx, role.id, input.body.permissionKeys)
          }
          if ('name' in input.body && input.body.name !== undefined) {
            const [existing] = await tx
              .select()
              .from(roles)
              .where(and(scopeFilter(input.scope), eq(roles.name, input.body.name)))
            if (existing && existing.id !== role.id)
              throw new AppException(ACCESS_ERRORS.DUPLICATE_RESOURCE)
          }
          const body = input.body as UpdateRoleRequest
          await tx
            .update(roles)
            .set({
              ...(body.name !== undefined ? { name: body.name } : {}),
              ...(body.description !== undefined ? { description: body.description } : {}),
              version: sql`${roles.version} + 1`,
              updatedAt: new Date(),
            })
            .where(and(scopeFilter(input.scope), eq(roles.id, role.id)))
        }
        await this.access.audit(tx, {
          ...input,
          access,
          action: `role.${input.action}`,
          objectType: 'role',
          objectId: role.id,
          summary: {
            changedFields: Object.keys(input.body).filter((k) => k !== 'expectedVersion'),
          },
        })
        return input.action === 'delete'
          ? { deleted: true as const }
          : this.record(tx, access, role.id)
      },
    )
  }
}
