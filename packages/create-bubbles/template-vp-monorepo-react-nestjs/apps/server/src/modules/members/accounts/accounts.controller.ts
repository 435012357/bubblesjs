import { Body, Controller, Get, Patch, Put, Query, Req } from '@nestjs/common'
import type { FastifyRequest } from 'fastify'
import { AccessPolicy } from '@/common/decorators/access-policy.decorator'
import { actor, ids } from '@/modules/access/access-http'
import { parse } from '@/modules/access/access.validation'
import { accountStatusSchema, listSchema, platformRolesSchema } from './accounts.validation'
import { AccountsService } from './accounts.service'

@Controller()
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}
  @Get('platform/accounts')
  @AccessPolicy({ scope: 'platform', permission: 'platform.accounts.read' })
  accounts(@Req() req: FastifyRequest, @Query() query: unknown) {
    return this.accountsService.accounts({ actor: actor(req), query: parse(listSchema, query) })
  }
  @Patch('platform/accounts/:userId/status')
  @AccessPolicy({ scope: 'platform', permission: 'platform.accounts.status' })
  accountStatus(@Req() req: FastifyRequest, @Body() body: unknown) {
    return this.accountsService.accountChange({
      actor: actor(req),
      userId: ids(req).userId!,
      body: parse(accountStatusSchema, body),
    })
  }
  @Put('platform/accounts/:userId/roles')
  @AccessPolicy({ scope: 'platform', permission: 'platform.accounts.roles' })
  accountRoles(@Req() req: FastifyRequest, @Body() body: unknown) {
    return this.accountsService.accountChange({
      actor: actor(req),
      userId: ids(req).userId!,
      body: parse(platformRolesSchema, body),
    })
  }
}
