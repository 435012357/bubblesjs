import { useAppStore } from '@/store/modules/app'
import { envVariables } from '../env'
import { createDualCallInstance } from './alove-core'
import { router } from '@/router'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'
import vueHook from 'alova/vue'
import { axiosRequestAdapter } from '@alova/adapter-axios'

// 🎯 获取基础配置
const getBaseConfig = (): Parameters<typeof createDualCallInstance>[0] => {
  const appStore = useAppStore()

  return {
    baseUrl: `/${envVariables.BUSINESS_API_AFFIX}`,
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
      projectId: appStore.projectId.value,
      sceneId: appStore.sceneId.value,
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

// 🚀 使用 alova-core 的双重调用功能，超级简洁！
const alovaRequest = createDualCallInstance(getBaseConfig())

export default alovaRequest
