import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createHmac, randomBytes } from 'node:crypto'

@Injectable()
export class SessionTokenService {
  private readonly tokenPepper: string

  /**
   * 读取用于令牌摘要计算的服务端密钥。
   */
  constructor(config: ConfigService) {
    this.tokenPepper = config.getOrThrow<string>('session.tokenPepper')
  }

  /**
   * 使用服务端密钥计算令牌的 HMAC-SHA256 摘要，供 Redis 存储和查询使用。
   */
  digest(rawToken: string) {
    return createHmac('sha256', this.tokenPepper).update(rawToken).digest('hex')
  }

  /**
   * 生成 32 字节随机不透明令牌及其摘要，明文令牌仅交给客户端。
   */
  createToken() {
    const rawToken = randomBytes(32).toString('base64url')
    return {
      rawToken,
      tokenDigest: this.digest(rawToken),
    }
  }

  /**
   * 严格提取大小写匹配、长度为 43 的 base64url Bearer 令牌；格式不合法时返回 null。
   */
  extractBearerToken(authorization: string | undefined) {
    const matched = /^Bearer\s+([A-Za-z0-9_-]{43})$/.exec(authorization ?? '')
    return matched?.[1] ?? null
  }
}
