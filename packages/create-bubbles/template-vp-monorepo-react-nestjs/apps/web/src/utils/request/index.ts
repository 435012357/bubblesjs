import { axiosRequestAdapter, type AlovaAxiosRequestConfig } from '@alova/adapter-axios'
import reactHook, { type ReactHookExportType } from 'alova/react'
import { message } from 'antd'
import type { AxiosResponse, AxiosResponseHeaders } from 'axios'
import { envVariables } from '@/utils/env'
import { cookie } from '@/utils/storage/cookie'
import { createDualCallInstance, type BaseRequestOption } from './core/index.ts'

type WebRequestOption = BaseRequestOption<
  AlovaAxiosRequestConfig,
  AxiosResponse,
  AxiosResponseHeaders,
  ReactHookExportType<unknown>
>

function normalizeBaseUrl(apiAffix?: string) {
  if (!apiAffix) return '/'
  if (/^https?:\/\//.test(apiAffix) || apiAffix.startsWith('/')) {
    return apiAffix
  }

  return `/${apiAffix}`
}

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
    errorDefaultMessage: '请求失败，请稍后重试',
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
    unAuthorizedResponseFunc: () => {
      cookie.remove('token')
      message.error('登录过期或未登录')
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
