# vp-react-shadcn

集成 shadcn 风格 UI 能力的 Vite+ React 模板。

## 技术栈

- React 19.2 与 React Router 7。
- Vite+、TypeScript 6、Tailwind CSS 4。
- shadcn、Radix UI、Lucide React、Sonner。
- Zustand 5、Alova、GSAP。
- Geist 可变字体。

## 创建与启动

环境要求见 [快速开始](/guide/start/quick-start)。模板声明使用 pnpm 11.5.2。

```bash
pnpm create bubbles@latest my-app --template vp-react-shadcn
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

`build` 先执行 `tsc` 再运行 `vp build`，`check` 执行 `vp check`；安装依赖时，`prepare` 会执行 `vp config`。

## UI 与目录

- `components.json`：shadcn 组件配置。
- `src/components/ui`：已包含 Button、Sonner 和 Spinner 基础组件。
- `src/styles/shadcn.css`：组件主题样式。
- `src/router`、`src/utils/request`：路由与 Alova 请求封装。
