import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { AuthModule } from '../auth/auth.module'
import { AccessService } from './access.service'
import { AccessSeedService } from './seed/access-seed.service'
import { RolesService } from './roles/roles.service'
import { RolesController } from './roles/roles.controller'
import { PermissionsCleanupService } from './maintenance/permissions-cleanup.service'
import { PermissionsCleanupController } from './maintenance/permissions-cleanup.controller'
import { WorkspacesController } from './workspaces/workspaces.controller'
import { WorkspacesService } from './workspaces/workspaces.service'
import { AccessGuard } from './access.guard'

@Module({
  imports: [AuthModule],
  controllers: [RolesController, PermissionsCleanupController, WorkspacesController],
  providers: [
    AccessService,
    AccessSeedService,
    RolesService,
    PermissionsCleanupService,
    WorkspacesService,
    { provide: APP_GUARD, useClass: AccessGuard },
  ],
  exports: [AccessService, AccessSeedService],
})
export class AccessModule {}
