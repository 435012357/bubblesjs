import DraftProTable, { type DraftTableView } from '@/components/DraftProTable/DraftProTable'
import { local } from '@/utils/storage/session'
import { PlusOutlined } from '@ant-design/icons'
import type { ProFormInstance } from '@ant-design/pro-components'
import { useI18n } from '@bubblesjs/i18n-react'
import { App, Button, Empty, Popconfirm } from 'antd'
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

/** 演示已发布项目与个人草稿的切换、编辑及本地持久化。 */
export default function ProTableDraftExample() {
  const { message } = App.useApp()
  const { tr } = useI18n()
  const dialogRef = useRef<DraftProjectFormDialogRef>(null)
  const searchFormRef = useRef<ProFormInstance>(undefined)
  const [records, setRecords] = useState<DraftProjectRecord[]>(
    /** 优先恢复浏览器内的草稿记录，存储不可读或数据形态错误时使用演示初始值。 */ () => {
      try {
        const saved = local.get<DraftProjectRecord[]>(storageKey)
        return Array.isArray(saved) ? saved : initialRecords
      } catch {
        return initialRecords
      }
    },
  )
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

  /** 重置查询表单、行选择及页码，使视图从第一页重新展示。 */
  function resetSearch() {
    searchFormRef.current?.resetFields()
    setSearch({})
    setSelectedRowKeys([])
    setPage(1)
  }

  /** 切换列表与草稿视图，同时清除旧视图的查询和选择状态。 */
  function changeView(next: DraftTableView) {
    setView(next)
    resetSearch()
  }

  /** 先写入浏览器存储再更新页面数据，写入失败时保留现有记录。 */
  function persist(next: DraftProjectRecord[]) {
    try {
      local.set(storageKey, next)
      setRecords(next)
      return true
    } catch {
      void message.error(tr('保存失败，请检查浏览器存储空间后重试。'))
      return false
    }
  }

  /** 持久化新增或编辑后的项目，按保存阶段切换视图并提示结果。 */
  function saveProject(input: SaveProjectInput) {
    if (!persist(saveProjectRecord(records, input))) return false
    changeView(input.stage === 'draft' ? 'draft' : 'list')
    void message.success(
      input.stage === 'draft'
        ? tr('草稿已保存')
        : input.original?.stage === 'published'
          ? tr('项目已保存')
          : tr('提交成功，已进入项目列表'),
    )
    return true
  }

  /** 持久化移除所选项目或草稿，成功后清除行选择并提示结果。 */
  function deleteProjects(ids: Key[]) {
    if (!persist(records.filter((record) => !ids.includes(record.id)))) return
    setSelectedRowKeys([])
    void message.success(
      tr('已删除 {count} 个{type}', {
        count: ids.length,
        type: view === 'draft' ? tr('草稿') : tr('项目'),
      }),
    )
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
        onSubmit={
          /** 应用新的项目查询条件，同时回到第一页并清除行选择。 */ (values) => {
            setSearch(values)
            setPage(1)
            setSelectedRowKeys([])
          }
        }
        onReset={resetSearch}
        options={{ reload: () => resetSearch(), density: false, setting: true }}
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => dialogRef.current?.show()}
          >
            {tr('新增项目')}
          </Button>,
        ]}
        rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
        tableAlertOptionRender={() => (
          <Popconfirm
            title={tr('删除选中的 {count} 个{type}？', {
              count: selectedRowKeys.length,
              type: view === 'draft' ? tr('草稿') : tr('项目'),
            })}
            onConfirm={() => deleteProjects(selectedRowKeys)}
            okText={tr('删除')}
            okButtonProps={{ danger: true }}
          >
            <Button type="link" danger size="small">
              {tr('批量删除')}
            </Button>
          </Popconfirm>
        )}
        pagination={{
          current: Math.min(page, Math.max(1, Math.ceil(filteredRecords.length / pageSize))),
          pageSize,
          showSizeChanger: true,
          showQuickJumper: true,
          pageSizeOptions: [10, 20, 50],
          showTotal: (total) => tr('共 {count} 条', { count: total }),
          /** 同步分页页码与每页条数。 */
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
                    ? tr('暂无匹配草稿，请调整筛选条件。')
                    : tr('暂无草稿，可以新增项目并保存为草稿。')
                  : tr('暂无匹配项目，请调整筛选条件或新增项目。')
              }
            />
          ),
        }}
      />
      <DraftProjectFormDialog ref={dialogRef} onSave={saveProject} />
    </>
  )
}
