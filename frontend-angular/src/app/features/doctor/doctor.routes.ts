import { Routes } from '@angular/router';

export default [
  {
    path: 'dashboard',
    loadComponent: () => import('./doctor-dashboard.component').then(m => m.DoctorDashboardComponent)
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
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard'
  }
] satisfies Routes;
