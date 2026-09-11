import 'reflect-metadata'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vite-plus/test'
import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { eq, inArray } from 'drizzle-orm'
import Redis from 'ioredis'
import { ConfigService } from '@nestjs/config'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomBytes } from 'node:crypto'
import type {
  AccessScope,
  CompanyDetail,
  MemberRecord,
  PermissionDefinition,
  ProjectDetail,
} from 'shared/types'
import * as schema from '@/database/schema'
import { AccessService } from '@/modules/access/access.service'
import { AccessSeedService } from '@/modules/access/seed/access-seed.service'
import { MembersService } from '@/modules/members/members.service'
import { CompaniesService } from '@/modules/companies/companies.service'
import { ProjectsService } from '@/modules/projects/projects.service'
import { AdministratorsService } from '@/modules/members/administrators/administrators.service'
import { AccountsService } from '@/modules/members/accounts/accounts.service'
import { WorkspacesService } from '@/modules/access/workspaces/workspaces.service'
import { RolesService } from '@/modules/access/roles/roles.service'
import { MenusService } from '@/modules/menus/menus.service'
import { PermissionsCleanupService } from '@/modules/access/maintenance/permissions-cleanup.service'
import { SessionStoreService } from '@/modules/auth/session/session-store.service'
import { AuthRepository } from '@/modules/auth/auth.repository'
import { lockAccess } from '@/modules/access/access.store'
import { ACCESS_CATALOG_VERSION, ACCESS_ICON_NAMES, ACCESS_PERMISSION_CATALOG } from 'shared/utils'

// 仅测试模块扩展目录；生产首版没有废弃功能，不加入虚构的业务菜单。
vi.mock('shared/utils', async (original) => {
  const actual = await original<typeof import('shared/utils')>()
  const fixture: PermissionDefinition[] = [
    {
      key: 'company.fixture.read',
      scopeType: 'company',
      kind: 'page',
      title: '测试发布功能',
      routeKey: 'company.fixture',
      pagePermissionKey: null,
      adminOnly: false,
      deprecated: false,
    },
    {
      key: 'company.fixture.update',
      scopeType: 'company',
      kind: 'operation',
      title: '测试发布操作',
      routeKey: 'company.fixture',
      pagePermissionKey: 'company.fixture.read',
      adminOnly: false,
      deprecated: false,
    },
  ]
  // 只在当前测试模块修改内存目录，保留真实 getBuiltinPermissionKeys 的升级规则。
  ;(actual.ACCESS_PERMISSION_CATALOG as PermissionDefinition[]).push(...fixture)
  return actual
})

const enabled = process.env.RUN_ACCESS_INTEGRATION === 'true'
const databaseName = `access_it_${crypto.randomUUID().replaceAll('-', '')}`
const actor = (userId: string) => ({ userId, requestId: crypto.randomUUID() })
/** 创建可从外部释放的 Promise，用于控制并发测试中事务的进入与完成顺序。 */
const deferred = () => {
  let resolve!: () => void
  const promise = new Promise<void>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

describe.skipIf(!enabled)('企业权限真实 PostgreSQL / Redis 集成', () => {
  let adminPool: Pool
  let pool: Pool
  let redis: Redis
  let db: ReturnType<typeof drizzle<typeof schema>>
  let access: AccessService
  let seed: AccessSeedService
  let members: MembersService
  let companies: CompaniesService
  let projects: ProjectsService
  let accounts: AccountsService
  let workspaces: WorkspacesService
  let roles: RolesService
  let menus: MenusService
  let cleanup: PermissionsCleanupService
  let sessions: SessionStoreService
  let platformId: string
  let companyAdminId: string
  let memberId: string
  let replacementId: string
  let company: CompanyDetail
  let project: ProjectDetail
  let member: MemberRecord
  let temporaryDirectory: string
  let companyScope: AccessScope

  beforeAll(async () => {
    if (!process.env.DATABASE_URL) throw new Error('真实测试必须提供隔离容器 DATABASE_URL')
    adminPool = new Pool({ connectionString: process.env.DATABASE_URL })
    await adminPool.query(`CREATE DATABASE "${databaseName}"`)
    const connection = new URL(process.env.DATABASE_URL)
    connection.pathname = `/${databaseName}`
    pool = new Pool({ connectionString: connection.toString(), max: 12 })
    db = drizzle(pool, { schema })
    await migrate(db, { migrationsFolder: './drizzle' })
    await migrate(db, { migrationsFolder: './drizzle' })
    redis = new Redis({
      protocol: 2,
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
      password: process.env.REDIS_PASSWORD || undefined,
      db: Number(process.env.REDIS_DB ?? 0),
      lazyConnect: true,
    })
    await redis.connect()
    sessions = new SessionStoreService(
      redis,
      new ConfigService({ session: { idleTtlMs: 60_000, absoluteTtlMs: 120_000 } }),
    )
    access = new AccessService(db)
    seed = new AccessSeedService(db)
    members = new MembersService(access, seed)
    const administrators = new AdministratorsService(access, members, seed)
    companies = new CompaniesService(access, members, administrators)
    projects = new ProjectsService(access, members, administrators)
    accounts = new AccountsService(access, members, sessions)
    workspaces = new WorkspacesService(access)
    roles = new RolesService(access)
    menus = new MenusService(access)
    cleanup = new PermissionsCleanupService(access)
    const created = await db
      .insert(schema.users)
      .values(
        ['platform_it', 'company_admin_it', 'ordinary_it', 'replacement_it'].map((account) => ({
          account,
          name: account,
          passwordHash: 'test-only-no-login',
        })),
      )
      .returning()
    platformId = created[0]!.id
    companyAdminId = created[1]!.id
    memberId = created[2]!.id
    replacementId = created[3]!.id
    await seed.initialize('platform_it')
    temporaryDirectory = await mkdtemp(join(tmpdir(), 'codex-access-integration-'))
  }, 30_000)
  afterAll(async () => {
    const results = await Promise.allSettled([
      (async () => {
        if (!redis) return
        try {
          for (const id of [platformId, companyAdminId, memberId, replacementId].filter(Boolean))
            await sessions.revokeAllForUser(id)
        } finally {
          redis.disconnect()
        }
      })(),
      (async () => {
        try {
          if (pool) await pool.end()
        } finally {
          if (adminPool) {
            try {
              await adminPool.query(`DROP DATABASE IF EXISTS "${databaseName}" WITH (FORCE)`)
            } finally {
              await adminPool.end()
            }
          }
        }
      })(),
      temporaryDirectory
        ? rm(temporaryDirectory, { recursive: true, force: true })
        : Promise.resolve(),
    ])
    delete process.env.ACCESS_DEPLOYMENT_PROOF_FILE
    const failed = results.find((result) => result.status === 'rejected')
    if (failed?.status === 'rejected') throw failed.reason
  }, 30_000)

  /** 轮询测试数据库中等待权限咨询锁的连接，确认管理写操作已排队；两秒内未出现则断言失败。 */
  const waitForQueuedManagementWrite = () =>
    expect
      .poll(
        async () => {
          const result = await pool.query<{ count: number }>(
            "SELECT count(*)::int AS count FROM pg_locks l JOIN pg_stat_activity a ON a.pid = l.pid WHERE l.locktype = 'advisory' AND NOT l.granted AND l.classid = 7421 AND l.objid = 1 AND a.datname = $1",
            [databaseName],
          )
          return result.rows[0]!.count
        },
        { timeout: 2000, interval: 5 },
      )
      .toBeGreaterThan(0)

  it('幂等初始化不提权其他账号，公开新账号没有工作空间', async () => {
    await expect(seed.initialize('platform_it')).resolves.toMatchObject({
      alreadyInitialized: true,
    })
    await expect(seed.initialize('ordinary_it')).rejects.toMatchObject({
      definition: { code: 'ACCESS.ALREADY_INITIALIZED' },
    })
    expect((await workspaces.workspaces(actor(memberId))).workspaces).toEqual([])
    expect(
      await db
        .select()
        .from(schema.auditLogs)
        .where(eq(schema.auditLogs.action, 'access.initialize')),
    ).toHaveLength(1)
  })
  it('创建企业、添加成员、创建项目完整事务；平台身份不等于企业成员', async () => {
    company = (await companies.create({
      actor: actor(platformId),
      body: { name: '集成企业', code: 'integration', administratorAccount: 'company_admin_it' },
    })) as CompanyDetail
    companyScope = { type: 'company', companyId: company.id }
    member = await members.add({
      actor: actor(companyAdminId),
      scope: companyScope,
      body: { account: 'ordinary_it' },
    })
    project = (await projects.create({
      actor: actor(companyAdminId),
      companyId: company.id,
      body: { name: '集成项目', code: 'project_it', administratorAccount: 'ordinary_it' },
    })) as ProjectDetail
    await expect(
      access.read({ actor: actor(platformId), scope: companyScope }, async () => true),
    ).rejects.toMatchObject({ definition: { code: 'ACCESS.NOT_FOUND' } })
    const context = await access.read(
      {
        actor: actor(companyAdminId),
        scope: { type: 'project', companyId: company.id, projectId: project.id },
      },
      async (_tx, result) => access.context(result),
    )
    expect(context.administrator).toBe('company')
    expect(
      await db
        .select()
        .from(schema.projectMembers)
        .where(eq(schema.projectMembers.userId, companyAdminId)),
    ).toHaveLength(0)
    await expect(
      projects.create({
        actor: actor(memberId),
        companyId: company.id,
        body: { name: '不能创建', code: 'forbidden', administratorAccount: 'ordinary_it' },
      }),
    ).rejects.toMatchObject({ definition: { code: 'ACCESS.FORBIDDEN' } })
  })
  it('项目创建审计失败时项目、角色和成员全部回滚', async () => {
    const failingAudit = vi
      .spyOn(access, 'audit')
      .mockRejectedValueOnce(new Error('transaction audit fixture'))
    await expect(
      projects.create({
        actor: actor(companyAdminId),
        companyId: company.id,
        body: { name: '回滚项目', code: 'rollback', administratorAccount: 'ordinary_it' },
      }),
    ).rejects.toThrow('transaction audit fixture')
    failingAudit.mockRestore()
    expect(
      await db.select().from(schema.projects).where(eq(schema.projects.code, 'rollback')),
    ).toHaveLength(0)
  })
  it('同范围唯一、内置角色保护、非法授权与跨企业成员约束', async () => {
    await expect(
      members.add({
        actor: actor(companyAdminId),
        scope: companyScope,
        body: { account: 'ordinary_it' },
      }),
    ).rejects.toMatchObject({ definition: { code: 'ACCESS.DUPLICATE_RESOURCE' } })
    const builtin = (
      await roles.list({ actor: actor(companyAdminId), scope: companyScope, query: {} })
    ).items.find((r) => r.builtin === 'administrator')!
    await expect(
      roles.change({
        actor: actor(companyAdminId),
        scope: companyScope,
        roleId: builtin.id,
        action: 'delete',
        body: { expectedVersion: builtin.version },
      }),
    ).rejects.toMatchObject({ definition: { code: 'ACCESS.BUILTIN_ROLE_IMMUTABLE' } })
    await expect(
      roles.create({
        actor: actor(companyAdminId),
        scope: companyScope,
        body: { name: '非法授权', permissionKeys: ['company.projects.create'] },
      }),
    ).rejects.toMatchObject({ definition: { code: 'ACCESS.INVALID_PERMISSION_SET' } })
    const foreignCompany = (await companies.create({
      actor: actor(platformId),
      body: { name: '另一企业', code: 'foreign_it', administratorAccount: 'replacement_it' },
    })) as CompanyDetail
    await expect(
      db
        .insert(schema.projectMembers)
        .values({ companyId: foreignCompany.id, projectId: project.id, userId: replacementId }),
    ).rejects.toBeTruthy()
    await expect(
      members.record(db, { type: 'company', companyId: foreignCompany.id }, member.id),
    ).rejects.toMatchObject({ definition: { code: 'ACCESS.NOT_FOUND' } })
  })
  it('公司管理员和自定义角色均受菜单停用，隐藏只影响导航', async () => {
    const tree = await menus.list({ actor: actor(platformId), scopeType: 'company' })
    const page = tree.items.find((m) => m.routeKey === 'company.profile')!
    let changed = await menus.change({
      actor: actor(platformId),
      menuId: page.id,
      action: 'update',
      body: { expectedVersion: tree.version, hidden: true },
    })
    /** 以公司管理员身份重新鉴权并读取当前公司权限上下文，观察菜单修改后的导航和权限变化。 */
    const getContext = () =>
      access.read({ actor: actor(companyAdminId), scope: companyScope }, async (_tx, current) =>
        access.context(current),
      )
    expect((await getContext()).permissionKeys).toContain('company.profile.update')
    expect((await getContext()).menus.some((m) => m.id === page.id)).toBe(false)
    changed = await menus.change({
      actor: actor(platformId),
      menuId: page.id,
      action: 'update',
      body: { expectedVersion: changed.version, status: 'disabled' },
    })
    expect((await getContext()).permissionKeys).not.toContain('company.profile.update')
    await menus.change({
      actor: actor(platformId),
      menuId: page.id,
      action: 'update',
      body: { expectedVersion: changed.version, hidden: false, status: 'active' },
    })
    const platformTree = await menus.list({ actor: actor(platformId), scopeType: 'platform' })
    await expect(
      menus.change({
        actor: actor(platformId),
        menuId: platformTree.items.find((m) => m.routeKey === 'platform.menus')!.id,
        action: 'update',
        body: { expectedVersion: platformTree.version, status: 'disabled' },
      }),
    ).rejects.toMatchObject({ definition: { code: 'ACCESS.PROTECTED_MENU' } })
  })
  it('停用保留子级状态，移除企业成员清理项目授权且重新加入不恢复', async () => {
    let p = await projects.status({
      actor: actor(companyAdminId),
      companyId: company.id,
      projectId: project.id,
      body: { expectedVersion: project.version, status: 'disabled' },
    })
    let c = await companies.status({
      actor: actor(platformId),
      companyId: company.id,
      body: { expectedVersion: company.version, status: 'disabled' },
    })
    c = await companies.status({
      actor: actor(platformId),
      companyId: company.id,
      body: { expectedVersion: c.version, status: 'active' },
    })
    expect(
      (await projects.project(db, { companyId: company.id, projectId: project.id })).status,
    ).toBe('disabled')
    p = await projects.status({
      actor: actor(companyAdminId),
      companyId: company.id,
      projectId: project.id,
      body: { expectedVersion: p.version, status: 'active' },
    })
    await members.change({
      actor: actor(companyAdminId),
      scope: companyScope,
      memberId: member.id,
      action: 'remove',
      body: { expectedVersion: member.version },
    })
    expect(
      await db
        .select()
        .from(schema.projectMembers)
        .where(eq(schema.projectMembers.userId, memberId)),
    ).toHaveLength(0)
    member = await members.add({
      actor: actor(companyAdminId),
      scope: companyScope,
      body: { account: 'ordinary_it' },
    })
    expect(member.roleNames).toEqual(['内置普通成员'])
    project = { ...project, ...p }
    company = { ...company, ...c }
  })
  it('管理写先持锁允许提交，随后撤权；撤权先提交则锁内鉴权拒绝且无成功审计', async () => {
    const custom = await roles.create({
      actor: actor(companyAdminId),
      scope: companyScope,
      body: {
        name: '资料维护员',
        permissionKeys: ['company.profile.read', 'company.profile.update'],
      },
    })
    member = (await members.change({
      actor: actor(companyAdminId),
      scope: companyScope,
      memberId: member.id,
      action: 'roles',
      body: { expectedVersion: member.version, roleIds: [...member.roleIds, custom.id] },
    })) as MemberRecord
    const held = deferred()
    const release = deferred()
    const writeActor = actor(memberId)
    const write = access.write(
      { actor: writeActor, scope: companyScope, permission: 'company.profile.update' },
      async (tx, verified) => {
        held.resolve()
        await release.promise
        await tx
          .update(schema.companies)
          .set({ description: '先持锁写入' })
          .where(eq(schema.companies.id, company.id))
        await access.audit(tx, {
          actor: writeActor,
          access: verified,
          action: 'company.update',
          objectType: 'company',
          objectId: company.id,
        })
      },
    )
    await held.promise
    const revoke = members.change({
      actor: actor(companyAdminId),
      scope: companyScope,
      memberId: member.id,
      action: 'roles',
      body: {
        expectedVersion: member.version,
        roleIds: member.roleIds.filter((id) => id !== custom.id),
      },
    })
    try {
      await waitForQueuedManagementWrite()
    } finally {
      release.resolve()
    }
    await write
    member = (await revoke) as MemberRecord
    expect((await companies.company(db, company.id)).description).toBe('先持锁写入')

    member = (await members.change({
      actor: actor(companyAdminId),
      scope: companyScope,
      memberId: member.id,
      action: 'roles',
      body: { expectedVersion: member.version, roleIds: [...member.roleIds, custom.id] },
    })) as MemberRecord
    const revocationHeld = deferred()
    const releaseRevocation = deferred()
    const revokeActor = actor(companyAdminId)
    const originalAudit = access.audit.bind(access)
    const gateAudit = vi.spyOn(access, 'audit').mockImplementation(async (tx, input) => {
      await originalAudit(tx, input)
      if (input.actor.requestId === revokeActor.requestId) {
        revocationHeld.resolve()
        await releaseRevocation.promise
      }
    })
    const firstRevocation = members.change({
      actor: revokeActor,
      scope: companyScope,
      memberId: member.id,
      action: 'roles',
      body: {
        expectedVersion: member.version,
        roleIds: member.roleIds.filter((id) => id !== custom.id),
      },
    })
    await revocationHeld.promise
    const afterRevocation = actor(memberId)
    const blockedWrite = companies
      .profile({
        actor: afterRevocation,
        companyId: company.id,
        body: { expectedVersion: company.version, description: '不允许写入' },
      })
      .then(
        (result) => ({ result }),
        (error) => ({ error }),
      )
    try {
      await waitForQueuedManagementWrite()
    } finally {
      releaseRevocation.resolve()
    }
    member = (await firstRevocation) as MemberRecord
    expect(await blockedWrite).toMatchObject({
      error: { definition: { code: 'ACCESS.FORBIDDEN' } },
    })
    gateAudit.mockRestore()
    expect((await companies.company(db, company.id)).description).toBe('先持锁写入')
    expect(
      await db
        .select()
        .from(schema.auditLogs)
        .where(eq(schema.auditLogs.requestId, afterRevocation.requestId)),
    ).toHaveLength(0)
  })
  it('并发停用两位企业管理员只能成功一次', async () => {
    await companies.setAdministrator({
      actor: actor(platformId),
      companyId: company.id,
      body: { account: 'replacement_it' },
    })
    const currentMembers = (
      await members.list({ actor: actor(companyAdminId), scope: companyScope, query: {} })
    ).items
    const first = currentMembers.find((m) => m.userId === companyAdminId)!
    const second = currentMembers.find((m) => m.userId === replacementId)!
    const results = await Promise.allSettled([
      members.change({
        actor: actor(companyAdminId),
        scope: companyScope,
        memberId: first.id,
        action: 'status',
        body: { expectedVersion: first.version, status: 'disabled' },
      }),
      members.change({
        actor: actor(replacementId),
        scope: companyScope,
        memberId: second.id,
        action: 'status',
        body: { expectedVersion: second.version, status: 'disabled' },
      }),
    ])
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1)
    await companies.setAdministrator({
      actor: actor(platformId),
      companyId: company.id,
      body: { account: 'company_admin_it' },
    })
    await companies.setAdministrator({
      actor: actor(platformId),
      companyId: company.id,
      body: { account: 'replacement_it' },
    })
  })
  it('账号禁用允许平台补任更换，旧会话撤销、恢复不恢复旧管理员角色', async () => {
    const tokenDigest = randomBytes(32).toString('hex')
    await sessions.createOrReplace({
      tokenDigest,
      userId: companyAdminId,
      terminal: 'desktop',
      loginIp: '127.0.0.1',
      userAgent: 'test',
    })
    expect(await sessions.validateAndTouch(tokenDigest)).toMatchObject({
      userId: companyAdminId,
      terminal: 'desktop',
    })
    await accounts.accountChange({
      actor: actor(platformId),
      userId: companyAdminId,
      body: { status: 'disabled' },
    })
    expect(await sessions.validateAndTouch(tokenDigest)).toBeNull()
    await companies.setAdministrator({
      actor: actor(platformId),
      companyId: company.id,
      body: { account: 'replacement_it', replaceUserId: companyAdminId },
    })
    await accounts.accountChange({
      actor: actor(platformId),
      userId: companyAdminId,
      body: { status: 'active' },
    })
    expect(await access.isAdministrator(db, companyScope, companyAdminId)).toBe(false)
    expect(await sessions.validateAndTouch(tokenDigest)).toBeNull()
    const platformDigest = randomBytes(32).toString('hex')
    await sessions.createOrReplace({
      tokenDigest: platformDigest,
      userId: platformId,
      terminal: 'desktop',
      loginIp: '127.0.0.1',
      userAgent: 'test',
    })
    await expect(
      accounts.accountChange({
        actor: actor(platformId),
        userId: platformId,
        body: { status: 'disabled' },
      }),
    ).rejects.toMatchObject({ definition: { code: 'ACCESS.LAST_ADMINISTRATOR' } })
    expect(await sessions.validateAndTouch(platformDigest)).toMatchObject({ userId: platformId })
    await companies.setAdministrator({
      actor: actor(platformId),
      companyId: company.id,
      body: { account: 'company_admin_it' },
    })
  })
  it('账号停用审计失败回滚时保留账号状态和现有会话', async () => {
    const tokenDigest = randomBytes(32).toString('hex')
    await sessions.createOrReplace({
      tokenDigest,
      userId: memberId,
      terminal: 'desktop',
      loginIp: '127.0.0.1',
      userAgent: 'test',
    })
    const auditFailure = vi
      .spyOn(access, 'audit')
      .mockRejectedValueOnce(new Error('account audit rollback fixture'))
    await expect(
      accounts.accountChange({
        actor: actor(platformId),
        userId: memberId,
        body: { status: 'disabled' },
      }),
    ).rejects.toThrow('account audit rollback fixture')
    auditFailure.mockRestore()
    expect((await accounts.accountRecord(db, memberId)).status).toBe('active')
    expect(await sessions.validateAndTouch(tokenDigest)).toMatchObject({ userId: memberId })
  })
  it('登录用户行共享锁与禁用排他锁协调，禁用完成后不会残留登录会话', async () => {
    const repository = new AuthRepository(db)
    const held = deferred()
    const release = deferred()
    const tokenDigest = randomBytes(32).toString('hex')
    const login = repository.withActiveUserLock(memberId, async () => {
      held.resolve()
      await release.promise
      return sessions.createOrReplace({
        tokenDigest,
        userId: memberId,
        terminal: 'desktop',
        loginIp: '127.0.0.1',
        userAgent: 'test',
      })
    })
    await held.promise
    const disable = accounts.accountChange({
      actor: actor(platformId),
      userId: memberId,
      body: { status: 'disabled' },
    })
    release.resolve()
    await login
    await disable
    expect(await sessions.validateAndTouch(tokenDigest)).toBeNull()
    expect(await repository.withActiveUserLock(memberId, async () => true)).toBeNull()
    await accounts.accountChange({
      actor: actor(platformId),
      userId: memberId,
      body: { status: 'active' },
    })
  })
  it('清理重新核验部署与子项，审计失败全回滚，幂等/tombstone与种子不复活', async () => {
    const fixture = ACCESS_PERMISSION_CATALOG.filter((p) => p.routeKey === 'company.fixture')
    fixture.find((p) => p.kind === 'page')!.deprecated = true
    expect(
      (await cleanup.preview(actor(platformId))).items.find(
        (p) => p.permissionKey === 'company.fixture.read',
      )?.blockedReasons,
    ).toContain('存在非废弃子节点')
    for (const p of fixture) p.deprecated = true
    await db.transaction(async (tx) => {
      await lockAccess(tx)
      await seed.sync(tx)
    })
    const proofPath = join(temporaryDirectory, 'deployment-proof.json')
    process.env.ACCESS_DEPLOYMENT_PROOF_FILE = proofPath
    /** 根据当前未废弃权限目录生成一分钟内有效的部署证明，供清理接口复核服务依赖。 */
    const makeProof = () => ({
      deploymentId: 'integration-deployment',
      completed: true,
      verifiedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      serviceVersions: [
        {
          version: process.env.ACCESS_RELEASE_VERSION ?? ACCESS_CATALOG_VERSION,
          instanceIds: ['isolated-test-instance'],
          requiredPermissionKeys: ACCESS_PERMISSION_CATALOG.filter((p) => !p.deprecated).map(
            (p) => p.key,
          ),
        },
      ],
    })
    await writeFile(proofPath, JSON.stringify(makeProof()))
    const activePreview = await cleanup.preview(actor(platformId))
    expect(activePreview.eligible).toBe(false)
    const tree = await menus.list({ actor: actor(platformId), scopeType: 'company' })
    const page = tree.items.find((m) => m.routeKey === 'company.fixture')!
    let version = tree.version
    for (const row of [page, ...page.children]) {
      const result = await menus.change({
        actor: actor(platformId),
        menuId: row.id,
        action: 'update',
        body: { expectedVersion: version, status: 'disabled' },
      })
      version = result.version
    }
    let preview = await cleanup.preview(actor(platformId))
    expect(preview.eligible).toBe(true)
    const expiredProof = { ...makeProof(), expiresAt: new Date(Date.now() - 1000).toISOString() }
    await writeFile(proofPath, JSON.stringify(expiredProof))
    await expect(
      cleanup.cleanup(actor(platformId), {
        permissionKeys: fixture.map((p) => p.key),
        proofDigest: preview.proofDigest!,
      }),
    ).rejects.toMatchObject({ definition: { code: 'ACCESS.CLEANUP_BLOCKED' } })
    const dependentProof = makeProof()
    dependentProof.serviceVersions.push({
      version: 'still-running-old-version',
      instanceIds: ['isolated-old-instance'],
      requiredPermissionKeys: fixture.map((p) => p.key),
    })
    await writeFile(proofPath, JSON.stringify(dependentProof))
    const dependentPreview = await cleanup.preview(actor(platformId))
    expect(
      dependentPreview.items.every((p) => p.blockedReasons.includes('在用服务版本仍依赖此权限')),
    ).toBe(true)
    await expect(
      cleanup.cleanup(actor(platformId), {
        permissionKeys: fixture.map((p) => p.key),
        proofDigest: dependentPreview.proofDigest!,
      }),
    ).rejects.toMatchObject({ definition: { code: 'ACCESS.CLEANUP_BLOCKED' } })
    const validProofText = JSON.stringify(makeProof())
    await writeFile(proofPath, validProofText)
    preview = await cleanup.preview(actor(platformId))
    await writeFile(proofPath, `${validProofText}\n`)
    await expect(
      cleanup.cleanup(actor(platformId), {
        permissionKeys: fixture.map((p) => p.key),
        proofDigest: preview.proofDigest!,
      }),
    ).rejects.toMatchObject({ definition: { code: 'ACCESS.CLEANUP_BLOCKED' } })
    preview = await cleanup.preview(actor(platformId))
    await expect(
      cleanup.cleanup(actor(platformId), {
        permissionKeys: ['company.fixture.read'],
        proofDigest: preview.proofDigest!,
      }),
    ).rejects.toMatchObject({ definition: { code: 'ACCESS.RESOURCE_IN_USE' } })
    const body = { permissionKeys: fixture.map((p) => p.key), proofDigest: preview.proofDigest! }
    const auditFailure = vi
      .spyOn(access, 'audit')
      .mockRejectedValueOnce(new Error('cleanup rollback fixture'))
    await expect(cleanup.cleanup(actor(platformId), body)).rejects.toThrow(
      'cleanup rollback fixture',
    )
    auditFailure.mockRestore()
    expect(
      await db
        .select()
        .from(schema.permissions)
        .where(eq(schema.permissions.key, 'company.fixture.read')),
    ).toHaveLength(1)
    expect(await db.select().from(schema.cleanupTombstones)).toHaveLength(0)
    const result = await cleanup.cleanup(actor(platformId), body)
    expect(result.removedPermissionKeys).toHaveLength(2)
    expect(
      (await cleanup.cleanup(actor(platformId), body)).alreadyCleanedPermissionKeys,
    ).toHaveLength(2)
    await seed.onModuleInit()
    expect(
      await db
        .select()
        .from(schema.permissions)
        .where(eq(schema.permissions.key, 'company.fixture.read')),
    ).toHaveLength(0)
    expect(
      await db
        .select()
        .from(schema.rolePermissions)
        .where(eq(schema.rolePermissions.permissionKey, 'company.fixture.read')),
    ).toHaveLength(0)
  })
  it('菜单乐观版本、数据库版本约束和审计白名单保持有效', async () => {
    const tree = await menus.list({ actor: actor(platformId), scopeType: 'company' })
    await expect(
      menus.create({
        actor: actor(platformId),
        scopeType: 'company',
        body: {
          type: 'directory',
          parentId: null,
          name: '过期目录',
          expectedVersion: tree.version - 1,
        },
      }),
    ).rejects.toMatchObject({ definition: { code: 'ACCESS.VERSION_CONFLICT' } })
    await expect(
      db.update(schema.companies).set({ version: 0 }).where(eq(schema.companies.id, company.id)),
    ).rejects.toBeTruthy()
    const audits = await db.select().from(schema.auditLogs)
    expect(audits.length).toBeGreaterThan(15)
    expect(JSON.stringify(audits)).not.toMatch(/passwordHash|password_hash|accessToken|tokenDigest/)
  })
  it('初始化后发布新功能仅扩展同范围内置管理员，保持其他授权与菜单定制', async () => {
    const upgradePermissions: PermissionDefinition[] = [
      {
        key: 'company.upgrade_fixture.read',
        scopeType: 'company',
        kind: 'page',
        title: '升级新增页面',
        routeKey: 'company.upgrade_fixture',
        pagePermissionKey: null,
        adminOnly: false,
        deprecated: false,
      },
      {
        key: 'company.upgrade_fixture.update',
        scopeType: 'company',
        kind: 'operation',
        title: '升级新增操作',
        routeKey: 'company.upgrade_fixture',
        pagePermissionKey: 'company.upgrade_fixture.read',
        adminOnly: false,
        deprecated: false,
      },
    ]
    const upgradeKeys = upgradePermissions.map((permission) => permission.key)
    expect(await db.select().from(schema.accessBootstrap)).toHaveLength(1)
    expect(
      ACCESS_PERMISSION_CATALOG.some((permission) => upgradeKeys.includes(permission.key)),
    ).toBe(false)
    expect(
      await db
        .select()
        .from(schema.permissions)
        .where(inArray(schema.permissions.key, upgradeKeys)),
    ).toHaveLength(0)

    const custom = await roles.create({
      actor: actor(companyAdminId),
      scope: companyScope,
      body: { name: '升级保留角色', permissionKeys: ['company.profile.read'] },
    })
    const existingMember = await members.record(db, companyScope, member.id)
    await members.change({
      actor: actor(companyAdminId),
      scope: companyScope,
      memberId: existingMember.id,
      action: 'roles',
      body: {
        expectedVersion: existingMember.version,
        roleIds: [...existingMember.roleIds, custom.id],
      },
    })
    const tree = await menus.list({ actor: actor(platformId), scopeType: 'company' })
    const profile = tree.items.find((item) => item.routeKey === 'company.profile')!
    const withDirectory = await menus.create({
      actor: actor(platformId),
      scopeType: 'company',
      body: {
        expectedVersion: tree.version,
        type: 'directory',
        parentId: null,
        name: '升级保留目录',
        sort: 432,
      },
    })
    const directory = withDirectory.items.find((item) => item.name === '升级保留目录')!
    await menus.change({
      actor: actor(platformId),
      menuId: profile.id,
      action: 'update',
      body: {
        expectedVersion: withDirectory.version,
        parentId: directory.id,
        name: '升级前自定义资料页',
        icon: ACCESS_ICON_NAMES[0]!,
        sort: 987,
        hidden: true,
        status: 'disabled',
      },
    })

    /** 按稳定顺序读取角色、授权、菜单和版本，供验证种子升级保留已有配置且只增加预期数据。 */
    const snapshot = async () => ({
      roles: await db.select().from(schema.roles).orderBy(schema.roles.id),
      grants: await db
        .select()
        .from(schema.rolePermissions)
        .orderBy(schema.rolePermissions.roleId, schema.rolePermissions.permissionKey),
      assignments: await db
        .select()
        .from(schema.userRoles)
        .orderBy(schema.userRoles.userId, schema.userRoles.roleId),
      menus: await db.select().from(schema.menus).orderBy(schema.menus.id),
      menuVersions: await db
        .select()
        .from(schema.menuVersions)
        .orderBy(schema.menuVersions.scopeType),
    })
    const before = await snapshot()
    // 此时数据库和全部内置角色已初始化，之后才模拟新版服务发布目录。
    ;(ACCESS_PERMISSION_CATALOG as PermissionDefinition[]).push(...upgradePermissions)
    await seed.onModuleInit()
    const after = await snapshot()

    expect(after.roles.map((role) => role.id)).toEqual(before.roles.map((role) => role.id))
    for (const role of before.roles) {
      const previousKeys = before.grants
        .filter((grant) => grant.roleId === role.id)
        .map((grant) => grant.permissionKey)
      const nextKeys = after.grants
        .filter((grant) => grant.roleId === role.id)
        .map((grant) => grant.permissionKey)
      const receivesUpgrade = role.scopeType === 'company' && role.builtin === 'administrator'
      expect(nextKeys).toEqual([...previousKeys, ...(receivesUpgrade ? upgradeKeys : [])].sort())
      const nextRole = after.roles.find((candidate) => candidate.id === role.id)!
      if (receivesUpgrade) expect(nextRole.version).toBe(role.version + 1)
      else expect(nextRole).toEqual(role)
    }
    expect(after.assignments).toEqual(before.assignments)
    expect(
      after.menus.filter((item) => before.menus.some((previous) => previous.id === item.id)),
    ).toEqual(before.menus)
    const addedMenus = after.menus.filter(
      (item) => item.permissionKey && upgradeKeys.includes(item.permissionKey),
    )
    expect(addedMenus).toHaveLength(2)
    const addedPage = addedMenus.find((item) => item.type === 'page')!
    expect(addedPage.permissionKey).toBe('company.upgrade_fixture.read')
    expect(addedMenus.find((item) => item.type === 'operation')).toMatchObject({
      permissionKey: 'company.upgrade_fixture.update',
      parentId: addedPage.id,
    })
    for (const previous of before.menuVersions) {
      expect(
        after.menuVersions.find((version) => version.scopeType === previous.scopeType)?.version,
      ).toBe(previous.version + (previous.scopeType === 'company' ? 2 : 0))
    }
    expect(
      await db
        .select()
        .from(schema.permissions)
        .where(inArray(schema.permissions.key, upgradeKeys)),
    ).toHaveLength(2)
    const adminContext = await access.read(
      { actor: actor(companyAdminId), scope: companyScope },
      async (_tx, current) => access.context(current),
    )
    const memberContext = await access.read(
      { actor: actor(memberId), scope: companyScope },
      async (_tx, current) => access.context(current),
    )
    expect(adminContext.permissionKeys).toEqual(expect.arrayContaining(upgradeKeys))
    expect(memberContext.permissionKeys.some((key) => upgradeKeys.includes(key))).toBe(false)

    await seed.onModuleInit()
    expect(await snapshot()).toEqual(after)
  })
})
