import { defineConfig, presetWind3 } from 'unocss'

export default defineConfig({
  content: {
    filesystem: ['**/*.{html,js,ts,jsx,tsx,vue,svelte,astro}'],
  },
  presets: [presetWind3()],
  rules: [],
  shortcuts: [['flex-center', 'flex items-center justify-center']],
})
