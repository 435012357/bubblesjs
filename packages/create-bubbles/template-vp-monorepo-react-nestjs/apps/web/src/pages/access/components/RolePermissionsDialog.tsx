import { Alert, Button, Modal, Space, Tree, type TreeDataNode } from 'antd'
import type { PermissionTreeResult, RoleRecord } from 'shared/types'

export interface RolePermissionsDialogRef {
  show: (record: RoleRecord, tree: PermissionTreeResult, readOnly: boolean) => void
  hide: () => void
}

/** 按可授予范围编辑角色权限，维护页面和操作权限的依赖关系。 */
export default function RolePermissionsDialog({
  ref,
  onSave,
}: {
  ref: Ref<RolePermissionsDialogRef>
  onSave: (record: RoleRecord, permissionKeys: string[]) => Promise<boolean>
}) {
  const [record, setRecord] = useState<RoleRecord>()
  const [tree, setTree] = useState<PermissionTreeResult>()
  const [selected, setSelected] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [readOnly, setReadOnly] = useState(false)
  const hide = () => setOpen(false)
  useImperativeHandle(ref, () => ({
    /** 载入角色、权限目录和只读状态，初始化勾选后打开权限弹窗。 */
    show: (item, data, readonly) => {
      setRecord(item)
      setTree(data)
      setSelected(item.permissionKeys)
      setReadOnly(readonly)
      setOpen(true)
    },
    hide,
  }))

  const permissions =
    tree?.permissions.filter(
      (permission) => !permission.adminOnly || record?.builtin === 'administrator',
    ) ?? []
  const grantable = new Set(tree?.grantablePermissionKeys ?? [])
  const existing = new Set(record?.permissionKeys ?? [])
  const definitionByKey = new Map(permissions.map((permission) => [permission.key, permission]))
  const treeData: TreeDataNode[] = permissions
    .filter((permission) => permission.kind === 'page')
    .map(
      /** 按页面组织权限树，把页面读取权限及其操作放入同一勾选组。 */ (page) => ({
        key: `group:${page.routeKey}`,
        title: page.title,
        children: [
          page,
          ...permissions.filter((permission) => permission.pagePermissionKey === page.key),
        ].map(
          /** 展示权限及废弃标记，仅允许调整既有授权或当前可授予的权限。 */ (permission) => ({
            key: permission.key,
            title: `${permission.kind === 'page' ? '访问页面' : permission.title}${permission.deprecated ? '（已废弃）' : ''}`,
            disabled: readOnly || (!grantable.has(permission.key) && !existing.has(permission.key)),
          }),
        ),
      }),
    )
  // 不在当前目录中的历史引用原样保留；清理由受控平台维护操作完成。
  const preserved = selected.filter((key) => !definitionByKey.has(key))

  /** 联动页面与操作权限勾选，并保留当前目录外的历史权限引用。 */
  function handleCheck(
    keys: Key[] | { checked: Key[]; halfChecked: Key[] },
    info: { checked: boolean; node: { key: Key } },
  ) {
    const next = new Set(
      (Array.isArray(keys) ? keys : keys.checked)
        .map(String)
        .filter((key) => definitionByKey.has(key)),
    )
    preserved.forEach((key) => next.add(key))
    const changed = definitionByKey.get(String(info.node.key))
    if (!info.checked && changed?.kind === 'page') {
      for (const permission of permissions)
        if (permission.pagePermissionKey === changed.key) next.delete(permission.key)
    }
    for (const key of next) {
      const page = definitionByKey.get(key)?.pagePermissionKey
      if (page) next.add(page)
    }
    setSelected([...next])
  }

  /** 提交角色权限配置，成功后关闭弹窗并在结束时解除保存状态。 */
  async function save() {
    if (!record) return
    setSaving(true)
    try {
      if (await onSave(record, selected)) hide()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={`${readOnly ? '查看' : '配置'}权限 · ${record?.name ?? ''}`}
      open={open}
      width={680}
      onCancel={hide}
      destroyOnHidden
      footer={
        readOnly ? (
          <Button onClick={hide}>关闭</Button>
        ) : (
          <Space>
            <Button onClick={hide}>取消</Button>
            <Button type="primary" loading={saving} onClick={() => void save()}>
              保存权限
            </Button>
          </Space>
        )
      }
    >
      <Alert
        type="info"
        showIcon
        title={
          record?.builtin
            ? '内置角色由系统维护，不能人工编辑。'
            : '按钮授权自动包含页面访问权限；取消页面访问将同步取消页面下的操作。'
        }
        description={
          record?.builtin
            ? '新增功能自动授予对应内置管理员，仍受功能启停状态约束。'
            : '只能新增你有权授予的权限。目录支持全选和半选；创建项目等管理员专属能力不在自定义角色树中。'
        }
      />
      {!readOnly && (
        <Space style={{ marginTop: 16 }}>
          <Button
            size="small"
            onClick={
              /** 补入全部可授予操作及其页面读取权限，并保留已有选择。 */ () =>
                setSelected([
                  ...new Set([
                    ...selected,
                    ...permissions
                      .filter((item) => grantable.has(item.key))
                      .flatMap((item) =>
                        item.pagePermissionKey ? [item.key, item.pagePermissionKey] : [item.key],
                      ),
                  ]),
                ])
            }
          >
            全选可授予权限
          </Button>
          <Button size="small" onClick={() => setSelected(preserved)}>
            清空可见权限
          </Button>
        </Space>
      )}
      <div className="permission-tree">
        <Tree
          disabled={readOnly}
          checkable
          defaultExpandAll
          checkedKeys={selected}
          treeData={treeData}
          onCheck={handleCheck}
        />
      </div>
      {preserved.length > 0 && (
        <Alert
          style={{ marginTop: 12 }}
          type="warning"
          title={`另有 ${preserved.length} 项历史权限引用将保留，须经平台维护流程清理。`}
        />
      )}
    </Modal>
  )
}
