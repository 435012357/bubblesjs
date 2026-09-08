import { Spin } from 'antd'
import styles from './PageLoading.module.css'

const Loading = () => {
  return (
    <div className={styles.pageLoading} role="status" aria-label="页面加载中">
      <Spin size="large" />
    </div>
  )
}

export default Loading
