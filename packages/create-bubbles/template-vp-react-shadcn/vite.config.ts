import path from 'path'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import AutoImport from 'unplugin-auto-import/vite'
import { defineConfig, loadEnv } from 'vite-plus'

export default defineConfig(({ mode }) => {
  const root = process.cwd()
  const env = loadEnv(mode, root)
  const { VITE_PORT } = env

  return {
    fmt: {
      printWidth: 80,
      semi: false,
      singleQuote: true,
      sortImports: {},
      sortTailwindcss: {},
      sortPackageJson: true,
      ignorePatterns: [
        '.agents/skills/**',
        'skills-lock.json',
        'src/types/auto-imports.d.ts',
      ],
    },
    lint: {
      plugins: [
        'import',
        'jsdoc',
        'promise',
        'react',
        'react-perf',
        'jsx-a11y',
      ],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      port: Number(VITE_PORT),
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      AutoImport({
        imports: ['react', 'react-router', 'react-dom'],
        dts: './src/types/auto-imports.d.ts',
      }),
      tailwindcss(),
    ],
    staged: {
      '*': 'vp check --fix',
    },
  }
})
