import { FolderOutlined } from '@ant-design/icons'
import type { ProColumns } from '@ant-design/pro-components'
import { Avatar, Badge, Button, Divider, Popconfirm, Space, Tag, Tooltip } from 'antd'
import dayjs from 'dayjs'
import { owners, statusOptions } from '../../config'
import type { DraftProjectRecord } from '.'
import styles from '../index.module.css'

interface ProjectColumnOptions {
  onEdit: (project: DraftProjectRecord) => void
  onDelete: (project: DraftProjectRecord) => void
}

export function createDraftProjectColumns({
  onEdit,
  onDelete,
}: ProjectColumnOptions): ProColumns<DraftProjectRecord>[] {
  return [
    {
      title: '项目名称',
      dataIndex: 'name',
      width: 360,
      fieldProps: { placeholder: '搜索项目名称或编号', allowClear: true },
      render: (_, project) => (
        <div className={styles.project}>
          <span className={styles.projectIcon}>
            <FolderOutlined />
          </span>
          <div className={styles.projectInfo}>
            <Space size={8}>
              <Button type="link" className={styles.projectName} onClick={() => onEdit(project)}>
                {project.name || '未命名项目'}
              </Button>
              {project.stage === 'draft' && (
                <Tag color="orange" variant="filled">
                  草稿
                </Tag>
              )}
            </Space>
            <span className={styles.projectId}>{project.id}</span>
          </div>
        </div>
      ),
    },
    {
      title: '项目状态',
      dataIndex: 'status',
      width: 140,
      valueType: 'select',
      valueEnum: statusOptions,
      fieldProps: { placeholder: '全部状态' },
      render: (dom, project) =>
        project.status ? (
          dom
        ) : (
          <Badge status="default" text={<span className={styles.muted}>未填写</span>} />
        ),
    },
    {
      title: '负责人',
      dataIndex: 'owner',
      width: 150,
      valueType: 'select',
      fieldProps: {
        placeholder: '全部负责人',
        options: owners.map((owner) => ({ label: owner, value: owner })),
      },
      render: (_, project) =>
        project.owner ? (
          <Space size={8}>
            <Avatar size={28} className={styles.avatar}>
              {project.owner.slice(0, 1)}
            </Avatar>
            {project.owner}
          </Space>
        ) : (
          <span className={styles.muted}>未填写</span>
        ),
    },
    {
      title: '最后保存时间',
      dataIndex: 'savedAt',
      width: 200,
      search: false,
      sorter: (first, second) => first.savedAt.localeCompare(second.savedAt),
      render: (_, project) => {
        const date = dayjs(project.savedAt)
        const prefix = date.isSame(dayjs(), 'day')
          ? '今天'
          : date.isSame(dayjs().subtract(1, 'day'), 'day')
            ? '昨天'
            : date.format('YYYY-MM-DD')
        return (
          <Tooltip title={date.format('YYYY-MM-DD HH:mm:ss')}>
            <span className={styles.muted}>
              {prefix} {date.format('HH:mm')}
            </span>
          </Tooltip>
        )
      },
    },
    {
      title: '操作',
      valueType: 'option',
      width: 170,
      fixed: 'right',
      render: (_, project) => (
        <Space size={0} separator={<Divider orientation="vertical" />}>
          <Button type="link" size="small" onClick={() => onEdit(project)}>
            {project.stage === 'draft' ? '继续编辑' : '编辑'}
          </Button>
          <Popconfirm
            title={project.stage === 'draft' ? '删除草稿' : '删除项目'}
            description={`确定删除「${project.name || '未命名项目'}」吗？`}
            onConfirm={() => onDelete(project)}
            okText="删除"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" danger size="small">
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]
}
