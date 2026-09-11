import {
  createSessionKey,
  createSessionSlotKey,
  isSessionTerminal,
  SESSION_KEY_PREFIX,
  SESSION_SLOT_PREFIX,
  SESSION_TERMINALS,
} from '@/common/constants/session.constants'
import { AppException } from '@/common/exceptions/app.exception'
import { InjectRedis } from '@nestjs-modules/ioredis'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'
import { AUTH_ERRORS } from '../auth.errors'
import {
  CREATE_OR_REPLACE_SESSION_SCRIPT,
  LOGOUT_SESSION_SCRIPT,
  REVOKE_USER_SESSIONS_SCRIPT,
  VALIDATE_AND_TOUCH_SESSION_SCRIPT,
} from './session.script'
import { CreatedSession, CreateSessionInput, CurrentAuthType } from './session.types'

const INVALID_SESSION_CODES = new Set(['NOT_FOUND', 'REPLACED', 'ABSOLUTE_EXPIRED'])

type SessionRedis = Redis & {
  /**
   * 执行创建或替换会话的 Lua 命令，参数依次包含键、摘要、身份、有效期和登录来源。
   */
  authCreateOrReplaceSession(...args: string[]): Promise<unknown>
  /**
   * 执行会话验证和闲置续期 Lua 命令，返回脚本协议数组供服务层校验。
   */
  authValidateAndTouchSession(...args: string[]): Promise<unknown>
  /**
   * 执行原子退出 Lua 命令，避免删除已被新会话替换的终端槽位。
   */
  authLogoutSession(...args: string[]): Promise<unknown>
  /**
   * 执行用户所有终端会话撤销 Lua 命令，键列表对应各终端槽位。
   */
  authRevokeUserSessions(...args: string[]): Promise<unknown>
}

const SCRIPT_CODE_PATTERN = /^[A-Z][A-Z0-9_]{0,79}$/

/**
 * 只保留符合白名单格式的 Lua 返回码，构造不包含原始 Redis 数据的协议错误。
 */
function createScriptProtocolError(operation: string, value: string | undefined): Error {
  const code = SCRIPT_CODE_PATTERN.test(value ?? '') ? value : 'UNKNOWN'
  return new Error(`Redis ${operation} script returned ${code}`)
}

@Injectable()
export class SessionStoreService {
  // private readonly logger = new Logger(SessionStoreService.name)
  private readonly redis: SessionRedis
  private readonly idleTtlMs: number
  private readonly absoluteTtlMs: number

  /**
   * 读取会话时限并注册 Lua 命令，使会话和终端槽位的变更在 Redis 中原子执行。
   */
  constructor(@InjectRedis() redis: Redis, config: ConfigService) {
    this.redis = redis as SessionRedis
    this.idleTtlMs = config.getOrThrow<number>('session.idleTtlMs')
    this.absoluteTtlMs = config.getOrThrow<number>('session.absoluteTtlMs')

    this.redis.defineCommand('authCreateOrReplaceSession', {
      numberOfKeys: 2,
      lua: CREATE_OR_REPLACE_SESSION_SCRIPT,
    })

    this.redis.defineCommand('authValidateAndTouchSession', {
      numberOfKeys: 1,
      lua: VALIDATE_AND_TOUCH_SESSION_SCRIPT,
    })

    this.redis.defineCommand('authLogoutSession', {
      numberOfKeys: 1,
      lua: LOGOUT_SESSION_SCRIPT,
    })

    this.redis.defineCommand('authRevokeUserSessions', {
      numberOfKeys: SESSION_TERMINALS.length,
      lua: REVOKE_USER_SESSIONS_SCRIPT,
    })
  }

  /**
   * 执行会话 Lua 命令并规范化数组结果。
   * @throws Redis 调用失败或返回格式异常时抛出认证服务不可用错误。
   */
  private async execute(command: () => Promise<unknown>) {
    try {
      const result = await command()

      if (!Array.isArray(result)) {
        throw new Error('Redis script returned a non-array result')
      }
      return result.map((item) => String(item ?? ''))
    } catch (cause: unknown) {
      throw new AppException(AUTH_ERRORS.SERVICE_UNAVAILABLE, { cause })
    }
  }

  /**
   * 原子创建会话并替换该用户同一终端的旧会话。
   * @param input 令牌摘要、用户终端及登录来源信息。
   * @returns 初始闲置过期时间与不可延长的绝对过期时间，单位为毫秒。
   */
  async createOrReplace(input: CreateSessionInput): Promise<CreatedSession> {
    const result = await this.execute(() =>
      this.redis.authCreateOrReplaceSession(
        createSessionSlotKey(input.userId, input.terminal),
        createSessionKey(input.tokenDigest),
        input.tokenDigest,
        input.userId,
        input.terminal,
        String(this.idleTtlMs),
        String(this.absoluteTtlMs),
        input.loginIp,
        input.userAgent,
        SESSION_KEY_PREFIX,
      ),
    )

    // if (result[0] !== '1') {
    //   this.logger.error(`Create session script rejected: ${result[1] ?? 'UNKNOWN'}`)
    //   throw new ServiceUnavailableException('暂时无法创建登录状态')
    // }

    const initialExpiresAtMs = Number(result[2])
    const absoluteExpiresAtMs = Number(result[3])
    if (
      result[0] !== '1' ||
      !Number.isFinite(initialExpiresAtMs) ||
      !Number.isFinite(absoluteExpiresAtMs)
    ) {
      throw new AppException(AUTH_ERRORS.SERVICE_UNAVAILABLE, {
        cause: createScriptProtocolError('createOrReplace', result[1]),
      })
    }

    // if (!Number.isFinite(initialExpiresAtMs) || !Number.isFinite(absoluteExpiresAtMs)) {
    //   throw new ServiceUnavailableException('登录状态数据异常')
    // }

    return {
      initialExpiresAtMs,
      absoluteExpiresAtMs,
    }
  }

  /**
   * 校验令牌对应会话并刷新闲置有效期，刷新不会超过绝对有效期。
   * @returns 用户及终端身份；会话缺失、被替换或过期时返回 null。
   */
  async validateAndTouch(tokenDigest: string): Promise<CurrentAuthType | null> {
    const result = await this.execute(() =>
      this.redis.authValidateAndTouchSession(
        createSessionKey(tokenDigest),
        tokenDigest,
        SESSION_SLOT_PREFIX,
        String(this.idleTtlMs),
      ),
    )

    if (result[0] !== '1') {
      const code = result[1] ?? 'UNKNOWN'

      if (INVALID_SESSION_CODES.has(code)) {
        return null
      }

      // this.logger.error(`Validate session script returned unexpected code: ${code}`)
      // throw new ServiceUnavailableException('登录状态数据异常')
      throw new AppException(AUTH_ERRORS.SERVICE_UNAVAILABLE, {
        cause: createScriptProtocolError('validateAndTouch', result[1]),
      })
    }

    const userId = result[1]
    const terminal = result[2]

    // if (!userId || !terminal || !isSessionTerminal(terminal)) {
    //   this.logger.error('Redis returned an invalid Session payload')
    //   throw new ServiceUnavailableException('登录状态数据异常')
    // }

    if (!userId || !terminal || !isSessionTerminal(terminal)) {
      throw new AppException(AUTH_ERRORS.SERVICE_UNAVAILABLE, {
        cause: createScriptProtocolError('validateAndTouch', result[1]),
      })
    }

    return {
      userId,
      terminal,
    }
  }

  /**
   * 原子撤销令牌对应会话，并仅在槽位仍指向该令牌时清理终端槽位。
   */
  async logout(tokenDigest: string) {
    const result = await this.execute(() =>
      this.redis.authLogoutSession(createSessionKey(tokenDigest), tokenDigest, SESSION_SLOT_PREFIX),
    )

    // if (result[0] !== '1') {
    //   this.logger.error(`Logout session script returned unexpected code: ${result[1] ?? 'UNKNOWN'}`)
    //   throw new ServiceUnavailableException('暂时无法完成退出')
    // }

    if (result[0] !== '1') {
      throw new AppException(AUTH_ERRORS.SERVICE_UNAVAILABLE, {
        cause: createScriptProtocolError('logout', result[1]),
      })
    }
  }

  /**
   * 原子撤销用户在所有支持终端上的会话，供停用用户等操作使用。
   */
  async revokeAllForUser(userId: string) {
    const slotKeys = SESSION_TERMINALS.map((terminal) => createSessionSlotKey(userId, terminal))
    const result = await this.execute(() =>
      this.redis.authRevokeUserSessions(...slotKeys, SESSION_KEY_PREFIX),
    )
    // if (result[0] !== '1') {
    //   this.logger.error(
    //     `Revoke user sessions script returned unexpected code: ${result[1] ?? 'UNKNOWN'}`,
    //   )
    //   throw new ServiceUnavailableException('暂时无法撤销用户登录状态')
    // }

    if (result[0] !== '1') {
      throw new AppException(AUTH_ERRORS.SERVICE_UNAVAILABLE, {
        cause: createScriptProtocolError('revokeAllForUser', result[1]),
      })
    }
  }
}
