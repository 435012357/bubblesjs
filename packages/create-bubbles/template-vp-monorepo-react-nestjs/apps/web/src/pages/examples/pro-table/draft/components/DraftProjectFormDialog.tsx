import {
  ModalForm,
  ProFormDatePicker,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  type ProFormInstance,
} from '@ant-design/pro-components'
import { Button } from 'antd'
import { owners, priorityOptions, statusOptions, type ProjectFormValues } from '../../config'
import { currentUser, type DraftProjectRecord, type SaveProjectInput } from '../config'

export interface DraftProjectFormDialogRef {
  show: (record?: DraftProjectRecord) => void
  hide: () => void
}

interface DraftProjectFormDialogProps {
  ref: Ref<DraftProjectFormDialogRef>
  onSave: (input: SaveProjectInput) => boolean
}

/** 提供项目编辑弹窗，允许保存不完整草稿或校验后发布。 */
export default function DraftProjectFormDialog({ ref, onSave }: DraftProjectFormDialogProps) {
  const formRef = useRef<ProFormInstance<ProjectFormValues>>(undefined)
  const [open, setOpen] = useState(false)
  const [record, setRecord] = useState<DraftProjectRecord>()
  const isPublished = record?.stage === 'published'

  function hide() {
    setOpen(false)
  }

  useImperativeHandle(ref, () => ({
    /** 载入待编辑记录并打开表单；未传记录时进入新增模式。 */
    show(project) {
      setRecord(project)
      setOpen(true)
    },
    hide,
  }))

  return (
    <ModalForm<ProjectFormValues>
      name="draft-project-editor"
      formRef={formRef}
      title={isPublished ? '编辑项目' : record ? '继续编辑草稿' : '新增项目'}
      open={open}
      width={600}
      grid
      rowProps={{ gutter: 16 }}
      dateFormatter="string"
      initialValues={
        record ?? { owner: currentUser, status: 'planning', priority: 'medium', progress: 0 }
      }
      modalProps={{ destroyOnHidden: true, onCancel: hide }}
      onOpenChange={(visible) => {
        if (!visible) hide()
      }}
      submitter={{
        render: (props) => [
          <Button key="cancel" onClick={hide}>
            取消
          </Button>,
          !isPublished && (
            <Button
              key="draft"
              onClick={
                /** 读取未强制校验的表单内容保存草稿，保存成功后关闭弹窗。 */ () => {
                  const values = formRef.current?.getFieldsFormatValue?.()
                  if (values && onSave({ values, original: record, stage: 'draft' })) hide()
                }
              }
            >
              保存草稿
            </Button>
          ),
          <Button key="submit" type="primary" onClick={() => props.submit()}>
            {isPublished ? '保存项目' : '提交'}
          </Button>,
        ],
      }}
      onFinish={
        /** 提交校验通过的项目为已发布状态，保存成功后关闭弹窗。 */ async (values) => {
          const saved = onSave({ values, original: record, stage: 'published' })
          if (saved) hide()
          return saved
        }
      }
    >
      <ProFormText
        name="name"
        label="项目名称"
        placeholder="例如：客户服务工作台"
        rules={[{ required: true, whitespace: true, message: '请输入项目名称' }]}
        fieldProps={{ maxLength: 40, showCount: true }}
        extra={!isPublished ? '信息未填完也可以保存草稿，提交时需补齐必填项。' : undefined}
      />
      <ProFormSelect
        name="owner"
        label="负责人"
        options={owners}
        colProps={{ xs: 24, sm: 12 }}
        rules={[{ required: true, message: '请选择负责人' }]}
      />
      <ProFormDatePicker
        name="dueDate"
        label="截止日期"
        colProps={{ xs: 24, sm: 12 }}
        rules={[{ required: true, message: '请选择截止日期' }]}
        fieldProps={{ style: { width: '100%' } }}
      />
      <ProFormSelect
        name="status"
        label="项目状态"
        valueEnum={statusOptions}
        colProps={{ xs: 24, sm: 12 }}
        rules={[{ required: true, message: '请选择项目状态' }]}
      />
      <ProFormSelect
        name="priority"
        label="优先级"
        valueEnum={priorityOptions}
        colProps={{ xs: 24, sm: 12 }}
        rules={[{ required: true, message: '请选择优先级' }]}
      />
      <ProFormDigit
        name="progress"
        label="完成进度（%）"
        min={0}
        max={100}
        fieldProps={{ precision: 0 }}
        rules={[{ required: true, message: '请输入完成进度' }]}
        extra="待启动项目保存为 0%，已完成项目保存为 100%。"
      />
      <ProFormTextArea
        name="description"
        label="项目说明"
        placeholder="补充项目目标或备注（选填）"
        fieldProps={{ maxLength: 200, showCount: true, rows: 3 }}
      />
    </ModalForm>
  )
}
