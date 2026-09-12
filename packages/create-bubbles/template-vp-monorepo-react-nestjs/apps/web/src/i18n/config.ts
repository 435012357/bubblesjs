export const APP_LOCALES = ['zh_CN', 'en_US'] as const

export type AppLocale = (typeof APP_LOCALES)[number]

export const DEFAULT_LOCALE: AppLocale = 'zh_CN'
export const I18N_STORAGE_KEY = 'wanwu-locale'

/** 判断外部输入是否为前端支持的语言标识。 */
export function isAppLocale(locale: unknown): locale is AppLocale {
  return APP_LOCALES.includes(locale as AppLocale)
}

/** 根据浏览器首选语言选择应用初始语言，未匹配时回退到简体中文。 */
export function resolveBrowserLocale(language = navigator.language): AppLocale {
  return language.toLowerCase().startsWith('en') ? 'en_US' : DEFAULT_LOCALE
}
