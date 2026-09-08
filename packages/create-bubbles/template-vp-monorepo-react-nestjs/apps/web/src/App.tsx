import { StyleProvider } from '@ant-design/cssinjs'
import { ProConfigProvider } from '@ant-design/pro-components'
import { App as AntdApp, ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import { Suspense } from 'react'
import { RouterProvider } from 'react-router'
import PageLoading from '@/components/Loading/PageLoading'
import { appTheme } from '@/config/theme'
import styles from './App.module.css'
import { router } from './router'

dayjs.locale('zh-cn')

function App() {
  return (
    <StyleProvider layer>
      <ConfigProvider locale={zhCN} theme={appTheme}>
        <ProConfigProvider>
          <AntdApp className={styles.app}>
            <Suspense fallback={<PageLoading />}>
              <RouterProvider router={router} />
            </Suspense>
          </AntdApp>
        </ProConfigProvider>
      </ConfigProvider>
    </StyleProvider>
  )
}

export default App
