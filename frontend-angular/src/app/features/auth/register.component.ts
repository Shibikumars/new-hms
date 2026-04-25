import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { PatientProfileService } from '../patient/patient-profile.service';
import { ToastService } from '../../core/toast.service';
import { switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-shell register-shell" role="main" aria-labelledby="register-title">
      <section class="hero-panel" aria-label="Registration overview">
        <div class="brand">HMS V2</div>
        <h1>{{ step === 1 ? 'Create your clinical workspace.' : 'Complete your patient profile.' }}</h1>
        <p>{{ step === 1 ? 'Get a secure role-based account for patient care and diagnostics.' : 'Help us provide better care by sharing your demographic details.' }}</p>
        
        <div class="stepper" *ngIf="form.controls.role.value === 'PATIENT'">
          <div class="step-indicator" [class.active]="step === 1" [class.complete]="step > 1">1</div>
          <div class="step-line"></div>
          <div class="step-indicator" [class.active]="step === 2">2</div>
        </div>

        <div class="role-preview" *ngIf="step === 1">
          <span [class.active]="form.controls.role.value === 'DOCTOR'">Doctor</span>
          <span [class.active]="form.controls.role.value === 'PATIENT'">Patient</span>
        </div>
      </section>

      <section class="form-panel" aria-label="Registration form">
        <div class="form-header">
          <h2 id="register-title">{{ step === 1 ? 'Create Account' : 'Patient Details' }}</h2>
          <p class="form-subtitle">{{ step === 1 ? 'Secure onboarding in under 60 seconds' : 'Required for clinical records' }}</p>
        </div>

        <div class="error" *ngIf="error">{{ error }}</div>

        <form [formGroup]="form" (ngSubmit)="submit()" aria-describedby="register-help">
          <!-- Step 1: Account Credentials -->
          <ng-container *ngIf="step === 1">
            <div class="form-group">
              <label for="username">Username</label>
              <input id="username" type="text" placeholder="Choose a username" formControlName="username" autocomplete="username" />
            </div>

            <div class="form-group">
              <label for="password">Password</label>
              <input id="password" type="password" placeholder="Create a strong password" formControlName="password" autocomplete="new-password" />
            </div>

            <div class="form-group">
              <label for="role">Role</label>
              <select id="role" formControlName="role">
                <option value="PATIENT">Patient</option>
                <option value="DOCTOR">Doctor</option>
              </select>
            </div>

            <div class="consent-box">
              <input type="checkbox" id="terms" formControlName="termsAccepted" />
              <label for="terms">I agree to the <a href="#">Terms & Conditions</a> and <a href="#">Privacy Policy</a></label>
            </div>

            <button type="button" class="btn-primary" (click)="nextStep()" [disabled]="!canGoToStep2()">
              {{ form.controls.role.value === 'PATIENT' ? 'Continue to Details' : 'Create Account' }}
            </button>
          </ng-container>

          <!-- Step 2: Patient Demographics -->
          <ng-container *ngIf="step === 2">
            <div class="form-row">
              <div class="form-group">
                <label for="firstName">First Name</label>
                <input id="firstName" type="text" formControlName="firstName" placeholder="e.g. John" />
              </div>
              <div class="form-group">
                <label for="lastName">Last Name</label>
                <input id="lastName" type="text" formControlName="lastName" placeholder="e.g. Doe" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="dob">Date of Birth</label>
                <input id="dob" type="date" formControlName="dob" />
              </div>
              <div class="form-group">
                <label for="gender">Gender</label>
                <select id="gender" formControlName="gender">
                  <option value="">Select Gender</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="O">Other</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="phone">Phone Number</label>
                <input id="phone" type="tel" formControlName="phone" placeholder="+91" />
              </div>
              <div class="form-group">
                <label for="bloodGroup">Blood Group</label>
                <select id="bloodGroup" formControlName="bloodGroup">
                  <option value="">Select</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label for="email">Email Address</label>
              <input id="email" type="email" formControlName="email" placeholder="john@example.com" />
            </div>

            <div class="form-group">
              <label for="emergencyContact">Emergency Contact (Name & Phone)</label>
              <input id="emergencyContact" type="text" formControlName="emergencyContact" placeholder="Jane Doe: +91 99999 88888" />
            </div>

            <div class="form-actions">
              <button type="button" class="btn-secondary" (click)="step = 1">Back</button>
              <button type="submit" class="btn-primary" [disabled]="form.invalid">Complete Registration</button>
            </div>
          </ng-container>
        </form>

        <p id="register-help" class="sr-only">Provide username, password, and role to create a secure account.</p>

        <div class="form-footer">
          <p>Already have an account? <a routerLink="/auth/login">Sign in here</a></p>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .auth-shell {
      width: min(1160px, calc(100% - 2rem));
      margin: 1.5rem auto;
      display: grid;
      grid-template-columns: 1fr 1fr;
      border: 1px solid var(--border);
      border-radius: 22px;
      overflow: hidden;
      background: var(--surface);
      box-shadow: var(--shadow-strong);
      min-height: 74vh;
    }
    .hero-panel {
      padding: clamp(1.6rem, 3vw, 2.6rem);
      background:
        radial-gradient(circle at 20% 14%, rgba(26, 60, 110, 0.05), transparent 42%),
        linear-gradient(160deg, #FFFFFF 0%, #F8FAFC 45%, #F1F5F9 100%);
      border-right: 1px solid var(--border);
      display: grid;
      align-content: center;
      gap: 1.1rem;
    }
    .brand {
      width: fit-content;
      font-family: 'Syne', sans-serif;
      font-weight: 800;
      letter-spacing: 0.06em;
      color: var(--primary);
      border: 1px solid var(--primary-glow);
      border-radius: 999px;
      padding: 0.32rem 0.78rem;
      font-size: 0.8rem;
      text-transform: uppercase;
    }
    .hero-panel h1 { font-size: clamp(1.7rem, 2.8vw, 2.45rem); line-height: 1.1; color: var(--text); }
    .hero-panel p { color: var(--text-soft); max-width: 38ch; line-height: 1.6; }
    
    .stepper { display: flex; align-items: center; gap: 0.5rem; margin-top: 1rem; }
    .step-indicator { 
      width: 32px; height: 32px; border-radius: 50%; border: 2px solid var(--border); 
      display: flex; align-items: center; justify-content: center; font-weight: 700; color: var(--text-muted);
    }
    .step-indicator.active { border-color: var(--primary); color: var(--primary); background: var(--primary-glow); }
    .step-indicator.complete { border-color: var(--success); color: var(--success); background: rgba(22, 163, 74, 0.1); }
    .step-line { flex: 0 0 40px; height: 2px; background: var(--border); }

    .role-preview { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.5rem; }
    .role-preview span {
      border: 1px solid var(--border);
      background: var(--surface-strong);
      color: var(--text-soft);
      border-radius: 999px;
      padding: 0.36rem 0.72rem;
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      font-weight: 700;
    }
    .role-preview span.active { border-color: var(--primary); color: var(--primary); background: var(--primary-glow); }

    .form-panel {
      padding: clamp(1.4rem, 2.3vw, 2.3rem);
      display: grid;
      align-content: center;
      gap: 1rem;
      background: var(--surface);
    }
    .form-header { margin-bottom: 0.5rem; }
    .form-subtitle { color: var(--text-muted); margin-top: 0.35rem; }
    .form-group { display: grid; gap: 0.4rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    
    label { font-size: 0.88rem; color: var(--text-soft); font-weight: 600; }
    input, select { border: 1px solid var(--border-strong); background: var(--surface-soft); }
    
    .consent-box { display: flex; align-items: flex-start; gap: 0.75rem; margin: 0.5rem 0; }
    .consent-box input { width: 18px; height: 18px; margin-top: 0.15rem; cursor: pointer; }
    .consent-box label { font-weight: 400; font-size: 0.85rem; cursor: pointer; line-height: 1.4; }

    .form-actions { display: flex; gap: 1rem; margin-top: 1rem; }
    .btn-primary { 
      background: var(--primary); color: #FFF; flex: 1; border: none; border-radius: 10px; padding: 0.85rem; font-weight: 700; 
      cursor: pointer; transition: all 0.2s;
    }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary:not(:disabled):hover { background: var(--primary-strong); transform: translateY(-1px); }
    
    .btn-secondary { 
      background: var(--surface-strong); color: var(--text-soft); border: 1px solid var(--border); border-radius: 10px; padding: 0.85rem; 
      font-weight: 700; cursor: pointer;
    }

    .form-footer { margin-top: 0.35rem; padding-top: 1rem; border-top: 1px solid var(--border); text-align: center; }
    .form-footer p { color: var(--text-muted); font-size: 0.9rem; }

    @media (max-width: 920px) {
      .auth-shell { grid-template-columns: 1fr; }
      .hero-panel { border-right: none; border-bottom: 1px solid var(--border); }
    }
  `]
})
export class RegisterComponent {
  error = '';
  step = 1;

  readonly form = this.fb.nonNullable.group({
    // Step 1: Auth
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    role: ['PATIENT', Validators.required],
    termsAccepted: [false, Validators.requiredTrue],
    
    // Step 2: Patient Demographics
    firstName: [''],
    lastName: [''],
    dob: [''],
    gender: [''],
    phone: [''],
    email: [''],
    bloodGroup: [''],
    emergencyContact: ['']
  });

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private patientProfileService: PatientProfileService,
    private toast: ToastService,
    private router: Router
  ) {}

  canGoToStep2(): boolean {
    const { username, password, role, termsAccepted } = this.form.controls;
    return username.valid && password.valid && role.valid && termsAccepted.valid;
  }

  nextStep(): void {
    if (this.form.controls.role.value === 'PATIENT') {
      this.step = 2;
      // Add validators for step 2 fields when advancing
      this.addPatientValidators();
    } else {
      this.submit();
    }
  }

  private addPatientValidators(): void {
    this.form.controls.firstName.setValidators([Validators.required]);
    this.form.controls.lastName.setValidators([Validators.required]);
    this.form.controls.dob.setValidators([Validators.required]);
    this.form.controls.gender.setValidators([Validators.required]);
    this.form.controls.phone.setValidators([Validators.required]);
    
    this.form.controls.firstName.updateValueAndValidity();
    this.form.controls.lastName.updateValueAndValidity();
    this.form.controls.dob.updateValueAndValidity();
    this.form.controls.gender.updateValueAndValidity();
    this.form.controls.phone.updateValueAndValidity();
    this.form.controls.bloodGroup.updateValueAndValidity();
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.error = '';
    const rawForm = this.form.getRawValue();
    
    const authPayload = {
      username: rawForm.username,
      password: rawForm.password,
      role: rawForm.role
    };

    this.authService.register(authPayload).pipe(
      switchMap((user: any) => {
        if (rawForm.role === 'PATIENT') {
          const patientPayload = {
            userId: user.userId || user.id, 
            firstName: rawForm.firstName,
            lastName: rawForm.lastName,
            dob: rawForm.dob,
            gender: rawForm.gender,
            phone: rawForm.phone,
            email: rawForm.email,
            bloodGroup: rawForm.bloodGroup,
            emergencyContact: rawForm.emergencyContact
          };
          // Try to create patient profile, but don't fail registration if it doesn't work
          return this.patientProfileService.create(patientPayload as any).pipe(
            catchError((err) => {
              console.warn('Patient profile creation failed, creating localStorage fallback:', err);
              // Create patient profile in localStorage immediately
              const existingPatients = JSON.parse(localStorage.getItem('patients') || '[]');
              const newPatient = {
                ...patientPayload,
                id: user.userId || user.id,
                fullName: `${patientPayload.firstName} ${patientPayload.lastName}`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isActive: true
              };
              
              existingPatients.push(newPatient);
              localStorage.setItem('patients', JSON.stringify(existingPatients));
              
              return of(newPatient);
            })
          );
        }
        return of(null);
      })
    ).subscribe({
      next: (result) => {
        this.toast.success('Registration Successful', 'You can now sign in to your workspace.');
        this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        this.error = err?.error?.error ?? err?.message ?? 'Registration failed';
      }
    });
  }
}
