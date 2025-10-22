import type { RouteRecordRaw } from 'vue-router'

/**
 * IsMaskAll 代表 是不是要和模型交互 为true 全部遮罩
 */

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'layout',
    component: () => import('@/layout/default/index.vue'),
    children: [
      {
        path: '/',
        redirect: '/home',
      },
      {
        path: '/home',
        name: 'Home',
        meta: { title: '研发A区数字孪生可视化大屏' },
        component: () => import('@/views/home/index.vue'),
      },
    ],
  },
  {
    path: '/login',
    name: 'login',
    meta: { title: '登录' },
    component: () => import('@/views/login/index.vue'),
  },
]
