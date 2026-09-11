import type { FastifyRequest } from 'fastify'
import type { AccessScope } from 'shared/types'
import type { AuthenticatedRequest } from '../auth/session/session.types'
import { idSchema, parse } from './access.validation'

/**
 * 提取已通过会话认证的操作者和请求标识，供权限校验及审计记录使用。
 *
 * @param request - 已由认证守卫填充 auth 的请求。
 */
export function actor(request: FastifyRequest) {
  return { userId: (request as AuthenticatedRequest).auth!.userId, requestId: request.id }
}
/** 将全部路由参数按 UUID 校验并返回参数映射；非法标识由统一参数异常处理返回。 */
export function ids(request: FastifyRequest) {
  const params = request.params as Record<string, unknown>
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => [key, parse(idSchema, value)]),
  ) as Record<string, string>
}
/** 根据路由中的公司和项目标识推导访问作用域，项目作用域优先于公司作用域。 */
export function scopeFor(request: FastifyRequest): AccessScope {
  const params = ids(request)
  return params.projectId
    ? { type: 'project', companyId: params.companyId!, projectId: params.projectId }
    : params.companyId
      ? { type: 'company', companyId: params.companyId }
      : { type: 'platform' }
}
