import RouteError from '@/pages/error/error'
import { lazyLoad } from '@/router/lazy-load'
import { accessMiddleware } from '@/router/middleware'
import { pageRegistry, type RegisteredPage } from '@/router/page-registry'

/** 将已注册页面转换为带权限中间件和懒加载内容的路由。 */
export function page(
  routeKey: RegisteredPage,
  moduleName: string,
  leafPath = 'index',
): RouteObject {
  const path = pageRegistry[routeKey].path
  return {
    id: routeKey,
    ...(path ? { path } : { index: true }),
    element: lazyLoad(moduleName, leafPath),
    middleware: [accessMiddleware(routeKey)],
    errorElement: <RouteError />,
  }
}
