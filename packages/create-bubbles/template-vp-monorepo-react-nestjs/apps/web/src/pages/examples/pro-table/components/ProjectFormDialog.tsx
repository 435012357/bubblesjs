import {
  ModalForm,
  ProFormDatePicker,
  ProFormDigit,
  ProFormGroup,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components'
import { useImperativeHandle, useState, type Ref } from 'react'
import {
  owners,
  priorityOptions,
  statusOptions,
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

export default function ProjectFormDialog({ ref, onSave }: ProjectFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [project, setProject] = useState<ProjectRecord>()

  function hide() {
    setOpen(false)
  }

  useImperativeHandle(ref, () => ({
    show(record) {
      setProject(record)
      setOpen(true)
    },
    hide,
  }))

  return (
    <ModalForm<ProjectFormValues>
      name="project-editor"
      title={project ? '编辑项目' : '新增项目'}
      open={open}
      width={600}
      grid
      rowProps={{ gutter: 16 }}
      initialValues={project ?? { status: 'planning', priority: 'medium', progress: 0 }}
      modalProps={{ destroyOnHidden: true, onCancel: hide }}
      submitter={{ searchConfig: { submitText: '保存项目', resetText: '取消' } }}
      onOpenChange={(visible) => {
        if (!visible) hide()
      }}
      onFinish={async (values) => {
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
      }}
    >
      <ProFormText
        name="name"
        label="项目名称"
        placeholder="例如：客户服务工作台"
        rules={[{ required: true, whitespace: true, message: '请输入项目名称' }]}
        fieldProps={{ maxLength: 40, showCount: true }}
      />
      <ProFormGroup>
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
      </ProFormGroup>
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
