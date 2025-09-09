import { createBrowserRouter, Navigate, type RouteObject } from 'react-router'
import Layout from '@/layout/default'
import { envVariables } from '@/utils/env'
export const lazyLoad = (path: string) => {
  const Module = lazy(() => import(`@/pages/${path}.tsx`))
  return <Module />
}

export const menuRoutes: RouteObject[] = [
  {
    path: 'home',
    id: 'home',
    handle: { title: '首页' },
    element: lazyLoad('home/index'),
  },
]

const routes: RouteObject[] = [
  {
    path: '/',
    id: 'layout',
    element: <Layout />,
    children: [
      {
        path: '',
        id: 'index',
        element: <Navigate to={'/home'} />,
      },
      ...menuRoutes,
    ],
  },
]

export const router = createBrowserRouter(routes, {
  basename: envVariables.PUBLIC_PATH,
})

export default router
