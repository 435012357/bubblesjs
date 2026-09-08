import type { LogoutResult } from 'shared/types'
import request from '@/utils/request'

export const logout = () =>
  request.Post<LogoutResult>('/auth/logout', undefined, {
    cacheFor: 0,
    shareRequest: false,
    meta: { isShowErrorMessage: false },
  })
