import { Injectable } from '@nestjs/common'
import { and, eq } from 'drizzle-orm'
import { companies, companyMembers, projects, projectMembers, users } from '@/database/schema'
import { AppException } from '@/common/exceptions/app.exception'
import { AUTH_ERRORS } from '@/modules/auth/auth.errors'
import { AccessService, type AccessActor } from '@/modules/access/access.service'
import type { AccessScope, WorkspacesResult } from 'shared/types'

@Injectable()
export class WorkspacesService {
  constructor(private readonly access: AccessService) {}

  context(input: { actor: AccessActor; scope: AccessScope }) {
    return this.access.read(input, async (_tx, access) => this.access.context(access))
  }
  workspaces(actor: AccessActor): Promise<WorkspacesResult> {
    return this.access.db.transaction(
      async (tx) => {
        const [user] = await tx
          .select({ id: users.id, name: users.name, account: users.account, status: users.status })
          .from(users)
          .where(eq(users.id, actor.userId))
        if (!user || user.status !== 'active') throw new AppException(AUTH_ERRORS.SESSION_INVALID)
        const workspaces: WorkspacesResult['workspaces'] = []
        if ((await this.access.roleAssignments(tx, { type: 'platform' }, user.id)).length)
          workspaces.push({
            scope: { type: 'platform' },
            name: '平台管理',
            administrator: (await this.access.isAdministrator(tx, { type: 'platform' }, user.id))
              ? 'platform'
              : null,
          })
        const memberships = await tx
          .select({ company: companies })
          .from(companyMembers)
          .innerJoin(companies, eq(companies.id, companyMembers.companyId))
          .where(
            and(
              eq(companyMembers.userId, user.id),
              eq(companyMembers.status, 'active'),
              eq(companies.status, 'active'),
            ),
          )
        for (const { company } of memberships) {
          const scope: AccessScope = { type: 'company', companyId: company.id }
          const isAdmin = await this.access.isAdministrator(tx, scope, user.id)
          workspaces.push({ scope, name: company.name, administrator: isAdmin ? 'company' : null })
          const allProjects = await tx
            .select()
            .from(projects)
            .where(and(eq(projects.companyId, company.id), eq(projects.status, 'active')))
          const joined = await tx
            .select()
            .from(projectMembers)
            .where(
              and(
                eq(projectMembers.companyId, company.id),
                eq(projectMembers.userId, user.id),
                eq(projectMembers.status, 'active'),
              ),
            )
          for (const project of allProjects.filter(
            (p) => isAdmin || joined.some((m) => m.projectId === p.id),
          )) {
            const projectScope: AccessScope = {
              type: 'project',
              companyId: company.id,
              projectId: project.id,
            }
            workspaces.push({
              scope: projectScope,
              name: project.name,
              companyName: company.name,
              administrator: isAdmin
                ? 'company'
                : (await this.access.isAdministrator(tx, projectScope, user.id))
                  ? 'project'
                  : null,
            })
          }
        }
        return { user: { id: user.id, name: user.name, account: user.account }, workspaces }
      },
      { isolationLevel: 'repeatable read', accessMode: 'read only' },
    )
  }
}
