import FullHeightProTable from '@/components/FullHeightProTable/FullHeightProTable'
import { PlusOutlined } from '@ant-design/icons'
import { App, Button, Empty, Popconfirm } from 'antd'
import ProjectFormDialog, { type ProjectFormDialogRef } from './components/ProjectFormDialog'
import {
  initialProjects,
  type ProjectFormValues,
  type ProjectRecord,
  type ProjectSearchValues,
} from './config'
import { createProjectColumns } from './config/columns'

/** 演示项目列表的筛选、分页、行选择及新增编辑删除。 */
export default function ProTableExample() {
  const { message } = App.useApp()
  const formDialogRef = useRef<ProjectFormDialogRef>(null)
  const nextProjectId = useRef(initialProjects.length + 1)
  const [projects, setProjects] = useState(initialProjects)
  const [search, setSearch] = useState<ProjectSearchValues>({})
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(6)

  const filteredProjects = useMemo(
    /** 根据项目搜索条件计算当前列表，避免无关状态更新时重复筛选。 */ () => {
      const keyword = search.name?.trim().toLowerCase()
      return projects.filter(
        /** 依次校验关键字、状态、负责人、优先级及截止日期范围。 */ (project) => {
          if (keyword && !`${project.name} ${project.id}`.toLowerCase().includes(keyword))
            return false
          if (search.status && project.status !== search.status) return false
          if (search.owner && project.owner !== search.owner) return false
          if (search.priority && project.priority !== search.priority) return false
          if (
            search.dueDate &&
            (project.dueDate < search.dueDate[0] || project.dueDate > search.dueDate[1])
          )
            return false
          return true
        },
      )
    },
    [projects, search],
  )

  /** 新增项目或替换编辑记录，更新页面列表并提示保存成功。 */
  function saveProject(values: ProjectFormValues, original?: ProjectRecord) {
    if (original) {
      setProjects((current) =>
        current.map((project) =>
          project.id === original.id ? { ...values, id: original.id } : project,
        ),
      )
    } else {
      const id = `PRJ-${String(nextProjectId.current++).padStart(3, '0')}`
      setProjects((current) => [{ ...values, id }, ...current])
      setPage(1)
    }
    void message.success(original ? '项目已保存' : '项目已新增')
  }

  /** 从项目列表及行选择中移除指定项目，并提示删除数量。 */
  function deleteProjects(ids: Key[]) {
    setProjects((current) => current.filter((project) => !ids.includes(project.id)))
    setSelectedRowKeys((current) => current.filter((id) => !ids.includes(id)))
    void message.success(`已删除 ${ids.length} 个项目`)
  }

  const columns = createProjectColumns({
    onEdit: (project) => formDialogRef.current?.show(project),
    onDelete: (project) => deleteProjects([project.id]),
  })

  return (
    <>
      <FullHeightProTable<ProjectRecord, ProjectSearchValues>
        rowKey="id"
        columns={columns}
        dataSource={filteredProjects}
        headerTitle="项目列表"
        tooltip="支持搜索筛选、排序、分页、列设置和批量删除。"
        search={{ labelWidth: 'auto', defaultCollapsed: true }}
        form={{ name: 'project-search' }}
        dateFormatter="string"
        onSubmit={
          /** 应用新的项目查询条件，同时回到第一页并清除行选择。 */ (values) => {
            setSearch(values)
            setPage(1)
            setSelectedRowKeys([])
          }
        }
        onReset={
          /** 清空项目查询条件，同时回到第一页并清除行选择。 */ () => {
            setSearch({})
            setPage(1)
            setSelectedRowKeys([])
          }
        }
        options={{ reload: false, density: true, setting: true, fullScreen: true }}
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => formDialogRef.current?.show()}
          >
            新增项目
          </Button>,
        ]}
        rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
        tableAlertOptionRender={() => (
          <Popconfirm
            title={`删除选中的 ${selectedRowKeys.length} 个项目？`}
            description="删除后将从当前演示列表中移除。"
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
          current: Math.min(page, Math.max(1, Math.ceil(filteredProjects.length / pageSize))),
          pageSize,
          showSizeChanger: true,
          pageSizeOptions: [6, 12, 24],
          showTotal: (total) => `共 ${total} 个项目`,
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
              description="暂无匹配项目，请调整筛选条件或新增项目。"
            />
          ),
        }}
      />
      <ProjectFormDialog ref={formDialogRef} onSave={saveProject} />
    </>
  )
}
