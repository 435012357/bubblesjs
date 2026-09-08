# react-rsbuild-biome

React application template based on Rsbuild and Biome.

## Stack

- React 19.2, React Router 7, Zustand 5.
- Rsbuild 2, TypeScript 6, Biome 2.
- Ant Design 6, Ant Design Icons, Ahooks.
- UnoCSS, Sass, SVGR.
- Alova with the Axios adapter.

## Create and Run

See [Quick Start](/en/guide/start/quick-start) for environment requirements.

```bash
pnpm create bubbles@latest my-app --template react-rsbuild-biome
cd my-app
pnpm install
pnpm dev
```

## Common Scripts

```bash
pnpm dev:prod
pnpm build
pnpm preview
pnpm check
pnpm format
```

`dev:prod` starts the development server with production environment variables. `check` runs `biome check --write` and modifies files; `format` uses Prettier. `build` runs the Rsbuild build without a separate TypeScript type-check command.

## Important Files

- `rsbuild.config.ts`: build configuration.
- `src/router`: route configuration.
- `src/layout`: app layout.
