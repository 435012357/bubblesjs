import { networkInterfaces } from 'os'

const color = {
  cyan: (text: string) => `\x1b[36m${text}\x1b[0m`,
  green: (text: string) => `\x1b[32m${text}\x1b[0m`,
  bold: (text: string) => `\x1b[1m${text}\x1b[0m`,
}

/**
 * 为地址添加 OSC 8 超链接和颜色，使支持该协议的终端可以直接打开链接。
 */
function terminalLink(url: string) {
  return `\x1b]8;;${url}\x1b\\${color.cyan(url)}\x1b]8;;\x1b\\`
}

/**
 * 枚举本机非回环 IPv4 网卡，生成给定服务端口的局域网访问地址。
 */
export function getNetworkUrls(port: number) {
  return Object.values(networkInterfaces())
    .flatMap((items) => items ?? [])
    .filter((item) => item.family === 'IPv4' && !item.internal)
    .map((item) => `http://${item.address}:${port}/`)
}

/**
 * 打印服务器网络地址
 * @param port 服务器端口
 */
export function logNetworkUrls(port: number) {
  const localUrl = `http://localhost:${port}/`

  console.log(`\n  ${color.bold(color.green('NEST'))}  ${color.green('dev')}`)
  console.log(`  ${color.green('➜')}  ${color.bold('Local:')}   ${terminalLink(localUrl)}`)

  for (const url of new Set(getNetworkUrls(port))) {
    console.log(`  ${color.green('➜')}  ${color.bold('Network:')} ${terminalLink(url)}`)
  }
}
