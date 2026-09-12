import {
  ModalForm,
  ProFormDatePicker,
  ProFormDigit,
  ProFormGroup,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components'
import { useI18n } from '@bubblesjs/i18n-react'
import {
  getPriorityOptions,
  getStatusOptions,
  owners,
  type ProjectFormValues,
  type ProjectRecord,
} from '../config'

export interface ProjectFormDialogRef {
  show: (project?: ProjectRecord) => void
  hide: () => void
}

interface ProjectFormDialogProps {
  ref: Ref<ProjectFormDialogRef>
  onSave: (values: ProjectFormValues, project?: ProjectRecord) => void
}

/** 复用项目新增与编辑表单，校验后将规范化字段交给页面保存。 */
export default function ProjectFormDialog({ ref, onSave }: ProjectFormDialogProps) {
  const { tr } = useI18n()
  const [open, setOpen] = useState(false)
  const [project, setProject] = useState<ProjectRecord>()

  function hide() {
    setOpen(false)
  }

  useImperativeHandle(ref, () => ({
    /** 载入待编辑记录并打开表单；未传记录时进入新增模式。 */
    show(record) {
      setProject(record)
      setOpen(true)
    },
    hide,
  }))

  return (
    <ModalForm<ProjectFormValues>
      name="project-editor"
      title={project ? tr('编辑项目') : tr('新增项目')}
      open={open}
      width={600}
      grid
      rowProps={{ gutter: 16 }}
      initialValues={project ?? { status: 'planning', priority: 'medium', progress: 0 }}
      modalProps={{ destroyOnHidden: true, onCancel: hide }}
      submitter={{ searchConfig: { submitText: tr('保存项目'), resetText: tr('取消') } }}
      onOpenChange={(visible) => {
        if (!visible) hide()
      }}
      onFinish={
        /** 规范化项目名称、说明和进度后提交保存，并关闭编辑弹窗。 */ async (values) => {
          onSave(
            {
              ...values,
              name: values.name.trim(),
              description: values.description?.trim() ?? '',
              progress:
                values.status === 'completed'
                  ? 100
                  : values.status === 'planning'
                    ? 0
                    : values.progress,
            },
            project,
          )
          hide()
          return true
        }
      }
    >
      <ProFormText
        name="name"
        label={tr('项目名称')}
        placeholder={tr('例如：客户服务工作台')}
        rules={[{ required: true, whitespace: true, message: tr('请输入项目名称') }]}
        fieldProps={{ maxLength: 40, showCount: true }}
      />
      <ProFormGroup>
        <ProFormSelect
          name="owner"
          label={tr('负责人')}
          options={owners}
          colProps={{ xs: 24, sm: 12 }}
          rules={[{ required: true, message: tr('请选择负责人') }]}
        />
        <ProFormDatePicker
          name="dueDate"
          label={tr('截止日期')}
          colProps={{ xs: 24, sm: 12 }}
          rules={[{ required: true, message: tr('请选择截止日期') }]}
          fieldProps={{ style: { width: '100%' } }}
        />
        <ProFormSelect
          name="status"
          label={tr('项目状态')}
          valueEnum={getStatusOptions()}
          colProps={{ xs: 24, sm: 12 }}
          rules={[{ required: true, message: tr('请选择项目状态') }]}
        />
        <ProFormSelect
          name="priority"
          label={tr('优先级')}
          valueEnum={getPriorityOptions()}
          colProps={{ xs: 24, sm: 12 }}
          rules={[{ required: true, message: tr('请选择优先级') }]}
        />
      </ProFormGroup>
      <ProFormDigit
        name="progress"
        label={tr('完成进度（%）')}
        min={0}
        max={100}
        fieldProps={{ precision: 0 }}
        rules={[{ required: true, message: tr('请输入完成进度') }]}
        extra={tr('待启动项目保存为 0%，已完成项目保存为 100%。')}
      />
      <ProFormTextArea
        name="description"
        label={tr('项目说明')}
        placeholder={tr('补充项目目标或备注（选填）')}
        fieldProps={{ maxLength: 200, showCount: true, rows: 3 }}
      />
    </ModalForm>
  )
}
