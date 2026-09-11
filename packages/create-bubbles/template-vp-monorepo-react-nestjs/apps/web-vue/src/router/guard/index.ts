import type { Router } from 'vue-router'

import { createPermissionGuard } from './permissionGuard'

/** 为路由实例注册应用级导航守卫。 */
export function setupGuard(router: Router) {
  createPermissionGuard(router)
}
