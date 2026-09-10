import { ArrowRightOutlined, LockOutlined, UserOutlined } from '@ant-design/icons'
import { LoginForm, ProFormText } from '@ant-design/pro-components'
import { useRequest } from 'alova/client'
import { Alert } from 'antd'
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import type { LoginRequest } from 'shared/types'
import { ACCOUNT_PATTERN, normalizeAccount } from 'shared/utils'
import { cookie } from '@/utils/storage/cookie'
import { login } from './api'
import './login.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { send, loading } = useRequest(login, { immediate: false })
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(values: LoginRequest) {
    if (loading) return false
    setError(null)
    try {
      const result = await send({
        account: normalizeAccount(values.account),
        password: values.password,
      })
      cookie.set('token', result.accessToken, {
        expires: new Date(result.absoluteExpiresAt),
      })
      void navigate('/workspaces', { replace: true })
      return true
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '登录失败，请稍后重试')
      return false
    }
  }

  return (
    <main className="login-page">
      <title>登录 - 万物</title>
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
          <span>登录后，选择你的工作空间。</span>
        </div>
      </section>

      <section className="login-form-panel" aria-labelledby="login-title">
        <div className="login-form-content">
          <p className="login-form-eyebrow">账号登录</p>
          <h2 id="login-title">欢迎回到万物</h2>
          <p className="login-description">登录账号，进入你的工作空间。</p>
          <LoginForm<LoginRequest>
            autoFocusFirstInput={false}
            requiredMark={false}
            contentStyle={{ width: '100%', minWidth: 0 }}
            containerStyle={{ padding: 0, minWidth: 0 }}
            onFinish={handleLogin}
            onValuesChange={() => {
              if (error) setError(null)
            }}
            submitter={{
              searchConfig: { submitText: '登录' },
              submitButtonProps: {
                size: 'large',
                loading,
                icon: <ArrowRightOutlined />,
                iconPlacement: 'end',
              },
            }}
          >
            {searchParams.has('registered') && (
              <Alert
                className="login-error"
                type="success"
                showIcon
                title="账号已创建，请登录后等待企业管理员添加。"
              />
            )}
            {error && (
              <Alert className="login-error" type="error" showIcon title={error} role="alert" />
            )}
            <ProFormText
              name="account"
              label="账号"
              placeholder="请输入账号"
              fieldProps={{
                prefix: <UserOutlined />,
                autoComplete: 'username',
                maxLength: 32,
                size: 'large',
                autoCapitalize: 'none',
                spellCheck: false,
              }}
              rules={[
                { required: true, whitespace: true, message: '请输入账号' },
                {
                  min: 4,
                  max: 32,
                  transform: (value: string) => value?.trim(),
                  message: '账号长度为 4–32 位',
                },
                {
                  pattern: ACCOUNT_PATTERN,
                  transform: (value: string) => value?.trim(),
                  message: '账号仅支持字母、数字和下划线',
                },
              ]}
            />
            <ProFormText.Password
              name="password"
              label="密码"
              placeholder="请输入密码"
              fieldProps={{
                prefix: <LockOutlined />,
                autoComplete: 'current-password',
                maxLength: 128,
                size: 'large',
              }}
              rules={[
                { required: true, message: '请输入密码' },
                { max: 128, message: '密码不能超过 128 位' },
              ]}
            />
          </LoginForm>
          <p className="login-account-hint">
            还没有账号？<Link to="/register">注册账号</Link>
          </p>
        </div>
        <footer className="login-footer">万物 · 工作空间</footer>
      </section>
    </main>
  )
}
