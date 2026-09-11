import WorkspaceLayout from '@/layouts/WorkspaceLayout'
import RouteError from '@/pages/error/error'
import { authMiddleware, scopeMiddleware } from '@/router/middleware'
import { page } from './access/page'

export const projectRoutes: RouteObject[] = [
  {
    id: 'project',
    path: '/companies/:companyId/projects/:projectId',
    element: <WorkspaceLayout />,
    middleware: [authMiddleware, scopeMiddleware('project')],
    errorElement: <RouteError />,
    children: [
      page('project.home', 'access', 'home'),
      page('project.profile', 'access', 'profile'),
      page('project.members', 'access', 'members'),
      page('project.roles', 'access', 'roles'),
      page('project.audit', 'access', 'audit'),
    ],
  },
]
