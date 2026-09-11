import { StyleProvider } from '@ant-design/cssinjs'
import { ProConfigProvider } from '@ant-design/pro-components'
import { App as AntdApp, ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import PageLoading from '@/components/Loading/PageLoading'
import { appTheme } from '@/config/theme'
import styles from './App.module.css'
import { router } from './router'

dayjs.locale('zh-cn')

/** 配置全局主题、组件上下文与统一懒加载边界，让路由完成加载后执行一次页面过渡。 */
function App() {
  return (
    <StyleProvider layer>
      <ConfigProvider locale={zhCN} theme={appTheme}>
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
