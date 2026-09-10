import { PlusOutlined } from '@ant-design/icons'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import { App, Button, Empty, Popconfirm, Space } from 'antd'
import { useRef, useState } from 'react'
import { Link } from 'react-router'
import type { CompanyRecord, EntityStatus } from 'shared/types'
import FullHeightProTable from '@/components/FullHeightProTable/FullHeightProTable'
import { managementApi } from './api'
import AdministratorDialog, { type AdministratorDialogRef } from './components/AdministratorDialog'
import EntityFormDialog, { type EntityFormDialogRef } from './components/EntityFormDialog'
import { useAccess, useManagementAction } from './use-access'

export default function EntitiesPage() {
  const access = useAccess()
  const project = access.scope.type === 'company'
  const api = managementApi(access.scope)
  const actionRef = useRef<ActionType>(null)
  const formRef = useRef<EntityFormDialogRef>(null)
  const administratorRef = useRef<AdministratorDialogRef>(null)
  const [openingId, setOpeningId] = useState<string>()
  const { message } = App.useApp()
  const execute = useManagementAction()
  const prefix = project ? 'company.projects' : 'platform.companies'
  const allowed = (action: string) => access.permissionKeys.includes(`${prefix}.${action}`)
  const canCreate = allowed('create') && access.administrator === (project ? 'company' : 'platform')
  const refresh = () => {
    void actionRef.current?.reload()
  }

  async function openAdministrator(record: CompanyRecord) {
    setOpeningId(record.id)
    try {
      const administrators = project
        ? await api.projectAdministrators(record.id)
        : (await api.companyDetail(record.id)).administrators
      administratorRef.current?.show(record, administrators)
    } catch (error) {
      if ((error as Error).name !== 'AbortError')
        void message.error(error instanceof Error ? error.message : '无法加载管理员，请重试')
    } finally {
      setOpeningId(undefined)
    }
  }

  const columns: ProColumns<CompanyRecord>[] = [
    {
      title: '搜索',
      dataIndex: 'query',
      hideInTable: true,
      fieldProps: { placeholder: `搜索${project ? '项目' : '企业'}名称或编码` },
    },
    {
      title: project ? '项目名称' : '企业名称',
      dataIndex: 'name',
      search: false,
      ellipsis: true,
      width: 220,
    },
    { title: '编码', dataIndex: 'code', search: false, width: 150 },
    {
      title: '状态',
      dataIndex: 'status',
      valueEnum: {
        active: { text: '启用', status: 'Success' },
        disabled: { text: '停用', status: 'Default' },
      },
      width: 100,
    },
    { title: '说明', dataIndex: 'description', search: false, ellipsis: true },
    { title: '创建时间', dataIndex: 'createdAt', valueType: 'dateTime', search: false, width: 180 },
    {
      title: '操作',
      valueType: 'option',
      width: 270,
      render: (_, record) => (
        <Space size={4} wrap>
          {project && record.status === 'active' && access.scope.type === 'company' && (
            <Link to={`/companies/${access.scope.companyId}/projects/${record.id}`}>进入项目</Link>
          )}
          {allowed('administrator') && (
            <Button
              type="link"
              size="small"
              loading={openingId === record.id}
              onClick={() => void openAdministrator(record)}
            >
              设置管理员
            </Button>
          )}
          {allowed('status') && (
            <Popconfirm
              title={
                record.status === 'active'
                  ? `停用${project ? '项目' : '企业'}？`
                  : `启用${project ? '项目' : '企业'}？`
              }
              description={
                record.status === 'active'
                  ? '停用后阻断访问，保留成员和角色。'
                  : '恢复时检查有效管理员，保留子级原有状态。'
              }
              onConfirm={() =>
                execute(
                  () =>
                    api.entityStatus(record.id, {
                      status: record.status === 'active' ? 'disabled' : 'active',
                      expectedVersion: record.version,
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
        </Space>
      ),
    },
  ]

  return (
    <>
      <FullHeightProTable<CompanyRecord>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        headerTitle={project ? '项目管理' : '企业管理'}
        locale={{
          emptyText: (
            <Empty
              className="workspace-table-empty"
              image={<span className="workspace-empty-orbit" aria-hidden="true" />}
              description={
                <>
                  <strong>暂无{project ? '项目' : '企业'}</strong>
                  <p>
                    试试调整搜索条件
                    {canCreate ? `，或${project ? '创建项目' : '开通企业'}` : ''}。
                  </p>
                </>
              }
            />
          ),
        }}
        pagination={{ defaultPageSize: 20, showSizeChanger: true, pageSizeOptions: [20, 50, 100] }}
        request={async (params) => {
          const query = {
            page: params.current ?? 1,
            pageSize: params.pageSize ?? 20,
            query: params.query as string | undefined,
            status: params.status as EntityStatus | undefined,
          }
          const result = project ? await api.projects(query) : await api.companies(query)
          return { data: result.items, total: result.total, success: true }
        }}
        onRequestError={(error) => {
          if (error.name !== 'AbortError') void message.error(error.message)
        }}
        toolBarRender={() =>
          canCreate
            ? [
                <Button
                  key="create"
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => formRef.current?.show()}
                >
                  {project ? '创建项目' : '开通企业'}
                </Button>,
              ]
            : []
        }
      />
      <EntityFormDialog
        ref={formRef}
        project={project}
        onSave={(values) =>
          execute(() => (project ? api.createProject(values) : api.createCompany(values)), refresh)
        }
      />
      <AdministratorDialog
        ref={administratorRef}
        project={project}
        onSave={(record, input) => execute(() => api.setAdministrator(record.id, input), refresh)}
      />
    </>
  )
}
