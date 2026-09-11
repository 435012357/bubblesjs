import { routes } from './modules'

export const router = createBrowserRouter(routes, { basename: '/' })

export const navigator = router.navigate.bind(router)
