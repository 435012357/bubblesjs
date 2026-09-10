import { Body, Controller, Get, HttpCode, Post, Req } from '@nestjs/common'
import type { FastifyRequest } from 'fastify'
import { AccessPolicy } from '@/common/decorators/access-policy.decorator'
import { actor } from '../access-http'
import { parse } from '../access.validation'
import { PermissionsCleanupService } from './permissions-cleanup.service'
import { cleanupSchema } from './permissions-cleanup.validation'

@Controller('platform/permissions')
export class PermissionsCleanupController {
  constructor(private readonly cleanup: PermissionsCleanupService) {}

  @Get('cleanup-preview')
  @AccessPolicy({ scope: 'platform', permission: 'platform.menus.cleanup', adminOnly: true })
  preview(@Req() req: FastifyRequest) {
    return this.cleanup.preview(actor(req))
  }

  @Post('cleanup')
  @HttpCode(200)
  @AccessPolicy({ scope: 'platform', permission: 'platform.menus.cleanup', adminOnly: true })
  execute(@Req() req: FastifyRequest, @Body() body: unknown) {
    return this.cleanup.cleanup(actor(req), parse(cleanupSchema, body))
  }
}
