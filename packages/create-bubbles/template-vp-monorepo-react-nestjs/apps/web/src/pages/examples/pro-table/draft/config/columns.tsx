import { FolderOutlined } from '@ant-design/icons'
import type { ProColumns } from '@ant-design/pro-components'
import { Avatar, Badge, Button, Divider, Popconfirm, Space, Tag, Tooltip } from 'antd'
import dayjs from 'dayjs'
import { tr } from '@/i18n'
import { getStatusOptions, owners } from '../../config'
import type { DraftProjectRecord } from '.'
import styles from '../index.module.css'

interface ProjectColumnOptions {
  onEdit: (project: DraftProjectRecord) => void
  onDelete: (project: DraftProjectRecord) => void
}

/** 按项目或草稿视图生成列配置，展示缺失字段和继续编辑入口。 */
export function createDraftProjectColumns({
  onEdit,
  onDelete,
}: ProjectColumnOptions): ProColumns<DraftProjectRecord>[] {
  const statusOptions = getStatusOptions()

  return [
    {
      title: tr('项目名称'),
      dataIndex: 'name',
      width: 360,
      fieldProps: { placeholder: tr('搜索项目名称或编号'), allowClear: true },
      render: (_, project) => (
        <div className={styles.project}>
          <span className={styles.projectIcon}>
            <FolderOutlined />
          </span>
          <div className={styles.projectInfo}>
            <Space size={8}>
              <Button type="link" className={styles.projectName} onClick={() => onEdit(project)}>
                {project.name || tr('未命名项目')}
              </Button>
              {project.stage === 'draft' && (
                <Tag color="orange" variant="filled">
                  {tr('草稿')}
                </Tag>
              )}
            </Space>
            <span className={styles.projectId}>{project.id}</span>
          </div>
        </div>
      ),
    },
    {
      title: tr('项目状态'),
      dataIndex: 'status',
      width: 140,
      valueType: 'select',
      valueEnum: statusOptions,
      fieldProps: { placeholder: tr('全部状态') },
      render: (dom, project) =>
        project.status ? (
          dom
        ) : (
          <Badge status="default" text={<span className={styles.muted}>{tr('未填写')}</span>} />
        ),
    },
    {
      title: tr('负责人'),
      dataIndex: 'owner',
      width: 150,
      valueType: 'select',
      fieldProps: {
        placeholder: tr('全部负责人'),
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
          <span className={styles.muted}>{tr('未填写')}</span>
        ),
    },
    {
      title: tr('最后保存时间'),
      dataIndex: 'savedAt',
      width: 200,
      search: false,
      sorter: (first, second) => first.savedAt.localeCompare(second.savedAt),
      /** 将保存时间转换为今天、昨天或具体日期，并保留完整时间提示。 */
      render: (_, project) => {
        const date = dayjs(project.savedAt)
        const prefix = date.isSame(dayjs(), 'day')
          ? tr('今天')
          : date.isSame(dayjs().subtract(1, 'day'), 'day')
            ? tr('昨天')
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
      title: tr('操作'),
      valueType: 'option',
      width: 170,
      fixed: 'right',
      render: (_, project) => (
        <Space size={0} separator={<Divider orientation="vertical" />}>
          <Button type="link" size="small" onClick={() => onEdit(project)}>
            {project.stage === 'draft' ? tr('继续编辑') : tr('编辑')}
          </Button>
          <Popconfirm
            title={project.stage === 'draft' ? tr('删除草稿') : tr('删除项目')}
            description={tr('确定删除「{name}」吗？', {
              name: project.name || tr('未命名项目'),
            })}
            onConfirm={() => onDelete(project)}
            okText={tr('删除')}
            okButtonProps={{ danger: true }}
          >
            <Button type="link" danger size="small">
              {tr('删除')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]
}
