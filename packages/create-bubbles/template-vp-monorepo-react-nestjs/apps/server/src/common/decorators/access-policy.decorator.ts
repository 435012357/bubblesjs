import { SetMetadata } from '@nestjs/common'
import type { ScopeType } from 'shared/types'

export const ACCESS_POLICY_KEY = 'access-policy'
export interface AccessPolicyDefinition {
  scope: ScopeType | 'authenticated' | 'route'
  permission?: string | string[]
  adminOnly?: boolean
}
export const AccessPolicy = (policy: AccessPolicyDefinition) =>
  SetMetadata(ACCESS_POLICY_KEY, policy)
export const Authenticated = () => AccessPolicy({ scope: 'authenticated' })
