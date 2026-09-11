import type { ParamsType, ProTableProps } from '@ant-design/pro-components'
import type { ModalProps } from 'antd'

export type SelectorRowKey<T> = (keyof T & string) | ((record: T) => Key)

export interface SelectorShowOptions<T> {
  /** 单选也传数组；省略表示从空选择开始。 */
  value?: readonly Key[]
  /** 为已有 key 提供对象，避免依赖当前页数据。组件不会修改这些对象。 */
  selectedRows?: readonly T[]
}

export interface SelectorRef<T> {
  show: (options?: SelectorShowOptions<T>) => void
  hide: () => void
}

type ManagedTableProps =
  | 'ref'
  | 'title'
  | 'rowKey'
  | 'rowSelection'
  | 'request'
  | 'dataSource'
  | 'defaultData'
  | 'editable'
  | 'onChange'
  | 'tableAlertRender'
  | 'tableAlertOptionRender'

export type SelectorProps<
  T extends object,
  Params extends ParamsType = ParamsType,
  ValueType = 'text',
> = Omit<ProTableProps<T, Params, ValueType>, ManagedTableProps> & {
  ref: Ref<SelectorRef<T>>
  title: ReactNode
  rowKey: SelectorRowKey<T>
  request: NonNullable<ProTableProps<T, Params, ValueType>['request']>
  multiple?: boolean
  /** 仅点击确定时触发；keys 和 rows 长度、顺序始终一致。 */
  onChange: (keys: Key[], rows: T[]) => void | Promise<void>
  /** 确定时补查尚未取得对象的已选 key；返回顺序不限。 */
  requestByKeys?: (keys: Key[]) => Promise<T[]>
  labelRender?: (record: T) => ReactNode
  /** 保留 ProTable 的分页、排序、筛选回调，避免与选择结果 onChange 重名。 */
  onTableChange?: ProTableProps<T, Params, ValueType>['onChange']
  getCheckboxProps?: Exclude<
    ProTableProps<T, Params, ValueType>['rowSelection'],
    false | undefined
  >['getCheckboxProps']
  modalProps?: Pick<
    ModalProps,
    'width' | 'centered' | 'okText' | 'cancelText' | 'className' | 'styles' | 'zIndex'
  >
}
