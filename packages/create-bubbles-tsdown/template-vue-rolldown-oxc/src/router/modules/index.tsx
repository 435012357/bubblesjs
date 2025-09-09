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
        meta: { title: '研发A区数字孪生可视化大屏', isHideBack: true },
        component: () => import('@/views/home/index.vue'),
      },
    ],
  },
  {
    path: '/model',
    name: 'model',
    meta: {},
    component: () => import('@/views/model/index.vue'),
  },
]
