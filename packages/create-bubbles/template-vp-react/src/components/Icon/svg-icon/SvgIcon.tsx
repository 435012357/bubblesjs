import type { ComponentType, SVGProps } from 'react'

export type SvgIconProps = Omit<SVGProps<SVGSVGElement>, 'width' | 'height'> & {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  size?: number | string
}

/** SVG 源文件使用 currentColor；不传 size、color 时继承父级文字样式。 */
export default function SvgIcon({ icon: Icon, size, color, style, ...props }: SvgIconProps) {
  return (
    <Icon
      aria-hidden={props['aria-label'] || props['aria-labelledby'] ? undefined : true}
      focusable="false"
      {...props}
      width="1em"
      height="1em"
      style={{
        display: 'inline-block',
        verticalAlign: '-0.125em',
        flexShrink: 0,
        fontSize: size,
        color,
        ...style,
      }}
    />
  )
}
