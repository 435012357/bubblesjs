import { registerAs } from '@nestjs/config'

/**
 * 加载 HTTP 端口和运行环境，未配置时使用开发环境默认值。
 */
export default registerAs('app', () => ({
  port: Number.parseInt(process.env.PORT ?? '3000', 10),
  env: process.env.NODE_ENV ?? 'development',
}))
