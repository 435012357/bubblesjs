# Bubbles 文档站

文档站使用 VitePress 2.0.0-alpha.20 和 Vue 3。VitePress 2.x 当前最新版本仍是预发布版。自定义泡泡主题保留 Rspress 风格的导航、渐变首页、命令切换和文档布局，支持中英文、暗色模式及本地全文搜索。

## 开发

需要 Node.js 20.19+（20.x）或 22.12+，推荐使用 22/24 LTS。此要求来自 VitePress 使用的 Vite 8。在仓库根目录执行：

```bash
vp install
vp run docs
```

默认地址为 `http://localhost:5173/bubblesjs/`。也可以在 `docs` 目录运行 `vp run docs`。

## 构建与预览

在仓库根目录执行：

```bash
vp run docs:build
vp run docs:preview
```

构建产物输出到 `docs/doc_build/`，由 GitHub Actions 发布到 GitHub Pages。站点部署前缀为 `/bubblesjs/`，部署到其他路径时需同步修改 `.vitepress/config.ts` 中的 `base` 和 favicon 地址。

在 `docs` 目录可以使用 `vp run docs:build`、`vp run preview`；根目录的 `vp run docs-serve` 是预览的兼容别名。

## 目录

```text
docs/
├── .vitepress/
│   ├── config.ts        # 站点、路由、语言、导航、侧栏和搜索配置
│   └── theme/           # Vue 主题、泡泡首页与全局样式
├── docs/
│   ├── zh/              # 中文 Markdown，路由映射到站点根路径
│   ├── en/              # 英文 Markdown，路由保留 /en/ 前缀
│   └── public/          # 原样复制到构建目录的图标等资源
├── doc_build/           # 生产构建产物，不提交
└── package.json         # 文档站依赖和启动脚本
```

正文使用标准 Markdown 和 Vue 组件，不再使用 MDX/React。添加页面时，在 `.vitepress/config.ts` 更新相应导航或侧栏；图片等静态资源放在 `docs/public/`。站内链接不手写 `/bubblesjs/` 前缀，VitePress 会根据 `base` 处理。中文链接从 `/guide/`、`/packages/` 等根路径开始，英文链接使用 `/en/guide/`、`/en/packages/` 等路径。

首页与全局品牌样式位于 `.vitepress/theme/style.css`，文档内页样式位于 `.vitepress/theme/docs.css`，通过 `.bubbles-docs` 限定作用范围。侧栏统一提供指南、工具包和项目模板，进入模板页面时默认展开模板分组。每个工具包页面集中维护安装、示例和 API，旧 `/api/` 与 `/en/api/` 地址兼容跳转到相应语言的工具包总览。桌面内页采用白底三栏布局；窄屏保留侧栏抽屉和本页目录菜单。

模板文档以 `packages/create-bubbles/src/index.ts` 中的 `FRAMEWORKS` 和各模板实际文件为准；仅有模板目录、尚未注册到 CLI 的项目标为仓库预览。
