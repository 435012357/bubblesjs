import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// 只在明确隔离的本机环境运行验收，不读取或改写应用的开发配置。
const [runtimePath, workingDirectory, command, ...args] = process.argv.slice(2)
if (!runtimePath || !workingDirectory || !command) {
  throw new Error(
    '用法：node scripts/with-enterprise-test-env.mjs <临时配置路径> <工作目录> <命令> [...参数]',
  )
}

const runtime = JSON.parse(readFileSync(runtimePath, 'utf8').replace(/^\uFEFF/, ''))
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const cwd = resolve(root, workingDirectory)
if (relative(root, cwd).startsWith('..')) {
  throw new Error('测试工作目录必须在当前工程内')
}

const { database, storage, redisPort, serverPort, sessionPepper } = runtime
const isLocal = (host) => host === '127.0.0.1' || host === 'localhost'
const isPort = (port) => Number.isInteger(port) && port > 1024 && port < 65536
if (
  !isLocal(database?.host) ||
  !/^enterprise_(test|legacy)(_[a-z0-9]+)?$/.test(database?.database ?? '') ||
  !isPort(database?.port) ||
  !isPort(redisPort) ||
  !isPort(serverPort) ||
  !isLocal(new URL(storage?.endpoint).hostname) ||
  !storage?.bucket?.startsWith('enterprise-test-') ||
  typeof sessionPepper !== 'string' ||
  sessionPepper.length < 32
) {
  throw new Error('拒绝运行：需要独立本机数据库、Redis、对象存储及运行期会话密钥')
}

const databaseUrl = new URL(`postgresql://${database.host}:${database.port}/${database.database}`)
databaseUrl.username = database.user
databaseUrl.password = database.password

const env = {
  ...process.env,
  NODE_ENV: 'test',
  HOST: '127.0.0.1',
  PORT: String(serverPort),
  DATABASE_URL: databaseUrl.toString(),
  DB_HOST: database.host,
  DB_PORT: String(database.port),
  DB_DATABASE: database.database,
  DB_USERNAME: database.user,
  DB_PASSWORD: database.password,
  REDIS_HOST: '127.0.0.1',
  REDIS_PORT: String(redisPort),
  REDIS_DB: '0',
  REDIS_PASSWORD: '',
  SESSION_TOKEN_PEPPER: sessionPepper,
  QUEUE_REDIS_HOST: '127.0.0.1',
  QUEUE_REDIS_PORT: String(redisPort),
  QUEUE_REDIS_DB: '1',
  QUEUE_REDIS_USERNAME: '',
  QUEUE_REDIS_PASSWORD: '',
  QUEUE_PREFIX: 'enterprise:test:queue',
  STORAGE_ENDPOINT: storage.endpoint,
  STORAGE_REGION: storage.region,
  STORAGE_ACCESS_KEY_ID: storage.accessKeyId,
  STORAGE_SECRET_ACCESS_KEY: storage.secretAccessKey,
  STORAGE_BUCKET: storage.bucket,
}

const child = spawn(command, args, { cwd, env, stdio: 'inherit', shell: false })
child.on('error', () => {
  console.error('测试命令启动失败，请确认命令存在且允许启动子进程')
  process.exitCode = 1
})
child.on('exit', (code) => {
  process.exitCode = code ?? 1
})
process.on('SIGINT', () => child.kill('SIGINT'))
process.on('SIGTERM', () => child.kill('SIGTERM'))
