import { describe, expect, it } from 'vite-plus/test'
import {
  currentUser,
  initialRecords,
  type DraftProjectRecord,
} from '../src/pages/examples/pro-table/draft/config'
import {
  filterProjectRecords,
  saveProjectRecord,
} from '../src/pages/examples/pro-table/draft/config/projects'

describe('项目草稿演示', () => {
  it('允许保存未填完的草稿，并与正式项目分开显示', () => {
    const records = saveProjectRecord(initialRecords, {
      values: { name: '  测试草稿  ' },
      stage: 'draft',
    })
    const drafts = filterProjectRecords({ records, view: 'draft', search: {} })
    expect(drafts).toHaveLength(4)
    expect(drafts.find((record) => record.name === '测试草稿')).toMatchObject({
      stage: 'draft',
      createdBy: currentUser,
    })
    expect(drafts.find((record) => record.name === '测试草稿')?.owner).toBeUndefined()
    expect(filterProjectRecords({ records, view: 'list', search: {} })).toHaveLength(18)
  })

  it('继续保存同一草稿不会产生重复记录，提交后保留编号并移入正式列表', () => {
    const original = initialRecords.find((record) => record.id === 'PRJ-019')!
    const saved = saveProjectRecord(initialRecords, {
      original,
      values: { name: '继续完善' },
      stage: 'draft',
    })
    const updated = saved.find((record) => record.id === original.id)!
    expect(saved).toHaveLength(initialRecords.length)
    const submitted = saveProjectRecord(saved, {
      original: updated,
      values: {
        name: '已完成项目',
        owner: currentUser,
        status: 'completed',
        priority: 'medium',
        progress: 75,
        dueDate: '2026-10-01',
        description: '',
      },
      stage: 'published',
    })
    expect(submitted.filter((record) => record.id === original.id)).toHaveLength(1)
    expect(submitted.find((record) => record.id === original.id)).toMatchObject({
      stage: 'published',
      progress: 100,
    })
    expect(filterProjectRecords({ records: submitted, view: 'draft', search: {} })).toHaveLength(2)
    expect(filterProjectRecords({ records: submitted, view: 'list', search: {} })).toHaveLength(19)
  })

  it('草稿可见性取决于创建人，负责人筛选不能显示其他人的草稿', () => {
    const otherDraft: DraftProjectRecord = {
      id: 'PRJ-099',
      name: '其他人的草稿',
      stage: 'draft',
      createdBy: '其他人',
      owner: currentUser,
      savedAt: new Date().toISOString(),
    }
    const records = [...initialRecords, otherDraft]
    expect(
      filterProjectRecords({ records, view: 'draft', search: { owner: currentUser } }),
    ).toHaveLength(3)
    expect(
      filterProjectRecords({ records, view: 'list', search: { name: 'PRJ-099' } }),
    ).toHaveLength(0)
  })

  it('未填写业务状态的草稿仍可按编号搜索，状态筛选不把它当作待启动', () => {
    expect(
      filterProjectRecords({ records: initialRecords, view: 'draft', search: { name: 'prj-020' } }),
    ).toHaveLength(1)
    expect(
      filterProjectRecords({
        records: initialRecords,
        view: 'draft',
        search: { status: 'planning' },
      }),
    ).toHaveLength(2)
  })
})
