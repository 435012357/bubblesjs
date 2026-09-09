import {
  AppstoreOutlined,
  DashboardOutlined,
  LogoutOutlined,
  TableOutlined,
  TranslationOutlined,
} from '@ant-design/icons'
import { ProLayout } from '@ant-design/pro-components'
import { useRequest } from 'alova/client'
import { App, Button } from 'antd'
import { Suspense } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router'
import PageLoading from '@/components/Loading/PageLoading'
import { logout } from '@/api/auth'
import { cookie } from '@/utils/storage/cookie'
import styles from './BasicLayout.module.css'

const menuRoutes = [
  { path: '/home', name: '工作台', icon: <DashboardOutlined /> },
  {
    path: '/examples/pro-table',
    key: 'pro-table-examples',
    name: 'ProTable 示例',
    icon: <TableOutlined />,
    routes: [
      { path: '/examples/pro-table', key: 'pro-table-basic', name: '基础' },
      { path: '/examples/pro-table/draft', name: '草稿' },
    ],
  },
  { path: '/examples/i18n', name: '国际化示例', icon: <TranslationOutlined /> },
]

export default function BasicLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const token = cookie.get('token')
  const { message } = App.useApp()
  const { send, loading } = useRequest(logout, { immediate: false })

  async function handleLogout() {
    if (loading) return
    try {
      await send()
      cookie.remove('token')
      void navigate('/login', { replace: true })
    } catch (error) {
      void message.error(error instanceof Error ? error.message : '退出失败，请重试')
    }
  }

  return (
    <ProLayout
      className="platform-layout"
      style={{ height: '100dvh', overflow: 'hidden' }}
      contentStyle={{ minHeight: 0, padding: 0, overflow: 'auto' }}
      title="通用平台"
      logo={<AppstoreOutlined className={styles.logo} />}
      layout="mix"
      fixedHeader
      fixSiderbar
      siderWidth={224}
      actionsRender={() =>
        token
          ? [
              <Button
                key="logout"
                type="text"
                icon={<LogoutOutlined />}
                loading={loading}
                onClick={() => void handleLogout()}
              >
                退出登录
              </Button>,
            ]
          : [
              <Link key="login" to="/login">
                登录
              </Link>,
            ]
      }
      location={location}
      route={{ path: '/', routes: menuRoutes }}
      menu={{ locale: false }}
      menuProps={{
        selectedKeys: [
          location.pathname === '/examples/pro-table' ? 'pro-table-basic' : location.pathname,
        ],
      }}
      menuItemRender={(item, dom, { isMobile }) => (
        <Link to={item.path ?? '/home'} onClick={isMobile ? item.onClick : undefined}>
          {dom}
        </Link>
      )}
      headerTitleRender={(logo, title) => (
        <Link className={styles.brand} to="/home" aria-label="通用平台首页">
          {logo}
          {title}
        </Link>
      )}
    >
      <Suspense fallback={<PageLoading />}>
        <Outlet />
      </Suspense>
    </ProLayout>
  )
}
