import type { LoginRequest, LoginResult } from 'shared/types'
import request from '@/utils/request'

const publicRequest = request({
  commonHeaders: () => ({}),
  unAuthorizedResponseFunc: () => {},
  isShowErrorMessage: false,
})

export const login = (input: LoginRequest) =>
  publicRequest.Post<LoginResult>('/auth/login', input, { cacheFor: 0, shareRequest: false })
