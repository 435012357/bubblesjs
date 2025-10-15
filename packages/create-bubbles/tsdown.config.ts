import { defineConfig } from 'tsdown'

export default defineConfig(() => ({
  entry: ['src/index.ts'],
  target: 'node20',
  minify: true,
  // inputOptions: {
  //   plugins: [
  //     {
  //       name: 'remove-console-debugger',
  //       transform: (code) => {
  //         if (process.env.NODE_ENV === 'production') {
  //           return code.replace(/console\.log\([^;]*\);?/g, '').replace(/debugger;?/g, '')
  //         }
  //         return code
  //       },
  //     },
  //   ],
  // },
}))
