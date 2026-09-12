import { StyleProvider } from '@ant-design/cssinjs'
import { ProConfigProvider } from '@ant-design/pro-components'
import { useI18n } from '@bubblesjs/i18n-react'
import { App as AntdApp, ConfigProvider } from 'antd'
import enUS from 'antd/locale/en_US'
import zhCN from 'antd/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/en'
import 'dayjs/locale/zh-cn'
import PageLoading from '@/components/Loading/PageLoading'
import { appTheme } from '@/config/theme'
import { DEFAULT_LOCALE, isAppLocale } from '@/i18n/config'
import styles from './App.module.css'
import { router } from './router'

/** 配置全局主题、组件上下文与统一懒加载边界，让路由完成加载后执行一次页面过渡。 */
function App() {
  const { locale } = useI18n()
  const activeLocale = isAppLocale(locale) ? locale : DEFAULT_LOCALE

  useEffect(() => {
    dayjs.locale(activeLocale === 'en_US' ? 'en' : 'zh-cn')
    document.documentElement.lang = activeLocale === 'en_US' ? 'en' : 'zh-CN'
  }, [activeLocale])

  return (
    <StyleProvider layer>
      <ConfigProvider locale={activeLocale === 'en_US' ? enUS : zhCN} theme={appTheme}>
        <ProConfigProvider>
          <AntdApp className={styles.app}>
            {/* 懒加载统一等待，保留旧页面直到目标页面可以提交。 */}
            <Suspense fallback={<PageLoading />}>
              {/* 加载态立即更新，最终路由通过 transition 提交。 */}
              <RouterProvider router={router} useTransitions />
            </Suspense>
          </AntdApp>
        </ProConfigProvider>
      </ConfigProvider>
    </StyleProvider>
  )
}

export default App
