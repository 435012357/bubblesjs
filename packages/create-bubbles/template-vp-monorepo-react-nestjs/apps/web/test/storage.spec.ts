import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { cookie } from '../src/utils/storage/cookie'
import { local, session } from '../src/utils/storage/session'

function createMemoryStorage() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
  }
}

beforeEach(() => {
  vi.stubGlobal('window', {
    location: { protocol: 'https:' },
    localStorage: createMemoryStorage(),
    sessionStorage: createMemoryStorage(),
  })
  vi.stubGlobal('document', { cookie: '' })
})

afterEach(() => vi.unstubAllGlobals())

describe('Cookie', () => {
  it('准确区分名称，并解码包含中文、分隔符的值', () => {
    document.cookie = 'token-old=wrong; token=%E4%B8%AD%E6%96%87%3B%3D%25; empty='
    expect(cookie.get('token')).toBe('中文;=%')
    expect(cookie.get('empty')).toBe('')
    expect(cookie.get('missing')).toBeNull()
  })

  it('名称和值均编码，HTTPS 默认启用 Secure 并作用于整个站点', () => {
    cookie.set('偏好', '中文;=')
    expect(document.cookie).toBe(
      '%E5%81%8F%E5%A5%BD=%E4%B8%AD%E6%96%87%3B%3D; Path=/; SameSite=Lax; Secure',
    )
    expect(cookie.get('偏好')).toBe('中文;=')
  })

  it('HTTP 开发环境可写入 Cookie，支持设置过期时间', () => {
    window.location.protocol = 'http:'
    const expires = new Date('2030-01-01T00:00:00Z')
    cookie.set('token', 'value', { expires })
    expect(document.cookie).toContain(`Expires=${expires.toUTCString()}`)
    expect(document.cookie).not.toContain('Secure')
  })

  it('删除时覆盖原作用域，并同时设置立即过期时间和 Max-Age', () => {
    cookie.remove('token', { path: '/workspace', domain: 'example.test' })
    expect(document.cookie).toContain('token=;')
    expect(document.cookie).toContain('Path=/workspace')
    expect(document.cookie).toContain('Domain=example.test')
    expect(document.cookie).toContain('Expires=Thu, 01 Jan 1970 00:00:00 GMT')
    expect(document.cookie).toContain('Max-Age=0')
  })

  it('读取无法解码的现有 Cookie 时保留原值', () => {
    document.cookie = 'token=%zz'
    expect(cookie.get('token')).toBe('%zz')
  })
})

describe.each([
  ['local', local, 'localStorage'],
  ['session', session, 'sessionStorage'],
] as const)('%s 存储', (_name, storage, type) => {
  it('保存和更新结构化数据，正确读取空字符串、false 和 0', () => {
    for (const value of [{ title: '草稿', items: [1, 2] }, '', false, 0]) {
      storage.set('draft', value)
      expect(storage.get('draft')).toEqual(value)
    }
    storage.remove('draft')
    expect(storage.get('draft')).toBeNull()
  })

  it('缺失或损坏的数据返回 null', () => {
    expect(storage.get('missing')).toBeNull()
    window[type].setItem('broken', '{invalid')
    expect(storage.get('broken')).toBeNull()
  })

  it('不可序列化的数据不会覆盖已有值', () => {
    storage.set('draft', 'saved')
    expect(() => storage.set('draft', undefined)).toThrow(TypeError)
    expect(storage.get('draft')).toBe('saved')
  })

  it('存储失败时向调用方抛出错误', () => {
    vi.spyOn(window[type], 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    expect(() => storage.set('draft', 'value')).toThrow('QuotaExceededError')
  })
})

it('local 和 session 的同名数据与清空操作相互独立', () => {
  local.set('draft', 'local')
  session.set('draft', 'session')
  expect(local.get('draft')).toBe('local')
  expect(session.get('draft')).toBe('session')
  local.clear()
  expect(local.get('draft')).toBeNull()
  expect(session.get('draft')).toBe('session')
  session.clear()
  expect(session.get('draft')).toBeNull()
})
