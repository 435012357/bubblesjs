import { SetMetadata } from '@nestjs/common'
import type { ScopeType } from 'shared/types'

export const ACCESS_POLICY_KEY = 'access-policy'
export interface AccessPolicyDefinition {
  scope: ScopeType | 'authenticated' | 'route'
  permission?: string | string[]
  adminOnly?: boolean
}
/**
 * 将作用域、权限及管理员限制写入 Nest 元数据，供权限守卫读取。
 */
export const AccessPolicy = (policy: AccessPolicyDefinition) =>
  SetMetadata(ACCESS_POLICY_KEY, policy)
/**
 * 标记路由只要求登录身份，由权限守卫跳过具体业务权限校验。
 */
export const Authenticated = () => AccessPolicy({ scope: 'authenticated' })
