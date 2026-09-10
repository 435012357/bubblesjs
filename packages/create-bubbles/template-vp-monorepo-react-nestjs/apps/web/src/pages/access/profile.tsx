import { ProForm, ProFormText, ProFormTextArea } from '@ant-design/pro-components'
import { Alert, Button, Card, Descriptions, Space, Spin, Tag } from 'antd'
import { useEffect, useState } from 'react'
import type { CompanyDetail, ProjectDetail, UpdateProfileRequest } from 'shared/types'
import { accessScopeKey } from 'shared/utils'
import { managementApi } from './api'
import { useAccess, useManagementAction } from './use-access'

export default function ProfilePage() {
  const access = useAccess()
  const scopeKey = accessScopeKey(access.scope)
  const [record, setRecord] = useState<CompanyDetail | ProjectDetail>()
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(true)
  const [refresh, setRefresh] = useState(0)
  const execute = useManagementAction()
  const api = managementApi(access.scope)
  const canEdit = access.permissionKeys.includes(`${access.scope.type}.profile.update`)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(undefined)
    void api
      .profile()
      .then((value) => {
        if (active) setRecord(value)
      })
      .catch((cause: unknown) => {
        if (active && (cause as Error).name !== 'AbortError')
          setError(cause instanceof Error ? cause.message : '无法加载资料')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [scopeKey, refresh])

  return (
    <div className="workspace-page">
      <div className="workspace-page-title">
        <h1>{access.scope.type === 'company' ? '企业资料' : '项目资料'}</h1>
        <p>维护当前工作空间的名称、编码与说明。</p>
      </div>
      {error ? (
        <Alert
          type="error"
          showIcon
          title={error}
          action={<Button onClick={() => setRefresh((value) => value + 1)}>重试</Button>}
        />
      ) : loading ? (
        <Spin />
      ) : (
        record && (
          <Card style={{ maxWidth: 800 }}>
            <Descriptions
              column={2}
              style={{ marginBottom: 24 }}
              items={[
                {
                  key: 'status',
                  label: '当前状态',
                  children: (
                    <Tag color={record.status === 'active' ? 'success' : 'default'}>
                      {record.status === 'active' ? '启用' : '停用'}
                    </Tag>
                  ),
                },
                {
                  key: 'created',
                  label: '创建时间',
                  children: new Date(record.createdAt).toLocaleString(),
                },
                {
                  key: 'administrators',
                  label: '管理员',
                  span: 2,
                  children: (
                    <Space wrap>
                      {record.administrators.map((admin) => (
                        <Tag key={admin.id} color={admin.effective ? 'cyan' : 'default'}>
                          {admin.name}（{admin.account}）{admin.effective ? '' : ' · 当前无效'}
                        </Tag>
                      ))}
                    </Space>
                  ),
                },
              ]}
            />
            <ProForm<UpdateProfileRequest>
              key={`${record.id}:${record.version}`}
              initialValues={record}
              disabled={!canEdit}
              submitter={
                canEdit
                  ? { searchConfig: { submitText: '保存资料' }, resetButtonProps: false }
                  : false
              }
              onFinish={(values) =>
                execute(async () => {
                  const latest = await api.updateProfile({
                    name: values.name?.trim(),
                    code: values.code?.trim().toLowerCase(),
                    description: values.description?.trim(),
                    expectedVersion: record.version,
                  })
                  setRecord({ ...record, ...latest })
                })
              }
            >
              <ProFormText
                name="name"
                label="名称"
                rules={[
                  {
                    required: true,
                    whitespace: true,
                    min: 2,
                    max: 100,
                    message: '请输入 2–100 字名称',
                  },
                ]}
                fieldProps={{ maxLength: 100 }}
              />
              <ProFormText
                name="code"
                label="编码"
                rules={[
                  {
                    required: true,
                    pattern: /^[A-Za-z0-9_-]{2,32}$/,
                    message: '请输入 2–32 位字母、数字、下划线或短横线',
                  },
                ]}
                fieldProps={{ maxLength: 32 }}
              />
              <ProFormTextArea
                name="description"
                label="说明"
                fieldProps={{ rows: 4, maxLength: 500, showCount: true }}
              />
            </ProForm>
          </Card>
        )
      )}
    </div>
  )
}
