import { envVariables } from '../env'
import { createDualCallInstance } from './core'
import { router } from '@/router'
import { message } from 'antd'
import 'element-plus/es/components/message/style/css'
import vueHook from 'alova/vue'
import { axiosRequestAdapter } from '@alova/adapter-axios'

// 🎯 获取基础配置
const getBaseConfig = (): Parameters<typeof createDualCallInstance>[0] => {

  return {
    baseUrl: `/${envVariables.PUBLIC_API_AFFIX}`,
    statusMap: {
      success: 200,
      unAuthorized: 401,
    },
    codeMap: {
      success: [200],
    },
    responseDataKey: 'data',
    responseMessageKey: 'msg',
    commonHeaders: {
    },
    successMessageFunc: (msg: string) => {
      message.success(msg)
    },
    errorMessageFunc: (msg: string) => {
      message.error(msg)
    },
    unAuthorizedResponseFunc: () => {
      router.navigate('/login')
      message.error('登录过期或未登录')
    },
    statesHook: vueHook,
    requestAdapter: axiosRequestAdapter(),
  }
}

// 🚀 使用 alova-core 的双重调用功能，超级简洁！
const alovaRequest = createDualCallInstance(getBaseConfig())

export default alovaRequest
