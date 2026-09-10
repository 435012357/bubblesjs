import type { ProColumns } from '@ant-design/pro-components'
import { App, Typography } from 'antd'
import type { AuditRecord } from 'shared/types'
import FullHeightProTable from '@/components/FullHeightProTable/FullHeightProTable'
import { managementApi } from './api'
import { useAccess } from './use-access'

const actionNames: Record<string, string> = {
  'company.create': '开通企业',
  'company.status': '变更企业状态',
  'company.administrator.set': '设置企业管理员',
  'company.update': '修改企业资料',
  'project.update': '修改项目资料',
  'project.create': '创建项目',
  'project.status': '变更项目状态',
  'project.administrator.set': '设置项目管理员',
  'account.status': '变更账号状态',
  'account.roles': '分配平台角色',
  'member.add': '添加成员',
  'member.status': '变更成员状态',
  'member.remove': '移除成员',
  'member.roles': '分配成员角色',
  'role.create': '创建角色',
  'role.update': '修改角色',
  'role.permissions': '修改角色权限',
  'role.delete': '删除角色',
  'menu.create': '新增菜单',
  'menu.update': '修改菜单',
  'menu.delete': '删除菜单',
  'permission.cleanup': '清理废弃权限',
}
const summaryNames: Record<string, string> = {
  changedFields: '修改字段',
  fromStatus: '原状态',
  toStatus: '新状态',
  roleIds: '角色',
  permissionKeys: '权限',
  targetUserId: '目标用户',
  companyId: '企业',
  replacedUserId: '被替换用户',
  name: '名称',
  code: '编码',
  description: '说明',
}

export default function AuditPage() {
  const access = useAccess()
  const api = managementApi(access.scope)
  const { message } = App.useApp()
  const columns: ProColumns<AuditRecord>[] = [
    {
      title: '搜索',
      dataIndex: 'query',
      hideInTable: true,
      fieldProps: { placeholder: '操作、对象类型或对象编号' },
    },
    { title: '操作', dataIndex: 'action', width: 160, valueType: 'select', valueEnum: actionNames },
    {
      title: '时间范围',
      dataIndex: 'timeRange',
      valueType: 'dateTimeRange',
      hideInTable: true,
      search: {
        transform: (value: string[]) => ({
          from: value[0] ? new Date(value[0]).toISOString() : undefined,
          to: value[1] ? new Date(value[1]).toISOString() : undefined,
        }),
      },
    },
    { title: '操作时间', dataIndex: 'createdAt', valueType: 'dateTime', search: false, width: 180 },
    {
      title: '操作者',
      search: false,
      width: 180,
      render: (_, record) => (
        <span>
          {record.actor.name}
          <br />
          <Typography.Text type="secondary">{record.actor.account}</Typography.Text>
        </span>
      ),
    },
    {
      title: '对象',
      search: false,
      width: 220,
      render: (_, record) => (
        <span>
          {record.objectType}
          <br />
          <Typography.Text copyable>{record.objectId}</Typography.Text>
        </span>
      ),
    },
    {
      title: '变更摘要',
      search: false,
      width: 320,
      render: (_, record) => (
        <div className="audit-summary">
          {Object.entries(record.summary).map(([key, value]) => (
            <div key={key}>
              <strong>{summaryNames[key] ?? key}：</strong>
              {Array.isArray(value) ? value.join('、') : String(value ?? '—')}
            </div>
          ))}
        </div>
      ),
    },
    {
      title: '请求编号',
      dataIndex: 'requestId',
      search: false,
      copyable: true,
      ellipsis: true,
      width: 200,
    },
  ]
  return (
    <FullHeightProTable<AuditRecord>
      rowKey="id"
      columns={columns}
      headerTitle="操作日志"
      pagination={{ defaultPageSize: 20, showSizeChanger: true, pageSizeOptions: [20, 50, 100] }}
      request={async (params) => {
        const result = await api.audits({
          page: params.current,
          pageSize: params.pageSize,
          query: params.query as string | undefined,
          action: params.action as string | undefined,
          from: params.from as string | undefined,
          to: params.to as string | undefined,
        })
        return { data: result.items, total: result.total, success: true }
      }}
      onRequestError={(error) => {
        if (error.name !== 'AbortError') void message.error(error.message)
      }}
    />
  )
}
