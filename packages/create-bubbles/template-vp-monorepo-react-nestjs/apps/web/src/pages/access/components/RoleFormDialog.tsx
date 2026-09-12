import { ModalForm, ProFormText, ProFormTextArea } from '@ant-design/pro-components'
import { useI18n } from '@bubblesjs/i18n-react'
import type { CreateRoleRequest, RoleRecord } from 'shared/types'

export interface RoleFormDialogRef {
  show: (record?: RoleRecord) => void
  hide: () => void
}
/** 复用新增与编辑角色表单，并保留原角色的版本信息。 */
export default function RoleFormDialog({
  ref,
  onSave,
}: {
  ref: Ref<RoleFormDialogRef>
  onSave: (values: CreateRoleRequest, record?: RoleRecord) => Promise<boolean>
}) {
  const [open, setOpen] = useState(false)
  const [record, setRecord] = useState<RoleRecord>()
  const { tr } = useI18n()
  const hide = () => setOpen(false)
  useImperativeHandle(ref, () => ({
    /** 载入待编辑记录并打开表单；未传记录时进入新增模式。 */
    show: (item) => {
      setRecord(item)
      setOpen(true)
    },
    hide,
  }))
  return (
    <ModalForm<CreateRoleRequest>
      title={record ? tr('编辑自定义角色') : tr('创建自定义角色')}
      open={open}
      width={520}
      initialValues={record}
      modalProps={{ destroyOnHidden: true, onCancel: hide }}
      onOpenChange={(visible) => {
        if (!visible) hide()
      }}
      submitter={{ searchConfig: { submitText: tr('保存角色') } }}
      onFinish={
        /** 规范化角色名称与说明，提交新增或编辑后按结果关闭弹窗。 */ async (values) => {
          const ok = await onSave(
            { name: values.name.trim(), description: values.description?.trim() },
            record,
          )
          if (ok) hide()
          return ok
        }
      }
    >
      <ProFormText
        name="name"
        label={tr('角色名称')}
        rules={[
          {
            required: true,
            whitespace: true,
            min: 2,
            max: 100,
            message: tr('请输入 2–100 字角色名称'),
          },
        ]}
        fieldProps={{ maxLength: 100 }}
      />
      <ProFormTextArea
        name="description"
        label={tr('角色说明')}
        fieldProps={{ maxLength: 500, showCount: true, rows: 3 }}
      />
      {!record && <p>{tr('创建后，通过“配置权限”选择此角色可以使用的功能。')}</p>}
    </ModalForm>
  )
}
