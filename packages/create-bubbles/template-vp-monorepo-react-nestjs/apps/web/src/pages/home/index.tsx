import { ArrowRightOutlined, TableOutlined } from '@ant-design/icons'
import { PageContainer, ProCard } from '@ant-design/pro-components'
import { Button, Tag, Typography } from 'antd'
import { Link } from 'react-router'
import styles from './index.module.css'

export default function Home() {
  return (
    <PageContainer title="工作台" content="你的业务工作空间。">
      <ProCard title="业务模块" variant="outlined">
        <div className={styles.demo}>
          <TableOutlined className={styles.icon} />
          <div>
            <Typography.Title level={4}>
              项目管理 <Tag color="cyan">Demo</Tag>
            </Typography.Title>
            <Typography.Paragraph type="secondary">
              使用 ProTable 管理项目，体验搜索筛选、分页、新增编辑和批量操作。
            </Typography.Paragraph>
            <Link to="/examples/pro-table">
              <Button type="primary" icon={<ArrowRightOutlined />} iconPlacement="end">
                打开 ProTable 示例
              </Button>
            </Link>
          </div>
        </div>
      </ProCard>
    </PageContainer>
  )
}
