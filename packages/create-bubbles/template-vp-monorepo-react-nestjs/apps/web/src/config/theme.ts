import type { ThemeConfig } from 'antd'

/** Ant Design 与 ProComponents 共用的主题入口。 */
export const appTheme: ThemeConfig = {
  token: {
    colorPrimary: '#176f88',
    colorInfo: '#176f88',
    colorBgLayout: '#f3f6f8',
    colorText: '#1a2938',
    colorBorderSecondary: '#dfe7ed',
    borderRadius: 6,
    fontFamily: '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
  },
  components: {
    Layout: {
      headerBg: '#ffffff',
      siderBg: '#ffffff',
    },
  },
}
