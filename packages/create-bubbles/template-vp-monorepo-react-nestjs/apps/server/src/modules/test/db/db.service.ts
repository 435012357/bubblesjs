import { DRIZZLE, type DrizzleDB } from '@/database/db.module'
import { Inject, Injectable } from '@nestjs/common'
import { users } from '@/database/schema'

@Injectable()
export class DbService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  /**
   * 查询数据库当前时间以验证 PostgreSQL 连接可用。
   */
  async ping() {
    const res = await this.db.execute('SELECT now() AS now')
    return res.rows[0]
  }

  /**
   * 读取全部用户记录，供数据库示例接口联调使用。
   */
  async findAll() {
    return this.db.query.users.findMany()
  }

  /**
   * 插入示例用户资料并返回数据库生成的完整记录。
   */
  async create(data: Omit<typeof users.$inferInsert, 'id' | 'createdAt'>) {
    const [row] = await this.db.insert(users).values(data).returning()
    return row
  }
}
