import { AUTH_ERRORS } from '@/modules/auth/auth.errors'
import { AuthenticatedRequest, CurrentAuthType } from '@/modules/auth/session/session.types'
import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { AppException } from '../exceptions/app.exception'

export const CurrentAuth = createParamDecorator(
  /**
   * 从守卫写入的请求上下文提取当前身份，作为控制器方法参数。
   * @throws 上下文缺少身份时抛出认证上下文缺失错误。
   */
  (_data: unknown, context: ExecutionContext): CurrentAuthType => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()

    if (!request.auth) {
      throw new AppException(AUTH_ERRORS.CONTEXT_MISSING)
    }

    return request.auth
  },
)
