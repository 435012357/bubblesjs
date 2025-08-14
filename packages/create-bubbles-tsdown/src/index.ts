import mri from 'mri' // http://github.com/lukeed/mri
import colors from 'picocolors' // https://github.com/alexeyraspopov/picocolors

const { blue, blueBright, cyan, green, greenBright, magenta, red, redBright, reset, yellow } =
  colors // 终端输出添加颜色

/**
 * process.argv 是 node index.js 前两个参数
 * 第一个参数是 node 可执行文件的路径
 * 第二个参数是当前执行的脚本文件的路径
 * 虽然最终使用的是 pnpm create bubbles 但最后都会指向bin 执行 node index.js
 */

const argv = mri(process.argv.slice(2), {
  alias: { h: 'help', t: 'template' }, // 缩写 比如 --h 就像变成 h:true help:true
  boolean: ['help', 'overwrite'], // 指定 help overwrite 为 boolean 类型
  string: ['template'], // 指定 template 为 string 类型
})

const cwd = process.cwd() // 执行命令的绝对路径

const helpMessage = `\
Usage: create-bubbles [OPTION]... [DIRECTORY]

Create a new Bubbles project in JavaScript or TypeScript.
With no arguments, start the CLI in interactive mode.

Options:
  -t, --template NAME        use a specific template

Available templates:
${yellow('vanilla-ts     vanilla')}
${green('vue-ts         vue')}
${cyan('react-ts       react')}
${cyan('react-swc-ts   react-swc')}
${magenta('preact-ts      preact')}
${redBright('lit-ts         lit')}
${red('svelte-ts      svelte')}
${blue('solid-ts       solid')}
${blueBright('qwik-ts        qwik')}`

const init = async () => {
  console.log(helpMessage)
  const argTargetDir = argv._[0]
}

init().catch((e) => {
  console.error('💦', e)
})
