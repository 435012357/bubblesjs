import { Body, Controller, Delete, Get, Patch, Post, Put, Query, Req } from '@nestjs/common'
import type { FastifyRequest } from 'fastify'
import { AccessPolicy } from '@/common/decorators/access-policy.decorator'
import { RolesService } from './roles.service'
import { actor, ids, scopeFor } from '../access-http'
import { deleteSchema, pageSchema, parse } from '../access.validation'
import { createRoleSchema, permissionsSchema, updateRoleSchema } from './roles.validation'

@Controller(['platform', 'companies/:companyId', 'companies/:companyId/projects/:projectId'])
export class RolesController {
  constructor(private readonly roles: RolesService) {}
  @Get('roles')
  @AccessPolicy({ scope: 'route' })
  list(@Req() req: FastifyRequest, @Query() query: unknown) {
    return this.roles.list({
      actor: actor(req),
      scope: scopeFor(req),
      query: parse(pageSchema, query),
    })
  }
  @Get('roles/:roleId')
  @AccessPolicy({ scope: 'route' })
  get(@Req() req: FastifyRequest) {
    return this.roles.get({ actor: actor(req), scope: scopeFor(req), roleId: ids(req).roleId! })
  }
  @Get('permissions')
  @AccessPolicy({ scope: 'route' })
  permissions(@Req() req: FastifyRequest) {
    return this.roles.permissions({ actor: actor(req), scope: scopeFor(req) })
  }
  @Post('roles')
  @AccessPolicy({ scope: 'route', permission: '{scope}.roles.create' })
  create(@Req() req: FastifyRequest, @Body() body: unknown) {
    return this.roles.create({
      actor: actor(req),
      scope: scopeFor(req),
      body: parse(createRoleSchema, body),
    })
  }
  @Patch('roles/:roleId')
  @AccessPolicy({ scope: 'route', permission: '{scope}.roles.update' })
  update(@Req() req: FastifyRequest, @Body() body: unknown) {
    return this.roles.change({
      actor: actor(req),
      scope: scopeFor(req),
      roleId: ids(req).roleId!,
      action: 'update',
      body: parse(updateRoleSchema, body),
    })
  }
  @Put('roles/:roleId/permissions')
  @AccessPolicy({ scope: 'route', permission: '{scope}.roles.permissions' })
  permissionsUpdate(@Req() req: FastifyRequest, @Body() body: unknown) {
    return this.roles.change({
      actor: actor(req),
      scope: scopeFor(req),
      roleId: ids(req).roleId!,
      action: 'permissions',
      body: parse(permissionsSchema, body),
    })
  }
  @Delete('roles/:roleId')
  @AccessPolicy({ scope: 'route', permission: '{scope}.roles.delete' })
  remove(@Req() req: FastifyRequest, @Query() query: unknown) {
    return this.roles.change({
      actor: actor(req),
      scope: scopeFor(req),
      roleId: ids(req).roleId!,
      action: 'delete',
      body: parse(deleteSchema, query),
    })
  }
}
