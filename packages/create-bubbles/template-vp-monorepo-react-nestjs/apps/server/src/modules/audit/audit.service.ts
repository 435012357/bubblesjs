import { Injectable } from '@nestjs/common'
import { and, count, desc, eq, gte, lte } from 'drizzle-orm'
import type { AccessScope, AuditQuery, AuditRecord, PageResult } from 'shared/types'
import { auditLogs } from '@/database/schema'
import { AccessService, type AccessActor } from '@/modules/access/access.service'
import { pageWindow, searchSql, toScope } from '@/modules/access/access.store'

@Injectable()
export class AuditService {
  constructor(private readonly access: AccessService) {}

  list(input: {
    actor: AccessActor
    scope: AccessScope
    query: AuditQuery
  }): Promise<PageResult<AuditRecord>> {
    const { actor, scope, query } = input
    return this.access.read(
      { actor, scope, permission: `${scope.type}.audit.read` },
      async (tx) => {
        const scopeCondition =
          scope.type === 'platform'
            ? eq(auditLogs.scopeType, 'platform')
            : scope.type === 'company'
              ? eq(auditLogs.companyId, scope.companyId)
              : and(
                  eq(auditLogs.companyId, scope.companyId),
                  eq(auditLogs.projectId, scope.projectId),
                  eq(auditLogs.scopeType, 'project'),
                )
        const { page, pageSize, offset } = pageWindow(query)
        const condition = and(
          scopeCondition,
          query.action ? eq(auditLogs.action, query.action) : undefined,
          query.actorId ? eq(auditLogs.actorUserId, query.actorId) : undefined,
          query.from ? gte(auditLogs.createdAt, new Date(query.from)) : undefined,
          query.to ? lte(auditLogs.createdAt, new Date(query.to)) : undefined,
          searchSql([auditLogs.action, auditLogs.objectType, auditLogs.objectId], query.query),
        )
        const [total] = await tx.select({ value: count() }).from(auditLogs).where(condition)
        const rows = await tx
          .select()
          .from(auditLogs)
          .where(condition)
          .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id))
          .limit(pageSize)
          .offset(offset)
        return {
          page,
          pageSize,
          total: total!.value,
          items: rows.map((r) => ({
            id: r.id,
            actor: { id: r.actorUserId, name: r.actorName, account: r.actorAccount },
            scope: toScope(r),
            action: r.action,
            objectType: r.objectType,
            objectId: r.objectId,
            summary: r.summary,
            requestId: r.requestId,
            createdAt: r.createdAt.toISOString(),
          })),
        }
      },
    )
  }
}
