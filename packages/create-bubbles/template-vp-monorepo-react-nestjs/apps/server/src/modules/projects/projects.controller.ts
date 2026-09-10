import { Body, Controller, Get, HttpCode, Patch, Post, Query, Req } from '@nestjs/common'
import type { FastifyRequest } from 'fastify'
import { AccessPolicy } from '@/common/decorators/access-policy.decorator'
import { actor, ids } from '@/modules/access/access-http'
import { entityListSchema, parse, statusSchema } from '@/modules/access/access.validation'
import { createScopeSchema, profileSchema } from '@/modules/access/workspaces/workspaces.validation'
import { administratorSchema } from '@/modules/members/administrators/administrators.validation'
import { ProjectsService } from './projects.service'

@Controller()
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}
  @Patch('companies/:companyId/projects/:projectId')
  @AccessPolicy({ scope: 'route', permission: '{scope}.profile.update' })
  updateProfile(@Req() req: FastifyRequest, @Body() body: unknown) {
    return this.projectsService.profile({
      actor: actor(req),
      companyId: ids(req).companyId!,
      projectId: ids(req).projectId!,
      body: parse(profileSchema, body),
    })
  }
  @Get('companies/:companyId/projects')
  @AccessPolicy({ scope: 'company', permission: 'company.projects.read' })
  projects(@Req() req: FastifyRequest, @Query() query: unknown) {
    return this.projectsService.listProjects({
      actor: actor(req),
      companyId: ids(req).companyId!,
      query: parse(entityListSchema, query),
    })
  }
  @Post('companies/:companyId/projects')
  @AccessPolicy({ scope: 'company', permission: 'company.projects.create', adminOnly: true })
  createProject(@Req() req: FastifyRequest, @Body() body: unknown) {
    return this.projectsService.create({
      actor: actor(req),
      companyId: ids(req).companyId!,
      body: parse(createScopeSchema, body),
    })
  }
  @Get('companies/:companyId/projects/:projectId')
  @AccessPolicy({ scope: 'project', permission: 'project.profile.read' })
  projectDetail(@Req() req: FastifyRequest) {
    const params = ids(req)
    return this.projectsService.get({
      actor: actor(req),
      companyId: params.companyId!,
      projectId: params.projectId!,
    })
  }
  @Patch('companies/:companyId/projects/:projectId/status')
  @AccessPolicy({ scope: 'company', permission: 'company.projects.status' })
  projectStatus(@Req() req: FastifyRequest, @Body() body: unknown) {
    const params = ids(req)
    return this.projectsService.status({
      actor: actor(req),
      companyId: params.companyId!,
      projectId: params.projectId!,
      body: parse(statusSchema, body),
    })
  }
  @Post('companies/:companyId/projects/:projectId/administrator')
  @HttpCode(200)
  @AccessPolicy({ scope: 'company', permission: 'company.projects.administrator', adminOnly: true })
  projectAdministrator(@Req() req: FastifyRequest, @Body() body: unknown) {
    const params = ids(req)
    return this.projectsService.setAdministrator({
      actor: actor(req),
      companyId: params.companyId!,
      projectId: params.projectId!,
      body: parse(administratorSchema, body),
    })
  }
  @Get('companies/:companyId/projects/:projectId/administrators')
  @AccessPolicy({ scope: 'company', permission: 'company.projects.administrator', adminOnly: true })
  projectAdministrators(@Req() req: FastifyRequest) {
    const params = ids(req)
    return this.projectsService.projectAdministrators({
      actor: actor(req),
      companyId: params.companyId!,
      projectId: params.projectId!,
    })
  }
}
