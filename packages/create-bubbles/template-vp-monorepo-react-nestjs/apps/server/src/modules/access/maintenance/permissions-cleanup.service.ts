import { Injectable } from '@nestjs/common'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { z } from 'zod'
import { eq, inArray, sql } from 'drizzle-orm'
import {
  cleanupTombstones,
  menus,
  menuVersions,
  permissions,
  rolePermissions,
  roles,
} from '@/database/schema'
import type { CleanupPreview, CleanupRequest, CleanupResult } from 'shared/types'
import { ACCESS_CATALOG_VERSION, ACCESS_PERMISSION_CATALOG } from 'shared/utils'
import { AppException } from '@/common/exceptions/app.exception'
import { AccessService, type AccessActor } from '../access.service'
import { ACCESS_ERRORS } from '../access.errors'
import type { AccessDb } from '../access.store'

const proofSchema = z.strictObject({
  deploymentId: z.string().min(1).max(150),
  completed: z.literal(true),
  verifiedAt: z.iso.datetime(),
  expiresAt: z.iso.datetime(),
  serviceVersions: z
    .array(
      z.strictObject({
        version: z.string().min(1),
        instanceIds: z.array(z.string().min(1)).min(1),
        requiredPermissionKeys: z.array(z.string().min(1)),
      }),
    )
    .min(1),
})
@Injectable()
export class PermissionsCleanupService {
  constructor(private readonly access: AccessService) {}
  async proof() {
    const path = process.env.ACCESS_DEPLOYMENT_PROOF_FILE
    if (!path) return null
    // 证明缺失/格式失效是明确的维护阻断，不能降级为允许清理。
    try {
      const raw = await readFile(path, 'utf8')
      const proof = proofSchema.parse(JSON.parse(raw))
      const now = Date.now()
      if (
        Date.parse(proof.verifiedAt) > now ||
        Date.parse(proof.expiresAt) <= now ||
        Date.parse(proof.expiresAt) - Date.parse(proof.verifiedAt) > 86_400_000
      )
        return null
      const versions = proof.serviceVersions.map((v) => v.version)
      const instances = proof.serviceVersions.flatMap((v) => v.instanceIds)
      if (
        new Set(versions).size !== versions.length ||
        new Set(instances).size !== instances.length
      )
        return null
      const current = proof.serviceVersions.find(
        (v) => v.version === (process.env.ACCESS_RELEASE_VERSION ?? ACCESS_CATALOG_VERSION),
      )
      const expected = ACCESS_PERMISSION_CATALOG.filter((p) => !p.deprecated)
        .map((p) => p.key)
        .sort()
      if (
        !current ||
        JSON.stringify([...current.requiredPermissionKeys].sort()) !== JSON.stringify(expected)
      )
        return null
      if (
        proof.serviceVersions.some(
          (v) =>
            new Set(v.requiredPermissionKeys).size !== v.requiredPermissionKeys.length ||
            v.requiredPermissionKeys.some(
              (k) => !ACCESS_PERMISSION_CATALOG.some((p) => p.key === k),
            ),
        )
      )
        return null
      return { proof, digest: createHash('sha256').update(raw).digest('hex') }
    } catch (error) {
      if (
        error instanceof SyntaxError ||
        error instanceof z.ZodError ||
        (error instanceof Error &&
          'code' in error &&
          ['ENOENT', 'EACCES'].includes(String(error.code)))
      )
        return null
      throw error
    }
  }
  async inspect(db: AccessDb): Promise<CleanupPreview> {
    const proof = await this.proof()
    const tombstones = new Set(
      (await db.select().from(cleanupTombstones)).map((t) => t.permissionKey),
    )
    const candidates = ACCESS_PERMISSION_CATALOG.filter(
      (p) => p.deprecated && !tombstones.has(p.key),
    )
    const rows = await db.select().from(menus)
    const grants = await db.select().from(rolePermissions)
    const candidateKeys = new Set(candidates.map((p) => p.key))
    const items = candidates.map((p) => {
      const bound = rows.filter((m) => m.permissionKey === p.key)
      const blockedReasons: string[] = []
      if (bound.some((m) => m.status === 'active')) blockedReasons.push('功能尚未停用')
      if (bound.some((m) => m.protected)) blockedReasons.push('属于受保护管理入口')
      const hasActiveDescendant = (id: string): boolean =>
        rows
          .filter((m) => m.parentId === id)
          .some(
            (m) =>
              !m.permissionKey || !candidateKeys.has(m.permissionKey) || hasActiveDescendant(m.id),
          )
      if (bound.some((m) => hasActiveDescendant(m.id))) blockedReasons.push('存在非废弃子节点')
      if (proof?.proof.serviceVersions.some((v) => v.requiredPermissionKeys.includes(p.key)))
        blockedReasons.push('在用服务版本仍依赖此权限')
      return {
        permissionKey: p.key,
        title: p.title,
        menuIds: bound.map((m) => m.id),
        roleCount: grants.filter((g) => g.permissionKey === p.key).length,
        blockedReasons,
      }
    })
    const blockedReasons = proof ? [] : ['缺少有效且完整的部署证明']
    return {
      catalogVersion: ACCESS_CATALOG_VERSION,
      deploymentId: proof?.proof.deploymentId ?? null,
      proofDigest: proof?.digest ?? null,
      eligible:
        items.length > 0 && !blockedReasons.length && items.every((i) => !i.blockedReasons.length),
      blockedReasons,
      items,
      totals: {
        permissions: items.length,
        menus: items.reduce((n, i) => n + i.menuIds.length, 0),
        roleAssignments: items.reduce((n, i) => n + i.roleCount, 0),
      },
    }
  }
  preview(actor: AccessActor) {
    return this.access.read(
      { actor, scope: { type: 'platform' }, permission: 'platform.menus.cleanup', adminOnly: true },
      (tx) => this.inspect(tx),
    )
  }
  cleanup(actor: AccessActor, body: CleanupRequest) {
    return this.access.write(
      { actor, scope: { type: 'platform' }, permission: 'platform.menus.cleanup', adminOnly: true },
      async (tx, access): Promise<CleanupResult> => {
        const preview = await this.inspect(tx)
        if (preview.proofDigest !== body.proofDigest || preview.blockedReasons.length)
          throw new AppException(ACCESS_ERRORS.CLEANUP_BLOCKED)
        const cleaned = new Set(
          (await tx.select().from(cleanupTombstones)).map((t) => t.permissionKey),
        )
        const requested = body.permissionKeys.filter((k) => !cleaned.has(k))
        for (const key of requested) {
          const item = preview.items.find((i) => i.permissionKey === key)
          if (!item || item.blockedReasons.length)
            throw new AppException(ACCESS_ERRORS.CLEANUP_BLOCKED)
        }
        const rows = requested.length
          ? await tx.select().from(menus).where(inArray(menus.permissionKey, requested))
          : []
        const allRows = await tx.select().from(menus)
        if (
          rows.some((row) =>
            allRows.some(
              (child) => child.parentId === row.id && !rows.some((r) => r.id === child.id),
            ),
          )
        )
          throw new AppException(ACCESS_ERRORS.RESOURCE_IN_USE)
        const grants = requested.length
          ? await tx
              .select()
              .from(rolePermissions)
              .where(inArray(rolePermissions.permissionKey, requested))
          : []
        if (requested.length) {
          if (grants.length)
            await tx
              .update(roles)
              .set({ version: sql`${roles.version} + 1`, updatedAt: new Date() })
              .where(inArray(roles.id, [...new Set(grants.map((g) => g.roleId))]))
          await tx.delete(rolePermissions).where(inArray(rolePermissions.permissionKey, requested))
          const remaining = [...rows]
          while (remaining.length) {
            const leaf = remaining.find((r) => !remaining.some((child) => child.parentId === r.id))
            if (!leaf) throw new AppException(ACCESS_ERRORS.RESOURCE_IN_USE)
            await tx.delete(menus).where(eq(menus.id, leaf.id))
            remaining.splice(remaining.indexOf(leaf), 1)
          }
          await tx.delete(permissions).where(inArray(permissions.key, requested))
          await tx.insert(cleanupTombstones).values(
            requested.map((permissionKey) => ({
              permissionKey,
              deploymentId: preview.deploymentId!,
            })),
          )
          const scopes = [
            ...new Set(
              ACCESS_PERMISSION_CATALOG.filter((p) => requested.includes(p.key)).map(
                (p) => p.scopeType,
              ),
            ),
          ]
          await tx
            .update(menuVersions)
            .set({ version: sql`${menuVersions.version} + 1` })
            .where(inArray(menuVersions.scopeType, scopes))
          await this.access.audit(tx, {
            actor,
            access,
            action: 'permission.cleanup',
            objectType: 'permission',
            objectId: preview.deploymentId!,
            summary: {
              permissionKeys: requested,
              removedMenus: rows.length,
              removedRoleAssignments: grants.length,
            },
          })
        }
        return {
          removedPermissionKeys: requested,
          alreadyCleanedPermissionKeys: body.permissionKeys.filter((k) => cleaned.has(k)),
          removedMenuCount: rows.length,
          removedRoleAssignmentCount: grants.length,
        }
      },
    )
  }
}
