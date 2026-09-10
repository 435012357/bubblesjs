import { Injectable } from '@nestjs/common'
import { and, count, desc, eq, inArray } from 'drizzle-orm'
import { roles, userRoles, users } from '@/database/schema'
import { AccessService, type AccessActor } from '@/modules/access/access.service'
import { MembersService } from '@/modules/members/members.service'
import { SessionStoreService } from '@/modules/auth/session/session-store.service'
import {
  pageWindow,
  requireFound,
  scopeFilter,
  searchSql,
  type AccessDb,
} from '@/modules/access/access.store'
import type { AccountPageQuery, AccountRecord } from 'shared/types'
import { toTimestampRecord } from 'shared/utils'

@Injectable()
export class AccountsService {
  constructor(
    private readonly access: AccessService,
    private readonly members: MembersService,
    private readonly sessions: SessionStoreService,
  ) {}
  async accountRecord(db: AccessDb, userId: string): Promise<AccountRecord> {
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        account: users.account,
        status: users.status,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, userId))
    const found = requireFound(user)
    return {
      ...toTimestampRecord(found),
      platformRoleIds: (await this.access.roleAssignments(db, { type: 'platform' }, userId)).map(
        (r) => r.role.id,
      ),
    }
  }
  accounts(input: { actor: AccessActor; query: AccountPageQuery }) {
    return this.access.read(
      { actor: input.actor, scope: { type: 'platform' }, permission: 'platform.accounts.read' },
      async (tx) => {
        const { page, pageSize, offset } = pageWindow(input.query)
        const condition = and(
          input.query.status ? eq(users.status, input.query.status) : undefined,
          searchSql([users.name, users.account], input.query.query),
        )
        const [total] = await tx.select({ value: count() }).from(users).where(condition)
        const rows = await tx
          .select({
            id: users.id,
            name: users.name,
            account: users.account,
            status: users.status,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt,
          })
          .from(users)
          .where(condition)
          .orderBy(desc(users.createdAt), desc(users.id))
          .limit(pageSize)
          .offset(offset)
        const assignments = rows.length
          ? await tx
              .select({ userId: userRoles.userId, roleId: userRoles.roleId })
              .from(userRoles)
              .innerJoin(roles, eq(roles.id, userRoles.roleId))
              .where(
                and(
                  scopeFilter({ type: 'platform' }),
                  inArray(
                    userRoles.userId,
                    rows.map((r) => r.id),
                  ),
                ),
              )
          : []
        return {
          page,
          pageSize,
          total: total!.value,
          items: rows.map((row) => ({
            ...toTimestampRecord(row),
            platformRoleIds: assignments.filter((a) => a.userId === row.id).map((a) => a.roleId),
          })),
        }
      },
    )
  }
  accountChange(input: {
    actor: AccessActor
    userId: string
    body: { status: 'active' | 'disabled' } | { roleIds: string[] }
  }) {
    return this.access.write(
      {
        actor: input.actor,
        scope: { type: 'platform' },
        permission: 'status' in input.body ? 'platform.accounts.status' : 'platform.accounts.roles',
      },
      async (tx, access) => {
        const [user] = await tx.select().from(users).where(eq(users.id, input.userId)).for('update')
        requireFound(user)
        if ('status' in input.body) {
          const options = { userId: input.userId, platformOnly: !!access.administrator }
          const previous = (await this.access.effectiveAdministratorScopes(tx, options)).effective
          await tx
            .update(users)
            .set({ status: input.body.status, updatedAt: new Date() })
            .where(eq(users.id, input.userId))
          await this.access.assertAdministrators(tx, { ...options, previous })
        } else {
          await this.members.validateRoleAssignment(tx, {
            access,
            userId: input.userId,
            roleIds: input.body.roleIds,
          })
          await this.access.assertAdministrators(tx, { platformOnly: true })
        }
        await this.access.audit(tx, {
          actor: input.actor,
          access,
          action: 'status' in input.body ? 'account.status' : 'account.roles',
          objectType: 'account',
          objectId: input.userId,
          summary:
            'status' in input.body
              ? { fromStatus: user!.status, toStatus: input.body.status }
              : { roleIds: input.body.roleIds },
        })
        const result = await this.accountRecord(tx, input.userId)
        // 保持用户行排他锁；业务校验与审计成功后再撤销会话，避免拒绝操作产生注销副作用。
        if ('status' in input.body && input.body.status === 'disabled')
          await this.sessions.revokeAllForUser(input.userId)
        return result
      },
    )
  }
}
