# taro-react-oxc

Taro 4.2 template for React mini-program and H5 projects. Select Taro → `taro-react + oxc` in the CLI.

## Stack

- Taro 4.2, React 18, TypeScript 5, and Webpack 5.
- NutUI React Taro, currently using prerelease packages.
- Tailwind CSS 4, weapp-tailwindcss 5, and Sass.
- Zustand 5, Alova, and `@alova/adapter-taro`.
- Oxlint, Oxfmt, and Stylelint.

## Create and Run

See [Quick Start](/en/guide/start/quick-start) for environment requirements. The current `prepare` hook uses Lefthook without declaring the dependency. Run `pnpm add -D lefthook` to add it and install the project dependencies.

```bash
pnpm create bubbles@latest my-app --template taro-react-oxc
cd my-app
pnpm add -D lefthook
pnpm dev:h5
```

For WeChat development, replace `appid` in `project.config.json` with your AppID, run `pnpm dev:weapp`, and import the project root into WeChat DevTools.

## Common Scripts

```bash
pnpm build:weapp
pnpm build:h5
pnpm lint
pnpm lint:fix
pnpm lint:style
pnpm fmt
pnpm check
```

`check` runs Oxlint, Stylelint, and `oxfmt --check` in order. Use `dev:<platform>` and `build:<platform>`; there are no generic `dev` or `build` scripts.

## Build and Configuration

- `build:weapp` and `build:weapp:upload` explicitly use `--mode development`. Adjust build arguments and `config` for your release environment before publishing.
- Platforms share the `dist` output directory; rebuild after switching platforms.
- Configure the DevTools path, AppID, and private key in `config` before opening WeChat DevTools automatically or uploading.
- Keep dependency build permissions in `pnpm-workspace.yaml` and the mini-ci patch in `patches`.
- RN scripts still require additional platform plugins and runtime dependencies.
