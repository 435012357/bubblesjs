export type ProjectStatus = 'planning' | 'active' | 'paused' | 'completed'
export type ProjectPriority = 'high' | 'medium' | 'low'

// 仅用于页面演示；接入真实接口时再在 shared 中定义接口契约。
export interface ProjectRecord {
  id: string
  name: string
  owner: string
  status: ProjectStatus
  priority: ProjectPriority
  progress: number
  dueDate: string
  description: string
}

export type ProjectFormValues = Omit<ProjectRecord, 'id'>

export interface ProjectSearchValues {
  name?: string
  owner?: string
  status?: ProjectStatus
  priority?: ProjectPriority
  dueDate?: [string, string]
}

export const statusOptions = {
  planning: { text: '待启动', status: 'Default' },
  active: { text: '进行中', status: 'Processing' },
  paused: { text: '已暂停', status: 'Warning' },
  completed: { text: '已完成', status: 'Success' },
}

export const priorityOptions = {
  high: { text: '高', color: 'volcano' },
  medium: { text: '中', color: 'gold' },
  low: { text: '低', color: 'default' },
}

export const owners = ['林知夏', '陈一舟', '周予安', '许清和', '沈亦宁']

const projectNames = [
  '客户服务工作台',
  '官网体验升级',
  '移动端设计系统',
  '数据分析平台',
  '团队知识库',
  '会员积分中心',
  '订单管理优化',
  '消息通知服务',
  '供应链协同平台',
  '用户反馈中心',
  '内容发布系统',
  '企业权限管理',
  '运营活动配置',
  '数据报表导出',
  '开放接口文档',
  '支付流程优化',
  '文件资源管理',
  '服务监控看板',
]

const statuses: ProjectStatus[] = ['active', 'active', 'planning', 'active', 'completed', 'paused']
const priorities: ProjectPriority[] = ['high', 'medium', 'low']

export const initialProjects: ProjectRecord[] = projectNames.map((name, index) => {
  const status = statuses[index % statuses.length]!
  return {
    id: `PRJ-${String(index + 1).padStart(3, '0')}`,
    name,
    owner: owners[index % owners.length]!,
    status,
    priority: priorities[index % priorities.length]!,
    progress: status === 'completed' ? 100 : status === 'planning' ? 0 : 24 + ((index * 13) % 65),
    dueDate: `2026-${index < 12 ? '09' : '10'}-${String(10 + (index % 12)).padStart(2, '0')}`,
    description: `围绕${name}完善团队协作与交付体验。`,
  }
})
