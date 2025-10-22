import { defineConfig, presetUno } from 'unocss'

export default defineConfig({
  // content: {
  //   filesystem: [
  //     '**/*.{html,js,ts,jsx,tsx,vue,svelte,astro}',
  //   ],
  // },
  shortcuts: [
    {
      'flex-center': 'flex justify-center items-center',
    },
  ],
  presets: [
    presetUno(),
  ],
})
