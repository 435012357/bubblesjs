// import colors from 'picocolors' // https://github.com/alexeyraspopov/picocolors
import fs from 'node:fs'
import path from 'node:path'
import * as prompts from '@clack/prompts'
import gradient from 'gradient-string' // https://github.com/bokub/gradient-string
import mri from 'mri' // http://github.com/lukeed/mri
import spawn from 'cross-spawn'
import fsPromise from 'node:fs/promises'
import type { Framework } from './interface'

// const { blue, blueBright, cyan, green, greenBright, magenta, red, redBright, reset, yellow } =
//   colors // 终端输出添加颜色

const colorMap = {
  vue: gradient(['#42B883', '#42B883']),
  react: gradient(['#087EA4', '#087EA4']),
  others: gradient(['#8B5CF6', '#A855F7']),
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

/** 执行命令的绝对路径 代指执行命令的地方 */
const cwd = process.cwd()

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

const pkgFromUserAgent = (userAgent?: string): PkgInfo | undefined => {
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

const emptyDir = async (dir: string) => {
  await Promise.all(
    fs
      .readdirSync(dir)
      .filter((file) => file !== '.git')
      .map((file) => fs.promises.rm(path.resolve(dir, file), { recursive: true, force: true })),
  )
}
/**
 * 验证包名是否满足以 @ - * ~ 字母 数字 开头 并且
 * 第一个?: 代表非捕获模式 第二个代表 可有可无
 * @scope/abc  abc
 * (?:@[a-z\d\-*~][a-z\d\-*._~]*\/)?  => 匹配 @scope/
 * [a-z\d\-~][a-z\d\-._~]*  匹配 / 后面
 *
 * @param packageName
 * @returns
 */
const isValidPackageName = (packageName: string) => {
  return /^(?:@[a-z\d\-*~][a-z\d\-*._~]*\/)?[a-z\d\-~][a-z\d\-._~]*$/.test(packageName)
}

/**
 * 把不合法的包名元素替换掉
 * @param packageName
 * @returns
 */
const toValidPackageName = (packageName: string) => {
  return packageName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/^[._]/, '')
    .replace(/[^a-z\d\-~]+g/, '-')
}

const FRAMEWORKS: Framework[] = [
  {
    name: 'vue',
    display: 'Vue',
    color: colorMap.vue,
    variants: [
      {
        name: 'rsbuild-biome',
        display: 'rsbuild + biome',
        color: colorMap.vue,
      },
      {
        name: 'rolldown-oxc',
        display: 'rolldown + oxc',
        color: colorMap.vue,
      },
    ],
  },
  {
    name: 'react',
    display: 'React',
    color: colorMap.react,
    variants: [
      {
        name: 'rsbuild-biome',
        display: 'rsbuild-biome',
        color: colorMap.react,
      },
    ],
  },
  {
    name: 'others',
    display: 'Others',
    color: colorMap.others,
    variants: [
      {
        name: 'create-eletron-vite',
        display: 'Electron ↗',
        color: colorMap.others,
        customCommand: 'pnpm create electron-vite@latest TARGET_DIR',
      },
    ],
  },
]

const TEMPLATES = FRAMEWORKS.map((f) => f.variants.map((v) => `${f.name}-${v.name}`)).reduce(
  (a, b) => a.concat(b),
  [],
)

/**
 *
 * @param customCommand
 * @param pkgInfo  { name: 'pnpm', version: '10.0.0' }
 * @returns
 */
const getFullCustomCommand = (customCommand: string, pkgInfo?: PkgInfo) => {
  console.log('💦customCommand', customCommand, pkgInfo)
  const pkgManager = pkgInfo ? pkgInfo.name : 'npm'
  const isYarn1 = pkgManager === 'yarn' && pkgInfo?.version.startsWith('1.')

  return (
    customCommand
      .replace(/^npm create (?:-- )?/, () => {
        if (pkgManager === 'bun') {
          return 'bun x create-'
        }

        if (pkgManager === 'pnpm') {
          return 'pnpm create '
        }

        /** 这里的 -- 时参数分隔符 前面的给 npm create 后面的 给 create-vite 这个脚手架  */
        return customCommand.startsWith('npm create -- ')
          ? `${pkgManager} create -- `
          : `${pkgManager} create `
      })
      // Only Yarn 1.x doesn't support `@version` in the `create` command
      .replace('@latest', () => (isYarn1 ? '' : '@latest'))
      .replace(/^npm exec/, () => {
        // Prefer `pnpm dlx`, `yarn dlx`, or `bun x`
        if (pkgManager === 'pnpm') {
          return 'pnpm dlx'
        }
        if (pkgManager === 'yarn' && !isYarn1) {
          return 'yarn dlx'
        }
        if (pkgManager === 'bun') {
          return 'bun x'
        }
        // Use `npm exec` in all other cases
        // including Yarn 1.x and other custom npm clients
        return 'npm exec'
      })
  )
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
  /** 项目名 */
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
              label: `${colorMap.vue('Cancel operation')}`,
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

  // 3. 获取包名 package.json name
  // console.log('💦targetDir', targetDir)
  // console.log('💦targetDir', path.resolve(targetDir))
  // console.log('💦targetDir', path.basename(path.resolve(targetDir)))
  /** 提取绝对路径最后的path 与 targetDir 不同 因为 targetDir 可以输入 xxx/xxx */
  let packageName = path.basename(path.resolve(targetDir))
  if (!isValidPackageName(packageName)) {
    const packageNameResult = await prompts.text({
      message: 'Package name is invalid. please input again:',
      defaultValue: toValidPackageName(packageName),
      placeholder: toValidPackageName(packageName),
      validate(dir) {
        if (!isValidPackageName(dir)) {
          return 'Invalid package.json name'
        }
      },
    })
    if (prompts.isCancel(packageNameResult)) return cancel()
    packageName = packageNameResult
  }

  // 4. 选择模板
  let template = argTemplate
  let hasInvalidArgTemplate = false

  /** 输入的-t 模板不能存在 */
  if (argTemplate && !TEMPLATES.includes(argTemplate)) {
    template = undefined
    hasInvalidArgTemplate = true
  }
  if (!template) {
    const framework = await prompts.select({
      message: hasInvalidArgTemplate
        ? `"${argTemplate}" isn't a valia template. please choose from below:`
        : 'Select a framework',
      options: FRAMEWORKS.map((framework) => {
        const frameworkColor = framework.color
        return {
          label: frameworkColor(framework.display),
          value: framework,
        }
      }),
    })
    if (prompts.isCancel(framework)) return cancel()

    console.log('💦pkgInfo', pkgInfo)

    const variant = await prompts.select({
      message: 'Select a variant:',
      options: framework.variants.map((variant) => {
        const variantColor = variant.color
        const command = variant.customCommand
          ? getFullCustomCommand(variant.customCommand, pkgInfo).replace(/ TARGET_DIR$/, '')
          : undefined
        return {
          label: variantColor(variant.display || variant.name),
          value: variant.name,
          hint: command,
        }
      }),
    })
    if (prompts.isCancel(variant)) return cancel()
    template = variant
    console.log('💦template', template)
  }

  /** 合起来就是 项目文件夹的 绝对路径  */
  const root = path.join(cwd, targetDir)
  // recursive 递归 是防止用户输入的是 targetDir 是个多级目录 比如 abc/template-project
  fs.mkdirSync(root, { recursive: true })

  // determine template
  let isReactSwc = false
  if (template.includes('-swc')) {
    isReactSwc = true
    template = template.replace('-swc', '')
  }

  const pkgManager = pkgInfo ? pkgInfo.name : 'npm'

  const { customCommand } =
    FRAMEWORKS.flatMap((f) => f.variants).find((v) => v.name === template) ?? {}

  if (customCommand) {
    const fullCustomCommand = getFullCustomCommand(customCommand, pkgInfo)
    const [command, ...args] = fullCustomCommand.split(' ')

    // we replace TARGET_DIR here
    const replacedArgs = args.map((arg) => arg.replace('TARGET_DIR', () => targetDir))

    console.log('💦replacedArgs', replacedArgs)

    /** 这里的  inherit 表示继承父进程的输入输出  */
    const { status } = spawn.sync(command, replacedArgs, { stdio: 'inherit' })
    process.exit(status ?? 0)
  }

  prompts.log.step(`scaffolding project in ${root}...`)
}

init().catch((e) => {
  console.error('💦', e)
})
