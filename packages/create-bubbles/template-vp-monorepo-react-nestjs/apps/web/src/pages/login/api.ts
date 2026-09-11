import type { LoginRequest, LoginResult } from 'shared/types'
import request from '@/utils/request'

const publicRequest = request({
  /** 登录请求不附带现有会话令牌。 */
  commonHeaders: () => ({}),
  /** 登录失败交由表单提示，避免重复触发未登录跳转。 */
  unAuthorizedResponseFunc: () => {},
  isShowErrorMessage: false,
})

/** 通过不附带会话凭据的请求提交登录信息。 */
export const login = (input: LoginRequest) =>
  publicRequest.Post<LoginResult>('/auth/login', input, { cacheFor: 0, shareRequest: false })
