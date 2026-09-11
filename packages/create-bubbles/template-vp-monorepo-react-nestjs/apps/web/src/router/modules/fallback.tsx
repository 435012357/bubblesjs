import NotFound from '@/pages/error/404'

export const fallbackRoutes: RouteObject[] = [
  {
    path: '*',
    element: <NotFound />,
  },
]
