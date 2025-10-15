import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createInstance, createDualCallInstance } from '../src/index'
import type { baseRequestOption } from '../src/index'
import type { AlovaGenerics } from 'alova'

// Mock alova
vi.mock('alova', () => ({
  createAlova: vi.fn((config) => ({
    config,
    Get: vi.fn(),
    Post: vi.fn(),
    Put: vi.fn(),
    Delete: vi.fn(),
    Patch: vi.fn(),
    Head: vi.fn(),
    Options: vi.fn(),
    Request: vi.fn(),
  })),
}))

// Mock alova/fetch
vi.mock('alova/fetch', () => ({
  default: vi.fn(() => 'mocked-adapter'),
}))

// Mock @bubblesjs/utils
vi.mock('@bubblesjs/utils', () => ({
  deepMergeObject: vi.fn((target, source) => ({ ...target, ...source })),
  isReadableStream: vi.fn(() => false),
}))

describe('Request Library Tests', () => {
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

  describe('createInstance', () => {
    it('should create instance with default configuration', () => {
      const instance = createInstance({})
      expect(instance).toBeDefined()
      expect(instance.Get).toBeDefined()
      expect(instance.Post).toBeDefined()
    })

    it('should merge custom configuration with defaults', () => {
      const customConfig: baseRequestOption<AlovaGenerics> = {
        baseUrl: 'https://api.example.com',
        timeout: 5000,
        commonHeaders: {
          Authorization: 'Bearer token',
          'X-Custom-Header': () => 'dynamic-value',
        },
        isShowSuccessMessage: true,
        successMessageFunc: mockSuccessMessageFunc,
      }

      const instance = createInstance(customConfig)
      expect(instance).toBeDefined()
    })

    it('should handle response transformation correctly', () => {
      const config: baseRequestOption<AlovaGenerics> = {
        isTransformResponse: true,
        responseDataKey: 'result',
        responseMessageKey: 'msg',
      }

      const instance = createInstance(config)
      expect(instance).toBeDefined()
    })

    it('should configure status and code mappings', () => {
      const config: baseRequestOption<AlovaGenerics> = {
        statusMap: {
          success: 200,
          unAuthorized: 401,
        },
        codeMap: {
          success: [200, 201],
          unAuthorized: [401, 403],
        },
      }

      const instance = createInstance(config)
      expect(instance).toBeDefined()
    })

    it('should set up message functions', () => {
      const config: baseRequestOption<AlovaGenerics> = {
        successMessageFunc: mockSuccessMessageFunc,
        errorMessageFunc: mockErrorMessageFunc,
        unAuthorizedResponseFunc: mockUnAuthorizedResponseFunc,
      }

      const instance = createInstance(config)
      expect(instance).toBeDefined()
    })
  })

  describe('createDualCallInstance', () => {
    let baseConfig: baseRequestOption<AlovaGenerics>

    beforeEach(() => {
      baseConfig = {
        baseUrl: '/api',
        isShowSuccessMessage: false,
        successMessageFunc: mockSuccessMessageFunc,
        errorMessageFunc: mockErrorMessageFunc,
      }
    })

    it('should create dual call instance factory', () => {
      const dualInstance = createDualCallInstance(baseConfig)
      expect(dualInstance).toBeDefined()
      expect(typeof dualInstance).toBe('function')
    })

    it('should return default instance when called without options', () => {
      const dualInstance = createDualCallInstance(baseConfig)
      const defaultInstance = dualInstance()
      expect(defaultInstance).toBeDefined()
    })

    it('should create new instance with merged config when options provided', () => {
      const dualInstance = createDualCallInstance(baseConfig)
      const customInstance = dualInstance({
        isShowSuccessMessage: true,
        isShowErrorMessage: false,
      })
      expect(customInstance).toBeDefined()
    })

    it('should bind HTTP methods to default instance', () => {
      const dualInstance = createDualCallInstance(baseConfig)
      expect(dualInstance.Get).toBeDefined()
      expect(dualInstance.Post).toBeDefined()
      expect(dualInstance.Put).toBeDefined()
      expect(dualInstance.Delete).toBeDefined()
      expect(dualInstance.Patch).toBeDefined()
      expect(dualInstance.Head).toBeDefined()
      expect(dualInstance.Options).toBeDefined()
      expect(dualInstance.Request).toBeDefined()
    })

    it('should allow method calls directly on dual instance', () => {
      const dualInstance = createDualCallInstance(baseConfig)
      expect(() => dualInstance.Get('/test')).not.toThrow()
      expect(() => dualInstance.Post('/test', { body: {} })).not.toThrow()
    })
  })

  describe('Configuration handling', () => {
    it('should use default values when not provided', () => {
      const instance = createInstance({})
      expect(instance).toBeDefined()
    })

    it('should handle common headers with functions', () => {
      const headerFunc = vi.fn(() => 'dynamic-token')
      const config: baseRequestOption<AlovaGenerics> = {
        commonHeaders: {
          Authorization: headerFunc,
          'Content-Type': 'application/json',
        },
      }

      const instance = createInstance(config)
      expect(instance).toBeDefined()
    })

    it('should handle boolean flags correctly', () => {
      const config: baseRequestOption<AlovaGenerics> = {
        isTransformResponse: false,
        isShowSuccessMessage: true,
        isShowErrorMessage: false,
      }

      const instance = createInstance(config)
      expect(instance).toBeDefined()
    })

    it('should handle custom message strings', () => {
      const config: baseRequestOption<AlovaGenerics> = {
        successDefaultMessage: '成功了！',
        errorDefaultMessage: '出错了！',
      }

      const instance = createInstance(config)
      expect(instance).toBeDefined()
    })
  })

  describe('Integration scenarios', () => {
    it('should create instance with comprehensive configuration', () => {
      const config: baseRequestOption<AlovaGenerics> = {
        baseUrl: 'https://api.test.com',
        timeout: 10000,
        commonHeaders: {
          Authorization: () => 'Bearer ' + Math.random(),
          'X-Client-Version': '1.0.0',
        },
        statusMap: {
          success: 200,
          unAuthorized: 401,
        },
        codeMap: {
          success: [200, 201, 202],
          unAuthorized: [401, 403],
        },
        responseDataKey: 'data',
        responseMessageKey: 'message',
        isTransformResponse: true,
        isShowSuccessMessage: true,
        successDefaultMessage: '操作成功',
        isShowErrorMessage: true,
        errorDefaultMessage: '操作失败',
        successMessageFunc: mockSuccessMessageFunc,
        errorMessageFunc: mockErrorMessageFunc,
        unAuthorizedResponseFunc: mockUnAuthorizedResponseFunc,
      }

      const instance = createInstance(config)
      expect(instance).toBeDefined()
      expect(instance.Get).toBeDefined()
      expect(instance.Post).toBeDefined()
    })

    it('should work with dual call instance in different scenarios', () => {
      const baseConfig: baseRequestOption<AlovaGenerics> = {
        baseUrl: '/api/v1',
        successMessageFunc: mockSuccessMessageFunc,
        errorMessageFunc: mockErrorMessageFunc,
      }

      const requestFactory = createDualCallInstance(baseConfig)

      // 默认实例
      const defaultRequest = requestFactory()
      expect(defaultRequest).toBeDefined()

      // 显示成功消息的实例
      const successRequest = requestFactory({
        isShowSuccessMessage: true,
      })
      expect(successRequest).toBeDefined()

      // 静默实例（不显示任何消息）
      const silentRequest = requestFactory({
        isShowSuccessMessage: false,
        isShowErrorMessage: false,
      })
      expect(silentRequest).toBeDefined()

      // 自定义响应转换的实例
      const customTransformRequest = requestFactory({
        isTransformResponse: false,
      })
      expect(customTransformRequest).toBeDefined()
    })
  })

  describe('Edge cases', () => {
    it('should handle undefined/null config gracefully', () => {
      expect(() => createInstance({})).not.toThrow()
    })

    it('should handle empty headers object', () => {
      const config: baseRequestOption<AlovaGenerics> = {
        commonHeaders: {},
      }
      expect(() => createInstance(config)).not.toThrow()
    })

    it('should handle undefined callback functions', () => {
      const config: baseRequestOption<AlovaGenerics> = {
        successMessageFunc: undefined,
        errorMessageFunc: undefined,
        unAuthorizedResponseFunc: undefined,
      }
      expect(() => createInstance(config)).not.toThrow()
    })

    it('should handle empty arrays in codeMap', () => {
      const config: baseRequestOption<AlovaGenerics> = {
        codeMap: {
          success: [],
          unAuthorized: [],
        },
      }
      expect(() => createInstance(config)).not.toThrow()
    })

    it('should handle zero timeout', () => {
      const config: baseRequestOption<AlovaGenerics> = {
        timeout: 0,
      }

      expect(() => createInstance(config)).not.toThrow()
    })

    it('should handle empty baseUrl', () => {
      const config: baseRequestOption<AlovaGenerics> = {
        baseUrl: '',
      }

      expect(() => createInstance(config)).not.toThrow()
    })
  })

  describe('Advanced configuration tests', () => {
    it('should handle custom requestAdapter', () => {
      const customAdapter = vi.fn()
      const config: baseRequestOption<AlovaGenerics> = {
        requestAdapter: customAdapter,
      }

      expect(() => createInstance(config)).not.toThrow()
    })

    it('should handle statesHook configuration', () => {
      const mockStatesHook = {} as any // 简化 mock
      const config: baseRequestOption<AlovaGenerics> = {
        statesHook: mockStatesHook,
      }

      expect(() => createInstance(config)).not.toThrow()
    })

    it('should work with all HTTP methods', () => {
      const config: baseRequestOption<AlovaGenerics> = {
        baseUrl: '/api/test',
      }

      const instance = createInstance(config)

      // 验证所有 HTTP 方法都存在且可调用
      expect(instance.Get).toBeDefined()
      expect(instance.Post).toBeDefined()
      expect(instance.Put).toBeDefined()
      expect(instance.Delete).toBeDefined()
      expect(instance.Patch).toBeDefined()
      expect(instance.Head).toBeDefined()
      expect(instance.Options).toBeDefined()
      expect(instance.Request).toBeDefined()
    })
  })

  describe('Type safety and interface compliance', () => {
    it('should accept all valid baseRequestOption properties', () => {
      const fullConfig: baseRequestOption<AlovaGenerics> = {
        baseUrl: 'https://example.com',
        timeout: 5000,
        commonHeaders: {
          Accept: 'application/json',
          'User-Agent': () => 'TestAgent/1.0',
        },
        statusMap: {
          success: 200,
          unAuthorized: 401,
        },
        codeMap: {
          success: [200, 201, 202],
          unAuthorized: [401, 403, 422],
        },
        responseDataKey: 'payload',
        responseMessageKey: 'msg',
        isTransformResponse: true,
        isShowSuccessMessage: false,
        successDefaultMessage: '请求成功',
        isShowErrorMessage: true,
        errorDefaultMessage: '请求失败',
        successMessageFunc: mockSuccessMessageFunc,
        errorMessageFunc: mockErrorMessageFunc,
        unAuthorizedResponseFunc: mockUnAuthorizedResponseFunc,
        requestAdapter: vi.fn(),
        statesHook: {} as any,
      }

      expect(() => createInstance(fullConfig)).not.toThrow()
    })

    it('should work with minimal configuration', () => {
      const minimalConfig = {}
      expect(() => createInstance(minimalConfig)).not.toThrow()
    })

    it('should handle CustomConfig interface correctly', () => {
      const baseConfig: baseRequestOption<AlovaGenerics> = {
        baseUrl: '/api',
      }

      const dualInstance = createDualCallInstance(baseConfig)

      // 测试 CustomConfig 接口的所有属性
      const customInstance = dualInstance({
        isTransformResponse: false,
        isShowSuccessMessage: true,
        isShowErrorMessage: false,
      })

      expect(customInstance).toBeDefined()
    })
  })

  describe('Dual call instance advanced scenarios', () => {
    it('should reuse default instance for multiple calls without options', () => {
      const baseConfig: baseRequestOption<AlovaGenerics> = {
        baseUrl: '/api',
      }

      const dualInstance = createDualCallInstance(baseConfig)
      const instance1 = dualInstance()
      const instance2 = dualInstance()

      expect(instance1).toBe(instance2) // 应该是同一个实例
    })

    it('should create different instances for different custom options', () => {
      const baseConfig: baseRequestOption<AlovaGenerics> = {
        baseUrl: '/api',
      }

      const dualInstance = createDualCallInstance(baseConfig)
      const instance1 = dualInstance({ isShowSuccessMessage: true })
      const instance2 = dualInstance({ isShowErrorMessage: false })

      expect(instance1).not.toBe(instance2) // 应该是不同的实例
    })

    it('should maintain method binding across different calls', () => {
      const baseConfig: baseRequestOption<AlovaGenerics> = {
        baseUrl: '/api',
      }

      const dualInstance = createDualCallInstance(baseConfig)

      // 测试直接方法调用
      expect(() => dualInstance.Get('/users')).not.toThrow()
      expect(() => dualInstance.Post('/users', { body: { name: 'test' } })).not.toThrow()

      // 测试实例方法调用
      const instance = dualInstance()
      expect(() => instance.Get('/users')).not.toThrow()
      expect(() => instance.Post('/users', { body: { name: 'test' } })).not.toThrow()
    })
  })
})
