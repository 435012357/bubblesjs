import type { FetchRequestInit } from 'alova/fetch'
import reactHook, { type ReactHookExportType } from 'alova/react'

import { toast } from '@/components/ui/toast'
import { navigator } from '@/router'
import { envVariables } from '@/utils/env'

import { createDualCallInstance, type BaseRequestOption } from './alova-core'

type WebRequestOption = BaseRequestOption<
  FetchRequestInit,
  Response,
  Headers,
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
    statusMap: {
      success: [200, 201, 204],
      unAuthorized: 401,
    },
    codeMap: {
      success: [200],
      unAuthorized: [401],
    },
    responseDataKey: 'data',
    responseMessageKey: 'msg',
    commonHeaders: () => ({}),
    successMessageFunc: (msg) => {
      toast.add({ type: 'success', description: msg })
    },
    errorMessageFunc: (msg) => {
      toast.add({ type: 'error', description: msg })
    },
    unAuthorizedResponseFunc: () => {
      navigator('/login')
      toast.add({ type: 'error', description: '登录过期或未登录' })
    },
    statesHook: reactHook,
  }
}

const alovaRequest = createDualCallInstance<
  FetchRequestInit,
  Response,
  Headers,
  ReactHookExportType<unknown>
>(getBaseConfig())

export default alovaRequest
