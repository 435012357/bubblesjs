import type { FastifyRequest } from 'fastify'
import type { AccessScope } from 'shared/types'
import type { AuthenticatedRequest } from '../auth/session/session.types'
import { idSchema, parse } from './access.validation'

export function actor(request: FastifyRequest) {
  return { userId: (request as AuthenticatedRequest).auth!.userId, requestId: request.id }
}
export function ids(request: FastifyRequest) {
  const params = request.params as Record<string, unknown>
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => [key, parse(idSchema, value)]),
  ) as Record<string, string>
}
export function scopeFor(request: FastifyRequest): AccessScope {
  const params = ids(request)
  return params.projectId
    ? { type: 'project', companyId: params.companyId!, projectId: params.projectId }
    : params.companyId
      ? { type: 'company', companyId: params.companyId }
      : { type: 'platform' }
}
