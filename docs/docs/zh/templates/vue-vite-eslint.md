# vue-vp-eslint

基于 Vite+ 的 Vue 3 单页应用模板，CLI 中对应 Vue → `vp + eslint`。

## 技术栈

- Vue 3.5、Vue Router 5、Pinia 4、状态持久化。
- Vite+ 0.2.6、TypeScript 6、Vue TSC。
- Antdv Next、ECharts。
- UnoCSS、Sass、SVG 图标插件。
- Alova 与 Axios 适配器。
- ESLint、Oxlint、Lefthook 与 Commitlint。

## 创建与启动

环境要求见 [快速开始](/guide/start/quick-start)。

```bash
pnpm create bubbles@latest my-app --template vue-vp-eslint
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

`build` 先运行 `vue-tsc -b` 再构建；`lint` 依次运行 Oxlint 和 ESLint，`lint:fix` 中的自动修复由 ESLint 执行。

## 主要文件

- `vite.config.ts`：端口、API 代理、组件自动导入和 UnoCSS。
- `src/router`、`src/store`：路由守卫和 Pinia 状态。
- `src/utils/request`：Alova 请求封装。
