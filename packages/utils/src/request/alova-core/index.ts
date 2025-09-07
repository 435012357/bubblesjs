import { type AlovaOptions, type AlovaGenerics, type Alova } from 'alova'
import adapterFetch from 'alova/fetch'
import { deepMergeObject } from './utils'
import { createRequestCore } from './core'
import { axiosRequestAdapter } from '@alova/adapter-axios'

interface statusMap {
  success?: number
  unAuthorized?: number
}

interface codeMap {
  success?: number[]
  unAuthorized?: number[]
}

export interface getRequestOption<AG extends AlovaGenerics> {
  baseUrl?: string
  timeout?: number
  commonHeaders?: Record<string, string | (() => string)>
  successDefaultMessage?: string
  statusMap?: statusMap
  codeMap?: codeMap
  responseDataKey?: string
  responseMessageKey?: string
  isTransformResponse?: boolean
  isShowSuccessMessage?: boolean
  statesHook?: AlovaOptions<AG>['statesHook']
  successMessageFunc?: (message: string) => void
  errorMessageFunc?: (message: string) => void
  unAuthorizedResponseFunc?: () => void
}

export const createInstance = (option) => {
  const defaultOption = {
    baseUrl: '/',
    timeout: 0,
    statusMap: {
      success: 200,
      unAuthorized: 401,
    },
    codeMap: {
      success: [200],
      unAuthorized: [401],
    },
    responseDataKey: 'data',
    responseMessageKey: 'message',
    isTransformResponse: true,
    isShowSuccessMessage: false,
    successDefaultMessage: '操作成功',
    requestAdapter: adapterFetch(),
  }

  const alovaOption = deepMergeObject(defaultOption, option)

  const instance = createAlova({
    baseURL: alovaOption.baseUrl,
    timeout: alovaOption.timeout,
    statesHook: alovaOption?.statesHook,
    requestAdapter: axiosRequestAdapter(),
    beforeRequest: async (method) => {
      for (const [key, value] of Object.entries(option?.commonHeaders ?? {})) {
        method.config.headers[key] = typeof value === 'function' ? value() : value
      }
    },
    responded: {
      onSuccess: (response, method) => {
        const { status, data } = response
        if (status !== option.statusMap?.success) {
          if (option?.statusMap?.unAuthorized === status) {
            option?.unAuthorizedResponseFunc?.()
          }
          throw Error(response.data)
        }

        if (!option?.isTransformResponse) return response

        const { responseDataKey, codeMap, isShowSuccessMessage, responseMessageKey } = option
        const {
          code,
          [responseDataKey as string]: responseData,
          [responseMessageKey as string]: responseMessage,
        } = data
        if (!codeMap?.success?.includes(+code)) {
          if (codeMap?.unAuthorized?.includes(+code)) {
            option?.unAuthorizedResponseFunc?.()
          }
          throw Error(response)
        }
        if (isShowSuccessMessage)
          option?.successMessageFunc?.(responseMessage ?? option.successDefaultMessage)
        return responseData
      },
      onError: (error, _method) => {
        option.errorMessageFunc?.(error.message)
      },
      onComplete: (_method) => {},
    },
  })

  return instance
}

// 🚀 创建双重调用实例的工厂函数
export const createDualCallInstance = (baseConfig) => {
  // 创建默认实例
  const defaultInstance = createInstance(baseConfig)

  type CustomConfig = {
    isTransformResponse?: boolean
    isShowSuccessMessage?: boolean
  }

  // 双重调用函数
  const dualInstance = (option?: CustomConfig) => {
    if (option) {
      // 合并配置并创建新实例
      const mergedConfig = { ...baseConfig, ...option }
      return createInstance(mergedConfig)
    }
    return defaultInstance
  }

  // 🎯 将默认实例的所有 HTTP 方法绑定到 dualInstance 上
  const httpMethods = [
    'Get',
    'Post',
    'Put',
    'Delete',
    'Patch',
    'Head',
    'Options',
    'Request',
  ] as const

  httpMethods.forEach((method) => {
    if (defaultInstance[method]) {
      ;(dualInstance as any)[method] = defaultInstance[method].bind(defaultInstance)
    }
  })

  return dualInstance
}
