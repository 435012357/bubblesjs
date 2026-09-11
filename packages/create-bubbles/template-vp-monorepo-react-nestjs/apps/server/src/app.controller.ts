import { Controller, Get } from '@nestjs/common'
import { AppService } from './app.service'
import { Public } from './common/decorators/public.decorator'

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * 为公开的根路径返回应用欢迎信息，便于快速确认 HTTP 服务可用。
   */
  @Get()
  @Public()
  getHello(): string {
    return this.appService.getHello()
  }
}
