import { FolderOutlined } from '@ant-design/icons'
import type { ProColumns } from '@ant-design/pro-components'
import { Avatar, Button, Popconfirm, Progress, Space, Tag, Tooltip } from 'antd'
import { tr } from '@/i18n'
import { getPriorityOptions, getStatusOptions, owners, type ProjectRecord } from '.'
import styles from '../index.module.css'

interface ProjectColumnOptions {
  onEdit: (project: ProjectRecord) => void
  onDelete: (project: ProjectRecord) => void
}

/** 生成项目列表的业务列、状态展示及编辑删除操作入口。 */
export function createProjectColumns({
  onEdit,
  onDelete,
}: ProjectColumnOptions): ProColumns<ProjectRecord>[] {
  const priorityOptions = getPriorityOptions()
  const statusOptions = getStatusOptions()

  return [
    {
      title: tr('项目名称'),
      dataIndex: 'name',
      width: 260,
      fieldProps: { placeholder: tr('搜索项目名称或编号'), allowClear: true },
      render: (_, project) => (
        <div className={styles.project}>
          <span className={styles.projectIcon}>
            <FolderOutlined />
          </span>
          <div className={styles.projectInfo}>
            <Tooltip title={project.description || project.name}>
              <Button type="link" className={styles.projectName} onClick={() => onEdit(project)}>
                {project.name}
              </Button>
            </Tooltip>
            <span className={styles.projectId}>{project.id}</span>
          </div>
        </div>
      ),
    },
    {
      title: tr('项目状态'),
      dataIndex: 'status',
      width: 115,
      valueType: 'select',
      valueEnum: statusOptions,
    },
    {
      title: tr('负责人'),
      dataIndex: 'owner',
      width: 125,
      valueType: 'select',
      fieldProps: { options: owners.map((owner) => ({ label: owner, value: owner })) },
      render: (_, project) => (
        <Space size={8}>
          <Avatar size={26} className={styles.avatar}>
            {project.owner.slice(0, 1)}
          </Avatar>
          {project.owner}
        </Space>
      ),
    },
    {
      title: tr('优先级'),
      dataIndex: 'priority',
      width: 90,
      valueType: 'select',
      valueEnum: priorityOptions,
      render: (_, project) => (
        <Tag color={priorityOptions[project.priority].color}>
          {priorityOptions[project.priority].text}
        </Tag>
      ),
    },
    {
      title: tr('完成进度'),
      dataIndex: 'progress',
      width: 155,
      search: false,
      sorter: (first, second) => first.progress - second.progress,
      render: (_, project) => (
        <Progress
          percent={project.progress}
          size="small"
          status={project.status === 'completed' ? 'success' : 'normal'}
          strokeColor={project.status === 'paused' ? '#d6a348' : undefined}
          className={styles.progress}
        />
      ),
    },
    {
      title: tr('截止日期'),
      dataIndex: 'dueDate',
      width: 130,
      valueType: 'date',
      search: false,
      sorter: (first, second) => first.dueDate.localeCompare(second.dueDate),
    },
    { title: tr('截止日期'), dataIndex: 'dueDate', valueType: 'dateRange', hideInTable: true },
    {
      title: tr('操作'),
      valueType: 'option',
      width: 120,
      fixed: 'right',
      render: (_, project) => [
        <Button key="edit" type="link" size="small" onClick={() => onEdit(project)}>
          {tr('编辑')}
        </Button>,
        <Popconfirm
          key="delete"
          title={tr('删除项目')}
          description={tr('确定删除「{name}」吗？', { name: project.name })}
          onConfirm={() => onDelete(project)}
          okText={tr('删除')}
          okButtonProps={{ danger: true }}
        >
          <Button type="link" danger size="small">
            {tr('删除')}
          </Button>
        </Popconfirm>,
      ],
    },
  ]
}
