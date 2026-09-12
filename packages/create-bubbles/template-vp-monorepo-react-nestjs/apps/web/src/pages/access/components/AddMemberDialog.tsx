import { ModalForm, ProFormText } from '@ant-design/pro-components'
import { useI18n } from '@bubblesjs/i18n-react'
import type { AddMemberRequest } from 'shared/types'
import { ACCOUNT_PATTERN, normalizeAccount } from 'shared/utils'

export interface AddMemberDialogRef {
  show: () => void
  hide: () => void
}
/** 通过完整账号添加工作空间成员，并在保存成功后关闭弹窗。 */
export default function AddMemberDialog({
  ref,
  project,
  onSave,
}: {
  ref: Ref<AddMemberDialogRef>
  project: boolean
  onSave: (data: AddMemberRequest) => Promise<boolean>
}) {
  const [open, setOpen] = useState(false)
  const { tr } = useI18n()
  const hide = () => setOpen(false)
  useImperativeHandle(ref, () => ({ show: () => setOpen(true), hide }))
  return (
    <ModalForm<AddMemberRequest>
      title={project ? tr('添加项目成员') : tr('添加企业成员')}
      open={open}
      width={500}
      modalProps={{ destroyOnHidden: true, onCancel: hide }}
      onOpenChange={(visible) => {
        if (!visible) hide()
      }}
      submitter={{ searchConfig: { submitText: tr('添加成员') } }}
      onFinish={
        /** 规范化完整账号并提交成员添加，成功后关闭弹窗。 */ async (values) => {
          const ok = await onSave({ account: normalizeAccount(values.account) })
          if (ok) hide()
          return ok
        }
      }
    >
      <ProFormText
        name="account"
        label={tr('完整账号')}
        extra={
          project
            ? tr('仅能添加所属企业中已启用的成员。')
            : tr('请输入已注册用户的完整账号，添加后可继续分配角色。')
        }
        rules={[{ required: true, pattern: ACCOUNT_PATTERN, message: tr('请输入完整账号') }]}
        fieldProps={{ maxLength: 32, autoComplete: 'off' }}
      />
    </ModalForm>
  )
}
