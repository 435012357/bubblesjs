import { createJsonStorage, i18n } from '@bubblesjs/i18n-core'
import type { MessageValues, Messages } from '@bubblesjs/i18n-core'
import {
  DEFAULT_LOCALE,
  I18N_STORAGE_KEY,
  isAppLocale,
  resolveBrowserLocale,
  type AppLocale,
} from './config'

const storage = createJsonStorage(localStorage)
const persistedLocale = storage.getItem<string>(I18N_STORAGE_KEY)

if (persistedLocale && !isAppLocale(persistedLocale)) storage.removeItem(I18N_STORAGE_KEY)

const messageLoaders: Record<AppLocale, () => Promise<Messages>> = {
  en_US: async () => (await import('@/locales/en_US.json')).default,
  zh_CN: async () => (await import('@/locales/zh_CN.json')).default,
}

/** 加载指定语言的前端词条，未知语言回退到默认语言。 */
async function loadMessages(locale?: string): Promise<Messages> {
  return messageLoaders[isAppLocale(locale) ? locale : DEFAULT_LOCALE]()
}

export const appI18nStore = await i18n.init({
  locale: isAppLocale(persistedLocale) ? persistedLocale : resolveBrowserLocale(),
  loaderMessage: loadMessages,
  storage,
  storageKey: I18N_STORAGE_KEY,
})

/** 为 React 组件之外的前端逻辑读取当前语言词条。 */
export function tr(key: string, values?: MessageValues): string {
  return appI18nStore.getState().tr(key, values)
}
