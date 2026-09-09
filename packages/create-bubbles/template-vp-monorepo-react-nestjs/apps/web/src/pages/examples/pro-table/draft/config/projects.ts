import type { DraftTableView } from '@/components/DraftProTable/DraftProTable'
import type { ProjectSearchValues } from '../../config'
import { currentUser, type DraftProjectRecord, type SaveProjectInput } from '.'

export function saveProjectRecord(records: DraftProjectRecord[], input: SaveProjectInput) {
  const { values, original, stage } = input
  const nextId =
    Math.max(0, ...records.map((record) => Number(record.id.replace('PRJ-', '')) || 0)) + 1
  const record: DraftProjectRecord = {
    ...values,
    name: values.name?.trim(),
    description: values.description?.trim(),
    progress:
      values.status === 'completed' ? 100 : values.status === 'planning' ? 0 : values.progress,
    id: original?.id ?? `PRJ-${String(nextId).padStart(3, '0')}`,
    stage,
    createdBy: original?.createdBy ?? currentUser,
    savedAt: new Date().toISOString(),
  }
  return [record, ...records.filter((item) => item.id !== record.id)]
}

export function filterProjectRecords({
  records,
  view,
  search,
}: {
  records: DraftProjectRecord[]
  view: DraftTableView
  search: ProjectSearchValues
}) {
  const keyword = search.name?.trim().toLowerCase()
  return records
    .filter((record) => {
      if (
        view === 'draft'
          ? record.stage !== 'draft' || record.createdBy !== currentUser
          : record.stage !== 'published'
      )
        return false
      if (keyword && !`${record.name ?? '未命名项目'} ${record.id}`.toLowerCase().includes(keyword))
        return false
      if (search.status && record.status !== search.status) return false
      if (search.owner && record.owner !== search.owner) return false
      return true
    })
    .sort((first, second) => second.savedAt.localeCompare(first.savedAt))
}
