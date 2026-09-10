import { ArrowRightOutlined } from '@ant-design/icons'
import { LoginForm, ProFormText } from '@ant-design/pro-components'
import { useRequest } from 'alova/client'
import { Alert } from 'antd'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import type { RegisterRequest } from 'shared/types'
import { ACCOUNT_PATTERN, normalizeAccount } from 'shared/utils'
import { register } from './api'
import '../login/login.css'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { send, loading } = useRequest(register, { immediate: false })
  const [error, setError] = useState<string | null>(null)

  async function handleRegister(values: RegisterRequest) {
    if (loading) return false
    setError(null)
    try {
      await send({
        password: values.password,
        account: normalizeAccount(values.account),
        name: values.name.trim(),
      })
      void navigate('/login?registered=1', { replace: true })
      return true
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '注册失败，请稍后重试')
      return false
    }
  }

  return (
    <main className="login-page login-page-register">
      <title>注册 - 万物</title>
      <section className="login-brand-panel" aria-label="万物">
        <div className="login-brand">
          <span className="wanwu-mark" aria-hidden="true" />
          <span>万物</span>
        </div>
        <div className="login-story">
          <div className="login-orbit" aria-hidden="true">
            <span className="login-pearl" />
            <span className="login-orbit-ring" />
            <span className="login-orbit-satellite" />
          </div>
          <p className="login-eyebrow">WANWU</p>
          <h1>万物</h1>
          <p className="login-story-caption">企业与项目工作空间</p>
        </div>
        <div className="login-brand-footer">
          <span>一个账号，访问你加入的企业和项目。</span>
        </div>
      </section>
      <section className="login-form-panel" aria-labelledby="register-title">
        <div className="login-form-content">
          <p className="login-form-eyebrow">加入万物</p>
          <h2 id="register-title">创建账号</h2>
          <p className="login-description">
            注册后，将账号提供给企业管理员，待添加后即可进入工作空间。
          </p>
          <LoginForm<RegisterRequest>
            autoFocusFirstInput={false}
            requiredMark={false}
            contentStyle={{ width: '100%', minWidth: 0 }}
            containerStyle={{ padding: 0, minWidth: 0 }}
            onFinish={handleRegister}
            submitter={{
              searchConfig: { submitText: '注册账号' },
              submitButtonProps: {
                loading,
                size: 'large',
                icon: <ArrowRightOutlined />,
                iconPlacement: 'end',
              },
            }}
          >
            {error && (
              <Alert className="login-error" type="error" showIcon title={error} role="alert" />
            )}
            <ProFormText
              name="name"
              label="姓名"
              fieldProps={{ maxLength: 100, autoComplete: 'name', size: 'large' }}
              rules={[
                {
                  required: true,
                  whitespace: true,
                  min: 2,
                  max: 100,
                  message: '请输入 2–100 字姓名',
                },
              ]}
            />
            <ProFormText
              name="account"
              label="账号"
              extra="4–32 位字母、数字或下划线，添加成员时使用此账号。"
              fieldProps={{
                maxLength: 32,
                autoComplete: 'username',
                autoCapitalize: 'none',
                spellCheck: false,
                size: 'large',
              }}
              rules={[
                { required: true, message: '请输入账号' },
                {
                  pattern: ACCOUNT_PATTERN,
                  transform: (value: string) => value?.trim(),
                  message: '请输入 4–32 位字母、数字或下划线',
                },
              ]}
            />
            <ProFormText.Password
              name="password"
              label="密码"
              fieldProps={{ maxLength: 16, autoComplete: 'new-password', size: 'large' }}
              rules={[
                { required: true, message: '请输入密码' },
                { min: 8, max: 16, message: '密码长度为 8–16 位' },
              ]}
            />
            <ProFormText.Password
              name="confirmPassword"
              label="确认密码"
              dependencies={['password']}
              fieldProps={{ maxLength: 16, autoComplete: 'new-password', size: 'large' }}
              rules={[
                { required: true, message: '请再次输入密码' },
                ({ getFieldValue }) => ({
                  validator: (_, value) =>
                    value === getFieldValue('password')
                      ? Promise.resolve()
                      : Promise.reject(new Error('两次输入的密码不一致')),
                }),
              ]}
            />
          </LoginForm>
          <p className="login-account-hint">
            已有账号？<Link to="/login">返回登录</Link>
          </p>
        </div>
        <footer className="login-footer">万物 · 工作空间</footer>
      </section>
    </main>
  )
}
