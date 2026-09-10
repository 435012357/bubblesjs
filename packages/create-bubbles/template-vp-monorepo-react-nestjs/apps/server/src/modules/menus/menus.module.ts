import { Module } from '@nestjs/common'
import { AccessModule } from '../access/access.module'
import { MenusController } from './menus.controller'
import { MenusService } from './menus.service'

@Module({
  imports: [AccessModule],
  controllers: [MenusController],
  providers: [MenusService],
})
export class MenusModule {}
