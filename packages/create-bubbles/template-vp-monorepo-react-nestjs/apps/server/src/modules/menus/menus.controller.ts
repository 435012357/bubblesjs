import { Body, Controller, Delete, Get, Patch, Post, Query, Req } from '@nestjs/common'
import type { FastifyRequest } from 'fastify'
import { AccessPolicy } from '@/common/decorators/access-policy.decorator'
import { MenusService } from './menus.service'
import { actor, ids } from '@/modules/access/access-http'
import { deleteSchema, parse } from '@/modules/access/access.validation'
import { createMenuSchema, menuQuerySchema, updateMenuSchema } from './menus.validation'

@Controller('platform')
export class MenusController {
  constructor(private readonly menus: MenusService) {}
  @Get('function-catalog')
  @AccessPolicy({ scope: 'platform', permission: 'platform.menus.read' })
  catalog(@Req() req: FastifyRequest, @Query() query: unknown) {
    return this.menus.catalog({ actor: actor(req), ...parse(menuQuerySchema, query) })
  }
  @Get('menus')
  @AccessPolicy({ scope: 'platform', permission: 'platform.menus.read' })
  list(@Req() req: FastifyRequest, @Query() query: unknown) {
    return this.menus.list({ actor: actor(req), ...parse(menuQuerySchema, query) })
  }
  @Post('menus')
  @AccessPolicy({ scope: 'platform', permission: 'platform.menus.create' })
  create(@Req() req: FastifyRequest, @Query() query: unknown, @Body() body: unknown) {
    return this.menus.create({
      actor: actor(req),
      ...parse(menuQuerySchema, query),
      body: parse(createMenuSchema, body),
    })
  }
  @Patch('menus/:menuId')
  @AccessPolicy({ scope: 'platform', permission: 'platform.menus.update' })
  update(@Req() req: FastifyRequest, @Body() body: unknown) {
    return this.menus.change({
      actor: actor(req),
      menuId: ids(req).menuId!,
      action: 'update',
      body: parse(updateMenuSchema, body),
    })
  }
  @Delete('menus/:menuId')
  @AccessPolicy({ scope: 'platform', permission: 'platform.menus.delete' })
  remove(@Req() req: FastifyRequest, @Query() query: unknown) {
    return this.menus.change({
      actor: actor(req),
      menuId: ids(req).menuId!,
      action: 'delete',
      body: parse(deleteSchema, query),
    })
  }
}
