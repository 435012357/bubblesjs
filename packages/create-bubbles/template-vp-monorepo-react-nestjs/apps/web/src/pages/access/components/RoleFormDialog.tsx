import { ModalForm, ProFormText, ProFormTextArea } from '@ant-design/pro-components'
import { useImperativeHandle, useState, type Ref } from 'react'
import type { CreateRoleRequest, RoleRecord } from 'shared/types'

export interface RoleFormDialogRef {
  show: (record?: RoleRecord) => void
  hide: () => void
}
export default function RoleFormDialog({
  ref,
  onSave,
}: {
  ref: Ref<RoleFormDialogRef>
  onSave: (values: CreateRoleRequest, record?: RoleRecord) => Promise<boolean>
}) {
  const [open, setOpen] = useState(false)
  const [record, setRecord] = useState<RoleRecord>()
  const hide = () => setOpen(false)
  useImperativeHandle(ref, () => ({
    show: (item) => {
      setRecord(item)
      setOpen(true)
    },
    hide,
  }))
  return (
    <ModalForm<CreateRoleRequest>
      title={record ? '编辑自定义角色' : '创建自定义角色'}
      open={open}
      width={520}
      initialValues={record}
      modalProps={{ destroyOnHidden: true, onCancel: hide }}
      onOpenChange={(visible) => {
        if (!visible) hide()
      }}
      submitter={{ searchConfig: { submitText: '保存角色' } }}
      onFinish={async (values) => {
        const ok = await onSave(
          { name: values.name.trim(), description: values.description?.trim() },
          record,
        )
        if (ok) hide()
        return ok
      }}
    >
      <ProFormText
        name="name"
        label="角色名称"
        rules={[
          {
            required: true,
            whitespace: true,
            min: 2,
            max: 100,
            message: '请输入 2–100 字角色名称',
          },
        ]}
        fieldProps={{ maxLength: 100 }}
      />
      <ProFormTextArea
        name="description"
        label="角色说明"
        fieldProps={{ maxLength: 500, showCount: true, rows: 3 }}
      />
      {!record && <p>创建后，通过“配置权限”选择此角色可以使用的功能。</p>}
    </ModalForm>
  )
}
