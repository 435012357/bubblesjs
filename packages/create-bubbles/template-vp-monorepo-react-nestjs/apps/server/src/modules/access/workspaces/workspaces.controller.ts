import { Controller, Get, Req } from '@nestjs/common'
import type { FastifyRequest } from 'fastify'
import { AccessPolicy, Authenticated } from '@/common/decorators/access-policy.decorator'
import { actor, scopeFor } from '@/modules/access/access-http'
import { WorkspacesService } from './workspaces.service'

@Controller()
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  /** 为已登录用户返回可进入的工作空间及其管理员身份。 */
  @Get('workspaces')
  @Authenticated()
  workspaces(@Req() req: FastifyRequest) {
    return this.workspacesService.workspaces(actor(req))
  }

  /** 根据路由推导工作空间，返回该空间的用户权限、菜单和版本上下文。 */
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
