import { DRIZZLE, type DrizzleDB } from '@/database/db.module'
import { users } from '@/database/schema'
import { Inject, Injectable } from '@nestjs/common'
import { eq } from 'drizzle-orm'

type CreateUserInput = Pick<typeof users.$inferInsert, 'name' | 'account' | 'passwordHash'>

@Injectable()
export class AuthRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  /**
   * 按标准化账号查找完整用户记录，供密码校验使用；不存在时返回 null。
   */
  async findByAccount(account: string) {
    const [user] = await this.db.select().from(users).where(eq(users.account, account)).limit(1)
    return user ?? null
  }

  /**
   * 按用户 ID 读取身份与状态字段，避免查询结果携带密码摘要。
   */
  async findPublicById(userId: string) {
    const [user] = await this.db
      .select({
        id: users.id,
        account: users.account,
        name: users.name,
        status: users.status,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
    return user ?? null
  }

  /**
   * 插入用户并返回记录；账号唯一键冲突时不写入并返回 null。
   */
  async createUser(input: CreateUserInput) {
    const [user] = await this.db
      .insert(users)
      .values(input)
      // 处理账号重复情况 ，不插入重复账号
      .onConflictDoNothing({ target: users.account })
      .returning()
    return user ?? null
  }

  /**
   * 在事务中对启用用户持有共享行锁，再执行会话创建操作，避免与用户停用并发。
   * @returns 操作结果；用户不存在或已停用时返回 null。
   */
  withActiveUserLock<T>(userId: string, operation: () => Promise<T>) {
    /** 在事务结束前保留共享行锁，保证回调执行期间账号不会被并发停用。 */
    return this.db.transaction(async (tx) => {
      const [user] = await tx.select().from(users).where(eq(users.id, userId)).for('share')
      if (!user || user.status !== 'active') return null
      return operation()
    })
  }
}
