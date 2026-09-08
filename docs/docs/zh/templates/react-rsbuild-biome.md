# react-rsbuild-biome

基于 Rsbuild 和 Biome 的 React 应用模板。

## 技术栈

- React 19.2、React Router 7、Zustand 5。
- Rsbuild 2、TypeScript 6、Biome 2。
- Ant Design 6、Ant Design Icons、Ahooks。
- UnoCSS、Sass、SVGR。
- Alova 与 Axios 适配器。

## 创建与启动

环境要求见 [快速开始](/guide/start/quick-start)。

```bash
pnpm create bubbles@latest my-app --template react-rsbuild-biome
cd my-app
pnpm install
pnpm dev
```

## 常用脚本

```bash
pnpm dev:prod
pnpm build
pnpm preview
pnpm check
pnpm format
```

`dev:prod` 使用生产环境变量启动开发服务器。`check` 实际执行 `biome check --write`，会修改文件；`format` 使用 Prettier。`build` 执行 Rsbuild 构建，脚本没有单独运行 TypeScript 类型检查。

## 重要文件

- `rsbuild.config.ts`：构建配置。
- `src/router`：路由配置。
- `src/layout`：应用布局。
