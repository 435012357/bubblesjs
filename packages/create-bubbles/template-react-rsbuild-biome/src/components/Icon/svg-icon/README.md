# SvgIcon

使用 `@rsbuild/plugin-svgr` 将本地 SVG 导入为 React 组件，再由 `SvgIcon` 统一控制大小与颜色。

```tsx
import DraftIcon from '@/assets/svg/draft.svg?react'
import SvgIcon from '@/components/Icon/svg-icon/SvgIcon'
;<SvgIcon icon={DraftIcon} size={24} color="#1677ff" />
```

| 参数                 | 说明                                                              |
| -------------------- | ----------------------------------------------------------------- |
| `icon`               | 通过 `?react` 导入的 SVG 组件，必填                               |
| `size`               | 字号，数字按 px 处理，也支持 `1.5rem` 等 CSS 长度；不传时继承父级 |
| `color`              | 图标颜色；不传时继承父级                                          |
| `className`、`style` | 原生 SVG 样式；`style` 中的同名设置优先                           |

SVG 的宽高统一为 `1em`，因此 `font-size` 决定图标大小。`ref`、事件和其他 SVG 属性继续透传。默认作为装饰图标隐藏于辅助技术；需要独立表达含义时传 `role="img"` 和 `aria-label`。

```tsx
<span style={{ fontSize: 20, color: '#1677ff' }}>
  <SvgIcon icon={DraftIcon} />
  草稿
</span>

<SvgIcon icon={DraftIcon} size={24} role="img" aria-label="草稿" />
```

源文件规范：

- 保留 `viewBox`，保证缩放正确。
- 单色填充图标使用 `fill="currentColor"`；线条图标使用 `stroke="currentColor"`。
- 保留 `fill="none"`、`stroke="none"`，避免填实空心图形。
- 内部元素若写死颜色，也需要在源文件中改成 `currentColor` 才能跟随文字颜色。
- SVGR 与组件保留多色和渐变，不会强制覆盖所有颜色。

现有 `draft.svg` 已遵循上述规范。直接导入 `draft.svg` 仍然得到资源 URL，只有 `draft.svg?react` 会转换为 React 组件。
