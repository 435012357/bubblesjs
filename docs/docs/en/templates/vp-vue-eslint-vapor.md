# vp-vue-eslint-vapor

Vue Vapor application template powered by Vite+, intended for evaluating the Vue 3.6 Vapor compilation mode.

## Stack

- Vue 3.6.0-rc.2, Vapor mode, Vue Router 5, and Pinia 4.
- Vite+ 0.2.6, TypeScript 6, and Vue TSC.
- Antdv Next, ECharts, UnoCSS, Sass, and the SVG icon plugin.
- Alova with the Axios adapter.
- ESLint, Oxlint, and Vite+ staged checks.

## Create and Run

See [Quick Start](/en/guide/start/quick-start) for environment requirements. Select Vue → `vp + eslint + vapor` in the CLI.

```bash
pnpm create bubbles@latest my-app --template vp-vue-eslint-vapor
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

`build` runs `vue-tsc -b` before building. `lint` runs Oxlint followed by ESLint; the automatic fixes in `lint:fix` are performed by ESLint. The `prepare` hook runs `vp config` when installing dependencies.

## Vapor Entry Point

`vite.config.ts` enables Vapor compilation through the `features.vapor` option in `@vitejs/plugin-vue`. `src/main.ts` creates the app with `createVaporApp` and registers `vaporInteropPlugin` for interoperability with existing components.

The current Vue 3.6 release candidate is suitable for evaluating Vapor compatibility. Choose [vue-vp-eslint](/en/templates/vue-vite-eslint) when you need stable Vue.
