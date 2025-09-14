import { envVariables } from '../env'
import { createDualCallInstance } from './core'
import { router } from '@/router'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'
import vueHook from 'alova/vue'
import { axiosRequestAdapter } from '@alova/adapter-axios'

const getBaseConfig = (): Parameters<typeof createDualCallInstance>[0] => {

  return {
    baseUrl: `/${envVariables.PUBLIC_PORT}`,
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
      ElMessage.success(msg)
    },
    errorMessageFunc: (msg: string) => {
      ElMessage.error(msg)
    },
    unAuthorizedResponseFunc: () => {
      router.push('/login')
      ElMessage.error('登录过期或未登录')
    },
    statesHook: vueHook,
    requestAdapter: axiosRequestAdapter(),
  }
}

const alovaRequest = createDualCallInstance(getBaseConfig())

export default alovaRequest
