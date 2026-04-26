import { createRouter, createWebHashHistory } from 'vue-router'

// Hash history works on plain static hosts (incl. file://) without server rewrites.
export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'search', component: () => import('./views/Search.vue') },
    { path: '/apps', name: 'apps', component: () => import('./views/AppDirectory.vue') },
    { path: '/apps/:id', name: 'app-detail', component: () => import('./views/AppDetail.vue') },
    { path: '/iocs', name: 'iocs', component: () => import('./views/IocFeed.vue') },
    { path: '/permissions', name: 'permissions', component: () => import('./views/Permissions.vue') },
    { path: '/help', name: 'help', component: () => import('./views/Help.vue') }
  ]
})