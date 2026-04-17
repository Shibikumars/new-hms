import { Routes } from '@angular/router';

export default [
  {
    path: 'login',
    loadComponent: () => import('./login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./register.component').then(m => m.RegisterComponent)
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login'
  }
] satisfies Routes;
