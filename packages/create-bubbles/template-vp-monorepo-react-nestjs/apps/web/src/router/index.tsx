import { Button, Result } from 'antd'
import { lazy } from 'react'
import { createBrowserRouter, Link, redirect, type RouteObject } from 'react-router'
import PageLoading from '@/components/Loading/PageLoading'
import RouteTransition from '@/components/RouteTransition/RouteTransition'
import BasicLayout from '@/layouts/BasicLayout'
import WorkspaceLayout from '@/layouts/WorkspaceLayout'
import { accessLoader, scopeLoader, workspaceLoader } from './loaders'
import RouteError from './RouteError'
import { pageRegistry, type RegisteredPage } from './page-registry'

const Login = lazy(() => import('@/pages/login'))
const Register = lazy(() => import('@/pages/register'))
const Workspaces = lazy(() => import('@/pages/workspaces'))
const WorkspaceHome = lazy(() => import('@/pages/access/home'))
const Entities = lazy(() => import('@/pages/access/entities'))
const Members = lazy(() => import('@/pages/access/members'))
const Roles = lazy(() => import('@/pages/access/roles'))
const Profile = lazy(() => import('@/pages/access/profile'))
const Audit = lazy(() => import('@/pages/access/audit'))
const Menus = lazy(() => import('@/pages/access/menus'))
const I18nExample = lazy(() => import('@/pages/examples/i18n'))
const ProTableExample = lazy(() => import('@/pages/examples/pro-table'))
const ProTableDraftExample = lazy(() => import('@/pages/examples/pro-table/draft'))
const routeError = (
  <RouteTransition>
    <RouteError />
  </RouteTransition>
)

function page(routeKey: RegisteredPage, element: React.ReactNode): RouteObject {
  const path = pageRegistry[routeKey].path
  return {
    ...(path ? { path } : { index: true }),
    element: <RouteTransition>{element}</RouteTransition>,
    loader: accessLoader(routeKey),
    shouldRevalidate: () => true,
    errorElement: routeError,
    HydrateFallback: PageLoading,
  }
}

const routes: RouteObject[] = [
  {
    path: '/login',
    element: (
      <RouteTransition>
        <Login />
      </RouteTransition>
    ),
  },
  {
    path: '/register',
    element: (
      <RouteTransition>
        <Register />
      </RouteTransition>
    ),
  },
  { path: '/', loader: () => redirect('/workspaces') },
  { path: '/home', loader: () => redirect('/workspaces') },
  {
    path: '/workspaces',
    element: (
      <RouteTransition>
        <Workspaces />
      </RouteTransition>
    ),
    loader: workspaceLoader,
    shouldRevalidate: () => true,
    errorElement: routeError,
    HydrateFallback: PageLoading,
  },
  {
    path: '/platform',
    element: <WorkspaceLayout />,
    loader: scopeLoader('platform'),
    shouldRevalidate: () => true,
    errorElement: routeError,
    children: [
      page('platform.home', <WorkspaceHome />),
      page('platform.companies', <Entities />),
      page('platform.accounts', <Members />),
      page('platform.roles', <Roles />),
      page('platform.menus', <Menus />),
      page('platform.audit', <Audit />),
    ],
  },
  {
    path: '/companies/:companyId',
    element: <WorkspaceLayout />,
    loader: scopeLoader('company'),
    shouldRevalidate: () => true,
    errorElement: routeError,
    children: [
      page('company.home', <WorkspaceHome />),
      page('company.profile', <Profile />),
      page('company.members', <Members />),
      page('company.roles', <Roles />),
      page('company.projects', <Entities />),
      page('company.audit', <Audit />),
    ],
  },
  {
    path: '/companies/:companyId/projects/:projectId',
    element: <WorkspaceLayout />,
    loader: scopeLoader('project'),
    shouldRevalidate: () => true,
    errorElement: routeError,
    children: [
      page('project.home', <WorkspaceHome />),
      page('project.profile', <Profile />),
      page('project.members', <Members />),
      page('project.roles', <Roles />),
      page('project.audit', <Audit />),
    ],
  },
  {
    path: '/examples',
    element: <BasicLayout />,
    loader: workspaceLoader,
    errorElement: routeError,
    children: [
      {
        path: 'pro-table',
        element: (
          <RouteTransition>
            <ProTableExample />
          </RouteTransition>
        ),
      },
      {
        path: 'pro-table/draft',
        element: (
          <RouteTransition>
            <ProTableDraftExample />
          </RouteTransition>
        ),
      },
      {
        path: 'i18n',
        element: (
          <RouteTransition>
            <I18nExample />
          </RouteTransition>
        ),
      },
    ],
  },
  {
    path: '*',
    element: (
      <RouteTransition>
        <Result
          status="404"
          title="页面不存在"
          subTitle="请检查地址，或返回工作空间重新选择。"
          extra={
            <Link to="/workspaces">
              <Button type="primary">返回工作空间</Button>
            </Link>
          }
        />
      </RouteTransition>
    ),
  },
]

export const router = createBrowserRouter(routes, { basename: '/' })
export const navigator = router.navigate.bind(router)
