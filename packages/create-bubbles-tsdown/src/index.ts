// import colors from 'picocolors' // https://github.com/alexeyraspopov/picocolors
import gradient from 'gradient-string' // https://github.com/bokub/gradient-string
import mri from 'mri' // http://github.com/lukeed/mri
import * as prompts from '@clack/prompts'
import fs from 'node:fs'
import path from 'node:path'

// const { blue, blueBright, cyan, green, greenBright, magenta, red, redBright, reset, yellow } =
//   colors // 终端输出添加颜色

const colorMap = {
  vue: gradient(['#42B883', 'white']),
  react: gradient(['#087EA4', 'white']),
}

/**
 * process.argv 是 node index.js 前两个参数
 * 第一个参数是 node 可执行文件的路径
 * 第二个参数是当前执行的脚本文件的路径
 * 虽然最终使用的是 pnpm create bubbles 但最后都会指向bin 执行 node index.js
 */

const argv = mri<{
  template?: string
  help?: boolean
  overwrite?: boolean
}>(process.argv.slice(2), {
  alias: { h: 'help', t: 'template' }, // 缩写 比如 -h 就像变成 h:true help:true
  boolean: ['help', 'overwrite'], // 指定 help overwrite 为 boolean 类型
  string: ['template'], // 指定 template 为 string 类型
})

const cwd = process.cwd() // 执行命令的绝对路径 代指执行命令的地方

const helpMessage = `\
Usage: create-bubbles [OPTION]... [DIRECTORY]

Create a new Bubbles project in JavaScript or TypeScript.
With no arguments, start the CLI in interactive mode.

Options:
  -t, --template NAME        use a specific template

Available templates:
${colorMap.vue('vue-rsbuild-biome        vue')}
${colorMap.vue('vue-rolldown-oxc         vue')}
${colorMap.react('react-rsbuild-biome       react')}
${colorMap.react('react-rolldown-oxc       react')}`

// const FRAMEWORK = [
//  {
//   name: 'vue'
//  }
// ]

/**
 * 去除空格并且替换掉末尾一个或者多个“/”
 * @param targetDir
 * @returns
 */
const formatTargetDir = (targetDir: string) => {
  return targetDir.trim().replace(/\/+$/g, '')
}

interface PkgInfo {
  name: string
  version: string
}

const pkgFromUserAgent = (userAgent?: string): PkgInfo | void => {
  if (!userAgent) return
  const pkgSpec = userAgent.split(' ')[0]
  const pkgSpecArr = pkgSpec.split('/')
  return {
    name: pkgSpecArr[0],
    version: pkgSpecArr[1],
  }
}

/**
 * 要么没有文件要么只有一个.git 文件夹
 * @param path
 * @returns
 */
const isEmpty = (path: string) => {
  const files = fs.readdirSync(path)
  return files.length === 0 || (files.length === 1 && files[0] === '.git')
}

const emptyDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    return
  }
  for (const file of fs.readdirSync(dir)) {
    if (file === '.git') {
      continue
    }
    fs.rmSync(path.resolve(dir, file), { force: true, recursive: true })
  }
}

const init = async () => {
  console.log(argv)
  /**
   * 取的是那些没有 --key value的参数 这里代指模板
   * bun index.js template-vue -t vue -s 12321  template-react
   * {
   * _: [ "template-vue", "template-react" ],
   * t: "vue",
   * s: 12321,
   * template: "vue",
   * }
   */
  const argTargetDir = argv._[0] ? formatTargetDir(argv._[0]) : undefined

  const argTemplate = argv.template
  const argOverwrite = argv.overwrite

  const defaultTargetDir = 'bubbles-project'

  // 1. 先看有没有help 参数
  const help = argv.help
  if (help) {
    console.log(helpMessage)
    return
  }

  //   - pnpm exec node packages/create-bubbles-tsdown/index.js
  // - 或 npm exec node packages/create-bubbles-tsdown/index.js
  const pkgInfo = pkgFromUserAgent(process.env.npm_config_user_agent) // 获取用户
  const cancel = () => prompts.cancel('Operation cancelled')

  // 2. 创建交互 让用户输入项目名 并提共默认值
  let targetDir = argTargetDir
  if (!targetDir) {
    const projectName = await prompts.text({
      message: 'Project name',
      defaultValue: defaultTargetDir,
      placeholder: defaultTargetDir,
      validate: (value) => {
        return value.length === 0 || formatTargetDir(value).length > 0
          ? undefined
          : 'Invalid project name'
      },
    })
    if (prompts.isCancel(projectName)) return cancel()
    targetDir = formatTargetDir(projectName)
  }

  // 2. 如果文件夹存在不为空
  if (fs.existsSync(targetDir) && !isEmpty(targetDir)) {
    const overwrite = argOverwrite
      ? 'yes'
      : await prompts.select({
          message:
            targetDir === '.'
              ? 'Current directory'
              : `Target directory "${targetDir}" is not empty. Please choose how to proceed:`,
          options: [
            {
              label: 'Cancel operation',
              value: 'no',
            },
            {
              label: 'Remove existing files and continue',
              value: 'yes',
            },
            {
              label: 'Ignore files and continue',
              value: 'ignore',
            },
          ],
        })
    // 处理 目录中取消
    if (prompts.isCancel(overwrite)) return cancel()
    switch (overwrite) {
      case 'yes':
        emptyDir(targetDir)
        break
      case 'no':
        cancel()
        return
    }
  }

  // 3. 获取包名
  let packageName = path.basename(path.resolve(targetDir))
}

init().catch((e) => {
  console.error('💦', e)
})
