import { TranslationOutlined } from '@ant-design/icons'
import { useI18n } from '@bubblesjs/i18n-react'
import { Button, Dropdown } from 'antd'
import { DEFAULT_LOCALE, isAppLocale, type AppLocale } from '@/i18n/config'

const localeItems = [
  { key: 'zh_CN', label: '简体中文' },
  { key: 'en_US', label: 'English' },
] satisfies Array<{ key: AppLocale; label: string }>

export interface LocaleSwitchProps {
  showLabel?: boolean
}

/** 切换并持久化应用语言，可选择是否显示当前语言名称。 */
export default function LocaleSwitch({ showLabel = true }: LocaleSwitchProps) {
  const { loadLocale, locale, tr } = useI18n()
  const [loading, setLoading] = useState(false)
  const activeLocale = isAppLocale(locale) ? locale : DEFAULT_LOCALE
  const activeLabel = localeItems.find((item) => item.key === activeLocale)?.label

  /** 加载所选语言资源，并在完成前阻止重复切换。 */
  async function handleLocaleChange(nextLocale: AppLocale) {
    if (loading || nextLocale === activeLocale) return
    setLoading(true)
    try {
      await loadLocale(nextLocale)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dropdown
      trigger={['click']}
      menu={{
        items: localeItems,
        selectedKeys: [activeLocale],
        onClick: ({ key }) => void handleLocaleChange(key as AppLocale),
      }}
    >
      <Button
        type="text"
        icon={<TranslationOutlined />}
        loading={loading}
        aria-label={tr('切换语言')}
      >
        {showLabel ? activeLabel : null}
      </Button>
    </Dropdown>
  )
}
