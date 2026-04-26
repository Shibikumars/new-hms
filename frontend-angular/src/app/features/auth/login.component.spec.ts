import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../core/auth.service';
import { PatientContextService } from '../../core/patient-context.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let router: Router;
  let contextServiceSpy: jasmine.SpyObj<PatientContextService>;

  const mockAuthResponse = {
    token: 'mock_token',
    refreshToken: 'mock_refresh',
    role: 'PATIENT',
    expiresIn: 3600,
    otpRequired: false,
  };

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', [
      'login', 'getRole', 'getUserId', 'isAuthenticated'
    ]);
    contextServiceSpy = jasmine.createSpyObj('PatientContextService', ['setPatient']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: PatientContextService, useValue: contextServiceSpy },
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('form should be invalid initially', () => {
    expect(component.form.invalid).toBeTrue();
  });

  it('form should be invalid when only username is provided', () => {
    component.form.patchValue({ username: 'john', password: '' });
    expect(component.form.invalid).toBeTrue();
  });

  it('form should be valid when both fields are filled', () => {
    component.form.patchValue({ username: 'john', password: 'pass' });
    expect(component.form.valid).toBeTrue();
  });

  it('submit() should do nothing if form is invalid', () => {
    component.submit();
    expect(authServiceSpy.login).not.toHaveBeenCalled();
  });

  it('submit() should call authService.login with form values', () => {
    authServiceSpy.login.and.returnValue(of({ ...mockAuthResponse, role: 'DOCTOR' }));
    component.form.patchValue({ username: 'doctor', password: 'secret', rememberMe: false });
    component.submit();
    expect(authServiceSpy.login).toHaveBeenCalledWith({
      username: 'doctor',
      password: 'secret',
      rememberMe: false,
    });
  });

  it('should navigate to /doctor/dashboard after DOCTOR login', fakeAsync(() => {
    const navigateSpy = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    authServiceSpy.login.and.returnValue(of({ ...mockAuthResponse, role: 'DOCTOR' }));
    component.form.patchValue({ username: 'doc', password: 'pass' });
    component.submit();
    tick();
    expect(navigateSpy).toHaveBeenCalledWith(['/doctor/dashboard']);
  }));

  it('should navigate to /admin/dashboard after ADMIN login', fakeAsync(() => {
    const navigateSpy = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    authServiceSpy.login.and.returnValue(of({ ...mockAuthResponse, role: 'ADMIN' }));
    component.form.patchValue({ username: 'admin', password: 'pass' });
    component.submit();
    tick();
    expect(navigateSpy).toHaveBeenCalledWith(['/admin/dashboard']);
  }));

  it('should navigate to /patient/portal after PATIENT login', fakeAsync(() => {
    const navigateSpy = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    authServiceSpy.getUserId.and.returnValue(null);
    authServiceSpy.login.and.returnValue(of({ ...mockAuthResponse, role: 'PATIENT' }));
    component.form.patchValue({ username: 'pat', password: 'pass' });
    component.submit();
    tick();
    expect(navigateSpy).toHaveBeenCalledWith(['/patient/portal']);
  }));

  it('should navigate to /auth/verify when OTP required', fakeAsync(() => {
    const navigateSpy = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    authServiceSpy.login.and.returnValue(
      of({ ...mockAuthResponse, otpRequired: true })
    );
    component.form.patchValue({ username: 'otp_user', password: 'pass' });
    component.submit();
    tick();
    expect(navigateSpy).toHaveBeenCalledWith(
      ['/auth/verify'],
      { queryParams: { username: 'otp_user' } }
    );
  }));

  it('should set error message on login failure', fakeAsync(() => {
    authServiceSpy.login.and.returnValue(throwError(() => new Error('Unauthorized')));
    component.form.patchValue({ username: 'bad', password: 'wrong' });
    component.submit();
    tick();
    expect(component.error).toBe('Invalid username or password');
  }));

  it('should clear error before each submission attempt', fakeAsync(() => {
    const navigateSpy = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    component.error = 'Previous error';
    authServiceSpy.login.and.returnValue(of({ ...mockAuthResponse, role: 'ADMIN' }));
    component.form.patchValue({ username: 'a', password: 'b' });
    component.submit();
    tick();
    expect(component.error).toBe('');
  }));

  it('should establish patient context for PATIENT role', fakeAsync(() => {
    const navigateSpy = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    localStorage.setItem('patients', JSON.stringify([
      { id: 1, userId: 42, fullName: 'John Doe' }
    ]));
    authServiceSpy.getUserId.and.returnValue(42);
    authServiceSpy.login.and.returnValue(of({ ...mockAuthResponse, role: 'PATIENT' }));
    component.form.patchValue({ username: 'pat', password: 'pass' });
    component.submit();
    tick();
    expect(contextServiceSpy.setPatient).toHaveBeenCalledWith({
      id: 1,
      name: 'John Doe',
      role: 'PATIENT'
    });
    localStorage.clear();
  }));

  it('should navigate to /appointments for unknown role', fakeAsync(() => {
    spyOn(router, 'navigate');
    authServiceSpy.login.and.returnValue(of({ ...mockAuthResponse, role: 'UNKNOWN' }));
    component.form.patchValue({ username: 'user', password: 'pass' });
    component.submit();
    tick();
    expect(router.navigate).toHaveBeenCalledWith(['/appointments']);
  }));
});
