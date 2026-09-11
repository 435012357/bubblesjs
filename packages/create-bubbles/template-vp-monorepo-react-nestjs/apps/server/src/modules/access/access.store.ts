import type { DrizzleDB } from '@/database/db.module'
import { and, eq, ilike, isNull, or, sql, type SQLWrapper } from 'drizzle-orm'
import { roles } from '@/database/schema'
import type { AccessScope, PageQuery } from 'shared/types'
import { AppException } from '@/common/exceptions/app.exception'
import { ACCESS_ERRORS } from './access.errors'

export type AccessTx = Parameters<Parameters<DrizzleDB['transaction']>[0]>[0]
export type AccessDb = DrizzleDB | AccessTx
/** 获取权限域的 PostgreSQL 事务级咨询锁，串行化权限相关写操作，事务结束时自动释放。 */
export const lockAccess = (tx: AccessTx) => tx.execute(sql`select pg_advisory_xact_lock(7421, 1)`)
/** 将访问作用域转换为数据库列，未适用的公司或项目标识写为 null。 */
export const scopeColumns = (scope: AccessScope) => ({
  scopeType: scope.type,
  companyId: scope.type === 'platform' ? null : scope.companyId,
  projectId: scope.type === 'project' ? scope.projectId : null,
})
/** 构造角色表的精确作用域条件，使用空值约束隔离平台、公司和项目角色。 */
export const scopeFilter = (scope: AccessScope) =>
  and(
    eq(roles.scopeType, scope.type),
    scope.type === 'platform' ? isNull(roles.companyId) : eq(roles.companyId, scope.companyId),
    scope.type === 'project' ? eq(roles.projectId, scope.projectId) : isNull(roles.projectId),
  )
/** 将数据库中的作用域列还原为访问作用域对象，依赖行数据满足作用域完整性约束。 */
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
/** 要求资源存在并返回原值；查询未命中时抛出统一资源不存在异常。 */
export function requireFound<T>(value: T | undefined | null): T {
  if (!value) throw new AppException(ACCESS_ERRORS.NOT_FOUND)
  return value
}
/**
 * 比较数据库版本与客户端预期版本，阻止过期数据覆盖后续修改。
 *
 * @throws 版本不一致时抛出版本冲突异常。
 */
export function checkVersion(actual: number, expected: number) {
  if (actual !== expected) throw new AppException(ACCESS_ERRORS.VERSION_CONFLICT)
}
/**
 * 构造多列忽略大小写的包含搜索条件，并转义关键词中的 SQL 通配符。
 *
 * @returns 各列之间以 OR 连接的条件；没有关键词时返回 undefined。
 */
export function searchSql(columns: SQLWrapper[], query?: string) {
  return query
    ? or(...columns.map((column) => ilike(sql`${column}`, `%${query.replace(/[\\%_]/g, '\\$&')}%`)))
    : undefined
}
/**
 * 根据分页参数计算查询窗口，缺省使用第 1 页、每页 20 条。
 *
 * @returns 页码、每页数量及数据库查询偏移量。
 */
export function pageWindow(query: PageQuery) {
  const page = query.page ?? 1
  const pageSize = query.pageSize ?? 20
  return { page, pageSize, offset: (page - 1) * pageSize }
}
