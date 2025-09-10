import type { RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    meta: {},
    component: () => import('@/views/home/index.vue'),
  },
]
