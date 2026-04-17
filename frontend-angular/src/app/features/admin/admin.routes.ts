import { Routes } from '@angular/router';

export default [
  {
    path: 'dashboard',
    loadComponent: () => import('./admin-dashboard.component').then(m => m.AdminDashboardComponent)
  },
  {
    path: 'billing',
    loadComponent: () => import('../billing/billing.component').then(m => m.BillingComponent)
  },
  {
    path: 'notifications',
    loadComponent: () => import('../notifications/notifications.component').then(m => m.NotificationsComponent)
  },
  {
    path: 'analytics',
    loadComponent: () => import('../analytics/analytics.component').then(m => m.AnalyticsComponent)
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard'
  }
] satisfies Routes;
