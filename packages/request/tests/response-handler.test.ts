import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createInstance } from '../src/index'
import type { baseRequestOption } from '../src/index'
import type { AlovaGenerics } from 'alova'

// Mock alova for response handling tests
vi.mock('alova', () => {
  let beforeRequestHandler: ((method: any) => Promise<void>) | undefined
  let onSuccessHandler: ((response: any) => Promise<any>) | undefined
  let onErrorHandler: ((error: any) => void) | undefined

  const mockInstance: any = {
    Get: vi.fn(),
    Post: vi.fn(),
    Put: vi.fn(),
    Delete: vi.fn(),
    Patch: vi.fn(),
    Head: vi.fn(),
    Options: vi.fn(),
    Request: vi.fn(),
  }

  return {
    createAlova: vi.fn((config) => {
      // 存储拦截器函数以供测试使用
      beforeRequestHandler = config.beforeRequest
      onSuccessHandler = config.responded?.onSuccess
      onErrorHandler = config.responded?.onError

      mockInstance.config = config
      // 暴露拦截器供测试使用
      mockInstance._beforeRequestHandler = beforeRequestHandler
      mockInstance._onSuccessHandler = onSuccessHandler
      mockInstance._onErrorHandler = onErrorHandler

      return mockInstance
    }),
    // 导出拦截器以便测试访问
    __getHandlers: () => ({
      beforeRequestHandler,
      onSuccessHandler,
      onErrorHandler,
    }),
  }
})

// Mock alova/fetch
vi.mock('alova/fetch', () => ({
  default: vi.fn(() => 'mocked-adapter'),
}))

// Mock @bubblesjs/utils
vi.mock('@bubblesjs/utils', () => ({
  deepMergeObject: vi.fn((target, source) => ({ ...target, ...source })),
  isReadableStream: vi.fn((body) => body && typeof body.getReader === 'function'),
}))

describe('Response Handler Tests', () => {
  let mockSuccessMessageFunc: ReturnType<typeof vi.fn>
  let mockErrorMessageFunc: ReturnType<typeof vi.fn>
  let mockUnAuthorizedResponseFunc: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockSuccessMessageFunc = vi.fn()
    mockErrorMessageFunc = vi.fn()
    mockUnAuthorizedResponseFunc = vi.fn()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('beforeRequest interceptor', () => {
    it('should set static headers correctly', async () => {
      const config: baseRequestOption<AlovaGenerics> = {
        commonHeaders: {
          'Content-Type': 'application/json',
          'X-API-Key': 'test-key',
        },
      }

      const instance = createInstance(config)
      const beforeRequestHandler = (instance as any)._beforeRequestHandler

      if (beforeRequestHandler) {
        const mockMethod = {
          config: {
            headers: {} as Record<string, string>,
          },
        }

        await beforeRequestHandler(mockMethod)

        expect(mockMethod.config.headers['Content-Type']).toBe('application/json')
        expect(mockMethod.config.headers['X-API-Key']).toBe('test-key')
      }
    })

    it('should set dynamic headers from functions', async () => {
      const dynamicToken = vi.fn(() => 'dynamic-bearer-token')
      const config: baseRequestOption<AlovaGenerics> = {
        commonHeaders: {
          Authorization: dynamicToken,
          'X-Timestamp': () => '2024-01-01',
        },
      }

      const instance = createInstance(config)
      const beforeRequestHandler = (instance as any)._beforeRequestHandler

      if (beforeRequestHandler) {
        const mockMethod = {
          config: {
            headers: {} as Record<string, string>,
          },
        }

        await beforeRequestHandler(mockMethod)

        expect(dynamicToken).toHaveBeenCalled()
        expect(mockMethod.config.headers['Authorization']).toBe('dynamic-bearer-token')
        expect(mockMethod.config.headers['X-Timestamp']).toBe('2024-01-01')
      }
    })

    it('should handle empty headers gracefully', async () => {
      const config: baseRequestOption<AlovaGenerics> = {
        commonHeaders: {},
      }

      const instance = createInstance(config)
      const beforeRequestHandler = (instance as any)._beforeRequestHandler

      if (beforeRequestHandler) {
        const mockMethod = {
          config: {
            headers: {} as Record<string, string>,
          },
        }

        await expect(beforeRequestHandler(mockMethod)).resolves.not.toThrow()
      }
    })
  })

  describe('onSuccess response handler', () => {
    it('should return original response when transform is disabled', async () => {
      const config: baseRequestOption<AlovaGenerics> = {
        isTransformResponse: false,
      }

      const instance = createInstance(config)
      const onSuccessHandler = (instance as any)._onSuccessHandler

      if (onSuccessHandler) {
        const mockResponse = {
          status: 200,
          body: null,
          data: { message: 'test' },
        }

        const result = await onSuccessHandler(mockResponse)
        expect(result).toBe(mockResponse)
      }
    })

    it('should handle successful response with correct status', async () => {
      const config: baseRequestOption<AlovaGenerics> = {
        isTransformResponse: true,
        statusMap: { success: 200 },
        codeMap: { success: [200] },
        responseDataKey: 'data',
        responseMessageKey: 'message',
        isShowSuccessMessage: true,
        successMessageFunc: mockSuccessMessageFunc,
      }

      const instance = createInstance(config)
      const onSuccessHandler = (instance as any)._onSuccessHandler

      if (onSuccessHandler) {
        const mockResponse = {
          status: 200,
          body: null,
          data: {
            code: 200,
            data: { id: 1, name: 'test' },
            message: '操作成功',
          },
          json: vi.fn().mockResolvedValue({
            code: 200,
            data: { id: 1, name: 'test' },
            message: '操作成功',
          }),
        }

        // Mock isReadableStream to return true to trigger json() call
        const { isReadableStream } = await import('@bubblesjs/utils')
        ;(isReadableStream as any).mockReturnValue(true)

        const result = await onSuccessHandler(mockResponse)

        expect(mockSuccessMessageFunc).toHaveBeenCalledWith('操作成功')
        expect(result).toEqual({ id: 1, name: 'test' })
      }
    })

    it('should handle HTTP status error', async () => {
      const config: baseRequestOption<AlovaGenerics> = {
        isTransformResponse: true,
        statusMap: { success: 200 },
      }

      const instance = createInstance(config)
      const onSuccessHandler = (instance as any)._onSuccessHandler

      if (onSuccessHandler) {
        const mockResponse = {
          status: 500,
          body: null,
          data: { error: 'Server Error' },
        }

        await expect(onSuccessHandler(mockResponse)).rejects.toBe(mockResponse)
      }
    })

    it('should handle unauthorized status code', async () => {
      const config: baseRequestOption<AlovaGenerics> = {
        isTransformResponse: true,
        statusMap: { success: 200, unAuthorized: 401 },
        unAuthorizedResponseFunc: mockUnAuthorizedResponseFunc,
      }

      const instance = createInstance(config)
      const onSuccessHandler = (instance as any)._onSuccessHandler

      if (onSuccessHandler) {
        const mockResponse = {
          status: 401,
          body: null,
          data: { error: 'Unauthorized' },
        }

        await expect(onSuccessHandler(mockResponse)).rejects.toBe(mockResponse)
        expect(mockUnAuthorizedResponseFunc).toHaveBeenCalled()
      }
    })

    it('should handle business code errors', async () => {
      const config: baseRequestOption<AlovaGenerics> = {
        isTransformResponse: true,
        statusMap: { success: 200 },
        codeMap: { success: [200] },
        responseDataKey: 'data',
        responseMessageKey: 'message',
        isShowErrorMessage: true,
        errorMessageFunc: mockErrorMessageFunc,
      }

      const instance = createInstance(config)
      const onSuccessHandler = (instance as any)._onSuccessHandler

      if (onSuccessHandler) {
        const mockResponse = {
          status: 200,
          body: null,
          data: {
            code: 400,
            data: null,
            message: '参数错误',
          },
          json: vi.fn().mockResolvedValue({
            code: 400,
            data: null,
            message: '参数错误',
          }),
        }

        // Mock isReadableStream to return true
        const { isReadableStream } = await import('@bubblesjs/utils')
        ;(isReadableStream as any).mockReturnValue(true)

        await expect(onSuccessHandler(mockResponse)).rejects.toBe(mockResponse)
        expect(mockErrorMessageFunc).toHaveBeenCalledWith('参数错误')
      }
    })

    it('should handle unauthorized business code', async () => {
      const config: baseRequestOption<AlovaGenerics> = {
        isTransformResponse: true,
        statusMap: { success: 200 },
        codeMap: { success: [200], unAuthorized: [401] },
        responseDataKey: 'data',
        responseMessageKey: 'message',
        unAuthorizedResponseFunc: mockUnAuthorizedResponseFunc,
      }

      const instance = createInstance(config)
      const onSuccessHandler = (instance as any)._onSuccessHandler

      if (onSuccessHandler) {
        const mockResponse = {
          status: 200,
          body: null,
          data: {
            code: 401,
            data: null,
            message: '登录已过期',
          },
          json: vi.fn().mockResolvedValue({
            code: 401,
            data: null,
            message: '登录已过期',
          }),
        }

        // Mock isReadableStream to return true
        const { isReadableStream } = await import('@bubblesjs/utils')
        ;(isReadableStream as any).mockReturnValue(true)

        await expect(onSuccessHandler(mockResponse)).rejects.toBe(mockResponse)
        expect(mockUnAuthorizedResponseFunc).toHaveBeenCalled()
      }
    })

    it('should use default error message when response message is missing', async () => {
      const config: baseRequestOption<AlovaGenerics> = {
        isTransformResponse: true,
        statusMap: { success: 200 },
        codeMap: { success: [200] },
        responseDataKey: 'data',
        responseMessageKey: 'message',
        isShowErrorMessage: true,
        errorMessageFunc: mockErrorMessageFunc,
        errorDefaultMessage: '默认错误消息',
      }

      const instance = createInstance(config)
      const onSuccessHandler = (instance as any)._onSuccessHandler

      if (onSuccessHandler) {
        const mockResponse = {
          status: 200,
          body: null,
          data: {
            code: 500,
            data: null,
            // message 字段缺失
          },
          json: vi.fn().mockResolvedValue({
            code: 500,
            data: null,
          }),
        }

        // Mock isReadableStream to return true
        const { isReadableStream } = await import('@bubblesjs/utils')
        ;(isReadableStream as any).mockReturnValue(true)

        await expect(onSuccessHandler(mockResponse)).rejects.toBe(mockResponse)
        expect(mockErrorMessageFunc).toHaveBeenCalledWith('默认错误消息')
      }
    })

    it('should handle non-readable stream response', async () => {
      const config: baseRequestOption<AlovaGenerics> = {
        isTransformResponse: true,
        statusMap: { success: 200 },
        codeMap: { success: [200] },
        responseDataKey: 'data',
      }

      const instance = createInstance(config)
      const onSuccessHandler = (instance as any)._onSuccessHandler

      if (onSuccessHandler) {
        const mockResponse = {
          status: 200,
          body: null,
          data: {
            code: 200,
            data: { id: 1, name: 'test' },
          },
        }

        // Mock isReadableStream to return false (direct use of response.data)
        const { isReadableStream } = await import('@bubblesjs/utils')
        ;(isReadableStream as any).mockReturnValue(false)

        const result = await onSuccessHandler(mockResponse)
        expect(result).toEqual({ id: 1, name: 'test' })
      }
    })
  })

  describe('onError handler', () => {
    it('should call error message function with response message', () => {
      const config: baseRequestOption<AlovaGenerics> = {
        isShowErrorMessage: true,
        errorMessageFunc: mockErrorMessageFunc,
      }

      const instance = createInstance(config)
      const onErrorHandler = (instance as any)._onErrorHandler

      if (onErrorHandler) {
        const mockError = {
          response: {
            data: {
              message: '网络错误',
            },
          },
        }

        onErrorHandler(mockError)
        expect(mockErrorMessageFunc).toHaveBeenCalledWith('网络错误')
      }
    })

    it('should use default error message when response message is missing', () => {
      const config: baseRequestOption<AlovaGenerics> = {
        isShowErrorMessage: true,
        errorMessageFunc: mockErrorMessageFunc,
        errorDefaultMessage: '默认网络错误',
      }

      const instance = createInstance(config)
      const onErrorHandler = (instance as any)._onErrorHandler

      if (onErrorHandler) {
        const mockError = {
          response: {
            data: {},
          },
        }

        onErrorHandler(mockError)
        expect(mockErrorMessageFunc).toHaveBeenCalledWith('默认网络错误')
      }
    })

    it('should handle error without response', () => {
      const config: baseRequestOption<AlovaGenerics> = {
        isShowErrorMessage: true,
        errorMessageFunc: mockErrorMessageFunc,
        errorDefaultMessage: '请求失败',
      }

      const instance = createInstance(config)
      const onErrorHandler = (instance as any)._onErrorHandler

      if (onErrorHandler) {
        const mockError = {
          // 没有 response 属性
        }

        onErrorHandler(mockError)
        expect(mockErrorMessageFunc).toHaveBeenCalledWith('请求失败')
      }
    })

    it('should not call error function when isShowErrorMessage is false', () => {
      const config: baseRequestOption<AlovaGenerics> = {
        isShowErrorMessage: false,
        errorMessageFunc: mockErrorMessageFunc,
      }

      const instance = createInstance(config)
      const onErrorHandler = (instance as any)._onErrorHandler

      if (onErrorHandler) {
        const mockError = {
          response: {
            data: {
              message: '错误消息',
            },
          },
        }

        onErrorHandler(mockError)
        expect(mockErrorMessageFunc).not.toHaveBeenCalled()
      }
    })
  })

  describe('Complex response scenarios', () => {
    it('should handle custom response keys correctly', async () => {
      const config: baseRequestOption<AlovaGenerics> = {
        isTransformResponse: true,
        statusMap: { success: 200 },
        codeMap: { success: [0] }, // 使用 0 作为成功码
        responseDataKey: 'result',
        responseMessageKey: 'msg',
        isShowSuccessMessage: true,
        successMessageFunc: mockSuccessMessageFunc,
      }

      const instance = createInstance(config)
      const onSuccessHandler = (instance as any)._onSuccessHandler

      if (onSuccessHandler) {
        const mockResponse = {
          status: 200,
          body: null,
          data: {
            code: 0,
            result: { userId: 123, userName: 'John' },
            msg: '获取用户信息成功',
          },
          json: vi.fn().mockResolvedValue({
            code: 0,
            result: { userId: 123, userName: 'John' },
            msg: '获取用户信息成功',
          }),
        }

        // Mock isReadableStream to return true
        const { isReadableStream } = await import('@bubblesjs/utils')
        ;(isReadableStream as any).mockReturnValue(true)

        const result = await onSuccessHandler(mockResponse)

        expect(mockSuccessMessageFunc).toHaveBeenCalledWith('获取用户信息成功')
        expect(result).toEqual({ userId: 123, userName: 'John' })
      }
    })

    it('should handle multiple success codes', async () => {
      const config: baseRequestOption<AlovaGenerics> = {
        isTransformResponse: true,
        statusMap: { success: 200 },
        codeMap: { success: [200, 201, 202] },
        responseDataKey: 'data',
      }

      const instance = createInstance(config)
      const onSuccessHandler = (instance as any)._onSuccessHandler

      if (onSuccessHandler) {
        // 测试 201 成功码
        const mockResponse = {
          status: 200,
          body: null,
          data: {
            code: 201,
            data: { created: true },
          },
          json: vi.fn().mockResolvedValue({
            code: 201,
            data: { created: true },
          }),
        }

        // Mock isReadableStream to return true
        const { isReadableStream } = await import('@bubblesjs/utils')
        ;(isReadableStream as any).mockReturnValue(true)

        const result = await onSuccessHandler(mockResponse)
        expect(result).toEqual({ created: true })
      }
    })
  })
})
