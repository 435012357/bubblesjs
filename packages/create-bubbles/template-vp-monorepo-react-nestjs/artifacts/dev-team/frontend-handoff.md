# 前端实现与验证交接

更新日期：2026-09-09。前端实现以已确认需求及 `contract.md` 为准，业务代码修改范围仅为 `apps/web`。

## 实现范围

- `src/pages/register`、`src/pages/login/index.tsx`：公开注册、登录、注册成功账号提示，以及登录后的工作空间入口。
- `src/pages/workspaces`：按服务端有效身份展示企业、项目和平台工作空间。无企业普通账号显示等待添加的空态；有效平台身份仍保留平台入口。
- `src/pages/access`：工作台、企业开通与启停、项目创建与启停、管理员补任与更换、账号与成员管理、角色分配、自定义角色与权限树、资料、三套菜单编辑、废弃权限清理预览与执行、审计筛选与分页。
- `src/pages/access/components`：通过 `show/hide` 暴露弹窗操作，所有写操作使用共享契约 DTO。内置角色定义只读；权限树保留页面和操作的依赖关系及全选、半选行为。
- `src/router`：17 个静态管理页面注册，父级 scope loader 获取作用域上下文，叶子 loader 校验页面权限；未知页面显示 404。页面 403 不会清空其他可用导航；空间首页无读权限时，优先进入可见菜单中的已授权静态页面。首页跳转工作空间，示例页面不出现在生产菜单。
- `src/layouts/WorkspaceLayout.tsx`、`workspace.css`：三种作用域布局、具体企业／项目名称、导航和切换；切换先移除旧业务 DOM，权限刷新时隐藏页面并保留表单输入。
- `src/utils/request/workspace.ts`：沿用现有 alova 请求封装；管理请求禁止缓存，取消旧请求，使用用户、作用域和请求代次阻止迟到结果。旧 401 不得退出新账号，旧 403 不得刷新新空间。当前业务 403 刷新一次，access 403 不递归。
- `test/workspace-requests.spec.ts`、`test/workspace-navigation.spec.ts`、`test/workspace-loaders.spec.ts`：新增 14 项权限导航、请求竞态和真实 React Router memory 导航回归测试。

## 已执行验证

以下结果来自实际运行，不包含尚未完成的浏览器联调：

| 命令                                                                                                                                                                                                                                                                                                                            | 结果                                                                                                                                           |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `vp run --filter web build`                                                                                                                                                                                                                                                                                                     | 通过。TypeScript 检查完成，Vite 构建 4494 个模块。现有 ProTable 相关产物存在大于 500 kB 的 chunk 提示，没有通过提高阈值隐藏提示。              |
| `vp run --filter web test`                                                                                                                                                                                                                                                                                                      | 6 个测试文件、43 项测试全部通过：storage 14、request 11、draft-projects 4、workspace-requests 5、workspace-navigation 6、workspace-loaders 3。 |
| `vp check apps/web/src/utils/request/workspace.ts apps/web/src/pages/access apps/web/src/pages/register apps/web/src/pages/workspaces apps/web/src/router apps/web/src/layouts/WorkspaceLayout.tsx apps/web/test/workspace-requests.spec.ts apps/web/test/workspace-navigation.spec.ts apps/web/test/workspace-loaders.spec.ts` | 31 个文件格式正确，无 lint 警告、错误或类型错误。                                                                                              |
| `git diff --check -- apps/web`                                                                                                                                                                                                                                                                                                  | 无空白错误。Windows Git 的 LF／CRLF 提示不影响此结论。                                                                                         |

14 项新增测试覆盖：切换取消与迟到成功；换号后的旧 401；旧作用域 403；当前 403 单次刷新与 access 防递归；Router AbortSignal；未知菜单、所属操作和空目录过滤且不改源数据；隐藏／停用导航与静态路由；未知／跨作用域 routeKey；服务端允许图标的完整前端映射；可见授权页面优先落点；没有受支持页面时无落点；叶子 403 保留父级上下文且可进入其他管理页；首页停用后自动重定向；整个作用域身份撤销后不保留旧上下文。

最终检查前修复了菜单平铺后的父级选择问题：编辑器从原始树定位当前节点并排除自身及全部后代，防止平铺行的空 children 漏掉后代选项。

联调复查发现并修复资料保存后的本地版本未递增问题：保存成功合并服务端返回的最新资料及 version，后续编辑使用最新版本；真正版本冲突仍保留输入。该修复已重新通过完整 TypeScript／Vite 构建及 31 文件检查，连续保存的真实浏览器验证交由 QA。

## 联调边界

- 页面直接调用真实 API，没有使用 mock 数据。共享类型与纯工具统一从 `shared/types`、`shared/utils` 导入。
- 企业项目列表的管理员设置使用已同步契约的 `GET /companies/:companyId/projects/:projectId/administrators`，支持读取停用项目的显式项目管理员，避免将企业隐式管理员当作待替换的项目身份。
- React Router 当前版本为 8.0.1，布局通过 `useLoaderData()` 读取独立父级作用域数据，页面读取叶子权限数据。工作空间名称由父 loader 同时读取 workspaces 提供，不增设 API DTO。
- 开发前端默认 API 前缀为 `/api`；隔离联调环境由主控启动，前端端口 5301，后端端口 3301。前端代理通过 `VITE_API_URL` 配置。
- Playwright 真实页面、后端接口和数据库事务验收由主控及 QA 独立执行，结果应写入最终测试报告，不能用本交接中的静态检查替代。
