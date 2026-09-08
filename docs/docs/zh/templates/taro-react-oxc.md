# taro-react-oxc

基于 Taro 4.2 的 React 小程序与 H5 模板，CLI 中对应 Taro → `taro-react + oxc`。

## 技术栈

- Taro 4.2、React 18、TypeScript 5、Webpack 5。
- NutUI React Taro（当前为预发布版本）。
- Tailwind CSS 4、weapp-tailwindcss 5、Sass。
- Zustand 5、Alova 与 `@alova/adapter-taro`。
- Oxlint、Oxfmt、Stylelint。

## 创建与启动

环境要求见 [快速开始](/guide/start/quick-start)。当前模板的 `prepare` 使用 Lefthook，但尚未声明该依赖；先用 `pnpm add -D lefthook` 补齐并安装项目依赖。

```bash
pnpm create bubbles@latest my-app --template taro-react-oxc
cd my-app
pnpm add -D lefthook
pnpm dev:h5
```

开发微信小程序前，将 `project.config.json` 中的 `appid` 替换为自己的 AppID，再执行 `pnpm dev:weapp`，并在微信开发者工具中导入项目根目录。

## 常用脚本

```bash
pnpm build:weapp
pnpm build:h5
pnpm lint
pnpm lint:fix
pnpm lint:style
pnpm fmt
pnpm check
```

`check` 依次运行 Oxlint、Stylelint 和 `oxfmt --check`。模板使用 `dev:<平台>` / `build:<平台>`，没有通用 `dev` 或 `build` 脚本。

## 构建与配置

- `build:weapp` 与 `build:weapp:upload` 显式带 `--mode development`，不能直接作为生产发布命令。发布前按环境调整构建参数与 `config`。
- 各平台共用 `dist` 输出目录，切换平台后需重新构建。
- 自动打开微信开发者工具或上传前，配置 `config` 中的工具路径、AppID 和私钥。
- 保留 `pnpm-workspace.yaml` 中的依赖构建许可及 `patches` 中的 mini-ci 补丁。
- RN 脚本仍需额外配置平台插件与运行依赖。
