import { registerAs } from '@nestjs/config'

const SESSION_TTL_MS = 24 * 60 * 60 * 1000
/**
 * 读取并修剪必填环境变量，缺失或只有空白时终止配置加载。
 */
function readRequired(name: string): string {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(`${name} is required`)
  }

  return value
}

/**
 * 验证存储端点为 HTTP 或 HTTPS URL，并去掉末尾斜杠供 S3 客户端使用。
 */
function readEndpoint(): string {
  const value = readRequired('STORAGE_ENDPOINT')
  const url = new URL(value)

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('STORAGE_ENDPOINT must use http or https')
  }

  return url.toString().replace(/\/$/, '')
}

/**
 * 加载并校验对象存储连接凭据、目标桶和上传会话有效期。
 */
export default registerAs('storage', () => ({
  endpoint: readEndpoint(),
  region: process.env.STORAGE_REGION?.trim() || 'us-east-1',
  accessKeyId: readRequired('STORAGE_ACCESS_KEY_ID'),
  secretAccessKey: readRequired('STORAGE_SECRET_ACCESS_KEY'),
  bucket: readRequired('STORAGE_BUCKET'),
  forcePathStyle: true,
  sessionTtlMs: SESSION_TTL_MS,
}))
