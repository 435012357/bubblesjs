import { Module } from '@nestjs/common'
import { AccessModule } from '../access/access.module'
import { MembersModule } from '../members/members.module'
import { ProjectsController } from './projects.controller'
import { ProjectsService } from './projects.service'

@Module({
  imports: [AccessModule, MembersModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
})
export class ProjectsModule {}
