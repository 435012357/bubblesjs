import { ModalForm, ProFormSelect } from '@ant-design/pro-components'
import { Alert } from 'antd'
import { useImperativeHandle, useState, type Ref } from 'react'
import type { AccountRecord, MemberRecord, RoleRecord } from 'shared/types'

export interface MemberRolesDialogRef {
  show: (record: MemberRecord | AccountRecord, roles: RoleRecord[]) => void
  hide: () => void
}
export default function MemberRolesDialog({
  ref,
  onSave,
}: {
  ref: Ref<MemberRolesDialogRef>
  onSave: (record: MemberRecord | AccountRecord, roleIds: string[]) => Promise<boolean>
}) {
  const [open, setOpen] = useState(false)
  const [record, setRecord] = useState<MemberRecord | AccountRecord>()
  const [roles, setRoles] = useState<RoleRecord[]>([])
  const hide = () => setOpen(false)
  const selected = record
    ? 'platformRoleIds' in record
      ? record.platformRoleIds
      : record.roleIds
    : []
  useImperativeHandle(ref, () => ({
    show: (item, options) => {
      setRecord(item)
      setRoles(options)
      setOpen(true)
    },
    hide,
  }))
  return (
    <ModalForm<{ roleIds: string[] }>
      title={`分配角色 · ${record?.name ?? ''}`}
      open={open}
      width={580}
      initialValues={{ roleIds: selected }}
      modalProps={{ destroyOnHidden: true, onCancel: hide }}
      onOpenChange={(visible) => {
        if (!visible) hide()
      }}
      submitter={{ searchConfig: { submitText: '保存角色' } }}
      onFinish={async (values) => {
        if (!record) return false
        const ok = await onSave(record, values.roleIds ?? [])
        if (ok) hide()
        return ok
      }}
    >
      <Alert
        type="info"
        showIcon
        title="多个角色的权限合并生效"
        description="这里只修改当前工作空间的角色。撤销管理员身份受委派资格和最后有效管理员保护。"
        style={{ marginBottom: 20 }}
      />
      <ProFormSelect
        name="roleIds"
        label="角色"
        mode="multiple"
        placeholder="选择角色；留空表示撤销当前范围全部角色"
        options={roles.map((role) => ({
          value: role.id,
          label: `${role.name}${role.builtin ? '（内置）' : ''}`,
          disabled: !role.assignable && !selected.includes(role.id),
        }))}
        fieldProps={{ optionFilterProp: 'label', allowClear: true }}
      />
    </ModalForm>
  )
}
