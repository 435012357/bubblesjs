import { Injectable } from '@nestjs/common'

@Injectable()
export class AppService {
  /**
   * 提供根路径使用的默认欢迎文本。
   */
  getHello(): string {
    return 'Hello World!'
  }
}
