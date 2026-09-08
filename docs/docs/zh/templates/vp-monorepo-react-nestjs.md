# vp-monorepo-react-nestjs

包含 React、Vue 和 NestJS 的全栈 monorepo 模板，适合共用后端、接口类型和国际化能力的业务项目。

## 创建项目

```bash
pnpm create bubbles my-fullstack-app -t vp-monorepo-react-nestjs
cd my-fullstack-app
vp install
```

先安装 [Vite+](https://viteplus.dev/guide/)。模板中的国际化 CLI 要求 Node.js `>=22.18.0`；模板根目录通过 `devEngines.packageManager` 声明 pnpm 版本。

## 技术栈

| 部分              | 当前内容                                                                                 |
| ----------------- | ---------------------------------------------------------------------------------------- |
| `apps/web`        | React 19、React Router、Ant Design 6、ProComponents、Tailwind CSS 4、Alova + Axios       |
| `apps/web-vue`    | Vue 3、Vue Router、Pinia、Antdv Next、UnoCSS、Alova + Axios、ECharts                     |
| `apps/server`     | NestJS 11、Fastify、Zod / nestjs-zod、Drizzle ORM、PostgreSQL、Redis、BullMQ、MinIO / S3 |
| `packages/shared` | 前后端共用的接口类型、认证类型及工具函数，使用 `vp pack` 构建                            |
| `packages/i18n`   | 国际化 core、React / Vue 适配包和语言包维护 CLI                                          |
| 工作区            | Vite+、TypeScript 6、pnpm workspace 与 catalog、类型感知 lint、提交检查                  |

React 应用包含 ProLayout 布局、登录页、工作台和国际化示例。当前 ProComponents 固定为兼容 Ant Design 6 的 `3.1.14-7` beta，具体依赖版本以模板的 `pnpm-workspace.yaml` 为准。

NestJS 已接入账号注册、登录和退出，使用 PostgreSQL 保存用户、Argon2 处理密码、Redis 保存不透明 Session Token。上传模块对接 MinIO / S3，队列模块集成 BullMQ。

## 首次启动

### 启动基础服务

Docker Compose 包含 PostgreSQL 18、Redis 8、MinIO，以及创建私有 `uploads` bucket 的 `minio-init` 服务。在生成的项目根目录执行：

```bash
docker compose up -d
```

等待服务就绪，核对 `apps/server` 下的 `.env` 和 `.env.development`，使数据库、Redis、队列 Redis 和对象存储配置与本地服务一致。后端默认按以下顺序读取配置，前面的文件优先：

```text
.env.development.local → .env.local → .env.development → .env
```

这是未设置 `NODE_ENV` 时的开发环境顺序；其他环境会将 `development` 替换为对应名称。然后应用数据库迁移并构建共享包：

```bash
vp run --filter server db:migrate
vp run --filter shared build
```

### 启动应用

分别在两个终端执行：

```bash
# 终端 1：NestJS API
vp run --filter server dev

# 终端 2：React 前端
vp run --filter web dev
```

| 服务               | 默认地址                                          |
| ------------------ | ------------------------------------------------- |
| React              | `http://localhost:9999`                           |
| NestJS             | `http://localhost:13000`                          |
| Swagger            | `http://localhost:13000/api-docs`                 |
| MinIO API / 控制台 | `http://localhost:9000` / `http://localhost:9001` |

React 开发代理会移除 `/api` 前缀，再转发到 NestJS。当前没有内置默认账号，可通过 Swagger 中的 `POST /auth/register` 创建开发账号。

NestJS 的 BullMQ 消费者默认随 API 进程启动；`QUEUE_WORKER_ENABLED=false` 可关闭当前进程的消费功能。此模板没有独立的 `dev:worker` 脚本。

### 启动 Vue 前端

`apps/web-vue` 当前也使用端口 `9999`，其开发 API 地址仍为 `http://localhost:8080`。与 React、NestJS 同时运行前，在 `apps/web-vue/.env.development.local` 写入：

```dotenv
VITE_PORT=9998
VITE_API_URL=http://localhost:13000
```

然后启动 Vue 应用：

```bash
vp run --filter web-vue dev
```

Vue 的 `VITE_API_AFFIX` 使用 `api`，React 使用 `/api`；两者的代理配置会分别处理前缀。修改共享包后，可另开终端运行 `vp run --filter shared dev` 持续构建。

## 国际化

`packages/i18n/core` 提供语言状态、存储与格式化能力，`react`、`vue` 提供框架适配，`cli` 负责扫描静态 `tr()` 调用并维护 JSON 语言包。

根目录 `i18n.config.ts` 分别配置 `web` 和 `webVue`，对应各自 `src/locales/zh_CN.json` 与 `en_US.json`：

```bash
# 添加缺失 key，保留已有翻译
vp run i18n:sync

# 只检查；发现缺失 key 时失败
vp run i18n:check
```

CLI 负责提取与检查，不会自动翻译文本。Vue 应用当前直接使用 `@bubblesjs/i18n-core` 初始化语言实例；工作区同时保留可复用的 Vue 适配包。

## 常用命令

以下命令均在生成项目的根目录执行。`vp run` 用于运行模板声明的脚本。

| 命令                                   | 用途                                                          |
| -------------------------------------- | ------------------------------------------------------------- |
| `vp run dev`                           | 执行根脚本 `pnpm run -r --stream dev`，运行工作区中的开发脚本 |
| `vp run ready`                         | 顺序执行 `vp check`、递归测试、递归构建                       |
| `vp run -r test`                       | 运行声明了 `test` 的工作区包                                  |
| `vp run -r build`                      | 构建工作区应用与包                                            |
| `vp run --filter web-vue lint`         | Vue 应用的 Oxlint + ESLint 检查                               |
| `vp run --filter server db:generate`   | 根据 Drizzle schema 生成迁移                                  |
| `vp run --filter server db:migrate`    | 执行数据库迁移                                                |
| `vp run --filter server db:studio`     | 打开 Drizzle Studio                                           |
| `vp run --filter server build:preview` | 运行已构建的 NestJS `dist/main`                               |

两个前端的开发端口需先按上文错开。React 当前的 `build` 脚本为 `tsc && vp build --mode dev`，Vue 为 `vue-tsc -b && vp build`；部署前应核对使用的环境模式与 API 配置。

## 结构

```text
apps/
  web/                # React 业务前端
  web-vue/            # Vue 业务前端
  server/             # NestJS API、认证、上传和队列
packages/
  shared/             # 共享类型与工具函数
  i18n/
    core/
    react/
    vue/
    cli/
docker-compose.yml
i18n.config.ts
pnpm-workspace.yaml
vite.config.ts
```
