import type { Router } from 'vue-router'

import NProgress from 'nprogress'

/** 注册导航进度条的开始与结束钩子；当前不执行登录或权限校验。 */
export function createPermissionGuard(router: Router) {
  router.beforeEach((_to, _from, next) => {
    NProgress.start()
    next()
  })
  router.afterEach((_to, _from) => {
    NProgress.done()
  })
}
