import { type AlovaOptions, type AlovaGenerics, createAlova } from 'alova'
import { deepMergeObject, isReadableStream } from '../../general'
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
    errorDefaultMessage: '服务异常',
    requestAdapter: adapterFetch(),
  }

  console.log('💦', option.requestAdapter === adapterFetch())

  const alovaOption: baseRequestOption<AlovaGenerics> & CustomConfig = deepMergeObject(
    defaultOption,
    option,
  )

  const instance = createAlova({
    baseURL: alovaOption.baseUrl,
    timeout: alovaOption.timeout,
    statesHook: alovaOption?.statesHook,
    requestAdapter: alovaOption.requestAdapter as AlovaOptions<AlovaGenerics>['requestAdapter'],
    beforeRequest: async (method) => {
      for (const [key, value] of Object.entries(option?.commonHeaders ?? {})) {
        method.config.headers[key] = typeof value === 'function' ? value() : value
      }
    },
    responded: {
      onSuccess: async (response) => {
        if (!alovaOption?.isTransformResponse) return response
        // debugger
        const { status } = response

        // 判断响应类型：如果使用 adapterFetch，response.data 是可读流，则调用 json()；否则直接使用 response.data
        const data =
          response?.body && isReadableStream(response.body)
            ? await response.json() // adapterFetch 的响应，使用 json() 解析可读流
            : response.data // 其他适配器的响应
        // 不成功的情况
        if (status !== alovaOption.statusMap?.success) {
          // 如果后端使用status 字段来表示未授权，则返回401
          if (alovaOption?.statusMap?.unAuthorized === status) {
            alovaOption?.unAuthorizedResponseFunc?.()
          }
          throw Error(response)
        }

        const { responseDataKey, codeMap, isShowSuccessMessage, responseMessageKey } = option
        const {
          code,
          [responseDataKey as string]: responseData,
          [responseMessageKey as string]: responseMessage,
        } = data
        if (!codeMap?.success?.includes(+code)) {
          if (codeMap?.unAuthorized?.includes(+code)) {
            alovaOption?.unAuthorizedResponseFunc?.()
          }
          throw Error(data[responseMessageKey as string] ?? alovaOption.errorDefaultMessage)
        }
        if (isShowSuccessMessage)
          alovaOption?.successMessageFunc?.(responseMessage ?? alovaOption.successDefaultMessage)
        return responseData
      },
      onError: (error) => {
        alovaOption.errorMessageFunc?.(
          error.response?.data?.message ?? alovaOption.errorDefaultMessage,
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
