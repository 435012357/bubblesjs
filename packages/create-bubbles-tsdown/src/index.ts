// import colors from 'picocolors' // https://github.com/alexeyraspopov/picocolors
import gradient from 'gradient-string'; // https://github.com/bokub/gradient-string
import mri from 'mri'; // http://github.com/lukeed/mri

// const { blue, blueBright, cyan, green, greenBright, magenta, red, redBright, reset, yellow } =
//   colors // 终端输出添加颜色

const colorMap = {
  vue: gradient(['#42B883', 'white']),
  react: gradient(['#087EA4', 'white']),
};

/**
 * process.argv 是 node index.js 前两个参数
 * 第一个参数是 node 可执行文件的路径
 * 第二个参数是当前执行的脚本文件的路径
 * 虽然最终使用的是 pnpm create bubbles 但最后都会指向bin 执行 node index.js
 */

const argv = mri<{
  template?: string;
  help?: boolean;
  overwrite?: boolean;
}>(process.argv.slice(2), {
  alias: { h: 'help', t: 'template' }, // 缩写 比如 -h 就像变成 h:true help:true
  boolean: ['help', 'overwrite'], // 指定 help overwrite 为 boolean 类型
  string: ['template'], // 指定 template 为 string 类型
});

const cwd = process.cwd(); // 执行命令的绝对路径

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
${colorMap.react('react-rolldown-oxc       react')}`;

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
  return targetDir.trim().replace(/\/+$/g, '');
};

const init = async () => {
  console.log(argv);
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
  const argTargetDir = argv._[0] ? formatTargetDir(argv._[0]) : undefined; 

  const argTemplate = argv.template;
  const argOverwirte = argv.overwrite;



  console.log('💦argTargetDir', argTargetDir);
};

init().catch((e) => {
  console.error('💦', e);
});
