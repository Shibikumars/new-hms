import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { roleGuard } from './core/role.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'auth/login' },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes')
  },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes'),
    canActivate: [authGuard],
    canMatch: [roleGuard('ADMIN')]
  },
  {
    path: 'doctor',
    loadChildren: () => import('./features/doctor/doctor.routes'),
    canActivate: [authGuard],
    canMatch: [roleGuard('DOCTOR')]
  },
  {
    path: 'patient',
    loadChildren: () => import('./features/patient/patient.routes'),
    canActivate: [authGuard],
    canMatch: [roleGuard('PATIENT')]
  },
  {
    path: 'appointments',
    loadComponent: () => import('./features/appointments/appointment-dashboard.component').then(m => m.AppointmentDashboardComponent),
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: 'auth/login' }
];
