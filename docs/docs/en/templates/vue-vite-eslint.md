# vue-vp-eslint

Vue 3 single-page application template powered by Vite+. Select Vue → `vp + eslint` in the CLI.

## Stack

- Vue 3.5, Vue Router 5, Pinia 4, persisted state.
- Vite+ 0.2.6, TypeScript 6, Vue TSC.
- Antdv Next, ECharts.
- UnoCSS, Sass, SVG icon plugin.
- Alova with the Axios adapter.
- ESLint, Oxlint, Lefthook, and Commitlint.

## Create and Run

See [Quick Start](/en/guide/start/quick-start) for environment requirements.

```bash
pnpm create bubbles@latest my-app --template vue-vp-eslint
cd my-app
pnpm install
pnpm dev
```

## Common Scripts

```bash
pnpm build
pnpm preview
pnpm lint
pnpm lint:fix
```

`build` runs `vue-tsc -b` before building. `lint` runs Oxlint followed by ESLint; the automatic fixes in `lint:fix` are performed by ESLint.

## Key Files

- `vite.config.ts`: port, API proxy, component auto-imports, and UnoCSS.
- `src/router` and `src/store`: route guards and Pinia state.
- `src/utils/request`: Alova request wrapper.
