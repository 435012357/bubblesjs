import { Injectable } from '@nestjs/common'
import * as argon2 from 'argon2'

export const PASSWORD_HASH_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 65_536,
  timeCost: 3,
  parallelism: 4,
} as const

@Injectable()
export class PasswordService {
  /**
   * 使用统一的 Argon2id 参数对明文密码加盐哈希，返回可用于后续校验的摘要。
   */
  hash(password: string) {
    return argon2.hash(password, PASSWORD_HASH_OPTIONS)
  }

  /**
   * 校验明文密码与 Argon2 摘要是否匹配；摘要损坏或校验失败时返回 false。
   */
  async verify(passswordHash: string, password: string) {
    try {
      return await argon2.verify(passswordHash, password)
    } catch {
      return false
    }
  }
}
