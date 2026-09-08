import { AppstoreOutlined, ArrowRightOutlined, LockOutlined, UserOutlined } from '@ant-design/icons'
import { LoginForm, ProFormText } from '@ant-design/pro-components'
import { useRequest } from 'alova/client'
import { Alert } from 'antd'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import type { LoginRequest } from 'shared/types'
import { ACCOUNT_PATTERN, normalizeAccount } from 'shared/utils'
import { cookie } from '@/utils/storage/cookie'
import { login } from './api'
import './login.css'

function ModuleDrawing() {
  return (
    <svg className="login-drawing" viewBox="0 0 540 360" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.5">
        <path d="M156 88h38a24 24 0 0 1 24 24v30M322 180h52a24 24 0 0 0 24-24v-28M218 218v38a24 24 0 0 1-24 24h-54M322 218v50a24 24 0 0 0 24 24h54" />
        <path
          d="M100 130v58a24 24 0 0 0 24 24h42M444 240v-28a24 24 0 0 0-24-24h-46"
          strokeDasharray="4 7"
          opacity=".35"
        />
        <g fill="var(--login-panel-bg)">
          <rect x="52" y="46" width="104" height="84" rx="12" />
          <rect x="354" y="48" width="104" height="80" rx="12" />
          <rect x="60" y="244" width="80" height="72" rx="12" />
          <rect x="396" y="248" width="88" height="68" rx="12" />
        </g>
        <path
          d="M76 72h24v24H76zM112 72h20M112 84h12M112 96h20M378 74h56M378 88h36M378 102h46M80 264h40M80 278h24M80 292h32"
          opacity=".7"
        />
        <circle cx="440" cy="282" r="14" />
        <path d="m434 282 4 4 8-9" stroke="var(--login-accent)" />
        <rect
          x="218"
          y="128"
          width="104"
          height="104"
          rx="20"
          fill="var(--login-panel-bg)"
          stroke="var(--login-accent)"
        />
        <g stroke="var(--login-accent)" strokeWidth="2">
          <rect x="244" y="154" width="20" height="20" rx="3" />
          <rect x="276" y="154" width="20" height="20" rx="3" />
          <rect x="244" y="186" width="20" height="20" rx="3" />
          <rect x="276" y="186" width="20" height="20" rx="3" />
        </g>
        <g fill="var(--login-accent)" stroke="none">
          <circle cx="194" cy="88" r="3" />
          <circle cx="374" cy="180" r="3" />
          <circle cx="218" cy="256" r="3" />
        </g>
      </g>
    </svg>
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
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
      void navigate('/home', { replace: true })
      return true
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '登录失败，请稍后重试')
      return false
    }
  }

  return (
    <main className="login-page">
      <title>登录 - 通用平台</title>
      <section className="login-brand-panel" aria-label="通用平台">
        <div className="login-brand">
          <AppstoreOutlined />
          <span>通用平台</span>
        </div>
        <div className="login-story">
          <p className="login-eyebrow">UNIVERSAL PLATFORM</p>
          <h1>
            连接业务，
            <br />
            从这里开始。
          </h1>
          <ModuleDrawing />
        </div>
        <div className="login-brand-footer">
          <span>一个平台，多种可能</span>
          <span>UNIVERSAL PLATFORM</span>
        </div>
      </section>

      <section className="login-form-panel" aria-labelledby="login-title">
        <div className="login-form-content">
          <p className="login-form-eyebrow">WORKSPACE</p>
          <h2 id="login-title">登录工作台</h2>
          <p className="login-description">欢迎回来，请使用平台账号登录。</p>
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
          <p className="login-account-hint">请使用已开通的账号，账号区分于显示名称。</p>
        </div>
        <footer className="login-footer">通用平台 · 业务工作空间</footer>
      </section>
    </main>
  )
}
