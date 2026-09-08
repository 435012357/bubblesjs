# nextjs-vinext-eslint

基于 Vinext 的 Next.js / React 模板。

## 技术栈

- Next.js 16.2 与 React 19.2。
- Vinext 0.0.55、Vite 8、TypeScript 6。
- Ant Design 6、CSS-in-JS 支持、GSAP。
- UnoCSS、SVGR、Alova 请求封装。
- ESLint 10，集成 Antfu、Next、React Hooks、React Refresh、UnoCSS 插件。

## 创建与启动

环境要求见 [快速开始](/guide/start/quick-start)。模板的 Volta 配置指定 Node.js `24.14.0`。

```bash
pnpm create bubbles@latest my-app --template nextjs-vinext-eslint
cd my-app
pnpm install
```

当前模板的 `vite.config.ts` 从 `vite-plus` 导入 `defineConfig`，但依赖清单未声明 `vite-plus`。独立使用前，请将这条导入改为模板已声明的 `vite`：

```ts
import { defineConfig } from 'vite'
```

然后启动开发服务：

```bash
pnpm dev
```

开发命令为 `vinext dev --port 9980`。

## 常用脚本

```bash
pnpm build
pnpm start
pnpm lint
pnpm lint:fix
```

`build` 和 `start` 分别执行 `vinext build`、`vinext start`；先完成构建再启动生产服务。代码检查使用 ESLint，安装依赖时通过 `prepare` 安装 Lefthook。

## 主要文件

- `src/app`：App Router 页面、布局和 Ant Design provider。
- `vite.config.ts`：Vinext、UnoCSS 与 SVG 组件插件。
- `src/utils/request`：Alova 请求封装。
