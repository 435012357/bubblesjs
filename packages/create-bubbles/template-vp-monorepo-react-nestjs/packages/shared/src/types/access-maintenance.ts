import type { AccessScope, PageQuery, UserSummary } from './access'

export interface CleanupPreviewItem {
  permissionKey: string
  title: string
  menuIds: string[]
  roleCount: number
  blockedReasons: string[]
}

export interface CleanupPreview {
  catalogVersion: string
  deploymentId: string | null
  proofDigest: string | null
  eligible: boolean
  blockedReasons: string[]
  items: CleanupPreviewItem[]
  totals: {
    permissions: number
    menus: number
    roleAssignments: number
  }
}

export interface CleanupRequest {
  permissionKeys: string[]
  proofDigest: string
}

export interface CleanupResult {
  removedPermissionKeys: string[]
  alreadyCleanedPermissionKeys: string[]
  removedMenuCount: number
  removedRoleAssignmentCount: number
}

export interface DeploymentServiceVersion {
  version: string
  instanceIds: string[]
  requiredPermissionKeys: string[]
}

export interface DeploymentProof {
  deploymentId: string
  completed: true
  verifiedAt: string
  expiresAt: string
  serviceVersions: DeploymentServiceVersion[]
}

export interface AuditRecord {
  id: string
  actor: UserSummary
  scope: AccessScope
  action: string
  objectType: string
  objectId: string
  summary: Record<string, string | number | boolean | null | string[]>
  requestId: string
  createdAt: string
}

export interface AuditQuery extends PageQuery {
  action?: string
  actorId?: string
  from?: string
  to?: string
}
