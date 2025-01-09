import { createBrowserRouter } from 'react-router';

const routes = [
  {
    path: '/',
    element: <div>Hello world!</div>,
  },
];

export const router = createBrowserRouter(routes, {
  basename: import.meta.env.PUBLIC_PATH,
});

export default router;
