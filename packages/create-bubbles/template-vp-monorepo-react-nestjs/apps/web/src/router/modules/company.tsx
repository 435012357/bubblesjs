import WorkspaceLayout from '@/layouts/WorkspaceLayout'
import RouteError from '@/pages/error/error'
import { authMiddleware, scopeMiddleware } from '@/router/middleware'
import { page } from './access/page'

export const companyRoutes: RouteObject[] = [
  {
    id: 'company',
    path: '/companies/:companyId',
    element: <WorkspaceLayout />,
    middleware: [authMiddleware, scopeMiddleware('company')],
    errorElement: <RouteError />,
    children: [
      page('company.home', 'access', 'home'),
      page('company.profile', 'access', 'profile'),
      page('company.members', 'access', 'members'),
      page('company.roles', 'access', 'roles'),
      page('company.projects', 'access', 'entities'),
      page('company.audit', 'access', 'audit'),
    ],
  },
]
