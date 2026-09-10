import type { DrizzleDB } from '@/database/db.module'
import { and, eq, ilike, isNull, or, sql, type SQLWrapper } from 'drizzle-orm'
import { roles } from '@/database/schema'
import type { AccessScope, PageQuery } from 'shared/types'
import { AppException } from '@/common/exceptions/app.exception'
import { ACCESS_ERRORS } from './access.errors'

export type AccessTx = Parameters<Parameters<DrizzleDB['transaction']>[0]>[0]
export type AccessDb = DrizzleDB | AccessTx
export const lockAccess = (tx: AccessTx) => tx.execute(sql`select pg_advisory_xact_lock(7421, 1)`)
export const scopeColumns = (scope: AccessScope) => ({
  scopeType: scope.type,
  companyId: scope.type === 'platform' ? null : scope.companyId,
  projectId: scope.type === 'project' ? scope.projectId : null,
})
export const scopeFilter = (scope: AccessScope) =>
  and(
    eq(roles.scopeType, scope.type),
    scope.type === 'platform' ? isNull(roles.companyId) : eq(roles.companyId, scope.companyId),
    scope.type === 'project' ? eq(roles.projectId, scope.projectId) : isNull(roles.projectId),
  )
export const toScope = (row: {
  scopeType: 'platform' | 'company' | 'project'
  companyId: string | null
  projectId: string | null
}): AccessScope =>
  row.scopeType === 'platform'
    ? { type: 'platform' }
    : row.scopeType === 'company'
      ? { type: 'company', companyId: row.companyId! }
      : { type: 'project', companyId: row.companyId!, projectId: row.projectId! }
export function requireFound<T>(value: T | undefined | null): T {
  if (!value) throw new AppException(ACCESS_ERRORS.NOT_FOUND)
  return value
}
export function checkVersion(actual: number, expected: number) {
  if (actual !== expected) throw new AppException(ACCESS_ERRORS.VERSION_CONFLICT)
}
export function searchSql(columns: SQLWrapper[], query?: string) {
  return query
    ? or(...columns.map((column) => ilike(sql`${column}`, `%${query.replace(/[\\%_]/g, '\\$&')}%`)))
    : undefined
}
export function pageWindow(query: PageQuery) {
  const page = query.page ?? 1
  const pageSize = query.pageSize ?? 20
  return { page, pageSize, offset: (page - 1) * pageSize }
}
