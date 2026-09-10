import request from './index'
import { cookie } from '@/utils/storage/cookie'

/** 权限和管理数据不进入 alova 缓存；每个工作空间代次都有独立的在途请求集合。 */
export const workspaceRequest = request({
  cacheFor: { GET: 0, POST: 0, PUT: 0, PATCH: 0, DELETE: 0, HEAD: 0, OPTIONS: 0 },
  cacheLogger: false,
  isShowErrorMessage: false,
  // 由下方代次检查后处理 401，旧会话的迟到失败不能退出新会话。
  unAuthorizedResponseFunc: () => {},
})

let currentKey = ''
let generation = 0
const pending = new Set<() => void>()

export function clearWorkspaceRequests() {
  generation += 1
  for (const abort of pending) abort()
  pending.clear()
  currentKey = ''
}

export function enterWorkspace(key: string) {
  const identityKey = `${cookie.get('token') ?? ''}:${key}`
  if (identityKey !== currentKey) {
    clearWorkspaceRequests()
    currentKey = identityKey
  }
}

export function refreshAccess() {
  window.dispatchEvent(new Event('workspace-access-refresh'))
}

export const freshRequest = { cacheFor: 0, shareRequest: false } as const

export async function runWorkspaceRequest<T>(options: {
  method: { send: (force?: boolean) => Promise<T>; abort: () => void }
  signal?: AbortSignal
  accessRequest?: boolean
}): Promise<T> {
  const { method, signal, accessRequest } = options
  const startedAt = generation
  const token = cookie.get('token')
  const abort = () => method.abort()
  const stale = () => signal?.aborted || generation !== startedAt || token !== cookie.get('token')
  if (stale()) throw new DOMException('请求已取消', 'AbortError')
  pending.add(abort)
  signal?.addEventListener('abort', abort, { once: true })
  try {
    const result = await method.send(true)
    if (stale()) throw new DOMException('工作空间已切换', 'AbortError')
    return result
  } catch (error) {
    if (stale()) throw new DOMException('工作空间已切换', 'AbortError')
    if ((error as { status?: number }).status === 401) {
      clearWorkspaceRequests()
      cookie.remove('token')
      window.location.assign('/login')
    }
    if (!accessRequest && (error as { status?: number }).status === 403) refreshAccess()
    throw error
  } finally {
    pending.delete(abort)
    signal?.removeEventListener('abort', abort)
  }
}
