import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { roleGuard } from './role.guard';
import { AuthService } from './auth.service';

describe('roleGuard', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getRole']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });
  });

  function runGuard(expectedRole: string): boolean {
    return TestBed.runInInjectionContext(() =>
      roleGuard(expectedRole)({} as any, {} as any) as boolean
    );
  }

  it('should allow access when role matches (case-insensitive)', () => {
    authServiceSpy.getRole.and.returnValue('admin');
    expect(runGuard('ADMIN')).toBeTrue();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('should allow access when role matches exactly', () => {
    authServiceSpy.getRole.and.returnValue('DOCTOR');
    expect(runGuard('DOCTOR')).toBeTrue();
  });

  it('should deny access and redirect to /appointments on role mismatch', () => {
    authServiceSpy.getRole.and.returnValue('PATIENT');
    expect(runGuard('ADMIN')).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/appointments']);
  });

  it('should redirect to /auth/login when role is null (not logged in)', () => {
    authServiceSpy.getRole.and.returnValue(null);
    expect(runGuard('ADMIN')).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
  });
});
