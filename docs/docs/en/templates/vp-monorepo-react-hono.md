# vp-monorepo-react-hono

A React + Hono full-stack monorepo with PostgreSQL, Redis, and an independent BullMQ worker, for projects that need a lightweight HTTP API and background jobs.

::: info Repository preview template
The repository includes `template-vp-monorepo-react-hono`, but create-bubbles has not registered it in the CLI. The `-t vp-monorepo-react-hono` option cannot scaffold it yet; copy the template directory from the repository.
:::

## Get the template

Clone the [BubblesJS repository](https://github.com/435012357/bubblesjs), then run PowerShell from its root to copy the template into a new directory that does not already exist:

```powershell
Copy-Item -LiteralPath ./packages/create-bubbles/template-vp-monorepo-react-hono -Destination ../my-hono-app -Recurse -Force
Set-Location ../my-hono-app
vp install
```

Update `name` in the copied root `package.json` for your project. Install [Vite+](https://viteplus.dev/guide/) first. The template's `mise.toml` configures Node.js 26, Bun 1.3, and pnpm 11; the root `devEngines.packageManager` declares its pnpm version. Bun is optional when using the default Node runtime.

## Stack

| Part            | Current contents                                                           |
| --------------- | -------------------------------------------------------------------------- |
| `apps/web`      | React 19, React Router, Ant Design 6, Tailwind CSS 4, Alova + Axios, Vite+ |
| `apps/server`   | Hono 4, Zod, Drizzle ORM, PostgreSQL, ioredis, BullMQ                      |
| HTTP runtimes   | `@hono/node-server` for Node; native `Bun.serve` for Bun                   |
| Background jobs | A separate `worker.ts` process with Node and Bun scripts                   |
| `packages/i18n` | Internationalization core and React / Vue adapters                         |
| Workspace       | TypeScript 6, pnpm workspace / catalog, Vite+ checks, tests, and builds    |

The application directories are `web` and `server`; there is no Vue app, `shared` package, or i18n CLI. Docker Compose provides PostgreSQL 18, Redis 8, and MinIO. The sample API and queue use PostgreSQL and Redis; a MinIO upload module is not included.

## First run

Run from the copied project root:

```powershell
Copy-Item -LiteralPath apps/server/.env.example -Destination apps/server/.env
docker compose up -d postgres redis
```

Wait for PostgreSQL and Redis to become available, then apply migrations:

```bash
vp run --filter server db:migrate
```

Start the applications and queue consumer separately:

```bash
# Terminal 1: React + Hono API, using Node by default
vp run dev

# Terminal 2: independent BullMQ worker, using Node by default
vp run dev:worker
```

The frontend defaults to `http://localhost:9999`, and the API to `http://localhost:10000`. `vp run dev` does not start the queue consumer; keep the second terminal running.

## Runtime scripts

Run these commands from the project root. Run the API and worker in separate terminals and choose one runtime for each process.

| Target      | Development              | Run build output           |
| ----------- | ------------------------ | -------------------------- |
| Node API    | `vp run dev:server:node` | `vp run start:server:node` |
| Bun API     | `vp run dev:server:bun`  | `vp run start:server:bun`  |
| Node worker | `vp run dev:worker:node` | `vp run start:worker:node` |
| Bun worker  | `vp run dev:worker:bun`  | `vp run start:worker:bun`  |

When starting the backend separately, run `vp run --filter web dev` in another terminal for React. Build the backend before using the production entry scripts:

```bash
vp run --filter server build
```

The backend uses `vp pack` to produce `dist/index.mjs`, `dist/index.bun.mjs`, and `dist/worker.mjs`. Node development uses `tsx watch`, while Bun uses `--watch`; both share `app.ts`. Bun scripts include `--no-env-file`, so `dotenv/config` consistently loads `apps/server/.env` for both runtimes.

Node is the primary production runtime for BullMQ, ioredis, and `pg`. The Bun worker entry is provided; verify retries, delayed jobs, lock renewal, and graceful shutdown before using it in production.

### Cloudflare support

Hono supports Cloudflare Workers, but this template does not include a Cloudflare entry, Wrangler configuration, or deployment script. Its `dev:worker` script starts a BullMQ queue consumer. Cloudflare deployment requires adapting environment configuration and database / Redis connections, and deploying the queue consumer in an environment that supports a persistent process.

## API and environment

| Backend route        | Purpose                                                         |
| -------------------- | --------------------------------------------------------------- |
| `GET /health/live`   | Checks process liveness without accessing external dependencies |
| `GET /health/ready`  | Checks PostgreSQL and Redis                                     |
| `POST /v1/jobs/demo` | Persists a job record and enqueues a sample BullMQ job          |
| `GET /v1/jobs/:id`   | Returns job execution status                                    |

These routes are also mounted under `/api/*`. The React development proxy strips `/api`: a browser request to `/api/health/live` reaches `/health/live`. Deployments without rewriting can also call `/api/health/live` directly.

The backend validates `.env` using Zod. Main settings include `PORT`, `CORS_ORIGINS`, `DATABASE_URL`, `REDIS_URL`, and `JOB_WORKER_CONCURRENCY`. Redis uses the `noeviction` policy, and the API and blocking worker use separate connections.

React development configuration lives in `apps/web/.env.dev`. The current `build` script also uses `--mode dev`; adjust the environment mode and API settings before deployment.

## Commands

| Command                              | Purpose                                                            |
| ------------------------------------ | ------------------------------------------------------------------ |
| `vp run ready`                       | Runs `vp check`, recursive tests, and recursive builds in sequence |
| `vp run -r build`                    | Builds all applications and internationalization packages          |
| `vp run --filter server test`        | Runs backend Vitest tests with `vp test run`                       |
| `vp run --filter server db:generate` | Generates Drizzle migrations                                       |
| `vp run --filter server db:migrate`  | Applies database migrations                                        |
| `vp run --filter server db:push`     | Pushes the schema directly to the database                         |
| `vp run --filter server db:studio`   | Opens Drizzle Studio                                               |

## Structure

```text
apps/
  web/                      # React frontend
  server/
    src/
      app.ts                # Hono application and routes
      index.ts              # Node HTTP entry
      index.bun.ts          # Bun HTTP entry
      worker.ts             # BullMQ consumer entry
      config/               # Environment validation
      infrastructure/       # Database, Redis, and queue connections
      modules/health/       # Health checks
      modules/jobs/         # Sample jobs
    drizzle/                # Database migrations
packages/i18n/
  core/
  react/
  vue/
docker-compose.yml
pnpm-workspace.yaml
vite.config.ts
```
