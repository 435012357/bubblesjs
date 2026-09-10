import { redirect, type LoaderFunctionArgs } from 'react-router'
import type { AccessScope, ScopeType } from 'shared/types'
import { accessScopeKey } from 'shared/utils'
import { getAccessContext, getWorkspaces } from '@/pages/workspaces/api'
import { enterWorkspace } from '@/utils/request/workspace'
import { cookie } from '@/utils/storage/cookie'
import { firstAccessiblePagePath, type RegisteredPage } from './page-registry'

function getScope(type: ScopeType, params: LoaderFunctionArgs['params']): AccessScope {
  return type === 'platform'
    ? { type }
    : type === 'project'
      ? { type, companyId: params.companyId!, projectId: params.projectId! }
      : { type, companyId: params.companyId! }
}

export async function workspaceLoader({ request }: LoaderFunctionArgs) {
  if (!cookie.get('token')) throw redirect('/login')
  enterWorkspace('workspaces')
  return getWorkspaces(request.signal)
}

export function scopeLoader(type: ScopeType) {
  return async ({ params, request }: LoaderFunctionArgs) => {
    if (!cookie.get('token')) throw redirect('/login')
    const scope = getScope(type, params)
    enterWorkspace(accessScopeKey(scope))
    const [context, spaces] = await Promise.all([
      getAccessContext(scope, request.signal),
      getWorkspaces(request.signal),
    ])
    return {
      ...context,
      workspace: spaces.workspaces.find(
        (entry) => accessScopeKey(entry.scope) === accessScopeKey(scope),
      ),
    }
  }
}

export function accessLoader(routeKey: RegisteredPage) {
  return async ({ params, request }: LoaderFunctionArgs) => {
    if (!cookie.get('token')) throw redirect('/login')
    const type = routeKey.split('.')[0] as ScopeType
    const scope = getScope(type, params)
    enterWorkspace(accessScopeKey(scope))
    const context = await getAccessContext(scope, request.signal)
    if (!context.permissionKeys.includes(`${routeKey}.read`)) {
      // 首页可能被停用或撤权；仍可从空间入口进入其他已授权页面。
      const destination = routeKey.endsWith('.home') ? firstAccessiblePagePath(context) : null
      if (destination) throw redirect(destination)
      throw Object.assign(new Error('你没有访问此页面的权限，请联系管理员授权。'), { status: 403 })
    }
    return context
  }
}
