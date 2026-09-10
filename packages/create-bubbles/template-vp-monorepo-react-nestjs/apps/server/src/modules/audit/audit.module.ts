import { Module } from '@nestjs/common'
import { AccessModule } from '../access/access.module'
import { AuditController } from './audit.controller'
import { AuditService } from './audit.service'

@Module({
  imports: [AccessModule],
  controllers: [AuditController],
  providers: [AuditService],
})
export class AuditModule {}
