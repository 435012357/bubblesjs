import type { Router } from 'vue-router';

export const createPermissionGuard = (router: Router) => {
  router.beforeEach((to, from, next) => {
    next();
  });
  router.afterEach((to, from) => {});
};
