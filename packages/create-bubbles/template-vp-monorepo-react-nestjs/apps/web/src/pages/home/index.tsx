import { ArrowRightOutlined, TableOutlined } from '@ant-design/icons'
import { PageContainer, ProCard } from '@ant-design/pro-components'
import { Button, Tag, Typography } from 'antd'
import { useI18n } from '@bubblesjs/i18n-react'
import styles from './index.module.css'

/** 展示基础工作台的业务模块入口。 */
export default function Home() {
  const { tr } = useI18n()

  return (
    <PageContainer title={tr('工作台')} content={tr('你的业务工作空间。')}>
      <ProCard title={tr('业务模块')} variant="outlined">
        <div className={styles.demo}>
          <TableOutlined className={styles.icon} />
          <div>
            <Typography.Title level={4}>
              {tr('项目管理')} <Tag color="cyan">Demo</Tag>
            </Typography.Title>
            <Typography.Paragraph type="secondary">
              {tr('使用 ProTable 管理项目，体验搜索筛选、分页、新增编辑和批量操作。')}
            </Typography.Paragraph>
            <Link to="/examples/pro-table">
              <Button type="primary" icon={<ArrowRightOutlined />} iconPlacement="end">
                {tr('打开 ProTable 示例')}
              </Button>
            </Link>
          </div>
        </div>
      </ProCard>
    </PageContainer>
  )
}
