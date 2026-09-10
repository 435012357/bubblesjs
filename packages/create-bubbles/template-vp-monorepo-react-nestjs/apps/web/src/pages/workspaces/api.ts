import type { AccessContext, AccessScope, WorkspacesResult } from 'shared/types'
import { accessScopeBasePath } from 'shared/utils'
import { freshRequest, runWorkspaceRequest, workspaceRequest } from '@/utils/request/workspace'

export const getWorkspaces = (signal?: AbortSignal) =>
  runWorkspaceRequest({
    method: workspaceRequest.Get<WorkspacesResult>('/workspaces', freshRequest),
    signal,
    accessRequest: true,
  })

export const getAccessContext = (scope: AccessScope, signal?: AbortSignal) =>
  runWorkspaceRequest({
    method: workspaceRequest.Get<AccessContext>(
      `${accessScopeBasePath(scope)}/access`,
      freshRequest,
    ),
    signal,
    accessRequest: true,
  })
