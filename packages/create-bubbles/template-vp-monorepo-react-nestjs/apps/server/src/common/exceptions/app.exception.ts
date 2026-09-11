import { HttpException, HttpStatus } from '@nestjs/common'
import { ApiErrorDetail } from 'shared/types'

const ERROR_CODE_PATTERN = /^[A-Z][A-Z0-9_]*(?:\.[A-Z][A-Z0-9_]*)+$/

export interface AppErrorDefinition<Code extends string = string> {
  readonly code: Code
  readonly publicMessage: string
  readonly status: HttpStatus
  readonly bearerChallenge?: true
}

export interface AppExceptionOptions {
  readonly cause?: unknown
  readonly details?: readonly ApiErrorDetail[]
}

/**
 * 校验业务错误码、公开文案和 HTTP 状态，并要求 401 错误声明 Bearer 质询。
 * @throws 错误定义不满足约定时抛出 TypeError。
 */
function assertErrorDefinition(definition: AppErrorDefinition): void {
  if (!ERROR_CODE_PATTERN.test(definition.code) || definition.code.length > 80) {
    throw new TypeError('Invalid application error code: ' + definition.code)
  }

  if (definition.status < 400 || definition.status > 599) {
    throw new TypeError('Application error status must be between 400 and 599')
  }

  if (!definition.publicMessage.trim()) {
    throw new TypeError('Application error publicMessage must not be empty')
  }

  if (definition.bearerChallenge && definition.status !== 401) {
    throw new TypeError('bearerChallenge is only valid for HTTP 401')
  }

  if (definition.status === 401 && !definition.bearerChallenge) {
    throw new TypeError('HTTP 401 errors must declare bearerChallenge')
  }
}

export class AppException extends HttpException {
  readonly definition: AppErrorDefinition
  readonly details?: readonly ApiErrorDetail[]

  /**
   * 创建携带稳定业务错误定义的 HTTP 异常。
   * @param options 保留内部原因用于日志，附加可公开的字段错误详情。
   * @throws 错误定义不合法时抛出 TypeError。
   */
  constructor(definition: AppErrorDefinition, options: AppExceptionOptions = {}) {
    assertErrorDefinition(definition)

    super(definition.publicMessage, definition.status, {
      cause: options.cause,
    })

    this.name = AppException.name
    this.definition = definition
    this.details = options.details
  }
}
