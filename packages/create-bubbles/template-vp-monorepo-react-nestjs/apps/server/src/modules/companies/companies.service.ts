import { Injectable } from '@nestjs/common'
import { and, count, desc, eq, sql } from 'drizzle-orm'
import { companies } from '@/database/schema'
import { AppException } from '@/common/exceptions/app.exception'
import { AccessService, type AccessActor } from '@/modules/access/access.service'
import { ACCESS_ERRORS } from '@/modules/access/access.errors'
import {
  checkVersion,
  pageWindow,
  requireFound,
  searchSql,
  type AccessDb,
} from '@/modules/access/access.store'
import { MembersService } from '@/modules/members/members.service'
import { AdministratorsService } from '@/modules/members/administrators/administrators.service'
import type {
  AccessScope,
  CompanyDetail,
  CompanyRecord,
  CreateCompanyRequest,
  EntityPageQuery,
  SetAdministratorRequest,
  SetAdministratorResult,
  StatusRequest,
  UpdateProfileRequest,
} from 'shared/types'
import { toTimestampRecord } from 'shared/utils'

@Injectable()
export class CompaniesService {
  constructor(
    private readonly access: AccessService,
    private readonly members: MembersService,
    private readonly administrators: AdministratorsService,
  ) {}

  /** 读取指定公司并将时间字段转换为接口格式；公司不存在时抛出资源不存在异常。 */
  async company(db: AccessDb, id: string): Promise<CompanyRecord> {
    const [row] = await db.select().from(companies).where(eq(companies.id, id))
    return toTimestampRecord(requireFound(row))
  }

  /** 在同一数据库上下文中读取公司资料及其直接分配的管理员状态。 */
  async companyDetail(db: AccessDb, id: string): Promise<CompanyDetail> {
    return {
      ...(await this.company(db, id)),
      administrators: await this.administrators.administrators(db, {
        type: 'company',
        companyId: id,
      }),
    }
  }

  /** 在平台公司读取权限下，按状态、公司名称或编码分页查询公司。 */
  listCompanies(input: { actor: AccessActor; query: EntityPageQuery }) {
    return this.access.read(
      { actor: input.actor, scope: { type: 'platform' }, permission: 'platform.companies.read' },
      /** 使用相同筛选条件查询公司总数和当前页，避免分页信息来自不同快照。 */
      async (tx) => {
        const { page, pageSize, offset } = pageWindow(input.query)
        const condition = and(
          input.query.status ? eq(companies.status, input.query.status) : undefined,
          searchSql([companies.name, companies.code], input.query.query),
        )
        const [total] = await tx.select({ value: count() }).from(companies).where(condition)
        const rows = await tx
          .select()
          .from(companies)
          .where(condition)
          .orderBy(desc(companies.createdAt), desc(companies.id))
          .limit(pageSize)
          .offset(offset)
        return { items: rows.map(toTimestampRecord), total: total!.value, page, pageSize }
      },
    )
  }

  /**
   * 要求平台管理员具备创建权限，校验公司编码和管理员账号后创建公司及首位管理员并记录审计。
   *
   * @returns 新公司资料与管理员列表。
   */
  create(input: { actor: AccessActor; body: CreateCompanyRequest }) {
    return this.access.write(
      {
        actor: input.actor,
        scope: { type: 'platform' },
        permission: 'platform.companies.create',
        adminOnly: true,
      },
      /** 在同一事务内校验管理员账号和公司编码，创建公司及首位管理员并记录审计。 */
      async (tx, access) => {
        const user = await this.members.userForAccount(
          tx,
          { type: 'company', companyId: '' },
          input.body.administratorAccount,
        )
        const [duplicate] = await tx
          .select()
          .from(companies)
          .where(eq(companies.code, input.body.code))
        if (duplicate) throw new AppException(ACCESS_ERRORS.DUPLICATE_RESOURCE)
        const [created] = await tx
          .insert(companies)
          .values({
            name: input.body.name,
            code: input.body.code,
            description: input.body.description ?? '',
          })
          .returning()
        await this.administrators.initialize(
          tx,
          { type: 'company', companyId: created!.id },
          user.id,
        )
        await this.access.audit(tx, {
          actor: input.actor,
          access,
          action: 'company.create',
          objectType: 'company',
          objectId: created!.id,
          summary: { targetUserId: user.id },
        })
        return this.companyDetail(tx, created!.id)
      },
    )
  }

  /**
   * 根据请求入口使用平台公司读取权限或公司资料读取权限，返回公司及管理员详情。
   *
   * @param input - platform 为 true 时按平台权限读取，默认使用公司作用域鉴权。
   */
  get(input: { actor: AccessActor; companyId: string; platform?: boolean }) {
    const scope: AccessScope = input.platform
      ? { type: 'platform' }
      : { type: 'company', companyId: input.companyId }
    return this.access.read(
      {
        actor: input.actor,
        scope,
        permission: input.platform ? 'platform.companies.read' : 'company.profile.read',
      },
      (tx) => this.companyDetail(tx, input.companyId),
    )
  }

  /** 在公司作用域内校验资料修改权限、数据版本和编码唯一性，更新资料并记录审计。 */
  profile(input: { actor: AccessActor; companyId: string; body: UpdateProfileRequest }) {
    return this.access.write(
      {
        actor: input.actor,
        scope: { type: 'company', companyId: input.companyId },
        permission: 'company.profile.update',
      },
      /** 检查公司版本与编码冲突，再将资料变更和字段审计一并写入。 */
      async (tx, access) => {
        const existing = await this.company(tx, input.companyId)
        checkVersion(existing.version, input.body.expectedVersion)
        if (input.body.code) {
          const [duplicate] = await tx
            .select()
            .from(companies)
            .where(eq(companies.code, input.body.code))
          if (duplicate && duplicate.id !== existing.id)
            throw new AppException(ACCESS_ERRORS.DUPLICATE_RESOURCE)
        }
        const { expectedVersion: _, ...changes } = input.body
        await tx
          .update(companies)
          .set({ ...changes, version: sql`${companies.version} + 1`, updatedAt: new Date() })
          .where(eq(companies.id, existing.id))
        await this.access.audit(tx, {
          actor: input.actor,
          access,
          action: 'company.update',
          objectType: 'company',
          objectId: existing.id,
          summary: { changedFields: Object.keys(changes) },
        })
        return this.company(tx, input.companyId)
      },
    )
  }

  /**
   * 在平台权限下启停公司并递增版本；重新启用时必须确认相关有效作用域仍有管理员。
   *
   * 状态变更与审计记录在同一事务内提交。
   */
  status(input: { actor: AccessActor; companyId: string; body: StatusRequest }) {
    return this.access.write(
      { actor: input.actor, scope: { type: 'platform' }, permission: 'platform.companies.status' },
      /** 根据预期版本启停公司，启用时验证管理员完整性并记录前后状态。 */
      async (tx, access) => {
        const target = await this.company(tx, input.companyId)
        checkVersion(target.version, input.body.expectedVersion)
        await tx
          .update(companies)
          .set({
            status: input.body.status,
            version: sql`${companies.version} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(companies.id, target.id))
        if (input.body.status === 'active')
          await this.access.assertAdministrators(tx, { companyId: input.companyId })
        await this.access.audit(tx, {
          actor: input.actor,
          access,
          action: 'company.status',
          objectType: 'company',
          objectId: target.id,
          summary: { fromStatus: target.status, toStatus: input.body.status },
        })
        return this.company(tx, input.companyId)
      },
    )
  }

  /**
   * 要求平台管理员具备公司管理员设置权限，为目标公司追加或替换管理员并记录审计。
   *
   * @returns 新管理员状态和被替换用户标识。
   */
  setAdministrator(input: {
    actor: AccessActor
    companyId: string
    body: SetAdministratorRequest
  }) {
    return this.access.write(
      {
        actor: input.actor,
        scope: { type: 'platform' },
        permission: 'platform.companies.administrator',
        adminOnly: true,
      },
      /** 确认公司存在后变更管理员分配，并返回新管理员状态及替换记录。 */
      async (tx, access): Promise<SetAdministratorResult> => {
        await this.company(tx, input.companyId)
        const scope: AccessScope = { type: 'company', companyId: input.companyId }
        const user = await this.administrators.assign(tx, { scope, body: input.body })
        await this.access.audit(tx, {
          actor: input.actor,
          access,
          action: 'company.administrator.set',
          objectType: 'company',
          objectId: input.companyId,
          summary: {
            targetUserId: user.id,
            companyId: input.companyId,
            replacedUserId: input.body.replaceUserId ?? null,
          },
        })
        return {
          administrator: (await this.administrators.administrators(tx, scope)).find(
            (item) => item.id === user.id,
          )!,
          replacedUserId: input.body.replaceUserId ?? null,
        }
      },
    )
  }
}
