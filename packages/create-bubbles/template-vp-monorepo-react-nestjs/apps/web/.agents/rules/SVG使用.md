# SVG 使用

- 图标通过 `*.svg?react` 导入，使用 `@/components/Icon/svg-icon/SvgIcon` 渲染；用 `size`、`color` 控制大小和颜色，默认继承父级。
- 公共图标放 `src/assets/svg/`，页面专用图标放所属页面的 `assets/svg/`。
- 保留 `viewBox`；单色图标用 `currentColor`，保留 `none`、多色和渐变。
- 图片或背景直接导入 `*.svg` 获取 URL。

参数、无障碍设置及示例见 [SvgIcon 使用说明](../../src/components/Icon/svg-icon/README.md)。
