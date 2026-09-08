# taro-vue-eslint

适用于 Vue 3 小程序和 H5 项目的 Taro 模板。

## 技术栈

- Taro 4.2 与 Vue 3.5。
- NutUI Taro 与 NutUI 自动导入 resolver。
- Alova 与 `@alova/adapter-taro`。
- Pinia 3 与状态持久化。
- TypeScript 6、ESLint、Sass、Webpack 5、UnoCSS 0.58 与 `unocss-preset-weapp`。

## 创建与启动

环境要求见 [快速开始](/guide/start/quick-start)。

```bash
pnpm create bubbles@latest my-app --template taro-vue-eslint
cd my-app
pnpm install
pnpm dev:h5
```

H5 开发服务端口为 `9970`。开发微信小程序前，将 `project.config.json` 中的 `appid` 替换为自己的 AppID，再执行 `pnpm dev:weapp`；在微信开发者工具中导入项目根目录，微信产物位于 `dist/weapp`。

## 常用脚本

```bash
pnpm build:weapp
pnpm build:h5
pnpm build:h5:prod
pnpm lint
pnpm lint:fix
```

模板使用 `dev:<平台>` 和 `build:<平台>`，没有通用 `dev` 或 `build` 脚本。`build:weapp` 带 `--open`；`build:h5:prod` 显式使用 production mode，H5 产物位于 `dist/h5`。

## UnoCSS

模板现在会在开发环境或 `--watch` 构建中启用 UnoCSS watch。`unocss.config.ts` 会扫描 `src/**/*.{vue,js,ts,jsx,tsx,html}`，并使用带有 `taroWebpack: 'webpack5'` 的 `unocss-preset-weapp`。

## 配置要点

- 按后端地址调整 `.env` 和环境文件中的 API 配置。
- 保留 `pnpm-workspace.yaml` 中的依赖构建许可及 `patches` 中的 mini-ci 补丁。
- 自动打开开发者工具或上传前，检查 `config` 中的工具路径、AppID 和私钥配置。
- 已提供多个小程序平台脚本；RN 脚本仍需额外配置平台插件与运行依赖。
