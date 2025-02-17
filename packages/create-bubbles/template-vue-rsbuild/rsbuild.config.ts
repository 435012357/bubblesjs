import { defineConfig } from '@rsbuild/core';
import { pluginVue } from '@rsbuild/plugin-vue';
import AutoImport from 'unplugin-auto-import/rspack';

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
    port: process.env.PUBLIC_PORT,
  },
  plugins: [pluginVue()],
  tools: {
    rspack: {
      plugins: [
        AutoImport({
          imports: ['vue', 'vue-router'],
          dts: './src/types/auto-import.d.ts',
        }),
      ],
    },
  },
});
