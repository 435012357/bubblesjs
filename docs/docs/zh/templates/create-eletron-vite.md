# Electron

通过 electron-vite 官方脚手架创建桌面应用。CLI 中对应 Others → `Electron ↗`，模板参数沿用当前源码中的拼写 `create-eletron-vite`。

## 创建项目

环境要求见 [快速开始](/guide/start/quick-start)，并准备好 pnpm。

```bash
pnpm create bubbles@latest desktop-app --template create-eletron-vite
```

该选项会执行以下上游命令，再由 electron-vite 交互选择应用模板：

```bash
pnpm create electron-vite@latest desktop-app
```

## 安装与启动

创建完成后进入项目，安装依赖并查看生成的脚本：

```bash
cd desktop-app
pnpm install
pnpm run
```

按上游提示运行开发命令；如果生成的项目包含 `dev` 脚本，使用 `pnpm dev`。构建、预览和平台打包命令以生成目录的 `package.json` 为准。

## 模板来源

Electron 选项调用外部脚手架，不对应仓库内的 `template-*` 目录。框架选项、依赖版本和打包配置取决于当时下载的 electron-vite 模板。
