import { axiosRequestAdapter, type AlovaAxiosRequestConfig } from '@alova/adapter-axios'
import type {
  AlovaGlobalCacheAdapter,
  AlovaOptions,
  AlovaRequestAdapter,
  GlobalCacheConfig,
  StatesExport,
  StatesHook,
} from 'alova'
import { createAlova } from 'alova'
import type { AxiosResponse, AxiosResponseHeaders } from 'axios'
import { tr } from '@/i18n'
import { deepMergeObject, isPlainObject, isReadableStream, tryParseJsonString } from './utils.ts'

type MaybePromise<T> = T | Promise<T>
type MessageResolver = string | (() => string)
type HeaderValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | (() => MaybePromise<string | number | boolean | null | undefined>)
type StatusMatcher<RE> = number | number[] | ((status: number, response: RE) => boolean)
type CodeMatcher = Array<number | string>

export interface StatusMap<RE = unknown> {
  unAuthorized?: StatusMatcher<RE>
}

export interface CodeMap {
  success?: CodeMatcher
  unAuthorized?: CodeMatcher
}

export interface RequestMeta {
  isWrapped?: boolean
  isTransformResponse?: boolean
  isShowSuccessMessage?: boolean
  isShowErrorMessage?: boolean
}

export interface BaseRequestOption<
  RC extends object = AlovaAxiosRequestConfig,
  RE = AxiosResponse,
  RH = AxiosResponseHeaders,
  SE extends StatesExport<any> = StatesExport<any>,
> extends RequestMeta {
  baseUrl?: string
  timeout?: number
  commonHeaders?: () => Record<string, HeaderValue>
  statusMap?: StatusMap<RE>
  codeMap?: CodeMap
  responseCodeKey?: string
  responseDataKey?: string
  responseMessageKey?: string
  cacheFor?: GlobalCacheConfig<any> | null
  cacheLogger?: boolean
  statesHook?: StatesHook<SE>
  successDefaultMessage?: MessageResolver
  errorDefaultMessage?: MessageResolver
  successMessageFunc?: (message: string) => void
  errorMessageFunc?: (message: string) => void
  unAuthorizedResponseFunc?: (response: RE) => void
  /** 默认使用 Axios；自定义适配器也须拒绝 HTTP 错误，并通过 error.response 提供响应。 */
  requestAdapter?: AlovaRequestAdapter<RC, RE, RH>
  l1Cache?: AlovaGlobalCacheAdapter
  l2Cache?: AlovaGlobalCacheAdapter
  storageAdapter?: AlovaGlobalCacheAdapter
}

export type baseRequestOption<
  RC extends object = AlovaAxiosRequestConfig,
  RE = AxiosResponse,
  RH = AxiosResponseHeaders,
  SE extends StatesExport<any> = StatesExport<any>,
> = BaseRequestOption<RC, RE, RH, SE>

export type RequestOption<
  RC extends object = AlovaAxiosRequestConfig,
  RE = AxiosResponse,
  RH = AxiosResponseHeaders,
  SE extends StatesExport<any> = StatesExport<any>,
> = BaseRequestOption<RC, RE, RH, SE>

type RequestAlovaGenerics<RC extends object, RE, RH, SE extends StatesExport<any>> = {
  Responded: unknown
  Transformed: unknown
  RequestConfig: RC
  Response: RE
  ResponseHeader: RH
  L1Cache: AlovaGlobalCacheAdapter
  L2Cache: AlovaGlobalCacheAdapter
  StatesExport: SE
}

type ResolvedRequestOption<RC extends object, RE, RH, SE extends StatesExport<any>> = Required<
  Pick<
    BaseRequestOption<RC, RE, RH, SE>,
    | 'baseUrl'
    | 'statusMap'
    | 'codeMap'
    | 'responseCodeKey'
    | 'responseDataKey'
    | 'responseMessageKey'
    | 'isWrapped'
    | 'isTransformResponse'
    | 'isShowSuccessMessage'
    | 'successDefaultMessage'
    | 'isShowErrorMessage'
    | 'errorDefaultMessage'
    | 'cacheLogger'
  >
> &
  BaseRequestOption<RC, RE, RH, SE>

const defaultRequestOption: BaseRequestOption<any, any, any, any> = {
  baseUrl: '/',
  timeout: undefined,
  statusMap: {
    unAuthorized: 401,
  },
  codeMap: {
    success: [200],
    unAuthorized: [401],
  },
  responseCodeKey: 'code',
  responseDataKey: 'data',
  responseMessageKey: 'message',
  isWrapped: true,
  isTransformResponse: true,
  isShowSuccessMessage: false,
  successDefaultMessage: () => tr('操作成功'),
  isShowErrorMessage: true,
  errorDefaultMessage: () => tr('服务异常'),
  cacheFor: null,
  cacheLogger: true,
  requestAdapter: axiosRequestAdapter(),
}

/** 兼容不同 Method 元数据位置，优先读取请求配置内的选项。 */
function getMethodMeta(method: unknown): RequestMeta {
  const methodRecord = method as { meta?: RequestMeta; config?: { meta?: RequestMeta } } | undefined
  return methodRecord?.config?.meta ?? methodRecord?.meta ?? {}
}

/** 读取请求级布尔开关，未显式指定时使用实例默认值。 */
function getMetaFlag(meta: RequestMeta, key: keyof RequestMeta, fallback: boolean): boolean {
  const value = meta[key]
  return typeof value === 'boolean' ? value : fallback
}

/** 以单值、集合或自定义函数判断 HTTP 状态是否命中规则。 */
function isMatchedStatus<RE>(
  status: number,
  matcher: StatusMatcher<RE> | undefined,
  response: RE,
): boolean {
  if (matcher === undefined) return false

  if (typeof matcher === 'function') return matcher(status, response)

  return Array.isArray(matcher) ? matcher.includes(status) : matcher === status
}

/** 将业务码转为字符串匹配；未配置匹配集合时视为命中。 */
function isMatchedCode(code: unknown, matcher: CodeMatcher | undefined): boolean {
  if (!matcher?.length) return true

  return matcher.some((item) => String(item) === String(code))
}

/** 兼容 statusCode 和 status 字段，将响应状态转换为数字。 */
function getResponseStatus(response: unknown): number {
  const responseRecord = response as { status?: unknown; statusCode?: unknown }
  const status = responseRecord.statusCode ?? responseRecord.status
  return typeof status === 'number' ? status : Number(status)
}

/** 按配置字段及常见消息字段读取提示，内容不可用时返回默认文案。 */
function getResponseMessage(data: unknown, messageKey: string, defaultMessage: string): string {
  if (!isPlainObject(data)) return defaultMessage

  const message = data[messageKey] ?? data.message ?? data.msg
  if (typeof message === 'string') return message || defaultMessage
  if (typeof message === 'number') return String(message)

  return defaultMessage
}

/** 在请求实际完成时解析默认提示，使语言切换后无需重建请求实例。 */
function resolveMessage(message: MessageResolver): string {
  return typeof message === 'function' ? message() : message
}

/** 仅从普通对象读取指定响应字段，其他响应形态返回 undefined。 */
function getResponseField(data: unknown, key: string): unknown {
  return isPlainObject(data) ? data[key] : undefined
}

/** 根据内容类型解析 Fetch 响应，204 返回空值并为 JSON 失败提供文本回退。 */
async function parseFetchResponse(response: {
  status?: number
  body?: unknown
  headers?: Headers | Record<string, unknown>
  clone?: () => Response
  json?: () => Promise<unknown>
  text?: () => Promise<string>
}): Promise<unknown> {
  if (response.status === 204) return undefined

  const reader = typeof response.clone === 'function' ? response.clone() : response
  const contentType = getHeaderValue(response.headers, 'content-type')

  if (contentType.includes('application/json') && typeof reader.json === 'function')
    return reader.json()

  if (contentType.startsWith('text/') && typeof reader.text === 'function')
    return tryParseJsonString(await reader.text())

  if (typeof reader.json === 'function') {
    try {
      return await reader.json()
    } catch {
      // Fall through to text parsing.
    }
  }

  if (typeof reader.text === 'function') return tryParseJsonString(await reader.text())

  return undefined
}

/** 兼容 Headers 和普通对象读取响应头，缺失或非字符串值返回空串。 */
function getHeaderValue(
  headers: Headers | Record<string, unknown> | undefined,
  key: string,
): string {
  if (!headers) return ''

  if (typeof Headers !== 'undefined' && headers instanceof Headers) return headers.get(key) ?? ''

  const headerRecord = headers as Record<string, unknown>
  const value =
    headerRecord[key] ?? headerRecord[key.toLowerCase()] ?? headerRecord[key.toUpperCase()]
  return typeof value === 'string' ? value : ''
}

/** 统一提取 Axios 或 Fetch 响应内容，并尝试解析对象、数组形式的 JSON 文本。 */
async function getResponseData(response: unknown): Promise<unknown> {
  const responseRecord = response as {
    body?: unknown
    data?: unknown
    json?: () => Promise<unknown>
    text?: () => Promise<string>
  }

  if ('data' in responseRecord && !isReadableStream(responseRecord.body))
    return tryParseJsonString(responseRecord.data)

  if (
    isReadableStream(responseRecord.body) ||
    typeof responseRecord.json === 'function' ||
    typeof responseRecord.text === 'function'
  ) {
    return parseFetchResponse(responseRecord)
  }

  return response
}

/** 求值静态或异步请求头配置，忽略空值并将有效结果转为字符串。 */
async function resolveHeaderValue(value: HeaderValue): Promise<string | undefined> {
  const resolved = typeof value === 'function' ? await value() : value
  if (resolved === null || resolved === undefined) return undefined
  return String(resolved)
}

/** 兼容 Headers、键值对数组及普通对象写入请求头。 */
function setHeader(target: unknown, key: string, value: string): void {
  if (typeof Headers !== 'undefined' && target instanceof Headers) {
    target.set(key, value)
    return
  }

  if (Array.isArray(target)) {
    target.push([key, value])
    return
  }

  ;(target as Record<string, string>)[key] = value
}

/** 将实例配置递归合并到请求默认项，保留未覆盖的默认设置。 */
function resolveConfig<RC extends object, RE, RH, SE extends StatesExport<any>>(
  option: BaseRequestOption<RC, RE, RH, SE>,
): ResolvedRequestOption<RC, RE, RH, SE> {
  return deepMergeObject(defaultRequestOption, option) as ResolvedRequestOption<RC, RE, RH, SE>
}

/** 创建统一处理公共请求头、响应解析、业务错误与未授权回调的 alova 实例。 */
export function createInstance<
  RC extends object = AlovaAxiosRequestConfig,
  RE = AxiosResponse,
  RH = AxiosResponseHeaders,
  SE extends StatesExport<any> = StatesExport<any>,
>(option: RequestOption<RC, RE, RH, SE> = {}) {
  const config = resolveConfig(option)

  /** 从响应内容构造包含 HTTP 状态及业务码的可识别错误。 */
  function responseError(data: unknown, status: number) {
    const code = getResponseField(data, config.responseCodeKey)
    return Object.assign(
      new Error(
        getResponseMessage(
          data,
          config.responseMessageKey,
          resolveMessage(config.errorDefaultMessage),
        ),
      ),
      { status, code: typeof code === 'string' || typeof code === 'number' ? code : undefined },
    )
  }

  const alovaOptions: AlovaOptions<RequestAlovaGenerics<RC, RE, RH, SE>> = {
    baseURL: config.baseUrl,
    timeout: config.timeout,
    cacheFor: config.cacheFor as GlobalCacheConfig<any>,
    cacheLogger: config.cacheLogger,
    statesHook: config.statesHook,
    requestAdapter: config.requestAdapter!,
    l1Cache: config.l1Cache,
    l2Cache: config.l2Cache ?? config.storageAdapter,
    /** 逐项求值公共请求头，并写入本次请求配置。 */
    beforeRequest: async (method) => {
      const methodConfig = method.config as { headers?: unknown }
      const headers = methodConfig.headers ?? {}
      methodConfig.headers = headers

      for (const [key, value] of Object.entries(config.commonHeaders?.() ?? {})) {
        const resolvedValue = await resolveHeaderValue(value)
        if (resolvedValue !== undefined) setHeader(headers, key, resolvedValue)
      }
    },
    responded: {
      // HTTP 成败由适配器判断；这里只解析成功响应并检查业务 code。
      /** 按请求元数据解析成功响应，检查业务码并按配置提示或返回业务数据。 */
      onSuccess: async (response, method) => {
        const meta = getMethodMeta(method)
        const shouldTransform = getMetaFlag(meta, 'isTransformResponse', config.isTransformResponse)
        const showSuccess = getMetaFlag(meta, 'isShowSuccessMessage', config.isShowSuccessMessage)
        const showError = getMetaFlag(meta, 'isShowErrorMessage', config.isShowErrorMessage)
        const isWrapped = getMetaFlag(meta, 'isWrapped', config.isWrapped)

        if (!shouldTransform) return response

        const status = getResponseStatus(response)
        const data = await getResponseData(response)

        if (!isWrapped) {
          if (showSuccess) config.successMessageFunc?.(resolveMessage(config.successDefaultMessage))
          return data
        }

        const code = getResponseField(data, config.responseCodeKey)
        const responseData = getResponseField(data, config.responseDataKey)
        const responseMessage = getResponseMessage(
          data,
          config.responseMessageKey,
          resolveMessage(config.successDefaultMessage),
        )

        if (!isMatchedCode(code, config.codeMap.success)) {
          if (isMatchedCode(code, config.codeMap.unAuthorized))
            config.unAuthorizedResponseFunc?.(response)

          if (showError) {
            config.errorMessageFunc?.(
              getResponseMessage(
                data,
                config.responseMessageKey,
                resolveMessage(config.errorDefaultMessage),
              ),
            )
          }
          throw responseError(data, status)
        }

        if (showSuccess) config.successMessageFunc?.(responseMessage)

        return responseData
      },
      // 统一处理 HTTP 错误、网络故障和超时；onSuccess 抛出的业务错误直接传给调用方。
      /** 统一处理 HTTP 和网络错误，触发未授权回调并抛出标准错误。 */
      onError: async (error, method) => {
        const meta = getMethodMeta(method)
        const showError = getMetaFlag(meta, 'isShowErrorMessage', config.isShowErrorMessage)
        const response = (error as { response?: RE } | undefined)?.response
        let failure: Error

        if (response) {
          const status = getResponseStatus(response)
          if (isMatchedStatus(status, config.statusMap.unAuthorized, response)) {
            config.unAuthorizedResponseFunc?.(response)
          }
          failure = responseError(await getResponseData(response), status)
        } else {
          failure = new Error(tr('无法连接服务，请检查网络后重试'))
        }

        if (showError) {
          config.errorMessageFunc?.(failure.message)
        }
        throw failure
      },
    },
  }

  return createAlova(alovaOptions)
}

export type RequestInstance<
  RC extends object = AlovaAxiosRequestConfig,
  RE = AxiosResponse,
  RH = AxiosResponseHeaders,
  SE extends StatesExport<any> = StatesExport<any>,
> = ReturnType<typeof createInstance<RC, RE, RH, SE>>

export type DualCallInstance<
  RC extends object = AlovaAxiosRequestConfig,
  RE = AxiosResponse,
  RH = AxiosResponseHeaders,
  SE extends StatesExport<any> = StatesExport<any>,
> = RequestInstance<RC, RE, RH, SE> &
  ((option?: RequestOption<RC, RE, RH, SE>) => RequestInstance<RC, RE, RH, SE>)

/** 提供默认请求实例的方法，同时支持通过函数调用创建覆盖配置的新实例。 */
export function createDualCallInstance<
  RC extends object = AlovaAxiosRequestConfig,
  RE = AxiosResponse,
  RH = AxiosResponseHeaders,
  SE extends StatesExport<any> = StatesExport<any>,
>(baseConfig: BaseRequestOption<RC, RE, RH, SE>): DualCallInstance<RC, RE, RH, SE> {
  const defaultInstance = createInstance(baseConfig)
  const dualInstance = /** 未传配置时复用默认请求实例，传入配置时合并基础设置创建独立实例。 */ ((
    option?: RequestOption<RC, RE, RH, SE>,
  ) => {
    if (!option) return defaultInstance
    return createInstance(deepMergeObject(baseConfig, option))
  }) as DualCallInstance<RC, RE, RH, SE>

  Object.assign(dualInstance, defaultInstance)
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
