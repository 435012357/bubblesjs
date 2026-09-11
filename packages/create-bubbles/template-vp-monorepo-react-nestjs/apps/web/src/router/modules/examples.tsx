import BasicLayout from '@/layouts/BasicLayout'
import RouteError from '@/pages/error/error'
import { lazyLoad } from '@/router/lazy-load'
import { authMiddleware, workspacesMiddleware } from '@/router/middleware'

export const exampleRoutes: RouteObject[] = [
  {
    path: '/examples',
    element: <BasicLayout />,
    middleware: [authMiddleware, workspacesMiddleware],
    errorElement: <RouteError />,
    children: [
      { path: 'pro-table', element: lazyLoad('examples/pro-table') },
      { path: 'pro-table/draft', element: lazyLoad('examples/pro-table/draft') },
      { path: 'i18n', element: lazyLoad('examples/i18n') },
    ],
  },
]
