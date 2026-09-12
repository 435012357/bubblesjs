import { useI18n } from '@bubblesjs/i18n-react'
import classNames from 'classnames'
import styles from './Brand.module.css'

export type BrandVariant = 'auth' | 'basic' | 'workspace'

export interface BrandProps {
  ariaLabel?: string
  className?: string
  to?: string
  variant?: BrandVariant
}

export interface BrandMarkProps {
  className?: string
}

const BRAND_VARIANTS = {
  auth: { className: styles.auth!, showEnglishName: false },
  basic: { className: styles.basic!, showEnglishName: false },
  workspace: { className: styles.workspace!, showEnglishName: true },
} satisfies Record<BrandVariant, { className: string; showEnglishName: boolean }>

/** 渲染万物品牌的图形标记，供品牌字标和第三方布局组件复用。 */
export function BrandMark({ className }: BrandMarkProps) {
  return <span className={classNames(styles.mark, className)} aria-hidden="true" />
}

/** 按使用场景渲染统一的万物品牌标记与字标，可选提供站内跳转。 */
export default function Brand({ ariaLabel, className, to, variant = 'workspace' }: BrandProps) {
  const { tr } = useI18n()
  const variantConfig = BRAND_VARIANTS[variant]
  const content = (
    <>
      <BrandMark />
      <span className={styles.wordmark}>
        {tr('万物')}
        {variantConfig.showEnglishName && <small className={styles.englishName}>WANWU</small>}
      </span>
    </>
  )
  const brandClassName = classNames(
    styles.brand,
    variantConfig.className,
    to && styles.link,
    className,
  )

  return to ? (
    <Link className={brandClassName} to={to} aria-label={ariaLabel}>
      {content}
    </Link>
  ) : (
    <span className={brandClassName}>{content}</span>
  )
}
