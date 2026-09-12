import { Button, Result } from 'antd'
import { useI18n } from '@bubblesjs/i18n-react'

/** 提示路由地址不存在，并提供返回工作空间的入口。 */
export default function NotFound() {
  const { tr } = useI18n()

  return (
    <Result
      status="404"
      title={tr('页面不存在')}
      subTitle={tr('请检查地址，或返回工作空间重新选择。')}
      extra={
        <Link to="/workspaces">
          <Button type="primary">{tr('返回工作空间')}</Button>
        </Link>
      }
    />
  )
}
