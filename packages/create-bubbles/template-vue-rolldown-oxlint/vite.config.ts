import { defineConfig } from 'vite'
import path from 'node:path'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  return {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    plugins: [
      vue(),
      AutoImport({
        imports: ['vue', 'vue-router'],
        dts: './src/types/auto-import.d.ts',
      }),
    ],
  }
})
