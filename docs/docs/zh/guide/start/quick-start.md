# 快速开始

从选择模板到启动开发，用 `create-bubbles` 创建你的第一个项目。

## 环境要求

在开始之前，请确保你的开发环境满足以下要求：

- **Node.js**: `^20.19.0 || >=22.12.0`
- **包管理器**: npm、yarn、pnpm 或 bun

推荐使用 Node.js 24 LTS。Monorepo 模板使用 pnpm workspace；NestJS 模板中的国际化 CLI 需要 Node.js 22.18+。使用 Vite+ 的模板还需要安装 [Vite+ CLI](https://viteplus.dev/guide/)。

## 创建 BubblesJS 项目

使用 `create-bubbles` 脚手架工具来创建一个新项目：

::: code-group

```bash [npm]
npm create bubbles@latest my-project
```

```bash [yarn]
yarn create bubbles my-project
```

```bash [pnpm]
pnpm create bubbles@latest my-project
```

```bash [bun]
bun create bubbles@latest my-project
```

:::

## 选择模板

运行命令后，会出现交互式提示，让你选择模板：

- **Vue**：[vue-vp-eslint](/templates/vue-vite-eslint)，或体验 Vapor 模式的 [vp-vue-eslint-vapor](/templates/vp-vue-eslint-vapor)。
- **React**：[react-rsbuild-biome](/templates/react-rsbuild-biome)、[vp-react](/templates/vp-react)、[vp-react-shadcn](/templates/vp-react-shadcn)。
- **全栈项目**：[vp-monorepo-react-nestjs](/templates/vp-monorepo-react-nestjs)，包含 React / Vue 前端、NestJS 后端、共享代码与国际化包。
- **小程序 / H5**：[taro-vue-eslint](/templates/taro-vue-eslint) 或 [taro-react-oxc](/templates/taro-react-oxc)。
- **Next.js**：[nextjs-vinext-eslint](/templates/nextjs-vinext-eslint)，使用 Vinext。
- **Electron**：[create-eletron-vite](/templates/create-eletron-vite)，转交上游 Electron 脚手架创建。

也可以跳过模板选择，直接指定名称：

```bash
pnpm create bubbles@latest my-project --template vue-vp-eslint
```

详细技术栈及仓库预览模板见 [模板总览](/templates/)。

## 启动开发服务器

以下以 `vue-vp-eslint` 单应用模板为例，进入项目目录、安装依赖并启动开发服务器：

```bash
cd my-project
```

::: code-group

```bash [npm]
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

```bash [yarn]
# 安装依赖
yarn install

# 启动开发服务器
yarn dev
```

```bash [pnpm]
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

```bash [bun]
# 安装依赖
bun install

# 启动开发服务器
bun dev
```

:::

## 项目结构

生成的目录结构取决于所选模板。单应用模板通常包含 `src/`、`public/`、`package.json`，以及 `vite.config.ts` 或 `rsbuild.config.ts` 等构建配置。NestJS monorepo 包含 `apps/web`、`apps/web-vue`、`apps/server`、`packages/shared`、`packages/i18n` 和 `pnpm-workspace.yaml`。

Taro 模板使用 `dev:weapp`（微信小程序）或 `dev:h5`（H5），没有通用的 `dev` 脚本。全栈模板需先配置数据库、Redis 等服务，再选择要启动的前端；Electron 按上游生成项目的脚本启动。具体初始化步骤请查看对应模板页。

## 下一步

- 查看 [工具包](/packages/)，在各包页面阅读安装、示例与 API。
- 查看 [模板](/templates/)，了解技术栈与各模板的开发、构建命令。
