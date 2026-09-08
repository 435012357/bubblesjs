import { FolderOutlined } from '@ant-design/icons'
import type { ProColumns } from '@ant-design/pro-components'
import { Avatar, Button, Popconfirm, Progress, Space, Tag, Tooltip } from 'antd'
import { owners, priorityOptions, statusOptions, type ProjectRecord } from '.'
import styles from '../index.module.css'

interface ProjectColumnOptions {
  onEdit: (project: ProjectRecord) => void
  onDelete: (project: ProjectRecord) => void
}

export function createProjectColumns({
  onEdit,
  onDelete,
}: ProjectColumnOptions): ProColumns<ProjectRecord>[] {
  return [
    {
      title: '项目名称',
      dataIndex: 'name',
      width: 260,
      fieldProps: { placeholder: '搜索项目名称或编号', allowClear: true },
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
      title: '项目状态',
      dataIndex: 'status',
      width: 115,
      valueType: 'select',
      valueEnum: statusOptions,
    },
    {
      title: '负责人',
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
      title: '优先级',
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
      title: '完成进度',
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
      title: '截止日期',
      dataIndex: 'dueDate',
      width: 130,
      valueType: 'date',
      search: false,
      sorter: (first, second) => first.dueDate.localeCompare(second.dueDate),
    },
    { title: '截止日期', dataIndex: 'dueDate', valueType: 'dateRange', hideInTable: true },
    {
      title: '操作',
      valueType: 'option',
      width: 120,
      fixed: 'right',
      render: (_, project) => [
        <Button key="edit" type="link" size="small" onClick={() => onEdit(project)}>
          编辑
        </Button>,
        <Popconfirm
          key="delete"
          title="删除项目"
          description={`确定删除「${project.name}」吗？`}
          onConfirm={() => onDelete(project)}
          okText="删除"
          okButtonProps={{ danger: true }}
        >
          <Button type="link" danger size="small">
            删除
          </Button>
        </Popconfirm>,
      ],
    },
  ]
}
