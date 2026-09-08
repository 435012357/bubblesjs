# vp-react

React starter powered by Vite+.

## Stack

- React 19.2 and React Router 7.
- Vite+, Vite 8, TypeScript 6.
- Tailwind CSS 4 and Ant Design 6.
- Alova with the Axios adapter.
- Auto import support.

## Create and Run

See [Quick Start](/en/guide/start/quick-start) for environment requirements. The template declares pnpm 11.5.2.

```bash
pnpm create bubbles@latest my-app --template vp-react
cd my-app
pnpm install
pnpm dev
```

## Common Scripts

```bash
pnpm build
pnpm preview
pnpm check
```

## Notes

`build` runs `tsc` before `vp build`, and `check` runs `vp check`. The `prepare` hook runs `vp config` when installing dependencies. The template maps Vite and Vitest to Vite+ packages through `pnpm.overrides`.

Routes live in `src/router`, the request wrapper lives in `src/utils/request`, and Tailwind CSS is configured in `vite.config.ts` and `src/styles/index.css`.
