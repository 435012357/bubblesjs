import { ModalForm, ProFormText, ProFormTextArea } from '@ant-design/pro-components'
import { useI18n } from '@bubblesjs/i18n-react'
import type { CreateCompanyRequest } from 'shared/types'
import { ACCOUNT_PATTERN, normalizeAccount } from 'shared/utils'

export interface EntityFormDialogRef {
  show: () => void
  hide: () => void
}

/** 收集企业或项目资料及初始管理员信息，交由页面创建实体。 */
export default function EntityFormDialog({
  ref,
  project,
  onSave,
}: {
  ref: Ref<EntityFormDialogRef>
  project: boolean
  onSave: (values: CreateCompanyRequest) => Promise<boolean>
}) {
  const [open, setOpen] = useState(false)
  const { tr } = useI18n()
  const hide = () => setOpen(false)
  useImperativeHandle(ref, () => ({ show: () => setOpen(true), hide }))
  const label = project ? tr('项目') : tr('企业')
  return (
    <ModalForm<CreateCompanyRequest>
      title={project ? tr('创建项目') : tr('开通企业')}
      open={open}
      width={560}
      modalProps={{ destroyOnHidden: true, onCancel: hide }}
      submitter={{
        searchConfig: { submitText: project ? tr('创建项目') : tr('开通企业') },
      }}
      onOpenChange={(visible) => {
        if (!visible) hide()
      }}
      onFinish={
        /** 规范化实体名称、编码和管理员账号，创建成功后关闭弹窗。 */ async (values) => {
          const ok = await onSave({
            name: values.name.trim(),
            code: values.code.trim().toLowerCase(),
            description: values.description?.trim(),
            administratorAccount: normalizeAccount(values.administratorAccount),
          })
          if (ok) hide()
          return ok
        }
      }
    >
      <ProFormText
        name="name"
        label={tr('{type}名称', { type: label })}
        rules={[
          {
            required: true,
            whitespace: true,
            min: 2,
            max: 100,
            message: tr('请输入 2–100 字{type}名称', { type: label }),
          },
        ]}
        fieldProps={{ maxLength: 100 }}
      />
      <ProFormText
        name="code"
        label={tr('{type}编码', { type: label })}
        extra={tr('2–32 位字母、数字、下划线或短横线。')}
        rules={[
          { required: true, pattern: /^[A-Za-z0-9_-]{2,32}$/, message: tr('请输入有效编码') },
        ]}
        fieldProps={{ maxLength: 32 }}
      />
      <ProFormText
        name="administratorAccount"
        label={tr('首位管理员账号')}
        extra={
          project
            ? tr('请输入一名有效企业成员的完整账号。')
            : tr('请输入已注册且启用的完整账号；系统将其加入企业并授予企业管理员。')
        }
        rules={[{ required: true, pattern: ACCOUNT_PATTERN, message: tr('请输入完整账号') }]}
        fieldProps={{ maxLength: 32, autoComplete: 'off' }}
      />
      <ProFormTextArea
        name="description"
        label={tr('{type}说明', { type: label })}
        fieldProps={{ maxLength: 500, showCount: true, rows: 3 }}
      />
    </ModalForm>
  )
}
