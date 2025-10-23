import type { RouteRecordRaw } from 'vue-router'

import type { MenuRouteRecordRawType } from '../interface'

import { ExampleRoutes } from './example'

export const menuRoutes: MenuRouteRecordRawType [] = [
  {
    path: '/home',
    name: 'Home',
    meta: { title: '首页概览', icon: 'svg-home' },
    component: () => import('@/views/home/index.vue'),
  },
  {
    path: '/data-search-statistics',
    name: 'DataSearchStatistics',
    meta: { title: '数据查询统计', icon: 'svg-data-search' },
    children: [
      {
        path: '/abc',
        name: 'abc',
        meta: { title: '测试' },
        component: () => import('@/views/home/index.vue'),
      },
      {
        path: '/data-statistics',
        name: 'DataStatistics',
        meta: { title: '数据统计' },
        component: () => import('@/views/data-statistics/index.vue'),
      },
    ],
  },
  {
    path: '/knowledge-graph',
    name: 'KnowledgeGraph',
    meta: { title: '知识图谱', icon: 'svg-knowledge-graph' },
    component: () => import('@/views/knowledge-graph/index.vue'),
  },
  {
    path: '/ai-search-tools',
    name: 'AISearchTools',
    meta: { title: 'AI研究工具', icon: 'svg-cpu' },
    component: () => import('@/views/home/index.vue'),
  },
  {
    path: '/data-mgt',
    name: 'DataMgt',
    meta: { title: '数据管理', icon: 'svg-computer-data' },
    component: () => import('@/views/home/index.vue'),
  },
  {
    path: '/platform-ai-assistant',
    name: 'PlatformAIAssistant',
    meta: { title: '平台智能助手', icon: 'svg-robot' },
    component: () => import('@/views/home/index.vue'),
  },
]

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
      ...menuRoutes,
    ],
  },
  ...ExampleRoutes,
  {
    path: '/login',
    name: 'login',
    meta: { title: '登录' },
    component: () => import('@/views/login/index.vue'),
  },
]
