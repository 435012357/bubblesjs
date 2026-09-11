export const ACCOUNT_PATTERN = /^[A-Za-z0-9_]+$/

/** 去除账号两端空白并统一为小写，供注册、登录和唯一性检查使用。 */
export function normalizeAccount(value: string) {
  return value.trim().toLowerCase()
}
