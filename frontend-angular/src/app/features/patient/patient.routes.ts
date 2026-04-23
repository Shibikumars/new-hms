import { Routes } from '@angular/router';

export default [
  {
    path: 'portal',
    loadComponent: () => import('./patient-portal.component').then(m => m.PatientPortalComponent)
  },
  {
    path: 'profile',
    loadComponent: () => import('./patient-profile.component').then(m => m.PatientProfileComponent)
  },
  {
    path: 'appointments',
    loadComponent: () => import('../appointments/appointment-dashboard.component').then(m => m.AppointmentDashboardComponent)
  },
  {
    path: 'records',
    loadComponent: () => import('../records/medical-records.component').then(m => m.MedicalRecordsComponent)
  },
  {
    path: 'pharmacy',
    loadComponent: () => import('../pharmacy/pharmacy.component').then(m => m.PharmacyComponent)
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
    path: 'lab',
    loadComponent: () => import('../lab/lab.component').then(m => m.LabComponent)
  },
  {
    path: 'queue',
    loadComponent: () => import('../queue/queue.component').then(m => m.QueueComponent)
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'portal'
  }
] satisfies Routes;
