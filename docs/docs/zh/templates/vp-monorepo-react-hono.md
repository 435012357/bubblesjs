# vp-monorepo-react-hono

React + Hono 全栈 monorepo，包含 PostgreSQL、Redis 和独立 BullMQ Worker，适合需要轻量 HTTP API 与后台任务的项目。

::: info 仓库预览模板
当前仓库已包含 `template-vp-monorepo-react-hono`，但 create-bubbles CLI 尚未注册此模板。暂时不能使用 `-t vp-monorepo-react-hono` 创建项目，请从仓库复制模板目录。
:::

## 获取模板

先克隆 [BubblesJS 仓库](https://github.com/435012357/bubblesjs)，在仓库根目录使用 PowerShell，将模板复制到一个尚不存在的新目录：

```powershell
Copy-Item -LiteralPath ./packages/create-bubbles/template-vp-monorepo-react-hono -Destination ../my-hono-app -Recurse -Force
Set-Location ../my-hono-app
vp install
```

复制完成后按项目名称修改根 `package.json` 的 `name`。先安装 [Vite+](https://viteplus.dev/guide/)；模板的 `mise.toml` 提供 Node.js 26、Bun 1.3 和 pnpm 11 配置，根 `devEngines.packageManager` 声明 pnpm 版本。使用默认 Node 模式时不需要 Bun。

## 技术栈

| 部分            | 当前内容                                                                   |
| --------------- | -------------------------------------------------------------------------- |
| `apps/web`      | React 19、React Router、Ant Design 6、Tailwind CSS 4、Alova + Axios、Vite+ |
| `apps/server`   | Hono 4、Zod、Drizzle ORM、PostgreSQL、ioredis、BullMQ                      |
| HTTP 运行时     | Node 使用 `@hono/node-server`；Bun 使用原生 `Bun.serve`                    |
| 后台任务        | 独立 `worker.ts` 进程，支持 Node 与 Bun 启动脚本                           |
| `packages/i18n` | 国际化 core、React 与 Vue 适配包                                           |
| 工作区          | TypeScript 6、pnpm workspace / catalog、Vite+ 检查、测试和构建             |

当前应用目录只有 `web` 和 `server`，没有 Vue 应用、共享 `shared` 包或国际化 CLI。Docker Compose 提供 PostgreSQL 18、Redis 8 和 MinIO；示例 API 与队列使用 PostgreSQL、Redis，尚未接入 MinIO 上传模块。

## 首次启动

在复制后的项目根目录执行：

```powershell
Copy-Item -LiteralPath apps/server/.env.example -Destination apps/server/.env
docker compose up -d postgres redis
```

等待 PostgreSQL 和 Redis 就绪，再执行迁移：

```bash
vp run --filter server db:migrate
```

分别启动应用和队列消费者：

```bash
# 终端 1：React + Hono API，默认使用 Node
vp run dev

# 终端 2：独立 BullMQ Worker，默认使用 Node
vp run dev:worker
```

前端默认地址为 `http://localhost:9999`，API 为 `http://localhost:10000`。`vp run dev` 不会启动队列消费者，需要保留第二个终端。

## 运行时与启动脚本

以下命令都在项目根目录执行。每组 API / Worker 应分别运行于独立终端，选择一种运行时即可。

| 目标        | 开发                     | 运行构建产物               |
| ----------- | ------------------------ | -------------------------- |
| Node API    | `vp run dev:server:node` | `vp run start:server:node` |
| Bun API     | `vp run dev:server:bun`  | `vp run start:server:bun`  |
| Node Worker | `vp run dev:worker:node` | `vp run start:worker:node` |
| Bun Worker  | `vp run dev:worker:bun`  | `vp run start:worker:bun`  |

单独启动后端时，另开终端执行 `vp run --filter web dev` 启动 React。运行构建产物前先执行：

```bash
vp run --filter server build
```

后端通过 `vp pack` 生成 `dist/index.mjs`、`dist/index.bun.mjs` 和 `dist/worker.mjs`。Node 开发模式使用 `tsx watch`，Bun 使用 `--watch`；两者共用 `app.ts`。Bun 脚本带有 `--no-env-file`，统一由 `dotenv/config` 加载 `apps/server/.env`。

BullMQ、ioredis 和 `pg` 的主要生产运行时是 Node。Bun Worker 已有启动入口，生产使用前应验证重试、延迟任务、锁续期和优雅关闭等队列行为。

### Cloudflare 支持范围

Hono 框架支持 Cloudflare Workers，但当前模板没有 Cloudflare 入口、Wrangler 配置或部署脚本。这里的 `dev:worker` 指 BullMQ 队列消费者。若要部署到 Cloudflare，需要另行适配环境变量、数据库与 Redis 连接，并将队列消费者部署到支持常驻进程的运行环境。

## API 与环境配置

| 后端路由             | 用途                               |
| -------------------- | ---------------------------------- |
| `GET /health/live`   | 进程存活检查，不访问外部依赖       |
| `GET /health/ready`  | 检查 PostgreSQL 与 Redis           |
| `POST /v1/jobs/demo` | 写入任务记录并投递 BullMQ 示例任务 |
| `GET /v1/jobs/:id`   | 查询任务执行状态                   |

这些路由也挂载在 `/api/*` 下。React 开发代理会移除 `/api` 前缀，例如浏览器请求 `/api/health/live`，代理后到达 `/health/live`；无 rewrite 的部署也可直接访问 `/api/health/live`。

后端 `.env` 使用 Zod 校验，主要配置为 `PORT`、`CORS_ORIGINS`、`DATABASE_URL`、`REDIS_URL` 和 `JOB_WORKER_CONCURRENCY`。Redis 使用 `noeviction` 策略，API 与阻塞式 Worker 使用不同连接。

React 的开发配置位于 `apps/web/.env.dev`。当前 `build` 脚本同样使用 `--mode dev`，部署前应调整环境模式和 API 配置。

## 常用命令

| 命令                                 | 用途                                         |
| ------------------------------------ | -------------------------------------------- |
| `vp run ready`                       | 顺序执行 `vp check`、递归测试、递归构建      |
| `vp run -r build`                    | 构建所有应用与国际化包                       |
| `vp run --filter server test`        | 执行后端 Vitest 测试，脚本使用 `vp test run` |
| `vp run --filter server db:generate` | 生成 Drizzle 迁移                            |
| `vp run --filter server db:migrate`  | 执行数据库迁移                               |
| `vp run --filter server db:push`     | 将 schema 直接同步到数据库                   |
| `vp run --filter server db:studio`   | 打开 Drizzle Studio                          |

## 结构

```text
apps/
  web/                      # React 前端
  server/
    src/
      app.ts                # Hono 应用与路由
      index.ts              # Node HTTP 入口
      index.bun.ts          # Bun HTTP 入口
      worker.ts             # BullMQ 消费者入口
      config/               # 环境变量校验
      infrastructure/       # 数据库、Redis、队列连接
      modules/health/       # 健康检查
      modules/jobs/         # 示例任务
    drizzle/                # 数据库迁移
packages/i18n/
  core/
  react/
  vue/
docker-compose.yml
pnpm-workspace.yaml
vite.config.ts
```
