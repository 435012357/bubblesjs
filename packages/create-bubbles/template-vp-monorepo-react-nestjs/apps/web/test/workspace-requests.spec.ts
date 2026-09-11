import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'

vi.mock('../src/utils/request/index', () => ({ default: () => ({}) }))
const cookieMocks = vi.hoisted(() => ({ get: vi.fn(() => 'session-one'), remove: vi.fn() }))
vi.mock('../src/utils/storage/cookie', () => ({ cookie: cookieMocks }))

import {
  clearWorkspaceRequests,
  enterWorkspace,
  runWorkspaceRequest,
} from '../src/utils/request/workspace'

const dispatchEvent = vi.fn()
const assign = vi.fn()

/** 创建可手动完成或拒绝的请求替身，用于验证取消与迟到响应。 */
function deferredMethod<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((onResolve, onReject) => {
    resolve = onResolve
    reject = onReject
  })
  return { method: { send: () => promise, abort: vi.fn() }, resolve, reject }
}

beforeEach(() => {
  clearWorkspaceRequests()
  vi.clearAllMocks()
  cookieMocks.get.mockReturnValue('session-one')
  vi.stubGlobal('window', { dispatchEvent, location: { assign } })
})

describe('工作空间请求隔离', () => {
  it('切换空间取消旧请求，即使服务端迟到成功也不返回旧数据', async () => {
    enterWorkspace('company:a')
    const pending = deferredMethod<string>()
    const result = runWorkspaceRequest({ method: pending.method })
    const rejected = expect(result).rejects.toMatchObject({ name: 'AbortError' })
    enterWorkspace('company:b')
    pending.resolve('企业 A 的数据')
    await rejected
    expect(pending.method.abort).toHaveBeenCalledOnce()
  })

  it('旧账号迟到的 401 不能删除新账号 Cookie 或触发跳转', async () => {
    enterWorkspace('company:a')
    const pending = deferredMethod<string>()
    const result = runWorkspaceRequest({ method: pending.method })
    const rejected = expect(result).rejects.toMatchObject({ name: 'AbortError' })
    cookieMocks.get.mockReturnValue('session-two')
    enterWorkspace('company:a')
    pending.reject(Object.assign(new Error('旧会话失效'), { status: 401 }))
    await rejected
    expect(cookieMocks.remove).not.toHaveBeenCalled()
    expect(assign).not.toHaveBeenCalled()
  })

  it('旧作用域迟到的 403 不刷新新空间权限', async () => {
    enterWorkspace('company:a')
    const pending = deferredMethod<string>()
    const result = runWorkspaceRequest({ method: pending.method })
    const rejected = expect(result).rejects.toMatchObject({ name: 'AbortError' })
    enterWorkspace('company:b')
    pending.reject(Object.assign(new Error('无权限'), { status: 403 }))
    await rejected
    expect(dispatchEvent).not.toHaveBeenCalled()
  })

  it('当前业务请求 403 触发权限刷新，access 请求失败不递归刷新', async () => {
    enterWorkspace('platform')
    const error = Object.assign(new Error('无权限'), { status: 403 })
    await expect(
      runWorkspaceRequest({ method: { send: () => Promise.reject(error), abort: vi.fn() } }),
    ).rejects.toBe(error)
    expect(dispatchEvent).toHaveBeenCalledOnce()
    dispatchEvent.mockClear()
    await expect(
      runWorkspaceRequest({
        method: { send: () => Promise.reject(error), abort: vi.fn() },
        accessRequest: true,
      }),
    ).rejects.toBe(error)
    expect(dispatchEvent).not.toHaveBeenCalled()
  })

  it('Router AbortSignal 取消后拒绝迟到结果', async () => {
    enterWorkspace('project:a:p')
    const controller = new AbortController()
    const pending = deferredMethod<string>()
    const result = runWorkspaceRequest({ method: pending.method, signal: controller.signal })
    const rejected = expect(result).rejects.toMatchObject({ name: 'AbortError' })
    controller.abort()
    pending.resolve('迟到结果')
    await rejected
    expect(pending.method.abort).toHaveBeenCalledOnce()
  })
})
