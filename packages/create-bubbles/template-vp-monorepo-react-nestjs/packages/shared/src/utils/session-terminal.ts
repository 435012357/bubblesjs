import type { SessionTerminalType } from '../types'

export const SESSION_TERMINALS = [
  'web',
  'desktop',
  'mobile',
] as const satisfies readonly SessionTerminalType[]

/** 判断外部输入是否属于支持的会话终端，并收窄为终端类型。 */
export function isSessionTerminal(value: unknown): value is SessionTerminalType {
  return SESSION_TERMINALS.includes(value as SessionTerminalType)
}
