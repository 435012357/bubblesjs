import { registerAs } from '@nestjs/config'

/**
 * 加载 PostgreSQL 连接配置，供连接池和数据库工具使用。
 */
export default registerAs('database', () => ({
  url: process.env.DATABASE_URL,
  host: process.env.DB_HOST ?? 'localhost',
  port: Number.parseInt(process.env.DB_PORT ?? '5432', 10),
  database: process.env.DB_DATABASE ?? 'postgres',
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD,
}))
