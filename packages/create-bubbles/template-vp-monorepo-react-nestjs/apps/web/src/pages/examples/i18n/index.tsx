import { createJsonStorage, i18n } from '@bubblesjs/i18n-core'
import I18nProvider, { useI18n } from '@bubblesjs/i18n-react'
import { PageContainer, ProCard } from '@ant-design/pro-components'
import { Button } from 'antd'
import styles from './index.module.css'

const leftStore = await i18n.init({
  locale: 'zh_CN',
  loaderMessage: async (locale?: string) => (await import(`@/locales/${locale}.json`))?.default,
  storageKey: 'i18n-home-left',
  storage: createJsonStorage(localStorage),
})

const rightStore = await i18n.init({
  locale: 'en_US',
  loaderMessage: async (locale?: string) => (await import(`@/locales/${locale}.json`))?.default,
  storageKey: 'i18n-home-right',
  storage: createJsonStorage(localStorage),
})

/** 展示翻译后的文案，并提供语言切换示例。 */
const I18nTestNode = ({ title, switchLocale }: { title: string; switchLocale: string }) => {
  const { tr, loadLocale, locale } = useI18n()

  return (
    <section className={styles.panel}>
      <h2>{title}</h2>
      <div>{tr('保存')}</div>
      <div>{tr('你好1')}</div>
      <div>目前语言: {locale}</div>
      <Button onClick={() => void loadLocale(switchLocale)}>切换到 {switchLocale}</Button>
    </section>
  )
}

/** 组合两个独立语言作用域，演示各自切换并保存语言偏好。 */
const I18nExample = () => {
  return (
    <PageContainer title="国际化示例" content="两个独立语言作用域，分别切换并保存语言偏好。">
      <ProCard title="语言作用域" variant="outlined">
        <div className={styles.demo}>
          <I18nProvider store={leftStore}>
            <I18nTestNode title="节点 A" switchLocale="en_US" />
          </I18nProvider>

          <I18nProvider store={rightStore}>
            <I18nTestNode title="节点 B" switchLocale="zh_CN" />
          </I18nProvider>
        </div>
      </ProCard>
    </PageContainer>
  )
}

export default I18nExample
