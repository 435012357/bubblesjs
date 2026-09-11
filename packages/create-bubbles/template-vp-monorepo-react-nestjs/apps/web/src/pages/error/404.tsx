import { Button, Result } from 'antd'

/** 提示路由地址不存在，并提供返回工作空间的入口。 */
export default function NotFound() {
  return (
    <Result
      status="404"
      title="页面不存在"
      subTitle="请检查地址，或返回工作空间重新选择。"
      extra={
        <Link to="/workspaces">
          <Button type="primary">返回工作空间</Button>
        </Link>
      }
    />
  )
}
