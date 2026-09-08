import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import BubblesHome from './components/BubblesHome.vue'
import BubblesLayout from './components/BubblesLayout.vue'
import './style.css'
import './docs.css'

export default {
  extends: DefaultTheme,
  Layout: BubblesLayout,
  enhanceApp({ app }) {
    app.component('BubblesHome', BubblesHome)
  },
} satisfies Theme
