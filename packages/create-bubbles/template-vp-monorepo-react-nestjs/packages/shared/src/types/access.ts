export type ScopeType = 'platform' | 'company' | 'project'

export type AccessScope =
  | { type: 'platform' }
  | { type: 'company'; companyId: string }
  | { type: 'project'; companyId: string; projectId: string }

export type EntityStatus = 'active' | 'disabled'
export type AccountStatus = 'active' | 'locked' | 'disabled'
export type BuiltinRole = 'administrator' | 'member' | null

export interface PageQuery {
  page?: number
  pageSize?: number
  query?: string
}

export interface PageResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface VersionRequest {
  expectedVersion: number
}

export interface StatusRequest extends VersionRequest {
  status: EntityStatus
}

export interface DeleteResult {
  deleted: true
}

export interface UserSummary {
  id: string
  account: string
  name: string
}

export interface WorkspaceEntry {
  scope: AccessScope
  name: string
  companyName?: string
  administrator: ScopeType | null
}

export interface WorkspacesResult {
  user: UserSummary
  workspaces: WorkspaceEntry[]
}

export interface EntityPageQuery extends PageQuery {
  status?: EntityStatus
}

export interface AccountPageQuery extends PageQuery {
  status?: AccountStatus
}

export interface AccessRoutePathInput {
  scope: AccessScope
  routeKey: string
}

export interface BuiltinPermissionKeysInput {
  scopeType: ScopeType
  builtin: Exclude<BuiltinRole, null>
}
