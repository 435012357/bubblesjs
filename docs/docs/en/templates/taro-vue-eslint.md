# taro-vue-eslint

Taro template for Vue 3 mini-program and H5 projects.

## Stack

- Taro 4.2 and Vue 3.5.
- NutUI Taro and NutUI auto import resolver.
- Alova with `@alova/adapter-taro`.
- Pinia 3 and persisted state.
- TypeScript 6, ESLint, Sass, Webpack 5, UnoCSS 0.58, and `unocss-preset-weapp`.

## Create and Run

See [Quick Start](/en/guide/start/quick-start) for environment requirements.

```bash
pnpm create bubbles@latest my-app --template taro-vue-eslint
cd my-app
pnpm install
pnpm dev:h5
```

The H5 development server uses port `9970`. For WeChat development, replace `appid` in `project.config.json` with your AppID before running `pnpm dev:weapp`. Import the project root into WeChat DevTools; WeChat output is written to `dist/weapp`.

## Common Scripts

```bash
pnpm build:weapp
pnpm build:h5
pnpm build:h5:prod
pnpm lint
pnpm lint:fix
```

Use `dev:<platform>` and `build:<platform>`; there are no generic `dev` or `build` scripts. `build:weapp` includes `--open`. `build:h5:prod` explicitly uses production mode, and H5 output is written to `dist/h5`.

## UnoCSS

The template enables UnoCSS watch mode during development or `--watch` builds. Its `unocss.config.ts` scans `src/**/*.{vue,js,ts,jsx,tsx,html}` and uses `unocss-preset-weapp` with `taroWebpack: 'webpack5'`.

## Configuration Notes

- Adjust API settings in `.env` and environment files for your backend.
- Keep dependency build permissions in `pnpm-workspace.yaml` and the mini-ci patch in `patches`.
- Check the DevTools path, AppID, and private-key settings in `config` before opening DevTools automatically or uploading.
- Scripts exist for multiple mini-program platforms; RN scripts still require additional platform plugins and runtime dependencies.
