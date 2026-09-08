# vp-monorepo-react-nestjs

A full-stack monorepo with React, Vue, and NestJS, for business applications that share a backend, API types, and internationalization packages.

## Create a project

```bash
pnpm create bubbles my-fullstack-app -t vp-monorepo-react-nestjs
cd my-fullstack-app
vp install
```

Install [Vite+](https://viteplus.dev/guide/) first. The included i18n CLI requires Node.js `>=22.18.0`; the root `devEngines.packageManager` declares the template's pnpm version.

## Stack

| Part              | Current contents                                                                         |
| ----------------- | ---------------------------------------------------------------------------------------- |
| `apps/web`        | React 19, React Router, Ant Design 6, ProComponents, Tailwind CSS 4, Alova + Axios       |
| `apps/web-vue`    | Vue 3, Vue Router, Pinia, Antdv Next, UnoCSS, Alova + Axios, ECharts                     |
| `apps/server`     | NestJS 11, Fastify, Zod / nestjs-zod, Drizzle ORM, PostgreSQL, Redis, BullMQ, MinIO / S3 |
| `packages/shared` | Shared API and authentication types and utilities, built with `vp pack`                  |
| `packages/i18n`   | Internationalization core, React / Vue adapters, and a catalog maintenance CLI           |
| Workspace         | Vite+, TypeScript 6, pnpm workspace and catalog, type-aware linting, commit checks       |

The React app includes a ProLayout shell, login page, workspace, and internationalization example. ProComponents is pinned to the Ant Design 6-compatible `3.1.14-7` beta. Refer to the template's `pnpm-workspace.yaml` for dependency versions.

The NestJS backend includes registration, login, and logout. PostgreSQL stores users, Argon2 handles password hashing, and Redis stores opaque session tokens. Uploads use MinIO / S3, and task processing uses BullMQ.

## First run

### Start infrastructure

Docker Compose includes PostgreSQL 18, Redis 8, MinIO, and a `minio-init` service that creates a private `uploads` bucket. Run from the generated project root:

```bash
docker compose up -d
```

Wait for the services to become available. Check `.env` and `.env.development` in `apps/server` so the database, Redis, queue Redis, and object storage settings match your local services. The backend reads configuration in this order, with earlier files taking precedence:

```text
.env.development.local → .env.local → .env.development → .env
```

This is the development order used when `NODE_ENV` is unset; other environments replace `development` with their name. Apply database migrations and build the shared package:

```bash
vp run --filter server db:migrate
vp run --filter shared build
```

### Start the applications

Run these commands in separate terminals:

```bash
# Terminal 1: NestJS API
vp run --filter server dev

# Terminal 2: React frontend
vp run --filter web dev
```

| Service             | Default address                                   |
| ------------------- | ------------------------------------------------- |
| React               | `http://localhost:9999`                           |
| NestJS              | `http://localhost:13000`                          |
| Swagger             | `http://localhost:13000/api-docs`                 |
| MinIO API / console | `http://localhost:9000` / `http://localhost:9001` |

The React development proxy strips `/api` before forwarding requests to NestJS. No default account is included; use `POST /auth/register` in Swagger to create a development account.

BullMQ consumers start inside the NestJS API process by default. Set `QUEUE_WORKER_ENABLED=false` to disable consumption in that process. This template does not provide a separate `dev:worker` script.

### Start the Vue frontend

`apps/web-vue` also defaults to port `9999`, and its development API URL currently points to `http://localhost:8080`. Before running it alongside React and NestJS, create `apps/web-vue/.env.development.local` with:

```dotenv
VITE_PORT=9998
VITE_API_URL=http://localhost:13000
```

Then start the Vue application:

```bash
vp run --filter web-vue dev
```

Vue uses `api` for `VITE_API_AFFIX`, while React uses `/api`; their proxy configurations handle the prefixes accordingly. Run `vp run --filter shared dev` in another terminal to rebuild the shared package as it changes.

## Internationalization

`packages/i18n/core` provides locale state, storage, and formatting. The `react` and `vue` packages provide framework adapters, while `cli` scans static `tr()` calls and maintains JSON catalogs.

The root `i18n.config.ts` defines separate `web` and `webVue` projects, each with its own `src/locales/zh_CN.json` and `en_US.json`:

```bash
# Add missing keys and preserve existing translations
vp run i18n:sync

# Check only; fail when keys are missing
vp run i18n:check
```

The CLI extracts and checks keys; it does not translate text automatically. The Vue app currently initializes its locale instance directly through `@bubblesjs/i18n-core`, and the workspace also includes a reusable Vue adapter.

## Commands

Run these commands from the generated project root. Use `vp run` to invoke the template's declared scripts.

| Command                                | Purpose                                                                           |
| -------------------------------------- | --------------------------------------------------------------------------------- |
| `vp run dev`                           | Runs the root script `pnpm run -r --stream dev` for workspace development scripts |
| `vp run ready`                         | Runs `vp check`, recursive tests, and recursive builds in sequence                |
| `vp run -r test`                       | Runs workspace packages that declare a `test` script                              |
| `vp run -r build`                      | Builds workspace applications and packages                                        |
| `vp run --filter web-vue lint`         | Runs the Vue app's Oxlint + ESLint checks                                         |
| `vp run --filter server db:generate`   | Generates migrations from the Drizzle schema                                      |
| `vp run --filter server db:migrate`    | Applies database migrations                                                       |
| `vp run --filter server db:studio`     | Opens Drizzle Studio                                                              |
| `vp run --filter server build:preview` | Runs the built NestJS `dist/main` entry                                           |

Assign different development ports to the two frontends as described above. React currently builds with `tsc && vp build --mode dev`, while Vue uses `vue-tsc -b && vp build`; review the environment mode and API configuration before deploying.

## Structure

```text
apps/
  web/                # React business frontend
  web-vue/            # Vue business frontend
  server/             # NestJS API, authentication, uploads, and queues
packages/
  shared/             # Shared types and utilities
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
