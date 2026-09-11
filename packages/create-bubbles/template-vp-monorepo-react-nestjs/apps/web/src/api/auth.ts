import type { LogoutResult } from 'shared/types'
import request from '@/utils/request'

/** 请求服务端注销当前会话，禁用缓存和重复请求合并。 */
export const logout = () =>
  request.Post<LogoutResult>('/auth/logout', undefined, {
    cacheFor: 0,
    shareRequest: false,
    meta: { isShowErrorMessage: false },
  })
