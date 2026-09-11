import request from '@/utils/request'

export const EXPIRE_TIME = 60 * 10 * 1000

/** 创建树形示例数据请求，使用可恢复缓存并设置十分钟有效期。 */
export function getTree() {
  return request.Get('/xxx/xx', {
    cacheFor: {
      mode: 'restore',
      expire: EXPIRE_TIME,
    },
  })
}
