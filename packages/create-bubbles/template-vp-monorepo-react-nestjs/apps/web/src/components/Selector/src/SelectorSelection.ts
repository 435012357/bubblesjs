import type { Key } from 'react'
import type { SelectorRowKey, SelectorShowOptions } from './SelectorTypes'

/** 选择器内部的会话快照。仅保留已选对象，不累积缓存所有访问过的页面。 */
export class SelectorSelection<T extends object> {
  readonly value: Key[]
  readonly multiple: boolean
  readonly rowKey: SelectorRowKey<T>
  private readonly records: Map<Key, T>

  constructor(options: SelectorShowOptions<T> & { multiple: boolean; rowKey: SelectorRowKey<T> }) {
    this.value = [...new Set(options.value ?? [])]
    this.multiple = options.multiple
    this.rowKey = options.rowKey
    if (!this.multiple && this.value.length > 1) {
      throw new Error('Selector 单选模式的 value 最多包含一个 key')
    }
    const selected = new Set(this.value)
    this.records = new Map()
    for (const row of options.selectedRows ?? []) {
      const key = this.keyOf(row)
      if (selected.has(key)) this.records.set(key, row)
    }
  }

  keyOf(row: T): Key {
    const key = typeof this.rowKey === 'function' ? this.rowKey(row) : row[this.rowKey]
    if (typeof key !== 'string' && typeof key !== 'number' && typeof key !== 'bigint') {
      throw new Error('Selector rowKey 必须返回稳定的字符串或数字 key')
    }
    return key
  }

  get(key: Key) {
    return this.records.get(key)
  }

  get missingKeys() {
    return this.value.filter((key) => !this.records.has(key))
  }

  get rows(): T[] {
    return this.value.map((key) => {
      const row = this.records.get(key)
      if (!row) throw new Error('部分已选数据尚未加载，请重新选择后重试')
      return row
    })
  }

  select(options: { value: readonly Key[]; rows?: readonly T[] }) {
    return new SelectorSelection<T>({
      rowKey: this.rowKey,
      multiple: this.multiple,
      value: options.value,
      // Ant Table 在仅回显 key 时，selectedRows 可能包含尚未缓存的空项。
      selectedRows: [...this.records.values(), ...(options.rows ?? []).filter(Boolean)],
    })
  }

  remember(rows: readonly T[]) {
    return this.select({ value: this.value, rows })
  }

  async resolve(requestByKeys?: (keys: Key[]) => Promise<T[]>) {
    const missing = this.missingKeys
    if (!missing.length) return this
    if (!requestByKeys) throw new Error('部分已选数据尚未加载，请重新选择后重试')
    const resolved = this.remember(await requestByKeys(missing))
    if (resolved.missingKeys.length) {
      throw new Error('部分已选数据已不可用，请取消对应选择后重试')
    }
    return resolved
  }
}
