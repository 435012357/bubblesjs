import { registerAs } from '@nestjs/config'

export interface RedisConfig {
  host: string
  port: number
  password?: string
  db: number
}

/**
 * 加载会话 Redis 的单节点连接配置及逻辑库编号。
 */
export default registerAs(
  'redis',
  (): RedisConfig => ({
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number.parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: Number.parseInt(process.env.REDIS_DB ?? '0', 10),
  }),
)
