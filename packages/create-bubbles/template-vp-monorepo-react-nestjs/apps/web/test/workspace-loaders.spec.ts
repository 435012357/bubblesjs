import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { createMemoryRouter } from 'react-router'
import type { AccessContext } from 'shared/types'

const api = vi.hoisted(() => ({ getAccessContext: vi.fn(), getWorkspaces: vi.fn() }))
vi.mock('../src/pages/workspaces/api', () => api)
vi.mock('../src/utils/request/workspace', () => ({ enterWorkspace: vi.fn() }))
vi.mock('../src/utils/storage/cookie', () => ({ cookie: { get: () => 'session' } }))

import { accessLoader, scopeLoader } from '../src/router/loaders'

const context: AccessContext = {
  user: { id: 'user', name: '管理员', account: 'admin' },
  scope: { type: 'platform' },
  administrator: 'platform',
  permissionKeys: ['platform.menus.read'],
  menus: [],
  menuVersion: 1,
  catalogVersion: 'v1',
}

beforeEach(() => {
  vi.clearAllMocks()
  api.getAccessContext.mockResolvedValue(context)
  api.getWorkspaces.mockResolvedValue({
    user: context.user,
    workspaces: [{ scope: context.scope, name: '平台管理', administrator: 'platform' }],
  })
})

function makeRouter() {
  return createMemoryRouter(
    [
      { path: '/placeholder', element: null },
      {
        id: 'scope',
        path: '/platform',
        loader: scopeLoader('platform'),
        shouldRevalidate: () => true,
        errorElement: '作用域不可用',
        children: [
          {
            id: 'home',
            index: true,
            loader: accessLoader('platform.home'),
            errorElement: '页面不可用',
          },
          {
            id: 'accounts',
            path: 'accounts',
            loader: accessLoader('platform.accounts'),
            errorElement: '页面不可用',
          },
          {
            id: 'menus',
            path: 'menus',
            loader: accessLoader('platform.menus'),
            errorElement: '页面不可用',
          },
        ],
      },
    ],
    { initialEntries: ['/placeholder'] },
  )
}

describe('工作空间父级上下文与页面权限', () => {
  it('叶子页面无权访问时保留已验证的父级上下文，其他管理入口仍可使用', async () => {
    const router = makeRouter()
    try {
      await router.navigate('/platform/accounts')
      expect(router.state.errors?.accounts).toMatchObject({ status: 403 })
      expect(router.state.loaderData.scope).toMatchObject({
        permissionKeys: ['platform.menus.read'],
        workspace: { name: '平台管理' },
      })
      await router.navigate('/platform/menus')
      expect(router.state.errors).toBeNull()
      expect(router.state.loaderData.menus).toEqual(context)
    } finally {
      router.dispose()
    }
  })

  it('首页被停用或撤权时，工作空间入口跳到其他已授权静态页面', async () => {
    const router = makeRouter()
    try {
      await router.navigate('/platform')
      expect(router.state.location.pathname).toBe('/platform/menus')
      expect(router.state.errors).toBeNull()
      expect(router.state.loaderData.scope).toMatchObject({ scope: { type: 'platform' } })
    } finally {
      router.dispose()
    }
  })

  it('整个作用域失效时父级 loader 拒绝访问，不保留旧权限上下文', async () => {
    const router = makeRouter()
    try {
      await router.navigate('/platform/menus')
      api.getAccessContext.mockRejectedValue(
        Object.assign(new Error('身份已撤销'), { status: 403 }),
      )
      await router.navigate('/platform/accounts')
      expect(router.state.errors?.scope).toMatchObject({ status: 403 })
      expect(router.state.loaderData.scope).toBeUndefined()
    } finally {
      router.dispose()
    }
  })
})
