import { createBrowserRouter, type RouteObject } from 'react-router';

export const lazyLoad = (path: string) => {
  const Module = () => import(`@/pages/${path}.tsx`);
  return <Module />;
};

const routes: RouteObject[] = [
  {
    path: '/',
    id: 'home',
    element: lazyLoad('home'),
  },
];

export const router = createBrowserRouter(routes, {
  basename: import.meta.env.PUBLIC_PATH,
});

export default router;
