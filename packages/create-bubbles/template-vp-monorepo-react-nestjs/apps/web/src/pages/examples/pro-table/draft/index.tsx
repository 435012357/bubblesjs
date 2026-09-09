import DraftProTable, { type DraftTableView } from '@/components/DraftProTable/DraftProTable'
import { local } from '@/utils/storage/session'
import { PlusOutlined } from '@ant-design/icons'
import type { ProFormInstance } from '@ant-design/pro-components'
import { App, Button, Empty, Popconfirm } from 'antd'
import { useMemo, useRef, useState, type Key } from 'react'
import type { ProjectSearchValues } from '../config'
import DraftProjectFormDialog, {
  type DraftProjectFormDialogRef,
} from './components/DraftProjectFormDialog'
import {
  currentUser,
  initialRecords,
  storageKey,
  type DraftProjectRecord,
  type SaveProjectInput,
} from './config'
import { createDraftProjectColumns } from './config/columns'
import { filterProjectRecords, saveProjectRecord } from './config/projects'

export default function ProTableDraftExample() {
  const { message } = App.useApp()
  const dialogRef = useRef<DraftProjectFormDialogRef>(null)
  const searchFormRef = useRef<ProFormInstance>(undefined)
  const [records, setRecords] = useState<DraftProjectRecord[]>(() => {
    try {
      const saved = local.get<DraftProjectRecord[]>(storageKey)
      return Array.isArray(saved) ? saved : initialRecords
    } catch {
      return initialRecords
    }
  })
  const [view, setView] = useState<DraftTableView>('list')
  const [search, setSearch] = useState<ProjectSearchValues>({})
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const filteredRecords = useMemo(
    () => filterProjectRecords({ records, view, search }),
    [records, view, search],
  )
  const draftCount = records.filter(
    (record) => record.stage === 'draft' && record.createdBy === currentUser,
  ).length

  function resetSearch() {
    searchFormRef.current?.resetFields()
    setSearch({})
    setSelectedRowKeys([])
    setPage(1)
  }

  function changeView(next: DraftTableView) {
    setView(next)
    resetSearch()
  }

  function persist(next: DraftProjectRecord[]) {
    try {
      local.set(storageKey, next)
      setRecords(next)
      return true
    } catch {
      void message.error('保存失败，请检查浏览器存储空间后重试。')
      return false
    }
  }

  function saveProject(input: SaveProjectInput) {
    if (!persist(saveProjectRecord(records, input))) return false
    changeView(input.stage === 'draft' ? 'draft' : 'list')
    void message.success(
      input.stage === 'draft'
        ? '草稿已保存'
        : input.original?.stage === 'published'
          ? '项目已保存'
          : '提交成功，已进入项目列表',
    )
    return true
  }

  function deleteProjects(ids: Key[]) {
    if (!persist(records.filter((record) => !ids.includes(record.id)))) return
    setSelectedRowKeys([])
    void message.success(`已删除 ${ids.length} 个${view === 'draft' ? '草稿' : '项目'}`)
  }

  return (
    <>
      <DraftProTable<DraftProjectRecord, ProjectSearchValues>
        rowKey="id"
        view={view}
        onViewChange={changeView}
        draftCount={draftCount}
        columns={createDraftProjectColumns({
          onEdit: (record) => dialogRef.current?.show(record),
          onDelete: (record) => deleteProjects([record.id]),
        })}
        dataSource={filteredRecords}
        formRef={searchFormRef}
        form={{ name: 'draft-project-search' }}
        search={{ labelWidth: 'auto', defaultCollapsed: true }}
        onSubmit={(values) => {
          setSearch(values)
          setPage(1)
          setSelectedRowKeys([])
        }}
        onReset={resetSearch}
        options={{ reload: () => resetSearch(), density: false, setting: true }}
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => dialogRef.current?.show()}
          >
            新增项目
          </Button>,
        ]}
        rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
        tableAlertOptionRender={() => (
          <Popconfirm
            title={`删除选中的 ${selectedRowKeys.length} 个${view === 'draft' ? '草稿' : '项目'}？`}
            onConfirm={() => deleteProjects(selectedRowKeys)}
            okText="删除"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" danger size="small">
              批量删除
            </Button>
          </Popconfirm>
        )}
        pagination={{
          current: Math.min(page, Math.max(1, Math.ceil(filteredRecords.length / pageSize))),
          pageSize,
          showSizeChanger: true,
          showQuickJumper: true,
          pageSizeOptions: [10, 20, 50],
          showTotal: (total) => `共 ${total} 条`,
          onChange: (current, size) => {
            setPage(current)
            setPageSize(size)
          },
        }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                view === 'draft'
                  ? draftCount > 0
                    ? '暂无匹配草稿，请调整筛选条件。'
                    : '暂无草稿，可以新增项目并保存为草稿。'
                  : '暂无匹配项目，请调整筛选条件或新增项目。'
              }
            />
          ),
        }}
      />
      <DraftProjectFormDialog ref={dialogRef} onSave={saveProject} />
    </>
  )
}
