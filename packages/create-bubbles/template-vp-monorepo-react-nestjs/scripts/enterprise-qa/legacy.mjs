import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { randomUUID, randomBytes } from 'node:crypto'
import {
  root,
  serverRequire,
  loadRuntime,
  databaseConfig,
  randomIdentity,
  ensure,
  privateStatePath,
  readPrivateState,
  writePrivateState,
  createReporter,
} from './runtime.mjs'

const { runtime, runtimePath } = loadRuntime(process.argv[2])
const mode = process.argv[3] ?? 'verify'
ensure(['prepare', 'verify'].includes(mode), '模式必须为 prepare 或 verify')
const { Client } = serverRequire('pg')
const { drizzle } = serverRequire('drizzle-orm/node-postgres')
const { migrate } = serverRequire('drizzle-orm/node-postgres/migrator')
const argon2 = serverRequire('argon2')
const statePath = privateStatePath(runtimePath, 'legacy')
const migrationsFolder = resolve(root, 'apps/server/drizzle')
const report = createReporter('legacy')
let state
let client

try {
  if (!existsSync(statePath)) {
    const database = `enterprise_legacy_${randomBytes(5).toString('hex')}`
    ensure(/^enterprise_legacy_[a-z0-9]+$/.test(database), '无效的隔离旧库名称')
    const admin = new Client(databaseConfig(runtime, 'postgres'))
    await admin.connect()
    try {
      const duplicate = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [
        database,
      ])
      ensure(duplicate.rowCount === 0, '拒绝复用未知的已有旧库')
      await admin.query(`CREATE DATABASE "${database}"`)
    } finally {
      await admin.end()
    }
    state = {
      database,
      stage: 'created',
      identity: randomIdentity('legacy'),
      uploadId: randomUUID(),
    }
    writePrivateState(statePath, state)
  } else {
    state = readPrivateState(statePath)
  }
  ensure(/^enterprise_legacy_[a-z0-9]+$/.test(state.database), '仅允许本脚本创建的明确旧库')
  client = new Client(databaseConfig(runtime, state.database))
  await client.connect()

  if (state.stage === 'created') {
    const journal = JSON.parse(
      readFileSync(resolve(migrationsFolder, 'meta/_journal.json'), 'utf8'),
    )
    const historical = journal.entries.filter((entry) => entry.idx <= 1)
    ensure(historical.length === 2, '必须存在两份原始历史迁移')
    const folder = mkdtempSync(resolve(tmpdir(), 'codex-enterprise-legacy-migrations-'))
    mkdirSync(resolve(folder, 'meta'))
    writeFileSync(
      resolve(folder, 'meta/_journal.json'),
      JSON.stringify({ ...journal, entries: historical }),
    )
    for (const entry of historical) {
      writeFileSync(
        resolve(folder, `${entry.tag}.sql`),
        readFileSync(resolve(migrationsFolder, `${entry.tag}.sql`)),
      )
    }
    await migrate(drizzle(client), { migrationsFolder: folder })
    const passwordHash = await argon2.hash(state.identity.password)
    const user = await client.query(
      'INSERT INTO users (name, account, password_hash) VALUES ($1, $2, $3) RETURNING id',
      [state.identity.name, state.identity.account, passwordHash],
    )
    state.identity.id = user.rows[0].id
    await client.query(
      `INSERT INTO upload_sessions
       (id, owner_id, client_upload_id, bucket, object_key, storage_upload_id, original_name,
        content_type, file_size, part_size, total_parts, status, expires_at, completed_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'legacy.txt', 'text/plain', 4, 5242880, 1,
               'completed', now() + interval '1 day', now())`,
      [
        state.uploadId,
        state.identity.id,
        randomUUID(),
        runtime.storage.bucket,
        `qa-legacy/${state.uploadId}`,
        randomUUID(),
      ],
    )
    state.passwordHash = passwordHash
    state.stage = 'legacy-ready'
    writePrivateState(statePath, state)
  }

  await report.check({
    id: 'legacy-fixture-isolated',
    acceptance: ['AC-08'],
    run: async () => {
      const { rows } = await client.query('SELECT current_database() AS database')
      ensure(rows[0].database === state.database, '连接到了非预期测试库')
      return '独立 enterprise_legacy_* 数据库；真实重放 0000/0001 迁移及旧用户、上传记录'
    },
  })

  if (mode === 'prepare') {
    report.pending({
      id: 'legacy-upgrade',
      acceptance: ['AC-08'],
      reason: '旧库夹具已准备；等待新增迁移就绪后执行 verify',
    })
  } else {
    const journal = JSON.parse(
      readFileSync(resolve(migrationsFolder, 'meta/_journal.json'), 'utf8'),
    )
    ensure(
      journal.entries.some((entry) => entry.idx > 1),
      '新增管理迁移尚未生成，不能验证升级',
    )
    await report.check({
      id: 'legacy-upgrade-retains-user-upload',
      acceptance: ['AC-08'],
      run: async () => {
        await migrate(drizzle(client), { migrationsFolder })
        const user = (
          await client.query('SELECT id, account, password_hash, status FROM users WHERE id = $1', [
            state.identity.id,
          ])
        ).rows[0]
        ensure(
          user?.account === state.identity.account && user.status === 'active',
          '升级改变了既有用户身份或状态',
        )
        ensure(user.password_hash === state.passwordHash, '升级改变了既有密码散列')
        ensure(
          await argon2.verify(user.password_hash, state.identity.password),
          '既有用户密码无法验证',
        )
        const upload = (
          await client.query('SELECT owner_id, status FROM upload_sessions WHERE id = $1', [
            state.uploadId,
          ])
        ).rows[0]
        ensure(
          upload?.owner_id === state.identity.id && upload.status === 'completed',
          '上传所有者或状态未保留',
        )
        const membership = await client.query(
          'SELECT count(*)::int AS count FROM company_members WHERE user_id = $1',
          [state.identity.id],
        )
        ensure(membership.rows[0].count === 0, '升级自动为既有用户分配了企业')
        return '完整新迁移保留既有用户、密码散列、上传 ownerId；不自动分配企业'
      },
    })
    await report.check({
      id: 'legacy-migration-repeat-safe',
      acceptance: ['AC-08'],
      run: async () => {
        const before = await client.query(
          'SELECT count(*)::int AS count FROM drizzle.__drizzle_migrations',
        )
        await migrate(drizzle(client), { migrationsFolder })
        const after = await client.query(
          'SELECT count(*)::int AS count FROM drizzle.__drizzle_migrations',
        )
        ensure(before.rows[0].count === after.rows[0].count, '重复迁移产生重复迁移记录')
        ensure(after.rows[0].count === journal.entries.length, '迁移记录数量与源码不一致')
        return '再次执行真实 migrator 未重复变更，迁移记录与 journal 一致'
      },
    })
    state.stage = 'upgraded'
    writePrivateState(statePath, state)
  }
} catch (error) {
  report.results.push({
    id: 'legacy-run',
    acceptance: ['AC-08'],
    status: 'failed',
    evidence: error instanceof Error ? error.message : '旧库验证失败',
  })
  process.stdout.write('FAIL legacy-run\n')
} finally {
  if (client) await client.end()
  report.save()
  if (report.results.some((item) => item.status === 'failed')) process.exitCode = 1
}
