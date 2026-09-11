import { Spin } from 'antd'
import styles from './PageLoading.module.css'

/** 为路由懒加载提供居中且可被辅助技术识别的加载状态。 */
const Loading = () => {
  return (
    <div className={styles.pageLoading} role="status" aria-label="页面加载中">
      <Spin size="large" />
    </div>
  )
}

export default Loading
