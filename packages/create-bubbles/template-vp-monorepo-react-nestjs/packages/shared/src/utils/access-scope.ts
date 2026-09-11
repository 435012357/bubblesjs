import type {
  AccessRoutePathInput,
  AccessScope,
  BuiltinPermissionKeysInput,
  FilterSupportedAccessMenusInput,
  MenuNode,
} from '../types'
import {
  ACCESS_BUILTIN_MEMBER_PERMISSIONS,
  ACCESS_PAGE_CATALOG,
  ACCESS_PERMISSION_CATALOG,
} from './access-catalog'

/** 标识当前作用域，不校验成员身份或访问权限。 */
export function accessScopeKey(scope: AccessScope): string {
  switch (scope.type) {
    case 'platform':
      return 'platform'
    case 'company':
      return `company:${scope.companyId}`
    case 'project':
      return `project:${scope.companyId}:${scope.projectId}`
  }
}

/** 生成平台、企业或项目的入口路径，并对路径中的资源 ID 编码。 */
export function accessScopeBasePath(scope: AccessScope): string {
  switch (scope.type) {
    case 'platform':
      return '/platform'
    case 'company':
      return `/companies/${encodeURIComponent(scope.companyId)}`
    case 'project':
      return `/companies/${encodeURIComponent(scope.companyId)}/projects/${encodeURIComponent(scope.projectId)}`
  }
}

/** 按路由键查找页面目录定义；未注册时返回 `undefined`。 */
export function getAccessPage(routeKey: string) {
  return ACCESS_PAGE_CATALOG.find((page) => page.routeKey === routeKey)
}

/** 按权限键查找权限目录定义；未注册时返回 `undefined`。 */
export function getAccessPermission(permissionKey: string) {
  return ACCESS_PERMISSION_CATALOG.find((permission) => permission.key === permissionKey)
}

/** 未注册页面或不匹配的作用域没有可生成的页面路径。 */
export function accessRoutePath({ scope, routeKey }: AccessRoutePathInput): string | null {
  const page = getAccessPage(routeKey)
  if (!page || page.scopeType !== scope.type) return null

  let path = page.path
  if (scope.type !== 'platform') {
    path = path.replace(':companyId', encodeURIComponent(scope.companyId))
  }
  if (scope.type === 'project') {
    path = path.replace(':projectId', encodeURIComponent(scope.projectId))
  }
  return path
}

/** 仅返回系统角色定义；实际访问仍须校验成员、状态及菜单。 */
export function getBuiltinPermissionKeys({
  scopeType,
  builtin,
}: BuiltinPermissionKeysInput): string[] {
  if (builtin === 'member') return [...ACCESS_BUILTIN_MEMBER_PERMISSIONS[scopeType]]
  return ACCESS_PERMISSION_CATALOG.filter(
    (permission) => permission.scopeType === scopeType && !permission.deprecated,
  ).map((permission) => permission.key)
}

/** 统一企业、项目等访问编码的空白与大小写，供保存和匹配使用。 */
export function normalizeAccessCode(value: string): string {
  return value.trim().toLowerCase()
}

/** 旧前端的页面兼容过滤，不更改来源菜单或服务端权限。 */
export function filterSupportedAccessMenus({
  menus,
  supportedRouteKeys,
}: FilterSupportedAccessMenusInput): MenuNode[] {
  const supported = new Set(supportedRouteKeys)

  /** 递归复制受支持的菜单，并移除过滤后没有子节点的目录。 */
  function visit(nodes: readonly MenuNode[]): MenuNode[] {
    return nodes.flatMap((node): MenuNode[] => {
      if (node.type !== 'directory' && (!node.routeKey || !supported.has(node.routeKey))) return []
      const children = visit(node.children)
      if (node.type === 'directory' && children.length === 0) return []
      return [{ ...node, children }]
    })
  }

  return visit(menus)
}
