import type { AccessContext, AccessScope, WorkspacesResult } from 'shared/types'
import { accessScopeBasePath } from 'shared/utils'
import { freshRequest, runWorkspaceRequest, workspaceRequest } from '@/utils/request/workspace'

/** 获取当前会话可进入的工作空间，导航取消时同步中止请求。 */
export const getWorkspaces = (signal?: AbortSignal) =>
  runWorkspaceRequest({
    method: workspaceRequest.Get<WorkspacesResult>('/workspaces', freshRequest),
    signal,
    accessRequest: true,
  })

/** 获取指定工作空间的权限上下文，供路由进入校验使用。 */
export const getAccessContext = (scope: AccessScope, signal?: AbortSignal) =>
  runWorkspaceRequest({
    method: workspaceRequest.Get<AccessContext>(
      `${accessScopeBasePath(scope)}/access`,
      freshRequest,
    ),
    signal,
    accessRequest: true,
  })
