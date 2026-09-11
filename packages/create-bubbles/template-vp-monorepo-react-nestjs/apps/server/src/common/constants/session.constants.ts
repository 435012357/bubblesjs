import type { SessionTerminalType } from 'shared/types'

export { isSessionTerminal, SESSION_TERMINALS } from 'shared/utils'

export const SESSION_KEY_PREFIX = 'auth:v1:session:'
export const SESSION_SLOT_PREFIX = 'auth:v1:slot:'

/**
 * 使用令牌摘要构造 Redis 会话键，避免将明文令牌写入键名。
 */
export function createSessionKey(tokenDigest: string) {
  return `${SESSION_KEY_PREFIX}${tokenDigest}`
}

/**
 * 构造用户与终端对应的唯一会话槽位键，用于同端会话替换。
 */
export function createSessionSlotKey(userId: string, terminal: SessionTerminalType) {
  return `${SESSION_SLOT_PREFIX}${userId}:${terminal}`
}

/**
 * 根据 User-Agent 优先识别 Electron 桌面端，其次识别移动端，其余归为 Web。
 */
export function detectSessionTerminal(userAgent: string | undefined): SessionTerminalType {
  const value = userAgent ?? ''

  if (/\bElectron\//i.test(value)) {
    return 'desktop'
  }

  if (/Android|iPhone|iPad|iPod/i.test(value)) {
    return 'mobile'
  }

  return 'web'
}
