import { ModalForm, ProFormSelect, ProFormText } from '@ant-design/pro-components'
import { Alert } from 'antd'
import type { AdministratorSummary, CompanyRecord, SetAdministratorRequest } from 'shared/types'
import { ACCOUNT_PATTERN, normalizeAccount } from 'shared/utils'

export interface AdministratorDialogRef {
  show: (record: CompanyRecord, administrators: AdministratorSummary[]) => void
  hide: () => void
}

/** 展示现有管理员，支持补充或替换企业、项目管理员。 */
export default function AdministratorDialog({
  ref,
  project,
  onSave,
}: {
  ref: Ref<AdministratorDialogRef>
  project: boolean
  onSave: (record: CompanyRecord, input: SetAdministratorRequest) => Promise<boolean>
}) {
  const [record, setRecord] = useState<CompanyRecord>()
  const [administrators, setAdministrators] = useState<AdministratorSummary[]>([])
  const [open, setOpen] = useState(false)
  const hide = () => setOpen(false)
  useImperativeHandle(ref, () => ({
    /** 载入待维护实体及现有管理员，打开管理员设置弹窗。 */
    show: (item, admins) => {
      setRecord(item)
      setAdministrators(admins)
      setOpen(true)
    },
    hide,
  }))
  return (
    <ModalForm<SetAdministratorRequest>
      title={`设置${project ? '项目' : '企业'}管理员 · ${record?.name ?? ''}`}
      open={open}
      width={580}
      modalProps={{ destroyOnHidden: true, onCancel: hide }}
      onOpenChange={(visible) => {
        if (!visible) hide()
      }}
      submitter={{ searchConfig: { submitText: '保存管理员' } }}
      onFinish={
        /** 规范化新管理员账号，并按可选替换对象提交管理员设置。 */ async (values) => {
          if (!record) return false
          const ok = await onSave(record, {
            account: normalizeAccount(values.account),
            ...(values.replaceUserId ? { replaceUserId: values.replaceUserId } : {}),
          })
          if (ok) hide()
          return ok
        }
      }
    >
      <Alert
        type="info"
        showIcon
        title="补充或更换管理员"
        description="不选择被替换者表示补充管理员。更换时仅撤销旧管理员身份，保留其成员关系及其他角色；此操作不会启用已停用的工作空间。"
        style={{ marginBottom: 20 }}
      />
      <ProFormText
        name="account"
        label="新管理员完整账号"
        extra={project ? '新管理员须为有效的企业成员。' : '新管理员须为有效的已注册账号。'}
        rules={[{ required: true, pattern: ACCOUNT_PATTERN, message: '请输入完整账号' }]}
      />
      <ProFormSelect
        name="replaceUserId"
        label="被替换的管理员（可选）"
        placeholder="不选择，补充管理员"
        allowClear
        options={administrators.map((admin) => ({
          value: admin.id,
          label: `${admin.name}（${admin.account}）${admin.effective ? '' : ' · 当前无效'}`,
        }))}
      />
    </ModalForm>
  )
}
