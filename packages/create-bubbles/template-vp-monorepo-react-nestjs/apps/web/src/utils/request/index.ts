import { axiosRequestAdapter, type AlovaAxiosRequestConfig } from '@alova/adapter-axios'
import reactHook, { type ReactHookExportType } from 'alova/react'
import { message } from 'antd'
import type { AxiosResponse, AxiosResponseHeaders } from 'axios'
import { tr } from '@/i18n'
import { envVariables } from '@/utils/env'
import { cookie } from '@/utils/storage/cookie'
import { createDualCallInstance, type BaseRequestOption } from './core/index.ts'

type WebRequestOption = BaseRequestOption<
  AlovaAxiosRequestConfig,
  AxiosResponse,
  AxiosResponseHeaders,
  ReactHookExportType<unknown>
>

/** 保留完整 URL 和绝对路径，为相对接口前缀补齐开头斜杠。 */
function normalizeBaseUrl(apiAffix?: string) {
  if (!apiAffix) return '/'
  if (/^https?:\/\//.test(apiAffix) || apiAffix.startsWith('/')) {
    return apiAffix
  }

  return `/${apiAffix}`
}

/** 组装 Web 请求配置，绑定登录凭据、提示方式及未授权跳转。 */
function getBaseConfig(): WebRequestOption {
  return {
    baseUrl: normalizeBaseUrl(envVariables.API_AFFIX),
    isWrapped: false,
    statusMap: {
      unAuthorized: 401,
    },
    codeMap: {
      success: [200],
      unAuthorized: [401],
    },
    responseDataKey: 'data',
    responseMessageKey: 'message',
    errorDefaultMessage: () => tr('请求失败，请稍后重试'),
    /** 在发送请求时读取最新登录令牌，存在时附加 Bearer 鉴权头。 */
    commonHeaders: () => {
      const token = cookie.get('token')
      return token ? { Authorization: `Bearer ${token}` } : {}
    },
    successMessageFunc: (msg) => {
      message.success(msg)
    },
    errorMessageFunc: (msg) => {
      message.error(msg)
    },
    /** 清除失效登录令牌，提示登录过期并跳转到登录页。 */
    unAuthorizedResponseFunc: () => {
      cookie.remove('token')
      message.error(tr('登录过期或未登录'))
      window.location.assign('/login')
    },
    statesHook: reactHook,
    requestAdapter: axiosRequestAdapter(),
  }
}

const alovaRequest = createDualCallInstance<
  AlovaAxiosRequestConfig,
  AxiosResponse,
  AxiosResponseHeaders,
  ReactHookExportType<unknown>
>(getBaseConfig())

export default alovaRequest
