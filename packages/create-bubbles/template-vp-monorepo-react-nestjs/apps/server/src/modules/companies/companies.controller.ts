import { Body, Controller, Get, HttpCode, Patch, Post, Query, Req } from '@nestjs/common'
import type { FastifyRequest } from 'fastify'
import { AccessPolicy } from '@/common/decorators/access-policy.decorator'
import { actor, ids } from '@/modules/access/access-http'
import { entityListSchema, parse, statusSchema } from '@/modules/access/access.validation'
import { createScopeSchema, profileSchema } from '@/modules/access/workspaces/workspaces.validation'
import { administratorSchema } from '@/modules/members/administrators/administrators.validation'
import { CompaniesService } from './companies.service'

@Controller()
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}
  @Get('platform/companies')
  @AccessPolicy({ scope: 'platform', permission: 'platform.companies.read' })
  companies(@Req() req: FastifyRequest, @Query() query: unknown) {
    return this.companiesService.listCompanies({
      actor: actor(req),
      query: parse(entityListSchema, query),
    })
  }
  @Get('platform/companies/:companyId')
  @AccessPolicy({ scope: 'platform', permission: 'platform.companies.read' })
  companyDetail(@Req() req: FastifyRequest) {
    return this.companiesService.get({
      actor: actor(req),
      companyId: ids(req).companyId!,
      platform: true,
    })
  }
  @Post('platform/companies')
  @AccessPolicy({ scope: 'platform', permission: 'platform.companies.create', adminOnly: true })
  createCompany(@Req() req: FastifyRequest, @Body() body: unknown) {
    return this.companiesService.create({ actor: actor(req), body: parse(createScopeSchema, body) })
  }
  @Patch('platform/companies/:companyId/status')
  @AccessPolicy({ scope: 'platform', permission: 'platform.companies.status' })
  companyStatus(@Req() req: FastifyRequest, @Body() body: unknown) {
    return this.companiesService.status({
      actor: actor(req),
      companyId: ids(req).companyId!,
      body: parse(statusSchema, body),
    })
  }
  @Post('platform/companies/:companyId/administrator')
  @HttpCode(200)
  @AccessPolicy({
    scope: 'platform',
    permission: 'platform.companies.administrator',
    adminOnly: true,
  })
  companyAdministrator(@Req() req: FastifyRequest, @Body() body: unknown) {
    return this.companiesService.setAdministrator({
      actor: actor(req),
      companyId: ids(req).companyId!,
      body: parse(administratorSchema, body),
    })
  }
  @Get('companies/:companyId')
  @AccessPolicy({ scope: 'company', permission: 'company.profile.read' })
  profile(@Req() req: FastifyRequest) {
    return this.companiesService.get({ actor: actor(req), companyId: ids(req).companyId! })
  }
  @Patch('companies/:companyId')
  @AccessPolicy({ scope: 'route', permission: '{scope}.profile.update' })
  updateProfile(@Req() req: FastifyRequest, @Body() body: unknown) {
    return this.companiesService.profile({
      actor: actor(req),
      companyId: ids(req).companyId!,
      body: parse(profileSchema, body),
    })
  }
}
