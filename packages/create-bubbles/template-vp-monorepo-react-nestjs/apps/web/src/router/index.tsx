import { Button, Result } from 'antd'
import { lazy } from 'react'
import { createBrowserRouter, Link, Navigate, type RouteObject } from 'react-router'
import BasicLayout from '@/layouts/BasicLayout'

const Home = lazy(() => import('@/pages/home'))
const I18nExample = lazy(() => import('@/pages/examples/i18n'))
const ProTableExample = lazy(() => import('@/pages/examples/pro-table'))
const Login = lazy(() => import('@/pages/login'))

const routes: RouteObject[] = [
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <BasicLayout />,
    children: [
      { index: true, element: <Navigate to="/home" replace /> },
      { path: 'home', element: <Home /> },
      { path: 'examples/pro-table', element: <ProTableExample /> },
      { path: 'examples/i18n', element: <I18nExample /> },
      {
        path: '*',
        element: (
          <Result
            status="404"
            title="404"
            subTitle="页面不存在，请检查地址或返回工作台。"
            extra={
              <Link to="/home">
                <Button type="primary">返回工作台</Button>
              </Link>
            }
          />
        ),
      },
    ],
  },
]

export const router = createBrowserRouter(routes, {
  basename: '/',
})

export const navigator = router.navigate.bind(router)
