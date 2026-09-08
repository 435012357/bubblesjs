import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { axiosRequestAdapter } from '@alova/adapter-axios'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vite-plus/test'
import { createInstance } from '../src/utils/request/core'

let server: Server
let baseUrl: string

beforeAll(async () => {
  server = createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json')
    if (req.url === '/credentials') {
      res
        .writeHead(422)
        .end(JSON.stringify({ code: 'AUTH.INVALID_CREDENTIALS', message: '账号或密码错误' }))
    } else if (req.url === '/expired') {
      res
        .writeHead(401)
        .end(JSON.stringify({ code: 'AUTH.SESSION_INVALID', message: '登录已失效，请重新登录' }))
    } else if (req.url === '/unavailable') {
      res.writeHead(503).end(
        JSON.stringify({
          code: 'AUTH.SERVICE_UNAVAILABLE',
          message: '登录服务暂时不可用，请稍后重试',
        }),
      )
    } else if (req.url === '/wrapped') {
      res.end(JSON.stringify({ code: 200, data: { id: 'test-user' } }))
    } else if (req.url?.startsWith('/http-status/')) {
      const status = Number(req.url.split('/').at(-1))
      res.writeHead(status).end(status === 204 ? undefined : JSON.stringify({ status }))
    } else if (req.url?.startsWith('/wrapped-error/')) {
      const code = Number(req.url.split('/').at(-1))
      res.end(JSON.stringify({ code, message: '业务处理失败' }))
    } else {
      res.end(JSON.stringify({ id: 'test-user', authorization: req.headers.authorization }))
    }
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})

afterAll(
  () =>
    new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    ),
)

function setup() {
  const unauthorized = vi.fn()
  const errorMessage = vi.fn()
  const request = createInstance({
    baseUrl,
    isWrapped: false,
    requestAdapter: axiosRequestAdapter(),
    commonHeaders: () => ({ Authorization: 'Bearer test-session' }),
    unAuthorizedResponseFunc: unauthorized,
    errorMessageFunc: errorMessage,
  })
  return { request, unauthorized, errorMessage }
}

describe('NestJS 响应适配', () => {
  it('读取未包装的数据，并携带 Bearer 令牌', async () => {
    const { request } = setup()
    expect(await request.Get('/me')).toEqual({
      id: 'test-user',
      authorization: 'Bearer test-session',
    })
    expect(await request.Get('/wrapped', { meta: { isWrapped: true } })).toEqual({
      id: 'test-user',
    })
  })

  it('Axios 的 422 走统一错误解析，保留错误码和公开文案', async () => {
    const { request, unauthorized, errorMessage } = setup()
    await expect(request.Post('/credentials').send()).rejects.toMatchObject({
      status: 422,
      code: 'AUTH.INVALID_CREDENTIALS',
      message: '账号或密码错误',
    })
    expect(errorMessage).toHaveBeenCalledExactlyOnceWith('账号或密码错误')
    expect(unauthorized).not.toHaveBeenCalled()
  })

  it.each([201, 202, 204, 206])('HTTP %i 按 Axios 的 2xx 规则返回成功', async (status) => {
    const { request, unauthorized, errorMessage } = setup()
    await expect(request.Get(`/http-status/${status}`).send()).resolves.toEqual(
      status === 204 ? '' : { status },
    )
    expect(errorMessage).not.toHaveBeenCalled()
    expect(unauthorized).not.toHaveBeenCalled()
  })

  it('默认适配器的 HTTP 401 也走统一错误处理', async () => {
    const unauthorized = vi.fn()
    const errorMessage = vi.fn()
    const request = createInstance({
      baseUrl,
      isWrapped: false,
      unAuthorizedResponseFunc: unauthorized,
      errorMessageFunc: errorMessage,
    })

    await expect(request.Get('/expired').send()).rejects.toMatchObject({
      status: 401,
      code: 'AUTH.SESSION_INVALID',
      message: '登录已失效，请重新登录',
    })
    expect(unauthorized).toHaveBeenCalledOnce()
    expect(errorMessage).toHaveBeenCalledExactlyOnceWith('登录已失效，请重新登录')
  })

  it.each([401, 422])('HTTP 200 下的业务错误 %i 仍会拒绝且只提示一次', async (code) => {
    const { request, unauthorized, errorMessage } = setup()
    await expect(
      request.Get(`/wrapped-error/${code}`, { meta: { isWrapped: true } }).send(),
    ).rejects.toMatchObject({ status: 200, code, message: '业务处理失败' })
    expect(errorMessage).toHaveBeenCalledExactlyOnceWith('业务处理失败')
    expect(unauthorized).toHaveBeenCalledTimes(code === 401 ? 1 : 0)
  })

  it('页面关闭全局提示后，401 仍触发会话失效回调', async () => {
    const { request, unauthorized, errorMessage } = setup()
    await expect(
      request.Get('/expired', { meta: { isShowErrorMessage: false } }).send(),
    ).rejects.toMatchObject({ status: 401 })
    expect(unauthorized).toHaveBeenCalledOnce()
    expect(unauthorized.mock.calls[0]?.[0].config.headers.get('Authorization')).toBe(
      'Bearer test-session',
    )
    expect(errorMessage).not.toHaveBeenCalled()
  })

  it('服务暂不可用时保留会话，不当成 401 注销用户', async () => {
    const { request, unauthorized } = setup()
    await expect(request.Get('/unavailable').send()).rejects.toMatchObject({
      status: 503,
      message: '登录服务暂时不可用，请稍后重试',
    })
    expect(unauthorized).not.toHaveBeenCalled()
  })
})
