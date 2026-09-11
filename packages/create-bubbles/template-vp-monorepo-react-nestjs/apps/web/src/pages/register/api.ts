import type { RegisterRequest, RegisterResult } from 'shared/types'
import request from '@/utils/request'

const publicRequest = request({
  /** 注册请求不附带现有会话令牌。 */
  commonHeaders: () => ({}),
  /** 注册失败交由表单提示，避免触发全局登录跳转。 */
  unAuthorizedResponseFunc: () => {},
  isShowErrorMessage: false,
})

/** 通过公开请求创建账号，避免附带既有会话凭据。 */
export const register = (input: RegisterRequest) =>
  publicRequest.Post<RegisterResult>('/auth/register', input, { cacheFor: 0, shareRequest: false })
