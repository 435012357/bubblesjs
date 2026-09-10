import { Controller, Get, Req } from '@nestjs/common'
import type { FastifyRequest } from 'fastify'
import { AccessPolicy, Authenticated } from '@/common/decorators/access-policy.decorator'
import { actor, scopeFor } from '@/modules/access/access-http'
import { WorkspacesService } from './workspaces.service'

@Controller()
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get('workspaces')
  @Authenticated()
  workspaces(@Req() req: FastifyRequest) {
    return this.workspacesService.workspaces(actor(req))
  }

  @Get([
    'platform/access',
    'companies/:companyId/access',
    'companies/:companyId/projects/:projectId/access',
  ])
  @AccessPolicy({ scope: 'route' })
  context(@Req() req: FastifyRequest) {
    return this.workspacesService.context({ actor: actor(req), scope: scopeFor(req) })
  }
}
