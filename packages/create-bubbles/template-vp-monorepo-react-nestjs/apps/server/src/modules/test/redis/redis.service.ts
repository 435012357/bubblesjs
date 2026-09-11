import { InjectRedis } from '@nestjs-modules/ioredis'
import { Injectable } from '@nestjs/common'
import Redis from 'ioredis'

@Injectable()
export class RedisService {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  /**
   * 执行 Redis PING，验证当前连接可用。
   */
  async ping() {
    return this.redis.ping()
  }

  /**
   * 写入字符串键值，可按秒设置正数有效期；未提供有效 TTL 时永久保存。
   */
  async set(key: string, value: string, ttlSeconds?: number) {
    if (ttlSeconds && ttlSeconds > 0) {
      await this.redis.set(key, value, 'EX', ttlSeconds)
    } else {
      await this.redis.set(key, value)
    }
    return 'Ok'
  }

  /**
   * 读取字符串键的值，键不存在时返回 null。
   */
  async get(key: string) {
    return this.redis.get(key)
  }

  /**
   * 删除指定 Redis 键并返回实际删除数量。
   */
  async del(key: string) {
    return this.redis.del(key)
  }

  /**
   * 检查指定 Redis 键是否存在并返回布尔结果。
   */
  async exist(key: string) {
    return (await this.redis.exists(key)) === 1
  }

  /**
   * 按 Redis 通配模式列出匹配键，供开发联调检查数据使用。
   */
  async keys(pattern: string) {
    return this.redis.keys(pattern)
  }
}
