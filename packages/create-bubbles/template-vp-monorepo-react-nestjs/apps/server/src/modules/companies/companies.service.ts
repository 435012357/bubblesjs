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

  async company(db: AccessDb, id: string): Promise<CompanyRecord> {
    const [row] = await db.select().from(companies).where(eq(companies.id, id))
    return toTimestampRecord(requireFound(row))
  }

  async companyDetail(db: AccessDb, id: string): Promise<CompanyDetail> {
    return {
      ...(await this.company(db, id)),
      administrators: await this.administrators.administrators(db, {
        type: 'company',
        companyId: id,
      }),
    }
  }

  listCompanies(input: { actor: AccessActor; query: EntityPageQuery }) {
    return this.access.read(
      { actor: input.actor, scope: { type: 'platform' }, permission: 'platform.companies.read' },
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

  create(input: { actor: AccessActor; body: CreateCompanyRequest }) {
    return this.access.write(
      {
        actor: input.actor,
        scope: { type: 'platform' },
        permission: 'platform.companies.create',
        adminOnly: true,
      },
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

  profile(input: { actor: AccessActor; companyId: string; body: UpdateProfileRequest }) {
    return this.access.write(
      {
        actor: input.actor,
        scope: { type: 'company', companyId: input.companyId },
        permission: 'company.profile.update',
      },
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

  status(input: { actor: AccessActor; companyId: string; body: StatusRequest }) {
    return this.access.write(
      { actor: input.actor, scope: { type: 'platform' }, permission: 'platform.companies.status' },
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
