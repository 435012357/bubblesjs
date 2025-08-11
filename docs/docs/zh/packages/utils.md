# @bubblesjs/utils

提供基于 Axios 的请求封装，快速集成常见的请求场景。

## 安装

```bash
pnpm add @bubblesjs/utils axios
```

## 快速使用

```ts
import { getRequest } from '@bubblesjs/utils'

const request = getRequest({
  baseUrl: '/api',
  timeout: 10000,
  commonHeaders: {
    Authorization: () => `Bearer ${localStorage.getItem('token') || ''}`,
  },
  successMessageFunc: (msg) => console.log(msg),
  errorMessageFunc: (msg) => console.error(msg),
  unAuthorizedResponseFunc: (msg) => console.warn('401', msg),
  statusMap: { success: 200, unAuthorized: 401 },
  codeMap: { success: [200], unAuthorized: [40101, 401] },
  responseDataKey: 'data',
  responseMessageKey: 'message',
  isTransformResponse: true,
  isShowSuccessMessage: false,
})

// 直接使用 request 即 axios 实例
const res = await request.get('/user')
```

## API

### getRequest(option)

- baseUrl: string 接口基础地址，默认 '/'
- timeout: number 请求超时毫秒数，默认 0
- commonHeaders: Record<string, string | () => string> 公共请求头
- successMessageFunc: (message: string) => void 成功提示
- errorMessageFunc: (message: string) => void 错误提示
- unAuthorizedResponseFunc: (message: string) => void 未授权处理
- statusMap: { success?: number; unAuthorized?: number }
- codeMap: { success?: number[]; unAuthorized?: number[] }
- responseDataKey: string 响应数据字段，默认 'data'
- responseMessageKey: string 响应消息字段，默认 'message'
- isTransformResponse: boolean 是否直接返回 data 数据，默认 true
- isShowSuccessMessage: boolean 是否显示成功提示，默认 true

### 高级：自定义 Axios 实例

```ts
import { createRequest } from '@bubblesjs/utils/request/core/axios'

const axiosInstance = createRequest({
  baseURL: '/api',
  timeout: 8000,
  requestInterceptor: (config) => {
    // 自定义请求拦截
    return config
  },
  responseInterceptor: (res) => {
    // 自定义响应处理
    return res
  },
})
```