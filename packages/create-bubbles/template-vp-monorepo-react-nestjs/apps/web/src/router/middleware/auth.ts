import { cookie } from '@/utils/storage/cookie'

/** 在路由进入前检查本地登录令牌，缺失时重定向到登录页。 */
export const authMiddleware: MiddlewareFunction = () => {
  if (!cookie.get('token')) throw redirect('/login')
}
