import { Card, Descriptions, Empty, Space, Tag } from 'antd'
import { Link } from 'react-router'
import { navigationTree } from '@/router/page-registry'
import { useAccess } from './use-access'

export default function WorkspaceHome() {
  const access = useAccess()
  const typeName =
    access.scope.type === 'platform' ? '平台' : access.scope.type === 'company' ? '企业' : '项目'
  const entries = navigationTree(access.menus, access.scope)
  return (
    <div className="workspace-page">
      <div className="workspace-stateless-home">
        <div className="workspace-page-title">
          <h1>{typeName}工作台</h1>
          <p>查看当前身份，选择你需要的管理功能。</p>
        </div>
        <Descriptions
          bordered
          column={{ xs: 1, sm: 2 }}
          items={[
            { key: 'name', label: '当前用户', children: access.user.name },
            { key: 'account', label: '完整账号', children: access.user.account },
            { key: 'scope', label: '工作空间', children: typeName },
            {
              key: 'role',
              label: '当前身份',
              children: (
                <Tag color={access.administrator ? 'cyan' : 'default'}>
                  {access.administrator === 'company'
                    ? '企业管理员'
                    : access.administrator === 'platform'
                      ? '平台管理员'
                      : access.administrator === 'project'
                        ? '项目管理员'
                        : '普通成员'}
                </Tag>
              ),
            },
          ]}
        />
        <Card title="可用功能">
          {entries.length ? (
            <Space size={[24, 18]} wrap>
              {entries
                .flatMap((entry) => entry.routes ?? [entry])
                .filter((entry) => entry.path)
                .map((entry) => (
                  <Link key={entry.key} to={entry.path!}>
                    {entry.icon} {entry.name}
                  </Link>
                ))}
            </Space>
          ) : (
            <Empty description="当前没有可用的菜单，请联系管理员授权。" />
          )}
        </Card>
      </div>
    </div>
  )
}
