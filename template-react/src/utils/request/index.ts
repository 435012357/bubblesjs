import type { AxiosRequestConfig } from 'axios'

import request, { type CustomConfig } from './axios'

interface createAxiosType {
  get: (
    config: {
      url: string
      params?: AxiosRequestConfig['params']
      config?: AxiosRequestConfig<any>
    },
    option?: CustomConfig,
  ) => Promise<any>
  post: (
    config: {
      url: string
      data?: AxiosRequestConfig['data']
      config?: AxiosRequestConfig<any>
    },
    option?: CustomConfig,
  ) => Promise<any>
  put: (
    config: {
      url: string
      data?: AxiosRequestConfig['data']
      config?: AxiosRequestConfig<any>
    },
    option?: CustomConfig,
  ) => Promise<any>
  delete: (
    config: {
      url: string
      data?: AxiosRequestConfig['data']
      config?: AxiosRequestConfig<any>
    },
    option?: CustomConfig,
  ) => Promise<any>
}

const createAxios: createAxiosType = {
  get: (config, option) =>
    request(option).get(config.url, {
      params: config.params,
      ...config?.config,
    }),
  post: (
    config: { url: string; data?: any; config?: AxiosRequestConfig<any> },
    option?: CustomConfig,
  ) => request(option).post(config.url, config?.data, config?.config),
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
