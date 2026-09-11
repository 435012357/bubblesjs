import DraftIcon from '@/assets/svg/draft.svg?react'
import { InfoCircleOutlined } from '@ant-design/icons'
import type { ParamsType } from '@ant-design/pro-components'
import { Badge } from 'antd'
import classNames from 'classnames'
import FullHeightProTable, {
  type FullHeightProTableProps,
} from '../FullHeightProTable/FullHeightProTable'
import SvgIcon from '../Icon/svg-icon/SvgIcon'
import styles from './DraftProTable.module.css'

export type DraftTableView = 'list' | 'draft'

export type DraftProTableProps<
  DataType extends object,
  Params extends ParamsType = ParamsType,
  ValueType = 'text',
> = FullHeightProTableProps<DataType, Params, ValueType> & {
  view: DraftTableView
  onViewChange: (view: DraftTableView) => void
  draftCount?: number
  draftHint?: ReactNode
}

/** 只封装草稿箱入口和布局，数据、请求、表单和提交规则由业务页面提供。 */
export default function DraftProTable<
  DataType extends object,
  Params extends ParamsType = ParamsType,
  ValueType = 'text',
>({
  view,
  onViewChange,
  draftCount,
  draftHint = '草稿提交后进入列表',
  toolbar,
  toolBarRender,
  optionsRender,
  tableViewRender,
  ...props
}: DraftProTableProps<DataType, Params, ValueType>) {
  const isDraft = view === 'draft'
  const { actions, settings, className: toolbarClassName, ...toolbarProps } = toolbar ?? {}
  const draftToggle = (
    <Badge
      key="draft-toggle"
      className={styles.draftBadge}
      count={draftCount}
      size="small"
      overflowCount={99}
      offset={[-4, 2]}
      title=""
    >
      <button
        type="button"
        className={styles.draftToggle}
        aria-label={draftCount === undefined ? '草稿箱' : `草稿箱，${draftCount} 条草稿`}
        aria-pressed={isDraft}
        onClick={() => onViewChange(isDraft ? 'list' : 'draft')}
      >
        <SvgIcon icon={DraftIcon} />
      </button>
    </Badge>
  )

  return (
    <FullHeightProTable<DataType, Params, ValueType>
      {...props}
      toolbar={{
        ...toolbarProps,
        className: classNames(styles.toolbar, toolbarClassName),
        ...(settings ? { settings: [draftToggle, ...settings] } : {}),
      }}
      // ProTable 的工具栏 memo 未比较 optionsRender，保留渲染回调以同步草稿选中状态。
      toolBarRender={(action, config) =>
        actions ?? (typeof toolBarRender === 'function' ? toolBarRender(action, config) : [])
      }
      optionsRender={(toolbarOptions, defaultOptions) => [
        draftToggle,
        ...(optionsRender?.(toolbarOptions, defaultOptions) ?? defaultOptions),
      ]}
      tableViewRender={(tableProps, defaultDom) => (
        <>
          {isDraft && draftHint && (
            <div className={styles.hint}>
              <InfoCircleOutlined />
              {draftHint}
            </div>
          )}
          {tableViewRender
            ? tableViewRender(tableProps, defaultDom)
            : typeof defaultDom === 'function'
              ? defaultDom()
              : defaultDom}
        </>
      )}
    />
  )
}
