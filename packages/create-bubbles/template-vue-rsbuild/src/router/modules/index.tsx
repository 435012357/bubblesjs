import type { RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  {
    path: '/home',
    name: 'Home',
    meta: {},
    component: () => import('@/views/home/index.vue'),
  },
]
