import type { AccessContext, WorkspaceEntry, WorkspacesResult } from 'shared/types'
import { cookie } from '@/utils/storage/cookie'

interface WorkspaceState {
  workspaces?: WorkspacesResult
  accessByScope: Map<string, AccessContext & { workspace?: WorkspaceEntry }>
}

let session: string | null
let state: WorkspaceState = { accessByScope: new Map() }

/**
 * 保存当前账号的工作空间列表和各空间权限，换号时清空。
 * middleware 写入；页面随路由导航或重新校验完成后读取，不额外订阅路由状态。
 * 每次进入空间仍会请求最新权限，这里的数据不能用于跳过权限校验。
 */
export function getWorkspaceState() {
  const token = cookie.get('token')
  if (token !== session) {
    session = token
    state = { accessByScope: new Map() }
  }
  return state
}
