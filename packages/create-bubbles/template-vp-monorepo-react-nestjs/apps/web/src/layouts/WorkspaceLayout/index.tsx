import { LogoutOutlined, SwapOutlined } from '@ant-design/icons'
import { ProLayout } from '@ant-design/pro-components'
import { App, Avatar, Button, Tooltip } from 'antd'
import { Suspense, useEffect } from 'react'
import {
  Link,
  Outlet,
  useLoaderData,
  useLocation,
  useNavigate,
  useNavigation,
  useRevalidator,
} from 'react-router'
import type { AccessContext, WorkspaceEntry } from 'shared/types'
import { accessScopeKey } from 'shared/utils'
import { logout } from '@/api/auth'
import PageLoading from '@/components/Loading/PageLoading'
import { workspaceLayoutToken } from '@/config/theme'
import { navigationTree } from '@/router/page-registry'
import { clearWorkspaceRequests } from '@/utils/request/workspace'
import { cookie } from '@/utils/storage/cookie'
import './workspace.css'

export default function WorkspaceLayout() {
  const access = useLoaderData<AccessContext & { workspace?: WorkspaceEntry }>()
  const location = useLocation()
  const navigation = useNavigation()
  const navigate = useNavigate()
  const revalidator = useRevalidator()
  const { message } = App.useApp()
  const scopeName =
    access?.scope.type === 'platform'
      ? '平台空间'
      : access?.scope.type === 'company'
        ? '企业空间'
        : '项目空间'
  const navigating = navigation.state !== 'idle'
  const refreshing = revalidator.state === 'loading'
  const workspaceName = [access?.workspace?.companyName, access?.workspace?.name]
    .filter(Boolean)
    .join(' / ')
  const brand = (
    <Link className="workspace-brand" to="/workspaces" aria-label="万物工作空间">
      <span className="wanwu-mark" aria-hidden="true" />
      <span className="workspace-wordmark">
        万物<small>WANWU</small>
      </span>
    </Link>
  )

  useEffect(() => {
    let requested = false
    const refresh = () => {
      if (document.visibilityState === 'hidden' || requested || revalidator.state !== 'idle') return
      requested = true
      void revalidator.revalidate().finally(() => {
        requested = false
      })
    }
    window.addEventListener('focus', refresh)
    window.addEventListener('workspace-access-refresh', refresh)
    return () => {
      window.removeEventListener('focus', refresh)
      window.removeEventListener('workspace-access-refresh', refresh)
    }
  }, [revalidator])

  async function handleLogout() {
    clearWorkspaceRequests()
    try {
      await logout().send(true)
    } catch (error) {
      void message.error(error instanceof Error ? error.message : '退出失败，请重试')
      return
    }
    cookie.remove('token')
    void navigate('/login', { replace: true })
  }

  return (
    <ProLayout
      className="workspace-layout"
      title="万物"
      logo={<span className="wanwu-mark" aria-hidden="true" />}
      token={workspaceLayoutToken}
      style={{ height: '100dvh', overflow: 'hidden' }}
      contentStyle={{ padding: 0, minHeight: 0, overflow: 'hidden' }}
      layout="mix"
      fixedHeader
      fixSiderbar
      siderWidth={232}
      location={location}
      route={{ path: '/', routes: access ? navigationTree(access.menus, access.scope) : [] }}
      menu={{ locale: false }}
      menuProps={{ selectedKeys: [location.pathname] }}
      menuItemRender={(item, dom, { isMobile }) =>
        item.path ? (
          <Link to={item.path} onClick={isMobile ? item.onClick : undefined}>
            {dom}
          </Link>
        ) : (
          dom
        )
      }
      headerTitleRender={() => brand}
      menuHeaderRender={(_logo, _title, props) => (props && !props.isMobile ? null : brand)}
      headerContentRender={() => (
        <div className={`workspace-context workspace-context-${access?.scope.type ?? 'platform'}`}>
          <span className="workspace-context-dot" aria-hidden="true" />
          <span className="workspace-context-type">{scopeName}</span>
          <strong title={workspaceName}>
            {access?.workspace?.companyName && (
              <span className="workspace-context-parent">{access.workspace.companyName} / </span>
            )}
            {access?.workspace?.name || scopeName}
          </strong>
        </div>
      )}
      actionsRender={() => [
        <Tooltip title={`账号：${access?.user.account}`} key="user">
          <div className="workspace-user" tabIndex={0}>
            <Avatar size={34}>{access?.user.name?.slice(0, 1).toUpperCase()}</Avatar>
            <span>
              {access?.user.name}
              <small>{access?.administrator ? '管理员' : '成员'}</small>
            </span>
          </div>
        </Tooltip>,
        <Link key="switch" to="/workspaces" aria-label="切换空间">
          <Button className="workspace-switch" aria-label="切换空间" icon={<SwapOutlined />}>
            切换空间
          </Button>
        </Link>,
        <Button
          key="logout"
          className="workspace-logout"
          aria-label="退出登录"
          type="text"
          icon={<LogoutOutlined />}
          onClick={() => void handleLogout()}
        >
          退出
        </Button>,
      ]}
    >
      <title>{workspaceName || scopeName} - 万物</title>
      <div className="workspace-content">
        <div
          className="workspace-body"
          key={access ? accessScopeKey(access.scope) : 'empty'}
          aria-busy={navigating || refreshing}
        >
          <div hidden={refreshing} inert={navigating || refreshing} style={{ height: '100%' }}>
            <Suspense fallback={<PageLoading />}>
              <Outlet />
            </Suspense>
          </div>
          {refreshing && <PageLoading />}
          {navigating && !refreshing && (
            <div className="workspace-navigation-loading">
              <PageLoading />
            </div>
          )}
        </div>
      </div>
    </ProLayout>
  )
}
