import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { FastifyRequest } from 'fastify'
import {
  ACCESS_POLICY_KEY,
  type AccessPolicyDefinition,
} from '@/common/decorators/access-policy.decorator'
import { IS_PUBLIC_KEY } from '@/common/constants/auth'
import { AppException } from '@/common/exceptions/app.exception'
import { ACCESS_ERRORS } from './access.errors'
import { AccessService } from './access.service'
import { actor, ids, scopeFor } from './access-http'
import type { AccessScope } from 'shared/types'

@Injectable()
export class AccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly access: AccessService,
  ) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<FastifyRequest>()
    if (
      request.method === 'OPTIONS' ||
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ])
    )
      return true
    const policy = this.reflector.getAllAndOverride<AccessPolicyDefinition>(ACCESS_POLICY_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!policy) throw new AppException(ACCESS_ERRORS.FORBIDDEN)
    if (policy.scope === 'authenticated') return true
    const params = ids(request)
    const scope: AccessScope =
      policy.scope === 'route'
        ? scopeFor(request)
        : policy.scope === 'platform'
          ? { type: 'platform' }
          : policy.scope === 'company'
            ? { type: 'company', companyId: params.companyId! }
            : { type: 'project', companyId: params.companyId!, projectId: params.projectId! }
    const permission =
      typeof policy.permission === 'string'
        ? policy.permission.replace('{scope}', scope.type)
        : policy.permission?.map((p) => p.replace('{scope}', scope.type))
    await this.access.read(
      { actor: actor(request), scope, permission, adminOnly: policy.adminOnly },
      async () => undefined,
    )
    return true
  }
}
