# Vue + Rolldown + Oxc 模板（实验性）

该模板集成了 Rolldown 与 Oxc，追求更快的构建与更强的静态分析能力。

## 技术栈

- **Rolldown**：Vite 的 Rust 实现，替代标准 Vite
- **Oxc**：基于 Rust 的高性能代码检查工具
- **Vue 3 + TypeScript**：现代化 Vue 开发体验
- **Element Plus + UnoCSS**：UI 组件库与原子化 CSS

## 重要说明

该模板使用 `vite.config.ts` 配置文件，但实际使用的是 Rolldown 构建工具（通过 `"vite": "npm:rolldown-vite@latest"` 替换）。

## 启动

```bash
pnpm install
pnpm dev
```

## 注意

此模板为实验性质，生态兼容性与稳定性可能略逊于 Rsbuild/标准 Vite，请按需选择。
