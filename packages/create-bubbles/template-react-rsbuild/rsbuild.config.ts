import { defineConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'
import AutoImport from 'unplugin-auto-import/rspack'
import UnoCSS from '@unocss/postcss'
import { pluginSass } from '@rsbuild/plugin-sass'
import { pluginSvgr } from '@rsbuild/plugin-svgr'

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
  plugins: [
    pluginReact(),
    pluginSass({
      sassLoaderOptions: {
        // additionalData: `@import "@/styles/variables.scss";`,
      },
    }),
    pluginSvgr(),
  ],
  tools: {
    rspack: {
      plugins: [
        AutoImport({
          imports: ['react', 'react-router'],
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
