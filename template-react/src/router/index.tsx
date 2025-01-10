import { Suspense } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router';

import Loading from '@/components/Loading/PageLoading';

export const lazyLoad = (path: string) => {
  const Module = lazy(() => import(`@/pages/${path}.tsx`));
  return (
    <Suspense fallback={<Loading />}>
      <Module />
    </Suspense>
  );
};

const routes: RouteObject[] = [
  {
    path: '/',
    id: 'home',
    element: lazyLoad('home/index'),
  },
];

export const router = createBrowserRouter(routes, {
  basename: import.meta.env.PUBLIC_PATH,
});

export default router;
