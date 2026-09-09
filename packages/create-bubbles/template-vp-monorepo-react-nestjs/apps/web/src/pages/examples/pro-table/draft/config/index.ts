import dayjs from 'dayjs'
import { initialProjects, owners, type ProjectFormValues } from '../../config'

export const currentUser = owners[0]!
export const storageKey = 'pro-table-draft-demo:v1'

// 本地演示数据，草稿允许字段不完整；stage 与项目业务 status 分开。
export type DraftProjectRecord = Partial<ProjectFormValues> & {
  id: string
  stage: 'draft' | 'published'
  createdBy: string
  savedAt: string
}

export interface SaveProjectInput {
  values: Partial<ProjectFormValues>
  original?: DraftProjectRecord
  stage: DraftProjectRecord['stage']
}

export const initialRecords: DraftProjectRecord[] = [
  ...initialProjects.map((project) => ({
    ...project,
    stage: 'published' as const,
    createdBy: project.owner,
    savedAt: dayjs().subtract(2, 'day').hour(9).minute(0).toISOString(),
  })),
  ...['移动端设计系统', '数据报表导出', '开放接口文档'].map((name, index) => ({
    id: `PRJ-${String(19 + index).padStart(3, '0')}`,
    name,
    stage: 'draft' as const,
    createdBy: currentUser,
    owner: currentUser,
    status: index === 1 ? undefined : ('planning' as const),
    priority: 'medium' as const,
    progress: 0,
    savedAt: dayjs().subtract([1, 3, 20][index]!, 'hour').toISOString(),
  })),
]
