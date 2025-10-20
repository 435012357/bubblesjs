import type { Router } from 'vue-router'

import NProgress from 'nprogress'

export const createPermissionGuard = (router: Router) => {
  router.beforeEach((to, from, next) => {
    NProgress.start()
    next()
  })
  router.afterEach((to, from) => {
    NProgress.done()
  })
}
