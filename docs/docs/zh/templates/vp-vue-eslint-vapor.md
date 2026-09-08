# vp-vue-eslint-vapor

基于 Vite+ 的 Vue Vapor 应用模板，用于体验 Vue 3.6 的 Vapor 编译模式。

## 技术栈

- Vue 3.6.0-rc.2、Vapor 模式、Vue Router 5、Pinia 4。
- Vite+ 0.2.6、TypeScript 6、Vue TSC。
- Antdv Next、ECharts、UnoCSS、Sass、SVG 图标插件。
- Alova 与 Axios 适配器。
- ESLint、Oxlint、Vite+ staged checks。

## 创建与启动

环境要求见 [快速开始](/guide/start/quick-start)。CLI 中对应 Vue → `vp + eslint + vapor`。

```bash
pnpm create bubbles@latest my-app --template vp-vue-eslint-vapor
cd my-app
pnpm install
pnpm dev
```

## 常用脚本

```bash
pnpm build
pnpm preview
pnpm lint
pnpm lint:fix
```

`build` 先运行 `vue-tsc -b` 再构建。`lint` 依次运行 Oxlint 和 ESLint；`lint:fix` 中的自动修复由 ESLint 执行。安装依赖时，`prepare` 会执行 `vp config`。

## Vapor 入口

`vite.config.ts` 通过 `@vitejs/plugin-vue` 的 `features.vapor` 开启 Vapor 编译；`src/main.ts` 使用 `createVaporApp` 创建应用，并注册 `vaporInteropPlugin` 以便与现有组件互操作。

当前使用 Vue 3.6 RC，适合验证 Vapor 兼容性；需要稳定版 Vue 时可选择 [vue-vp-eslint](/templates/vue-vite-eslint)。
