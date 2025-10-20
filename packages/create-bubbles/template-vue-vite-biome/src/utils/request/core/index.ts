import { type AlovaGenerics, type AlovaOptions, createAlova } from 'alova'
import { deepMergeObject, isReadableStream } from './utils'
import adapterFetch from 'alova/fetch'

interface statusMap {
  success?: number
  unAuthorized?: number
}

interface codeMap {
  success?: number[]
  unAuthorized?: number[]
}

export interface baseRequestOption<AG extends AlovaGenerics> {
  baseUrl?: string
  timeout?: number
  commonHeaders?: Record<string, string | (() => string)>
  statusMap?: statusMap
  codeMap?: codeMap
  responseDataKey?: string
  responseMessageKey?: string
  isTransformResponse?: boolean
  isShowSuccessMessage?: boolean
  successDefaultMessage?: string
  isShowErrorMessage?: boolean
  errorDefaultMessage?: string
  statesHook?: AlovaOptions<AG>['statesHook']
  successMessageFunc?: (message: string) => void
  errorMessageFunc?: (message: string) => void
  unAuthorizedResponseFunc?: () => void
  requestAdapter?: AlovaOptions<AG>['requestAdapter']
}

export interface CustomConfig {
  isTransformResponse?: boolean
  isShowSuccessMessage?: boolean
  isShowErrorMessage?: boolean
}

type requestOption = baseRequestOption<AlovaGenerics> & CustomConfig

export const createInstance = (option: requestOption) => {
  const defaultOption: requestOption = {
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
    isShowErrorMessage: true,
    errorDefaultMessage: '服务异常',
    requestAdapter: adapterFetch(),
  }

  const mergeOption: baseRequestOption<AlovaGenerics> & CustomConfig = deepMergeObject(
    defaultOption,
    option,
  )

  const instance = createAlova({
    baseURL: mergeOption.baseUrl,
    timeout: mergeOption.timeout,
    statesHook: mergeOption?.statesHook,
    requestAdapter: mergeOption.requestAdapter as AlovaOptions<AlovaGenerics>['requestAdapter'],
    beforeRequest: async (method) => {
      for (const [key, value] of Object.entries(option?.commonHeaders ?? {})) {
        method.config.headers[key] = typeof value === 'function' ? value() : value
      }
    },
    responded: {
      onSuccess: async (response) => {
        if (!mergeOption?.isTransformResponse) return response
        const { status } = response

        // 判断响应类型：如果使用 adapterFetch，response.data 是可读流，则调用 json()；否则直接使用 response.data
        const data =
          response?.body && isReadableStream(response.body)
            ? await response.json() // adapterFetch 的响应，使用 json() 解析可读流
            : response.data // 其他适配器的响应
        // 不成功的情况
        if (status !== mergeOption.statusMap?.success) {
          // 如果后端使用status 字段来表示未授权，则返回401
          if (mergeOption?.statusMap?.unAuthorized === status) {
            mergeOption?.unAuthorizedResponseFunc?.()
          }
          return Promise.reject(response)
        }

        const {
          responseDataKey,
          codeMap,
          isShowSuccessMessage,
          responseMessageKey,
          isShowErrorMessage,
        } = mergeOption
        const {
          code,
          [responseDataKey as string]: responseData,
          [responseMessageKey as string]: responseMessage,
        } = data
        if (!codeMap?.success?.includes(+code)) {
          // code unAuthorized 处理
          if (codeMap?.unAuthorized?.includes(+code)) {
            mergeOption?.unAuthorizedResponseFunc?.()
            return Promise.reject(response)
          }
          // 其他错误直接打印msg

          const errorMessage = data[responseMessageKey as string] ?? mergeOption.errorDefaultMessage
          if (isShowErrorMessage) mergeOption?.errorMessageFunc?.(errorMessage)
          return Promise.reject(response)
        }
        if (isShowSuccessMessage)
          mergeOption?.successMessageFunc?.(responseMessage ?? mergeOption.successDefaultMessage)
        return responseData
      },
      onError: (error) => {
        if (mergeOption?.isShowErrorMessage)
          mergeOption.errorMessageFunc?.(
            error.response?.data?.message ?? mergeOption?.errorDefaultMessage,
          )
      },
      // onComplete: (_method) => {},
    },
  })

  return instance
}

// 🚀 创建双重调用实例的工厂函数
export const createDualCallInstance = (baseConfig: baseRequestOption<AlovaGenerics>) => {
  // 创建默认实例
  const defaultInstance = createInstance(baseConfig)

  // 双重调用函数
  const dualInstance = (option?: CustomConfig) => {
    if (option) {
      // 合并配置并创建新实例
      const mergedConfig = { ...baseConfig, ...option }
      return createInstance(mergedConfig)
    }
    return defaultInstance
  }

  // 🎯 直接绑定 HTTP 方法，无需复杂类型注释
  dualInstance.Get = defaultInstance.Get.bind(defaultInstance)
  dualInstance.Post = defaultInstance.Post.bind(defaultInstance)
  dualInstance.Put = defaultInstance.Put.bind(defaultInstance)
  dualInstance.Delete = defaultInstance.Delete.bind(defaultInstance)
  dualInstance.Patch = defaultInstance.Patch.bind(defaultInstance)
  dualInstance.Head = defaultInstance.Head.bind(defaultInstance)
  dualInstance.Options = defaultInstance.Options.bind(defaultInstance)
  dualInstance.Request = defaultInstance.Request.bind(defaultInstance)

  return dualInstance
}
