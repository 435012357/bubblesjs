import { ClearOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import type { ProColumns } from '@ant-design/pro-components'
import { Alert, App, Button, Popconfirm, Space, Tabs, Tag } from 'antd'
import { useEffect, useRef, useState } from 'react'
import type {
  CreateMenuRequest,
  FunctionCatalogResult,
  MenuNode,
  MenuTreeResult,
  ScopeType,
} from 'shared/types'
import FullHeightProTable from '@/components/FullHeightProTable/FullHeightProTable'
import CleanupDialog, { type CleanupDialogRef } from '../components/CleanupDialog'
import MenuFormDialog, { type MenuFormDialogRef } from '../components/MenuFormDialog'
import { useAccess, useManagementAction } from '../use-access'
import { menuApi } from './api'

interface MenuRow extends MenuNode {
  parentName: string
}

export default function MenusPage() {
  const access = useAccess()
  const { message } = App.useApp()
  const execute = useManagementAction()
  const [scopeType, setScopeType] = useState<ScopeType>('platform')
  const [tree, setTree] = useState<MenuTreeResult>()
  const [catalog, setCatalog] = useState<FunctionCatalogResult>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [refresh, setRefresh] = useState(0)
  const [filter, setFilter] = useState<{ query?: string; status?: string; type?: string }>({})
  const [previewing, setPreviewing] = useState(false)
  const formRef = useRef<MenuFormDialogRef>(null)
  const cleanupRef = useRef<CleanupDialogRef>(null)
  const allowed = (action: string) => access.permissionKeys.includes(`platform.menus.${action}`)

  useEffect(() => {
    let current = true
    setLoading(true)
    setTree(undefined)
    setCatalog(undefined)
    setError(undefined)
    void Promise.all([menuApi.tree(scopeType), menuApi.catalog(scopeType)])
      .then(([data, functions]) => {
        if (current) {
          setTree(data)
          setCatalog(functions)
        }
      })
      .catch((cause: unknown) => {
        if (current && (cause as Error).name !== 'AbortError')
          setError(cause instanceof Error ? cause.message : '无法加载菜单')
      })
      .finally(() => {
        if (current) setLoading(false)
      })
    return () => {
      current = false
    }
  }, [scopeType, refresh])

  const rows: MenuRow[] = []
  const append = (items: MenuNode[], parentName: string) => {
    for (const item of items) {
      rows.push({ ...item, children: [], parentName })
      append(item.children, `${parentName === '根目录' ? '' : `${parentName} / `}${item.name}`)
    }
  }
  append(tree?.items ?? [], '根目录')
  const filteredRows = rows.filter(
    (row) =>
      (!filter.query ||
        `${row.name} ${row.routeKey ?? ''} ${row.permissionKey ?? ''}`
          .toLowerCase()
          .includes(filter.query.toLowerCase())) &&
      (!filter.status || row.status === filter.status) &&
      (!filter.type || row.type === filter.type),
  )

  async function previewCleanup() {
    setPreviewing(true)
    try {
      cleanupRef.current?.show(await menuApi.cleanupPreview())
    } catch (cause) {
      if ((cause as Error).name !== 'AbortError')
        void message.error(cause instanceof Error ? cause.message : '无法加载预览')
    } finally {
      setPreviewing(false)
    }
  }

  const columns: ProColumns<MenuRow>[] = [
    {
      title: '搜索',
      dataIndex: 'query',
      hideInTable: true,
      fieldProps: { placeholder: '名称或功能标识' },
    },
    {
      title: '名称',
      dataIndex: 'name',
      search: false,
      width: 180,
      render: (_, record) => (
        <Space>
          {record.name}
          {record.protected && <Tag color="blue">保护</Tag>}
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 100,
      valueEnum: { directory: '目录', page: '页面', operation: '按钮 / 操作' },
    },
    { title: '父级', dataIndex: 'parentName', search: false, ellipsis: true, width: 200 },
    {
      title: '绑定功能',
      search: false,
      width: 240,
      render: (_, record) =>
        catalog?.items.find((item) => item.key === record.permissionKey)?.title ?? '—',
    },
    {
      title: '导航',
      dataIndex: 'hidden',
      search: false,
      width: 80,
      render: (_, record) => (record.type === 'operation' ? '—' : record.hidden ? '隐藏' : '显示'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      valueEnum: {
        active: { text: '启用', status: 'Success' },
        disabled: { text: '停用', status: 'Default' },
      },
    },
    { title: '排序', dataIndex: 'sort', search: false, width: 70 },
    {
      title: '操作',
      valueType: 'option',
      width: 140,
      render: (_, record) => (
        <Space size={4}>
          {allowed('update') && (
            <Button
              type="link"
              size="small"
              onClick={() => {
                if (tree && catalog) formRef.current?.show({ record, tree, catalog })
              }}
            >
              编辑
            </Button>
          )}
          {allowed('delete') && !record.protected && (
            <Popconfirm
              title="删除菜单节点？"
              description="仍有子节点或角色授权引用时不能删除。"
              onConfirm={() =>
                execute(
                  () => menuApi.remove(record.id, tree!.version),
                  () => setRefresh((value) => value + 1),
                )
              }
            >
              <Button type="link" size="small" danger>
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div className="menu-management">
      <Tabs
        activeKey={scopeType}
        onChange={(key) => {
          setTree(undefined)
          setFilter({})
          setScopeType(key as ScopeType)
        }}
        items={[
          { key: 'platform', label: '平台菜单' },
          { key: 'company', label: '企业菜单' },
          { key: 'project', label: '项目菜单' },
        ]}
      />
      {error && (
        <Alert
          style={{ margin: '0 16px' }}
          type="error"
          showIcon
          title={error}
          action={<Button onClick={() => setRefresh((value) => value + 1)}>重试</Button>}
        />
      )}
      <div className="menu-table">
        <FullHeightProTable<MenuRow>
          key={scopeType}
          rowKey="id"
          columns={columns}
          dataSource={filteredRows}
          loading={loading}
          headerTitle="菜单与操作"
          options={{ reload: false }}
          pagination={{
            defaultPageSize: 20,
            showSizeChanger: true,
            pageSizeOptions: [20, 50, 100],
          }}
          onSubmit={(values) => setFilter(values)}
          onReset={() => setFilter({})}
          toolBarRender={() =>
            [
              <Button
                key="refresh"
                icon={<ReloadOutlined />}
                onClick={() => setRefresh((value) => value + 1)}
              >
                刷新
              </Button>,
              allowed('cleanup') && access.administrator === 'platform' && (
                <Button
                  key="cleanup"
                  icon={<ClearOutlined />}
                  loading={previewing}
                  onClick={() => void previewCleanup()}
                >
                  清理废弃权限
                </Button>
              ),
              allowed('create') && (
                <Button
                  key="create"
                  type="primary"
                  icon={<PlusOutlined />}
                  disabled={!tree || !catalog}
                  onClick={() => {
                    if (tree && catalog) formRef.current?.show({ tree, catalog })
                  }}
                >
                  新增节点
                </Button>
              ),
            ].filter(Boolean)
          }
        />
      </div>
      <MenuFormDialog
        ref={formRef}
        onSave={(state, data) =>
          execute(
            () =>
              state.record
                ? menuApi.update(state.record.id, data)
                : menuApi.create(state.tree.scopeType, data as CreateMenuRequest),
            () => setRefresh((value) => value + 1),
          )
        }
      />
      <CleanupDialog
        ref={cleanupRef}
        onSave={(data) =>
          execute(
            () => menuApi.cleanup(data),
            () => setRefresh((value) => value + 1),
          )
        }
      />
    </div>
  )
}
