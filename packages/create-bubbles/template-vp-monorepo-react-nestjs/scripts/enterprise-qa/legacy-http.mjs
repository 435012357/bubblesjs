import { spawn } from 'node:child_process'
import { resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { createServer } from 'node:net'
import {
  root,
  loadRuntime,
  privateStatePath,
  readPrivateState,
  createReporter,
  ensure,
  randomIdentity,
} from './runtime.mjs'
import { apiClient, loginIdentity, registerIdentity } from './http-support.mjs'

const { runtime, runtimePath } = loadRuntime(process.argv[2])
const legacy = readPrivateState(privateStatePath(runtimePath, 'legacy'))
ensure(
  legacy.stage === 'upgraded' && /^enterprise_legacy_[a-z0-9]+$/.test(legacy.database),
  '必须先完成真实旧库迁移验证',
)
const report = createReporter('legacy-http')
const { database, storage } = runtime
const databaseUrl = new URL(`postgresql://${database.host}:${database.port}/${legacy.database}`)
databaseUrl.username = database.user
databaseUrl.password = database.password
const port = 3302
const request = apiClient({ ...runtime, serverPort: port })
let child

async function assertPortFree() {
  await new Promise((resolve, reject) => {
    const probe = createServer()
    probe.once('error', () => reject(new Error('3302已被占用，拒绝接管已有进程')))
    probe.listen(port, '127.0.0.1', () => probe.close(resolve))
  })
}

try {
  await assertPortFree()
  const env = {
    ...process.env,
    NODE_ENV: 'test',
    HOST: '127.0.0.1',
    PORT: String(port),
    DATABASE_URL: databaseUrl.toString(),
    DB_HOST: database.host,
    DB_PORT: String(database.port),
    DB_DATABASE: legacy.database,
    DB_USERNAME: database.user,
    DB_PASSWORD: database.password,
    REDIS_HOST: '127.0.0.1',
    REDIS_PORT: String(runtime.redisPort),
    REDIS_DB: '2',
    REDIS_PASSWORD: '',
    SESSION_TOKEN_PEPPER: runtime.sessionPepper,
    QUEUE_REDIS_HOST: '127.0.0.1',
    QUEUE_REDIS_PORT: String(runtime.redisPort),
    QUEUE_REDIS_DB: '3',
    QUEUE_REDIS_USERNAME: '',
    QUEUE_REDIS_PASSWORD: '',
    QUEUE_PREFIX: 'enterprise:legacy:queue',
    QUEUE_WORKER_ENABLED: 'false',
    STORAGE_ENDPOINT: storage.endpoint,
    STORAGE_REGION: storage.region,
    STORAGE_ACCESS_KEY_ID: storage.accessKeyId,
    STORAGE_SECRET_ACCESS_KEY: storage.secretAccessKey,
    STORAGE_BUCKET: storage.bucket,
  }
  child = spawn(process.execPath, ['dist/src/main.js'], {
    cwd: resolve(root, 'apps/server'),
    env,
    stdio: 'ignore',
    windowsHide: true,
  })
  child.on('error', () => {})
  let ready = false
  for (let attempt = 0; attempt < 80; attempt++) {
    if (child.exitCode !== null) break
    try {
      const response = await fetch(`http://127.0.0.1:${port}/`, {
        signal: AbortSignal.timeout(500),
      })
      if (response.status === 200) {
        ready = true
        break
      }
    } catch {}
    await delay(250)
  }
  ensure(ready, '隔离旧库HTTP实例未能启动')
  await report.check({
    id: 'legacy-user-real-http-login',
    acceptance: ['AC-08'],
    run: async () => {
      await loginIdentity({ request, identity: legacy.identity })
      const me = (await request({ actor: legacy.identity, path: '/auth/me' })).body
      ensure(
        me.id === legacy.identity.id && me.account === legacy.identity.account,
        '旧用户登录身份未保留',
      )
      const spaces = (await request({ actor: legacy.identity, path: '/workspaces' })).body
      ensure(spaces.workspaces.length === 0, '旧用户被自动分配工作空间')
      return '旧0000/0001库账号在新服务真实登录成功，身份保留且未自动分配企业'
    },
  })
  await report.check({
    id: 'legacy-upload-owner-real-http',
    acceptance: ['AC-08'],
    run: async () => {
      const upload = (
        await request({ actor: legacy.identity, path: `/uploads/multipart/${legacy.uploadId}` })
      ).body
      ensure(upload.status === 'completed', '旧owner无法读取自己的完成上传记录')
      const outsider = await registerIdentity({ request, identity: randomIdentity('legacy_other') })
      await loginIdentity({ request, identity: outsider })
      await request({
        actor: outsider,
        path: `/uploads/multipart/${legacy.uploadId}`,
        expected: 404,
      })
      return '旧上传记录owner可读取、不同真实登录用户404；此夹具验证历史归属，真实对象写入另见http-upload-owner-regression'
    },
  })
} catch (error) {
  report.results.push({
    id: 'legacy-http-environment',
    acceptance: ['AC-08'],
    status: 'failed',
    evidence: error instanceof Error ? error.message : '旧库HTTP验收失败',
  })
  process.stdout.write('FAIL legacy-http-environment\n')
} finally {
  if (child && child.exitCode === null) {
    child.kill()
    await Promise.race([new Promise((resolve) => child.once('exit', resolve)), delay(5000)])
  }
  report.save()
  if (report.results.some((item) => item.status === 'failed')) process.exitCode = 1
}
