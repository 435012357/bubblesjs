import { message } from 'ant-design-vue'
import axios, { type AxiosResponse } from 'axios'
import _ from 'lodash-es'

import { router } from '@/router'
import { useUserStoreWithOut } from '@/store/modules/user'

export interface CustomConfig {
  /** 直接返回响应体 */
  isTransformResponse?: boolean
  // 成功需要提示
  isShowSuccessMsg?: boolean
}

export enum CodeEnum {
  SUCCESS = 200,
  UNAUTHORIZED = 401,
}

const unAuthFunc = _.debounce(() => {
  message.error('暂未登录或登录已过期，请重新登录')
  router.push('/login')
}, 500)

export default (customConfig?: CustomConfig) => {
  // const { getToken } = useUserStore()
  const userStore = useUserStoreWithOut()

  const instance = axios.create({
    baseURL: import.meta.env.PUBLIC_API_AFFIX,
  })

  instance.interceptors.request.use(
    (config) => {
      // config.headers = {
      //   'X-Access-Token': userStore.token,
      //   'Allow-Control-Allow-Origin': '*',
      //   ...config?.headers,
      // } as any
      config.headers.set('X-Access-Token', userStore.token)
      config.headers.set('Allow-Control-Allow-Origin', '*')
      return config
    },
    (error) => {
      message.error('请求错误')
      return Promise.reject(error)
    },
  )

  interface ResponseData<T = any> {
    code: number
    message: string
    requestId: string
    responseTime: number
    result: T
  }

  instance.interceptors.response.use(
    (response: AxiosResponse<ResponseData>) => {
      const { status, data } = response
      if (status === 200) {
        if (customConfig?.isTransformResponse === false) return data
        const { code, message: msg } = data
        if (code === CodeEnum.SUCCESS) {
          if (customConfig?.isShowSuccessMsg) {
            message.success(msg)
          }
          return data.result
        }
        message.error(msg)
        return Promise.reject(data)
      }
      if (status === CodeEnum.UNAUTHORIZED) {
        // _.debounce(() => {
        message.error(data.message)
        router.push('/login')
        // }, 500)
      } else return Promise.reject(data.message)
    },
    (error) => {
      const response = error.response
      const { status, data } = response
      if (status === CodeEnum.UNAUTHORIZED) {
        unAuthFunc()
      } else {
        message.error(data?.message || '系统异常')
        return Promise.reject(error)
      }
    },
  )

  return instance
}
