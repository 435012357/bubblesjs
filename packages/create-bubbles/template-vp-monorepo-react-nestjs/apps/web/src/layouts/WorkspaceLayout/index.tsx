import { logout } from '@/api/auth'
import PageLoading from '@/components/Loading/PageLoading'
import { workspaceLayoutToken } from '@/config/theme'
import { getWorkspaceState } from '@/pages/workspaces/state'
import { navigationTree } from '@/router/page-registry'
import { clearWorkspaceRequests } from '@/utils/request/workspace'
import { cookie } from '@/utils/storage/cookie'
import { LogoutOutlined, SwapOutlined } from '@ant-design/icons'
import { ProLayout } from '@ant-design/pro-components'
import { App, Avatar, Button, Tooltip } from 'antd'
import type { AccessScope } from 'shared/types'
import { accessScopeKey } from 'shared/utils'
import './workspace.css'

/** 根据当前工作空间权限构建导航并同步刷新状态，页面懒加载交由全局边界等待。 */
export default function WorkspaceLayout() {
  const { companyId, projectId } = useParams()
  const scope: AccessScope = projectId
    ? { type: 'project', companyId: companyId!, projectId }
    : companyId
      ? { type: 'company', companyId }
      : { type: 'platform' }
  const access = getWorkspaceState().accessByScope.get(accessScopeKey(scope))
  const location = useLocation()
  const navigation = useNavigation()
  const navigate = useNavigate()
  const revalidator = useRevalidator()
  const { message } = App.useApp()
  const navigating = navigation.state !== 'idle'
  const refreshing = revalidator.state === 'loading'

  useEffect(
    /** 监听窗口焦点和权限刷新事件，在卸载时移除订阅。 */ () => {
      let requested = false
      /** 在页面可见且未在刷新时重新校验工作空间权限，避免重复请求。 */
      const refresh = () => {
        if (document.visibilityState === 'hidden' || requested || revalidator.state !== 'idle')
          return
        requested = true
        void revalidator.revalidate().finally(() => {
          requested = false
        })
      }
      window.addEventListener('focus', refresh)
      window.addEventListener('workspace-access-refresh', refresh)
      return /** 移除窗口焦点和权限更新监听，防止已卸载布局再次触发请求。 */ () => {
        window.removeEventListener('focus', refresh)
        window.removeEventListener('workspace-access-refresh', refresh)
      }
    },
    [revalidator],
  )

  /** 结束当前登录会话，清理本地令牌并返回登录页。 */
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

  // 撤权时旧布局可能仍在等待错误边界提交，暂时显示加载态，避免子页面读取空权限。
  if (!access) return <PageLoading />

  const scopeName =
    access.scope.type === 'platform'
      ? '平台空间'
      : access.scope.type === 'company'
        ? '企业空间'
        : '项目空间'
  const workspaceName = [access.workspace?.companyName, access.workspace?.name]
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
      route={{ path: '/', routes: navigationTree(access.menus, access.scope) }}
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
        <div className={`workspace-context workspace-context-${access.scope.type}`}>
          <span className="workspace-context-dot" aria-hidden="true" />
          <span className="workspace-context-type">{scopeName}</span>
          <strong title={workspaceName}>
            {access.workspace?.companyName && (
              <span className="workspace-context-parent">{access.workspace.companyName} / </span>
            )}
            {access.workspace?.name || scopeName}
          </strong>
        </div>
      )}
      actionsRender={() => [
        <Tooltip title={`账号：${access.user.account}`} key="user">
          <div className="workspace-user" tabIndex={0}>
            <Avatar size={34}>{access.user.name.slice(0, 1).toUpperCase()}</Avatar>
            <span>
              {access.user.name}
              <small>{access.administrator ? '管理员' : '成员'}</small>
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
          key={accessScopeKey(scope)}
          aria-busy={navigating || refreshing}
        >
          <div hidden={refreshing} inert={navigating || refreshing} style={{ height: '100%' }}>
            <Outlet context={access} />
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
