interface PageModule {
  default: ComponentType
}

const pageModules = import.meta.glob<PageModule>('@/pages/**/*.tsx')
const lazyPages = new Map<string, LazyExoticComponent<ComponentType>>()

/**
 * 按 pages 下的模块目录懒加载页面，并复用已创建的懒加载组件。
 * @param moduleName 相对于 pages 的模块目录，例如 access/menus。
 * @param leafPath 模块目录下的页面路径，不带扩展名，默认 index。
 * @throws 页面模块不存在时抛出包含完整模块路径的错误。
 */
export function lazyLoad(moduleName: string, leafPath = 'index'): ReactElement {
  const modulePath = `/src/pages/${moduleName}/${leafPath}.tsx`
  let Page = lazyPages.get(modulePath)

  if (!Page) {
    const importPage = pageModules[modulePath]
    if (!importPage) throw new Error(`找不到路由页面模块：${modulePath}`)
    Page = lazy(importPage)
    lazyPages.set(modulePath, Page)
  }

  return <Page />
}
