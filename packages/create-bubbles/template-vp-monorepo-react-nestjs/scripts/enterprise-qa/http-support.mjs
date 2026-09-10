import { randomUUID } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { root, ensure, serverRequire } from './runtime.mjs'

export function apiClient(runtime) {
  const baseUrl = `http://127.0.0.1:${runtime.serverPort}`
  return async function request({
    actor,
    path,
    method = 'GET',
    body,
    expected = 200,
    requestId,
    headers = {},
  }) {
    const options = {
      method,
      headers: {
        'User-Agent': 'Enterprise-QA/1.0 Android',
        ...(actor?.accessToken ? { Authorization: `Bearer ${actor.accessToken}` } : {}),
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        'x-request-id': requestId ?? `qa-${randomUUID()}`,
        ...headers,
      },
      signal: AbortSignal.timeout(20000),
    }
    if (body !== undefined && method !== 'GET' && method !== 'HEAD') {
      options.body = typeof body === 'string' ? body : JSON.stringify(body)
    }
    const response = await fetch(`${baseUrl}${path}`, options)
    const text = await response.text()
    let data
    try {
      data = JSON.parse(text)
    } catch {
      data = null
    }
    if (expected !== null) {
      ensure(
        response.status === expected,
        `${method} ${path.split('?')[0]} 预期 ${expected}，实际 ${response.status}，错误码 ${data?.code ?? 'none'}`,
      )
    }
    return { status: response.status, body: data, requestId: response.headers.get('x-request-id') }
  }
}

export async function registerIdentity({ request, identity }) {
  const result = await request({
    path: '/auth/register',
    method: 'POST',
    body: identity,
    expected: 201,
  })
  ensure(typeof result.body?.id === 'string', '注册响应缺少用户 ID')
  identity.id = result.body.id
  return identity
}

export async function loginIdentity({ request, identity }) {
  const result = await request({
    path: '/auth/login',
    method: 'POST',
    body: { account: identity.account, password: identity.password },
  })
  ensure(typeof result.body?.accessToken === 'string', '登录响应缺少会话')
  identity.accessToken = result.body.accessToken
  return identity
}

export function runInitialization({ runtimePath, account, expectedSuccess = true }) {
  const vpEntry = resolve(serverRequire.resolve('vite-plus/package.json'), '../bin/vp')
  const builtEntry = resolve(root, 'apps/server/dist/src/access-init.js')
  const invocation = existsSync(builtEntry)
    ? [builtEntry, '--account', account]
    : [vpEntry, 'run', 'access:init', '--', '--account', account]
  const child = spawnSync(
    process.execPath,
    [
      resolve(root, 'scripts/with-enterprise-test-env.mjs'),
      runtimePath,
      'apps/server',
      process.execPath,
      ...invocation,
    ],
    { cwd: root, encoding: 'utf8', timeout: 45000, maxBuffer: 1024 * 1024 },
  )
  ensure(
    expectedSuccess ? child.status === 0 : child.status !== 0,
    `access:init CLI ${expectedSuccess ? '应成功' : '应拒绝'}，实际退出码 ${child.status ?? '无法启动'}`,
  )
}

export function flattenMenus(nodes) {
  return nodes.flatMap((node) => [node, ...flattenMenus(node.children ?? [])])
}

export async function findMember({ request, actor, base, userId }) {
  const result = await request({ actor, path: `${base}/members?pageSize=100` })
  const member = result.body.items.find((item) => item.userId === userId)
  ensure(member, '成员列表未返回预期测试成员')
  return member
}
