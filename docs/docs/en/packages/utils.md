# @bubblesjs/utils

Axios-based request wrapper for common request scenarios.

## Install

```bash
pnpm add @bubblesjs/utils axios
```

## Quick Usage

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

// request is an axios instance
const res = await request.get('/user')
```

## API

### getRequest(option)

- baseUrl: string, default '/'
- timeout: number, default 0
- commonHeaders: Record<string, string | () => string>
- successMessageFunc: (message: string) => void
- errorMessageFunc: (message: string) => void
- unAuthorizedResponseFunc: (message: string) => void
- statusMap: { success?: number; unAuthorized?: number }
- codeMap: { success?: number[]; unAuthorized?: number[] }
- responseDataKey: string, default 'data'
- responseMessageKey: string, default 'message'
- isTransformResponse: boolean, default true
- isShowSuccessMessage: boolean, default true

### Advanced: Custom Axios instance

```ts
import { createRequest } from '@bubblesjs/utils/request/core/axios'

const axiosInstance = createRequest({
  baseURL: '/api',
  timeout: 8000,
  requestInterceptor: (config) => {
    // custom request interceptor
    return config
  },
  responseInterceptor: (res) => {
    // custom response handling
    return res
  },
})
```