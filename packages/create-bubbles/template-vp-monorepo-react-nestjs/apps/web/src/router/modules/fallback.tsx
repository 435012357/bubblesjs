import RouteTransition from '@/components/RouteTransition/RouteTransition'
import NotFound from '@/pages/error/404'

export const fallbackRoutes: RouteObject[] = [
  {
    path: '*',
    element: (
      <RouteTransition>
        <NotFound />
      </RouteTransition>
    ),
  },
]
