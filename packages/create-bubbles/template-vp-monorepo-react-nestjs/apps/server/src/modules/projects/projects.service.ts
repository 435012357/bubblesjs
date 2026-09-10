import { Injectable } from '@nestjs/common'
import { and, count, desc, eq, inArray, sql } from 'drizzle-orm'
import { projects, projectMembers } from '@/database/schema'
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
  CreateProjectRequest,
  EntityPageQuery,
  ProjectDetail,
  ProjectRecord,
  SetAdministratorRequest,
  SetAdministratorResult,
  StatusRequest,
  UpdateProfileRequest,
} from 'shared/types'
import { toTimestampRecord } from 'shared/utils'

@Injectable()
export class ProjectsService {
  constructor(
    private readonly access: AccessService,
    private readonly members: MembersService,
    private readonly administrators: AdministratorsService,
  ) {}

  async project(
    db: AccessDb,
    scope: { companyId: string; projectId: string },
  ): Promise<ProjectRecord> {
    const [row] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.companyId, scope.companyId), eq(projects.id, scope.projectId)))
    return toTimestampRecord(requireFound(row))
  }

  async projectDetail(
    db: AccessDb,
    scope: { companyId: string; projectId: string },
  ): Promise<ProjectDetail> {
    return {
      ...(await this.project(db, scope)),
      administrators: await this.administrators.administrators(db, { type: 'project', ...scope }),
    }
  }

  listProjects(input: { actor: AccessActor; companyId: string; query: EntityPageQuery }) {
    return this.access.read(
      {
        actor: input.actor,
        scope: { type: 'company', companyId: input.companyId },
        permission: 'company.projects.read',
      },
      async (tx, access) => {
        const { page, pageSize, offset } = pageWindow(input.query)
        const joined = tx
          .select({ id: projectMembers.projectId })
          .from(projectMembers)
          .where(
            and(
              eq(projectMembers.companyId, input.companyId),
              eq(projectMembers.userId, input.actor.userId),
            ),
          )
        const condition = and(
          eq(projects.companyId, input.companyId),
          input.query.status ? eq(projects.status, input.query.status) : undefined,
          access.administrator ? undefined : inArray(projects.id, joined),
          searchSql([projects.name, projects.code], input.query.query),
        )
        const [total] = await tx.select({ value: count() }).from(projects).where(condition)
        const rows = await tx
          .select()
          .from(projects)
          .where(condition)
          .orderBy(desc(projects.createdAt), desc(projects.id))
          .limit(pageSize)
          .offset(offset)
        return { items: rows.map(toTimestampRecord), total: total!.value, page, pageSize }
      },
    )
  }

  create(input: { actor: AccessActor; companyId: string; body: CreateProjectRequest }) {
    return this.access.write(
      {
        actor: input.actor,
        scope: { type: 'company', companyId: input.companyId },
        permission: 'company.projects.create',
        adminOnly: true,
      },
      async (tx, access) => {
        const user = await this.members.userForAccount(
          tx,
          { type: 'project', companyId: input.companyId, projectId: '' },
          input.body.administratorAccount,
        )
        const [duplicate] = await tx
          .select()
          .from(projects)
          .where(and(eq(projects.companyId, input.companyId), eq(projects.code, input.body.code)))
        if (duplicate) throw new AppException(ACCESS_ERRORS.DUPLICATE_RESOURCE)
        const [created] = await tx
          .insert(projects)
          .values({
            companyId: input.companyId,
            name: input.body.name,
            code: input.body.code,
            description: input.body.description ?? '',
          })
          .returning()
        const scope: AccessScope = {
          type: 'project',
          companyId: input.companyId,
          projectId: created!.id,
        }
        await this.administrators.initialize(tx, scope, user.id)
        await this.access.audit(tx, {
          actor: input.actor,
          access,
          action: 'project.create',
          objectType: 'project',
          objectId: created!.id,
          summary: { targetUserId: user.id },
        })
        return this.projectDetail(tx, scope)
      },
    )
  }

  get(input: { actor: AccessActor; companyId: string; projectId: string }) {
    return this.access.read(
      {
        actor: input.actor,
        scope: { type: 'project', companyId: input.companyId, projectId: input.projectId },
        permission: 'project.profile.read',
      },
      (tx) => this.projectDetail(tx, { companyId: input.companyId, projectId: input.projectId }),
    )
  }

  profile(input: {
    actor: AccessActor
    companyId: string
    projectId: string
    body: UpdateProfileRequest
  }) {
    return this.access.write(
      {
        actor: input.actor,
        scope: { type: 'project', companyId: input.companyId, projectId: input.projectId },
        permission: 'project.profile.update',
      },
      async (tx, access) => {
        const existing = await this.project(tx, input)
        checkVersion(existing.version, input.body.expectedVersion)
        if (input.body.code) {
          const [duplicate] = await tx
            .select()
            .from(projects)
            .where(and(eq(projects.companyId, input.companyId), eq(projects.code, input.body.code)))
          if (duplicate && duplicate.id !== existing.id)
            throw new AppException(ACCESS_ERRORS.DUPLICATE_RESOURCE)
        }
        const { expectedVersion: _, ...changes } = input.body
        await tx
          .update(projects)
          .set({ ...changes, version: sql`${projects.version} + 1`, updatedAt: new Date() })
          .where(eq(projects.id, existing.id))
        await this.access.audit(tx, {
          actor: input.actor,
          access,
          action: 'project.update',
          objectType: 'project',
          objectId: existing.id,
          summary: { changedFields: Object.keys(changes) },
        })
        return this.project(tx, input)
      },
    )
  }

  status(input: { actor: AccessActor; companyId: string; projectId: string; body: StatusRequest }) {
    return this.access.write(
      {
        actor: input.actor,
        scope: { type: 'company', companyId: input.companyId },
        permission: 'company.projects.status',
      },
      async (tx, access) => {
        const target = await this.project(tx, input)
        if (!access.administrator) {
          const [member] = await tx
            .select()
            .from(projectMembers)
            .where(
              and(
                eq(projectMembers.companyId, input.companyId),
                eq(projectMembers.projectId, input.projectId),
                eq(projectMembers.userId, input.actor.userId),
              ),
            )
          requireFound(member)
        }
        checkVersion(target.version, input.body.expectedVersion)
        await tx
          .update(projects)
          .set({
            status: input.body.status,
            version: sql`${projects.version} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(projects.id, target.id))
        if (input.body.status === 'active')
          await this.access.assertAdministrators(tx, {
            companyId: input.companyId,
            projectId: input.projectId,
          })
        await this.access.audit(tx, {
          actor: input.actor,
          access,
          action: 'project.status',
          objectType: 'project',
          objectId: target.id,
          summary: { fromStatus: target.status, toStatus: input.body.status },
        })
        return this.project(tx, input)
      },
    )
  }

  setAdministrator(input: {
    actor: AccessActor
    companyId: string
    projectId: string
    body: SetAdministratorRequest
  }) {
    return this.access.write(
      {
        actor: input.actor,
        scope: { type: 'company', companyId: input.companyId },
        permission: 'company.projects.administrator',
        adminOnly: true,
      },
      async (tx, access): Promise<SetAdministratorResult> => {
        await this.project(tx, input)
        const scope: AccessScope = {
          type: 'project',
          companyId: input.companyId,
          projectId: input.projectId,
        }
        const user = await this.administrators.assign(tx, { scope, body: input.body })
        await this.access.audit(tx, {
          actor: input.actor,
          access,
          action: 'project.administrator.set',
          objectType: 'project',
          objectId: input.projectId,
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

  projectAdministrators(input: { actor: AccessActor; companyId: string; projectId: string }) {
    return this.access.read(
      {
        actor: input.actor,
        scope: { type: 'company', companyId: input.companyId },
        permission: 'company.projects.administrator',
        adminOnly: true,
      },
      async (tx) => {
        await this.project(tx, input)
        return this.administrators.administrators(tx, {
          type: 'project',
          companyId: input.companyId,
          projectId: input.projectId,
        })
      },
    )
  }
}
