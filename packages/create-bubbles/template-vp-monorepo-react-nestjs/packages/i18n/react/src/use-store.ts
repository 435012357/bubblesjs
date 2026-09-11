import { useSyncExternalStore } from 'react'
import type { I18nState, I18nStore } from '@bubblesjs/i18n-core'

/** 订阅国际化容器，并返回选择器提取的状态。 */
export function useI18nStore<T>(store: I18nStore, selector: (state: I18nState) => T): T
/** 订阅国际化容器，并返回完整状态。 */
export function useI18nStore(store: I18nStore): I18nState
/** 将外部容器订阅接入 React，根据选择器返回状态片段或完整快照。 */
export function useI18nStore<T>(
  store: I18nStore,
  selector?: (state: I18nState) => T,
): T | I18nState {
  if (selector) {
    return useSyncExternalStore(store.subscribe, () => selector(store.getState()))
  }
  return useSyncExternalStore(store.subscribe, store.getState)
}
