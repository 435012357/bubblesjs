import type { App } from 'vue'

import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

export const store = createPinia()
store.use(piniaPluginPersistedstate)

/** 将已配置持久化插件的 Pinia 实例安装到 Vue 应用。 */
export function setupStore(app: App) {
  app.use(store)
}
