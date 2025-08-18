import { defineConfig, presetWind3 } from 'unocss'

export default defineConfig({
  content: {
    filesystem: ['**/*.{html,js,ts,jsx,tsx,vue,svelte,astro}'],
  },
  presets: [presetWind3()],
  shortcuts: [
    {
      'flex-center': 'flex justify-center items-center',
    },
  ],
})
