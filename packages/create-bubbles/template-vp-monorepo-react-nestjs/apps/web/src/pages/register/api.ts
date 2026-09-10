import type { RegisterRequest, RegisterResult } from 'shared/types'
import request from '@/utils/request'

const publicRequest = request({
  commonHeaders: () => ({}),
  unAuthorizedResponseFunc: () => {},
  isShowErrorMessage: false,
})

export const register = (input: RegisterRequest) =>
  publicRequest.Post<RegisterResult>('/auth/register', input, { cacheFor: 0, shareRequest: false })
