import type { ThemeConfig } from 'antd'

/** Ant Design 与 ProComponents 共用的主题入口。 */
export const appTheme: ThemeConfig = {
  token: {
    colorPrimary: '#7864c4',
    colorInfo: '#7864c4',
    colorBgLayout: '#f5f3fc',
    colorText: '#302b49',
    colorTextSecondary: '#78718e',
    colorBorder: '#e1ddec',
    colorBorderSecondary: '#eeebf5',
    borderRadius: 12,
    controlHeight: 36,
    fontFamily: '"PingFang SC", "Microsoft YaHei", "Segoe UI", sans-serif',
  },
  components: {
    Button: { primaryShadow: '0 4px 12px rgba(120, 100, 196, 0.18)' },
    Card: { borderRadiusLG: 18 },
    Table: {
      headerBg: '#f5f3fb',
      headerColor: '#67607c',
      headerSplitColor: 'transparent',
      rowHoverBg: '#f7f5ff',
    },
    Menu: { itemBorderRadius: 12 },
    Layout: {
      headerBg: 'transparent',
      siderBg: 'transparent',
    },
  },
}

export const workspaceLayoutToken = {
  bgLayout: 'transparent',
  header: {
    heightLayoutHeader: 72,
    colorBgHeader: 'rgba(255, 255, 255, 0.56)',
    colorHeaderTitle: '#302b49',
    colorTextRightActionsItem: '#78718e',
  },
  sider: {
    colorMenuBackground: 'transparent',
    colorBgMenuItemSelected: '#e9e3fa',
    colorBgMenuItemHover: '#eeebf8',
    colorTextMenuSelected: '#6853ad',
    colorTextMenu: '#78718e',
    colorTextMenuItemHover: '#6853ad',
    colorTextMenuTitle: '#302b49',
    menuHeight: 46,
  },
}
