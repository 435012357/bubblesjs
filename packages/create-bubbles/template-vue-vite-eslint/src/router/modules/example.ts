import type { RouteRecordRaw } from 'vue-router'

export const ExampleRoutes: RouteRecordRaw[] = [
  {
    path: '/example',
    name: 'Example',
    children: [
      {
        path: 'echart',
        name: 'Echart',
        component: () => import('@/views/example/echart/index.vue'),
      },

      {
        path: 'tree-chart',
        name: 'TreeChart',
        component: () => import('@/views/example/tree-chart.vue'),
      },
    ],
  },
]
