# nextjs-vinext-eslint

Next.js and React template powered by Vinext.

## Stack

- Next.js 16.2 and React 19.2.
- Vinext 0.0.55, Vite 8, TypeScript 6.
- Ant Design 6, CSS-in-JS support, GSAP.
- UnoCSS, SVGR, and an Alova request wrapper.
- ESLint 10 with Antfu, Next, React Hooks, React Refresh, and UnoCSS plugins.

## Create and Run

See [Quick Start](/en/guide/start/quick-start) for environment requirements. The template's Volta configuration specifies Node.js `24.14.0`.

```bash
pnpm create bubbles@latest my-app --template nextjs-vinext-eslint
cd my-app
pnpm install
```

The current `vite.config.ts` imports `defineConfig` from `vite-plus`, but the template does not declare that dependency. Before running the project independently, change this import to the already declared `vite` package:

```ts
import { defineConfig } from 'vite'
```

Then start the development server:

```bash
pnpm dev
```

The development command is `vinext dev --port 9980`.

## Common Scripts

```bash
pnpm build
pnpm start
pnpm lint
pnpm lint:fix
```

`build` and `start` run `vinext build` and `vinext start`; build before starting the production server. ESLint handles code checks, and the `prepare` hook installs Lefthook when installing dependencies.

## Key Files

- `src/app`: App Router pages, layouts, and the Ant Design provider.
- `vite.config.ts`: Vinext, UnoCSS, and the SVG component plugin.
- `src/utils/request`: Alova request wrapper.
