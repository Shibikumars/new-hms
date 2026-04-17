import { CanMatchFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const roleGuard = (expectedRole: string): CanMatchFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const role = authService.getRole();
    if (!role) {
      router.navigate(['/auth/login']);
      return false;
    }

    if (role.toUpperCase() === expectedRole.toUpperCase()) {
      return true;
    }

    router.navigate(['/appointments']);
    return false;
  };
};
