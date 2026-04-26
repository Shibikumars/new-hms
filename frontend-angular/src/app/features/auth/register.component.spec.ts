import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { RegisterComponent } from './register.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterComponent, ReactiveFormsModule, RouterTestingModule, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with default values', () => {
    expect(component.form.get('role')?.value).toBe('PATIENT');
    expect(component.form.get('termsAccepted')?.value).toBeFalse();
  });

  it('should be on step 1 initially', () => {
    expect(component.step).toBe(1);
  });

  it('canGoToStep2 should return false for invalid form', () => {
    expect(component.canGoToStep2()).toBeFalse();
  });

  it('canGoToStep2 should return true for valid step 1 fields', () => {
    component.form.patchValue({
      username: 'testuser',
      password: 'password123',
      role: 'PATIENT',
      termsAccepted: true
    });
    expect(component.canGoToStep2()).toBeTrue();
  });

  it('nextStep should move to step 2 for PATIENT role', () => {
    component.form.patchValue({
      username: 'testuser',
      password: 'password123',
      role: 'PATIENT',
      termsAccepted: true
    });
    component.nextStep();
    expect(component.step).toBe(2);
  });

  it('nextStep should call submit for DOCTOR role', () => {
    component.form.patchValue({
      username: 'testuser',
      password: 'password123',
      role: 'DOCTOR',
      termsAccepted: true
    });
    spyOn(component, 'submit');
    component.nextStep();
    expect(component.submit).toHaveBeenCalled();
  });

  it('should add validators for patient fields on step 2', () => {
    component.form.patchValue({
      username: 'testuser',
      password: 'password123',
      role: 'PATIENT',
      termsAccepted: true
    });
    component.nextStep();
    expect(component.form.get('firstName')?.validator).toBeTruthy();
    expect(component.form.get('lastName')?.validator).toBeTruthy();
  });

  it('should not submit if form is invalid', () => {
    component.form.patchValue({
      username: 'test',
      password: '123',
      role: 'PATIENT',
      termsAccepted: true
    });
    spyOn(component['authService'], 'register');
    component.submit();
    expect(component['authService'].register).not.toHaveBeenCalled();
  });

  it('should set error message on registration failure', () => {
    component.form.patchValue({
      username: 'testuser',
      password: 'password123',
      role: 'DOCTOR',
      termsAccepted: true
    });
    spyOn(component['authService'], 'register').and.returnValue(throwError(() => new Error('Registration failed')));
    component.submit();
    expect(component.error).toBeTruthy();
  });

  it('should display error message when error is set', () => {
    component.error = 'Test error';
    fixture.detectChanges();
    const errorElement = fixture.nativeElement.querySelector('.error');
    expect(errorElement.textContent).toContain('Test error');
  });

  it('should show stepper for PATIENT role', () => {
    component.form.patchValue({ role: 'PATIENT' });
    fixture.detectChanges();
    const stepper = fixture.nativeElement.querySelector('.stepper');
    expect(stepper).toBeTruthy();
  });

  it('should not show stepper for DOCTOR role', () => {
    component.form.patchValue({ role: 'DOCTOR' });
    fixture.detectChanges();
    const stepper = fixture.nativeElement.querySelector('.stepper');
    expect(stepper).toBeFalsy();
  });

  it('should update role preview on role change', () => {
    component.form.patchValue({ role: 'DOCTOR' });
    fixture.detectChanges();
    const rolePreview = fixture.nativeElement.querySelectorAll('.role-preview span');
    expect(rolePreview.length).toBeGreaterThan(0);
  });
});
