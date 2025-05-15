import { defineConfig } from '@rsbuild/core'
import { pluginVue } from '@rsbuild/plugin-vue'
import AutoImport from 'unplugin-auto-import/rspack'
import UnoCSS from '@unocss/postcss'
import { pluginSass } from '@rsbuild/plugin-sass'

export default defineConfig({
  html: {
    template: './index.html',
  },
  resolve: {
    alias: {
      '@': './src',
    },
  },
  server: {
    port: Number(process.env.PUBLIC_PORT),
  },
  plugins: [pluginVue(), pluginSass()],
  tools: {
    rspack: {
      plugins: [
        AutoImport({
          imports: ['vue', 'vue-router'],
          dts: './src/types/auto-import.d.ts',
        }),
      ],
    },
    postcss: {
      postcssOptions: {
        plugins: [UnoCSS()],
      },
    },
  },
})
