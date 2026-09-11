import { PlusOutlined } from '@ant-design/icons'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import { App, Button, Popconfirm, Space, Tag } from 'antd'
import type { AccountRecord, EntityStatus, MemberRecord } from 'shared/types'
import FullHeightProTable from '@/components/FullHeightProTable/FullHeightProTable'
import { managementApi } from './api'
import AddMemberDialog, { type AddMemberDialogRef } from './components/AddMemberDialog'
import MemberRolesDialog, { type MemberRolesDialogRef } from './components/MemberRolesDialog'
import { useAccess, useManagementAction } from './use-access'

/** 按作用域管理账号或成员，处理状态、移除及角色分配。 */
export default function MembersPage() {
  const access = useAccess()
  const platform = access.scope.type === 'platform'
  const api = managementApi(access.scope)
  const execute = useManagementAction()
  const { message } = App.useApp()
  const actionRef = useRef<ActionType>(null)
  const addRef = useRef<AddMemberDialogRef>(null)
  const rolesRef = useRef<MemberRolesDialogRef>(null)
  const [openingId, setOpeningId] = useState<string>()
  const prefix = `${access.scope.type}.${platform ? 'accounts' : 'members'}`
  const allowed = (action: string) => access.permissionKeys.includes(`${prefix}.${action}`)
  /** 重新查询当前表格，使管理操作立即反映到列表。 */
  const refresh = () => {
    void actionRef.current?.reload()
  }

  /** 加载可分配角色，并将当前成员或账号带入角色分配弹窗。 */
  async function openRoles(record: AccountRecord | MemberRecord) {
    setOpeningId(record.id)
    try {
      const first = await api.roles({ page: 1, pageSize: 100 })
      const rest = await Promise.all(
        Array.from({ length: Math.ceil(first.total / 100) - 1 }, (_, index) =>
          api.roles({ page: index + 2, pageSize: 100 }),
        ),
      )
      rolesRef.current?.show(record, [...first.items, ...rest.flatMap((page) => page.items)])
    } catch (error) {
      if ((error as Error).name !== 'AbortError')
        void message.error(error instanceof Error ? error.message : '无法加载角色')
    } finally {
      setOpeningId(undefined)
    }
  }

  const columns: ProColumns<MemberRecord | AccountRecord>[] = [
    {
      title: '搜索',
      dataIndex: 'query',
      hideInTable: true,
      fieldProps: { placeholder: '搜索姓名或账号' },
    },
    { title: '姓名', dataIndex: 'name', search: false, width: 150 },
    { title: '完整账号', dataIndex: 'account', search: false, copyable: true, width: 180 },
    {
      title: platform ? '账号状态' : '成员状态',
      dataIndex: 'status',
      width: 100,
      valueEnum: {
        active: { text: '启用', status: 'Success' },
        disabled: { text: '停用', status: 'Default' },
        ...(platform ? { locked: { text: '锁定', status: 'Warning' } } : {}),
      },
    },
    ...(!platform
      ? [
          {
            title: '账号状态',
            dataIndex: 'accountStatus',
            width: 100,
            search: false,
            valueEnum: {
              active: { text: '启用', status: 'Success' },
              disabled: { text: '停用', status: 'Default' },
              locked: { text: '锁定', status: 'Warning' },
            },
          } as ProColumns<MemberRecord | AccountRecord>,
        ]
      : []),
    {
      title: platform ? '平台角色' : '角色',
      search: false,
      render: (_, record) =>
        'roleNames' in record ? (
          <Space size={[0, 4]} wrap>
            {record.roleNames.map((name) => (
              <Tag key={name}>{name}</Tag>
            ))}
          </Space>
        ) : (
          `${record.platformRoleIds.length} 个角色`
        ),
    },
    { title: '加入时间', dataIndex: 'createdAt', valueType: 'dateTime', search: false, width: 180 },
    {
      title: '操作',
      valueType: 'option',
      width: 240,
      render: (_, record) => (
        <Space size={4} wrap>
          {allowed('roles') && (
            <Button
              type="link"
              size="small"
              loading={openingId === record.id}
              onClick={() => void openRoles(record)}
            >
              分配角色
            </Button>
          )}
          {allowed('status') && (
            <Popconfirm
              title={`${record.status === 'active' ? '停用' : '启用'}${platform ? '账号' : '成员'}？`}
              description={
                platform
                  ? '账号停用后所有工作空间均不可访问；重新启用后须重新登录。'
                  : '停用保留成员关系和角色，阻断此身份提供的访问。'
              }
              onConfirm={() =>
                execute(
                  () =>
                    platform
                      ? api.accountStatus(record.id, {
                          status: record.status === 'active' ? 'disabled' : 'active',
                        })
                      : api.memberStatus(record.id, {
                          status: record.status === 'active' ? 'disabled' : 'active',
                          expectedVersion: (record as MemberRecord).version,
                        }),
                  refresh,
                )
              }
            >
              <Button type="link" size="small" danger={record.status === 'active'}>
                {record.status === 'active' ? '停用' : '启用'}
              </Button>
            </Popconfirm>
          )}
          {!platform && allowed('remove') && (
            <Popconfirm
              title="移除成员？"
              description={
                access.scope.type === 'company'
                  ? '同时清理该成员的企业角色及下属项目关系和角色。重新加入不会恢复旧授权。'
                  : '清理该成员在此项目的关系和角色。'
              }
              onConfirm={() =>
                execute(
                  () => api.removeMember(record.id, (record as MemberRecord).version),
                  refresh,
                )
              }
            >
              <Button type="link" size="small" danger>
                移除
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]
  return (
    <>
      <FullHeightProTable<MemberRecord | AccountRecord>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        headerTitle={
          platform ? '全局账号' : access.scope.type === 'company' ? '企业成员' : '项目成员'
        }
        pagination={{ defaultPageSize: 20, showSizeChanger: true, pageSizeOptions: [20, 50, 100] }}
        request={
          /** 按作用域查询全局账号或空间成员，并转换为表格分页结果。 */ async (params) => {
            const query = {
              page: params.current ?? 1,
              pageSize: params.pageSize ?? 20,
              query: params.query as string | undefined,
              status: params.status as EntityStatus | undefined,
            }
            const result = platform ? await api.accounts(query) : await api.members(query)
            return { data: result.items, total: result.total, success: true }
          }
        }
        onRequestError={(error) => {
          if (error.name !== 'AbortError') void message.error(error.message)
        }}
        toolBarRender={() =>
          !platform && allowed('add')
            ? [
                <Button
                  key="add"
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => addRef.current?.show()}
                >
                  添加成员
                </Button>,
              ]
            : []
        }
      />
      <AddMemberDialog
        ref={addRef}
        project={access.scope.type === 'project'}
        onSave={(data) => execute(() => api.addMember(data), refresh)}
      />
      <MemberRolesDialog
        ref={rolesRef}
        onSave={(record, roleIds) =>
          execute(
            () =>
              platform
                ? api.accountRoles(record.id, { roleIds })
                : api.memberRoles(record.id, {
                    roleIds,
                    expectedVersion: (record as MemberRecord).version,
                  }),
            refresh,
          )
        }
      />
    </>
  )
}
