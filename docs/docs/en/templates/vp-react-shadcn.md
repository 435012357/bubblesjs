# vp-react-shadcn

Vite+ React template with shadcn-style UI primitives.

## Stack

- React 19.2 and React Router 7.
- Vite+, TypeScript 6, Tailwind CSS 4.
- shadcn, Radix UI, Lucide React, Sonner.
- Zustand 5, Alova, GSAP.
- Geist variable font.

## Create and Run

See [Quick Start](/en/guide/start/quick-start) for environment requirements. The template declares pnpm 11.5.2.

```bash
pnpm create bubbles@latest my-app --template vp-react-shadcn
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

`build` runs `tsc` before `vp build`, and `check` runs `vp check`. The `prepare` hook runs `vp config` when installing dependencies.

## UI and Files

- `components.json`: shadcn component configuration.
- `src/components/ui`: included Button, Sonner, and Spinner primitives.
- `src/styles/shadcn.css`: component theme styles.
- `src/router` and `src/utils/request`: routes and the Alova request wrapper.
