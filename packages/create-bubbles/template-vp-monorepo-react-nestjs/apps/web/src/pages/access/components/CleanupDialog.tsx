import { Alert, Button, Checkbox, Descriptions, Empty, List, Modal, Space, Tag } from 'antd'
import { useI18n } from '@bubblesjs/i18n-react'
import type { CleanupPreview, CleanupRequest } from 'shared/types'

export interface CleanupDialogRef {
  show: (preview: CleanupPreview) => void
  hide: () => void
}
/** 展示废弃权限影响范围，在确认预览凭据后提交清理。 */
export default function CleanupDialog({
  ref,
  onSave,
}: {
  ref: Ref<CleanupDialogRef>
  onSave: (data: CleanupRequest) => Promise<boolean>
}) {
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState<CleanupPreview>()
  const [confirmed, setConfirmed] = useState(false)
  const [saving, setSaving] = useState(false)
  const { tr } = useI18n()
  const hide = () => setOpen(false)
  useImperativeHandle(ref, () => ({
    /** 载入本次清理预览并重置人工确认状态。 */
    show: (value) => {
      setPreview(value)
      setConfirmed(false)
      setOpen(true)
    },
    hide,
  }))
  const executable = preview?.eligible && preview.items.length > 0 && Boolean(preview.proofDigest)

  /** 校验清理条件和人工确认状态，携带预览凭据提交废弃权限清理。 */
  async function clean() {
    if (!preview?.proofDigest || !executable || !confirmed) return
    setSaving(true)
    try {
      const success = await onSave({
        permissionKeys: preview.items.map((item) => item.permissionKey),
        proofDigest: preview.proofDigest,
      })
      if (success) hide()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={tr('废弃权限清理预览')}
      open={open}
      width={740}
      onCancel={hide}
      destroyOnHidden
      footer={
        <Space>
          <Button onClick={hide}>{tr('关闭')}</Button>
          <Button
            danger
            type="primary"
            disabled={!executable || !confirmed}
            loading={saving}
            onClick={() => void clean()}
          >
            {tr('确认清理废弃权限')}
          </Button>
        </Space>
      }
    >
      {!preview?.items.length ? (
        <Empty description={tr('当前没有需要清理的废弃权限。')} />
      ) : (
        <>
          <Alert
            type={executable ? 'warning' : 'info'}
            showIcon
            title={
              executable
                ? tr('执行后将清理这些权限及对应引用，请核对影响范围。')
                : tr('当前条件不满足，暂不能执行清理。')
            }
            description={tr(
              '仅处理功能目录明确标记为废弃的权限。执行时会重新检查当前引用和所有在用服务版本的发布条件。',
            )}
          />
          {!!preview.blockedReasons.length && (
            <Alert
              style={{ marginTop: 16 }}
              type="warning"
              title={tr('暂不能清理')}
              description={preview.blockedReasons.map((reason) => (
                <div key={reason}>{reason}</div>
              ))}
            />
          )}
          <Descriptions
            style={{ marginTop: 20 }}
            column={3}
            items={[
              { key: 'permissions', label: tr('权限'), children: preview.totals.permissions },
              { key: 'menus', label: tr('菜单节点'), children: preview.totals.menus },
              { key: 'roles', label: tr('角色授权引用'), children: preview.totals.roleAssignments },
            ]}
          />
          <List
            dataSource={preview.items}
            style={{ maxHeight: 340, overflow: 'auto' }}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <Space>
                      {tr(item.title)}
                      <Tag>{tr('{count} 个菜单', { count: item.menuIds.length })}</Tag>
                      <Tag>{tr('{count} 个角色', { count: item.roleCount })}</Tag>
                    </Space>
                  }
                  description={
                    <>
                      {item.permissionKey}
                      {item.blockedReasons.map((reason) => (
                        <div key={reason}>{reason}</div>
                      ))}
                    </>
                  }
                />
              </List.Item>
            )}
          />
          {executable && (
            <Checkbox checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)}>
              {tr('已核对权限、菜单和角色授权引用的清理范围')}
            </Checkbox>
          )}
        </>
      )}
    </Modal>
  )
}
