import type { App } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'

import { routes } from './modules'

export const router = createRouter({
  history: createWebHistory(import.meta.env.PUBLIC_PATH),
  routes: routes,
  strict: true,
  scrollBehavior: () => ({ left: 0, top: 0 }),
})

export const setupRouter = (app: App) => {
  app.use(router)
}
