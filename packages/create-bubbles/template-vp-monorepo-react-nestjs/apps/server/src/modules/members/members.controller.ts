import { Body, Controller, Delete, Get, Patch, Post, Put, Query, Req } from '@nestjs/common'
import type { FastifyRequest } from 'fastify'
import { AccessPolicy } from '@/common/decorators/access-policy.decorator'
import { MembersService } from './members.service'
import { actor, ids, scopeFor } from '@/modules/access/access-http'
import {
  deleteSchema,
  entityListSchema,
  parse,
  statusSchema,
} from '@/modules/access/access.validation'
import { memberRolesSchema, memberSchema } from './members.validation'

@Controller(['companies/:companyId/members', 'companies/:companyId/projects/:projectId/members'])
export class MembersController {
  constructor(private readonly members: MembersService) {}
  @Get()
  @AccessPolicy({ scope: 'route', permission: '{scope}.members.read' })
  list(@Req() req: FastifyRequest, @Query() query: unknown) {
    return this.members.list({
      actor: actor(req),
      scope: scopeFor(req),
      query: parse(entityListSchema, query),
    })
  }
  @Post()
  @AccessPolicy({ scope: 'route', permission: '{scope}.members.add' })
  add(@Req() req: FastifyRequest, @Body() body: unknown) {
    return this.members.add({
      actor: actor(req),
      scope: scopeFor(req),
      body: parse(memberSchema, body),
    })
  }
  @Patch(':memberId/status')
  @AccessPolicy({ scope: 'route', permission: '{scope}.members.status' })
  status(@Req() req: FastifyRequest, @Body() body: unknown) {
    return this.members.change({
      actor: actor(req),
      scope: scopeFor(req),
      memberId: ids(req).memberId!,
      action: 'status',
      body: parse(statusSchema, body),
    })
  }
  @Put(':memberId/roles')
  @AccessPolicy({ scope: 'route', permission: '{scope}.members.roles' })
  roles(@Req() req: FastifyRequest, @Body() body: unknown) {
    return this.members.change({
      actor: actor(req),
      scope: scopeFor(req),
      memberId: ids(req).memberId!,
      action: 'roles',
      body: parse(memberRolesSchema, body),
    })
  }
  @Delete(':memberId')
  @AccessPolicy({ scope: 'route', permission: '{scope}.members.remove' })
  remove(@Req() req: FastifyRequest, @Query() query: unknown) {
    return this.members.change({
      actor: actor(req),
      scope: scopeFor(req),
      memberId: ids(req).memberId!,
      action: 'remove',
      body: parse(deleteSchema, query),
    })
  }
}
