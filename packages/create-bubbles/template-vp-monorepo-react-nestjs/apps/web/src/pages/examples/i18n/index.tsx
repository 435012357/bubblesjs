import { useI18n } from '@bubblesjs/i18n-react'
import { PageContainer, ProCard } from '@ant-design/pro-components'
import { Button } from 'antd'
import { DEFAULT_LOCALE, isAppLocale } from '@/i18n/config'
import styles from './index.module.css'

/** 展示应用级翻译结果，并验证语言切换会同步影响整个前端。 */
const I18nExample = () => {
  const { tr, loadLocale, locale } = useI18n()
  const activeLocale = isAppLocale(locale) ? locale : DEFAULT_LOCALE
  const nextLocale = activeLocale === 'zh_CN' ? 'en_US' : 'zh_CN'

  return (
    <PageContainer
      title={tr('国际化示例')}
      content={tr('语言偏好会持久化，并同步 Ant Design、日期和整个前端界面。')}
    >
      <ProCard title={tr('应用级语言')} variant="outlined">
        <div className={styles.demo}>
          <section className={styles.panel}>
            <h2>{tr('翻译结果')}</h2>
            <div>{tr('保存')}</div>
            <div>{tr('你好，{name}', { name: 'Bubbles' })}</div>
            <div>{tr('当前语言：{locale}', { locale: activeLocale })}</div>
            <Button onClick={() => void loadLocale(nextLocale)}>
              {tr('切换到 {locale}', { locale: nextLocale })}
            </Button>
          </section>
        </div>
      </ProCard>
    </PageContainer>
  )
}

export default I18nExample
