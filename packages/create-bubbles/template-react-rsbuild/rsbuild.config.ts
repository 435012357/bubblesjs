import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
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
  },
});
