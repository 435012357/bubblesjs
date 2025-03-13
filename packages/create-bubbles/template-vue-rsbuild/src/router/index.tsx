const { createRouter, createWebHistory } = require('vue-router');

export const router = createRouter({
  history: createWebHistory(import.meta.env.PUBLIC_PATH),
  routes: [],
});
