import { Module } from '@nestjs/common'
import { AccessModule } from '../access/access.module'
import { MembersModule } from '../members/members.module'
import { CompaniesController } from './companies.controller'
import { CompaniesService } from './companies.service'

@Module({
  imports: [AccessModule, MembersModule],
  controllers: [CompaniesController],
  providers: [CompaniesService],
})
export class CompaniesModule {}
