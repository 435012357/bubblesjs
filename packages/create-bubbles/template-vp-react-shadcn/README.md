# Vite+ React shadcn 模板

基于 React 19、React Router 8、TypeScript 7、Tailwind CSS 4 和 Vite+ 0.3。
shadcn/ui 使用 Base UI 的 `base-nova` 风格，底层依赖为 `@base-ui/react`。

## 启动与验证

先安装全局 Vite+ CLI，再执行：

```bash
vp install
vp dev
vp check
vp run build
```

## UI 组件

```bash
pnpm exec shadcn info
pnpm exec shadcn add dialog
```

组件源码位于 `src/components/ui`，`components.json` 会让后续新增组件继续使用 Base UI。
shadcn 仍支持 Radix UI；本模板已从 Radix UI 迁移到 Base UI。

- Button 和触发器组合使用 Base UI 的 `render` API，不再使用 `asChild`。
- 链接使用 `<a>` 或 React Router 的 `<Link>`，样式通过 `buttonVariants()` 生成。
- 消息提示使用 `@/components/ui/toast`，应用入口已挂载 `<Toaster />`。

```tsx
import { toast } from '@/components/ui/toast'

toast.add({ type: 'success', description: '操作成功' })
toast.add({ type: 'error', description: '操作失败' })
```

依赖覆盖配置集中在 `pnpm-workspace.yaml`，将 `vite` 固定到 Vite+ 对应版本。
播放器使用 `@videojs/react@10.0.0-beta.32`，仍处于 beta 阶段，因此固定精确版本。

参考：[shadcn Base UI Button](https://ui.shadcn.com/docs/components/base/button)、[Toast](https://ui.shadcn.com/docs/components/base/toast)。
