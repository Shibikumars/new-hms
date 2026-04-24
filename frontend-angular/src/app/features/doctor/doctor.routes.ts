import { Routes } from '@angular/router';

export default [
  {
    path: 'dashboard',
    loadComponent: () => import('./doctor-dashboard.component').then(m => m.DoctorDashboardComponent)
  },
  {
    path: 'complete-profile',
    loadComponent: () => import('./complete-profile.component').then(m => m.CompleteProfileComponent)
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
    redirectTo: 'dashboard'
  }
] satisfies Routes;
