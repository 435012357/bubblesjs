import type { Router } from 'vue-router';
import { createPermissionGuard } from './permissionGuard';

export const setupGuard = (router: Router) => {
  createPermissionGuard(router);
};
