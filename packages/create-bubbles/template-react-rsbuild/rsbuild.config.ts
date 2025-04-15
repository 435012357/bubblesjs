import { defineConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'
import AutoImport from 'unplugin-auto-import/rspack'
import UnoCSS from '@unocss/postcss'

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
  plugins: [pluginReact()],
  tools: {
    rspack: {
      plugins: [
        AutoImport({
          imports: ['react', 'react-router', 'react-router-dom'],
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
