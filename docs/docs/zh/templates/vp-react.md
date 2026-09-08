# vp-react

基于 Vite+ 的 React 起步模板。

## 技术栈

- React 19.2 与 React Router 7。
- Vite+、Vite 8、TypeScript 6。
- Tailwind CSS 4 与 Ant Design 6。
- Alova 与 Axios 适配器。
- 自动导入支持。

## 创建与启动

环境要求见 [快速开始](/guide/start/quick-start)。模板声明使用 pnpm 11.5.2。

```bash
pnpm create bubbles@latest my-app --template vp-react
cd my-app
pnpm install
pnpm dev
```

## 常用脚本

```bash
pnpm build
pnpm preview
pnpm check
```

## 注意

`build` 先执行 `tsc` 再运行 `vp build`，`check` 执行 `vp check`；安装依赖时，`prepare` 会执行 `vp config`。模板通过 `pnpm.overrides` 将 Vite / Vitest 指向 Vite+ 包。

路由位于 `src/router`，请求封装位于 `src/utils/request`，Tailwind CSS 在 `vite.config.ts` 和 `src/styles/index.css` 中配置。
