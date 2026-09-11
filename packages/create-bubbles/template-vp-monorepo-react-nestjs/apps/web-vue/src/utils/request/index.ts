import { axiosRequestAdapter } from '@alova/adapter-axios'
import vueHook from 'alova/vue'
import { message } from 'antdv-next'

import { router } from '@/router'

import { envVariables } from '../env'
import { createDualCallInstance } from './core'

/** 组合 Vue 请求适配器、业务响应字段、消息提示和未授权跳转配置。 */
function getBaseConfig() {
  return {
    baseUrl: `/${envVariables.API_AFFIX}`,
    statusMap: {
      success: 200,
      unAuthorized: 401,
    },
    codeMap: {
      success: [200],
      unAuthorized: [401],
    },
    responseCodeKey: 'code',
    responseDataKey: 'data',
    responseMessageKey: 'msg',
    commonHeaders: () => ({}),
    isWrapped: true,
    isTransformResponse: true,
    successMessageFunc: (msg: string) => {
      message.success(msg)
    },
    errorMessageFunc: (msg: string) => {
      message.error(msg)
    },
    /** 未授权时跳转登录页，并提示当前会话失效。 */
    unAuthorizedResponseFunc: () => {
      void router.push('/login')
      message.error('登录过期或未登录')
    },
    statesHook: vueHook,
    requestAdapter: axiosRequestAdapter(),
  }
}

const alovaRequest = createDualCallInstance(getBaseConfig())

export default alovaRequest
