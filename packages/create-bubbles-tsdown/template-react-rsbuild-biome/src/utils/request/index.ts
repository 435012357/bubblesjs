import type { AxiosRequestConfig } from 'axios'

import request, { type CustomConfig } from './axios'

interface createAxiosType {
  get: <T = any>(
    config: {
      url: string
      params?: AxiosRequestConfig['params']
      config?: AxiosRequestConfig<any>
    },
    option?: CustomConfig,
  ) => Promise<T>
  post: <T = any>(
    config: {
      url: string
      data?: AxiosRequestConfig['data']
      params?: AxiosRequestConfig['params']
      config?: AxiosRequestConfig<any>
    },
    option?: CustomConfig,
  ) => Promise<T>
  put: <T = any>(
    config: {
      url: string
      data?: AxiosRequestConfig['data']
      config?: AxiosRequestConfig<any>
    },
    option?: CustomConfig,
  ) => Promise<T>
  delete: <T = any>(
    config: {
      url: string
      data?: AxiosRequestConfig['data']
      config?: AxiosRequestConfig<any>
    },
    option?: CustomConfig,
  ) => Promise<T>
}

const createAxios: createAxiosType = {
  get: (config, option) =>
    request(option).get(config.url, {
      params: config.params,
      ...config?.config,
    }),
  post: (
    config: {
      url: string
      params?: Record<string, string>
      data?: any
      config?: AxiosRequestConfig<any>
    },
    option?: CustomConfig,
  ) => {
    let url = config.url
    if (config.params instanceof Object) {
      url += '?'
      const entries = Object.entries(config.params)
      for (let i = 0; i < entries.length; i++) {
        const [key, value] = entries[i]
        url += `${key}=${value}${i < entries.length - 1 ? '&' : ''}`
      }
    }
    return request(option).post(url, config?.data, config?.config)
  },
  put: (
    config: { url: string; data?: any; config?: AxiosRequestConfig<any> },
    option?: CustomConfig,
  ) => request(option).put(config.url, config?.data, config?.config),
  delete: (
    config: { url: string; config?: AxiosRequestConfig<any> },
    customConfig?: CustomConfig,
  ) => request(customConfig).delete(config.url, config?.config),
}

export default createAxios
