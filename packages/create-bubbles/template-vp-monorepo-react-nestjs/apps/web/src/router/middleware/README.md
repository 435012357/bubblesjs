# 路由中间件

当前共有 5 个路由中间件，通过 [index.ts](./index.ts) 统一导出，并在路由的 `middleware` 数组中配置。

| 中间件 / 实现文件 | 作用 | 拦截、跳转及异常处理 | 使用位置 |
| --- | --- | --- | --- |
| `authMiddleware` · [auth.ts](./auth.ts) | 检查本地 Cookie 中是否存在 `token`，作为进入受保护路由的登录检查。 | 缺少 `token` 时跳转到 `/login`；令牌有效性由后端接口校验。 | 默认入口 `/`、`/home`，工作空间选择页 `/workspaces`，示例页 `/examples`，以及平台、企业、项目的父路由。 |
| `workspacesMiddleware` · [workspace/data.ts](./workspace/data.ts) | 切换到工作空间列表的请求上下文，获取最新的可访问工作空间列表，写入页面共享状态和 `workspacesContext`，供选择页、布局及入口分流使用。 | 请求失败时继续抛出异常；非取消错误会清除旧列表，`AbortError` 不清除状态。 | `/`、`/home`、`/workspaces` 和 `/examples`，位于 `authMiddleware` 之后。 |
| `entryMiddleware` · [workspace/entry.ts](./workspace/entry.ts) | 为默认入口选择落地页：仅有一个项目入口，且没有平台入口、企业管理员身份或超出内置企业成员权限的企业职责时，进入该项目的首个已授权页面。 | 不满足自动进入条件、找不到可访问页面，或查询权限时收到 403 / 404，均跳转到 `/workspaces`；其他异常继续抛出。 | 仅 `/`、`/home`，位于 `workspacesMiddleware` 之后；主动选择空间或直接访问具体页面不经过此分流。 |
| `scopeMiddleware(type)` · [workspace/data.ts](./workspace/data.ts) | 根据 `platform`、`company`、`project` 及路由参数构造作用域；并行获取该空间的访问上下文和工作空间列表，将权限、菜单及空间信息保存到共享状态，并将权限上下文写入 `scopeAccessContext`。 | 请求失败时继续抛出异常；非取消错误会清除该作用域的旧权限，`AbortError` 不清除状态。切换账号或空间时，通过请求上下文切换中止旧请求。 | `/platform`、`/companies/:companyId`、`/companies/:companyId/projects/:projectId` 的父路由，位于 `authMiddleware` 之后。 |
| `accessMiddleware(routeKey)` · [workspace/access.ts](./workspace/access.ts) | **检查菜单对应页面的访问权限**：读取 `scopeAccessContext`，判断 `permissionKeys` 是否包含 `${routeKey}.read`，例如 `platform.menus.read`。 | 有权限则放行；首页无权限时尝试跳转到其他已授权页面，否则抛出状态为 403 的错误。错误归属当前叶子页面边界，保留父级空间导航。 | 由 [page()](../modules/access/page.tsx) 统一挂载到平台、企业、项目的叶子页面路由，在父级 `scopeMiddleware` 之后执行。 |

常见路由的执行顺序如下；前面的中间件发生跳转或失败时，按对应结果处理。

| 路由场景 | 执行顺序 |
| --- | --- |
| 默认入口 `/`、`/home` | `authMiddleware` → `workspacesMiddleware` → `entryMiddleware` |
| 工作空间选择页 `/workspaces`、示例页 `/examples` | `authMiddleware` → `workspacesMiddleware` |
| 平台、企业、项目内的页面 | 父路由 `authMiddleware` → 父路由 `scopeMiddleware(type)` → 叶子路由 `accessMiddleware(routeKey)` |

`workspacesContext` 和 `scopeAccessContext` 是路由上下文对象，用于在本次导航的中间件之间传递数据。页面和布局使用的共享状态由 `getWorkspaceState()` 提供；每次进入空间仍会请求最新权限，已有状态不会跳过权限校验。

后端接口的权限校验由全局守卫 `AccessGuard` 调用 `AccessService` 完成。前端中间件负责路由访问控制和导航体验。
