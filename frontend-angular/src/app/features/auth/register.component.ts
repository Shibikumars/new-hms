import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-shell register-shell" role="main" aria-labelledby="register-title">
      <section class="hero-panel" aria-label="Registration overview">
        <div class="brand">HMS</div>
        <h1>Create your clinical workspace.</h1>
        <p>Get a secure role-based account for patient care, diagnostics, operations and administration.</p>
        <div class="role-preview">
          <span [class.active]="form.controls.role.value === 'DOCTOR'">Doctor</span>
          <span [class.active]="form.controls.role.value === 'PATIENT'">Patient</span>
          <span [class.active]="form.controls.role.value === 'ADMIN'">Admin</span>
        </div>
      </section>

      <section class="form-panel" aria-label="Registration form">
        <div class="form-header">
          <h2 id="register-title">Create Account</h2>
          <p class="form-subtitle">Secure onboarding in under 60 seconds</p>
        </div>

        <div class="error" *ngIf="error">{{ error }}</div>

        <form [formGroup]="form" (ngSubmit)="submit()" aria-describedby="register-help">
          <div class="form-group">
            <label for="username">Username</label>
            <input id="username" type="text" placeholder="Choose a username" formControlName="username" autocomplete="username" />
            <p class="error-text" *ngIf="form.get('username')?.touched && form.get('username')?.errors">
              <span *ngIf="form.get('username')?.errors?.['required']">Username is required</span>
              <span *ngIf="form.get('username')?.errors?.['minlength']">Username must be at least 3 characters</span>
            </p>
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input id="password" type="password" placeholder="Create a strong password" formControlName="password" autocomplete="new-password" />
            <p class="error-text" *ngIf="form.get('password')?.touched && form.get('password')?.errors">
              <span *ngIf="form.get('password')?.errors?.['required']">Password is required</span>
              <span *ngIf="form.get('password')?.errors?.['minlength']">Password must be at least 8 characters</span>
            </p>
          </div>

          <div class="form-group">
            <label for="role">Role</label>
            <select id="role" formControlName="role">
              <option value="PATIENT">Patient</option>
              <option value="DOCTOR">Doctor</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>

          <button type="submit" [disabled]="form.invalid">Create Account</button>
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
      background: rgba(9, 15, 28, 0.88);
      box-shadow: var(--shadow-strong);
      min-height: 74vh;
    }
    .hero-panel {
      padding: clamp(1.6rem, 3vw, 2.6rem);
      background:
        radial-gradient(circle at 20% 14%, rgba(0, 212, 170, 0.24), transparent 42%),
        radial-gradient(circle at 74% 12%, rgba(109, 124, 255, 0.2), transparent 42%),
        linear-gradient(160deg, #08111f 0%, #0b1729 45%, #12223a 100%);
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
      border: 1px solid rgba(0, 212, 170, 0.45);
      border-radius: 999px;
      padding: 0.32rem 0.78rem;
      font-size: 0.8rem;
      text-transform: uppercase;
    }
    .hero-panel h1 { font-size: clamp(1.7rem, 2.8vw, 2.45rem); line-height: 1.1; color: var(--text); }
    .hero-panel p { color: var(--text-soft); max-width: 38ch; line-height: 1.6; }
    .role-preview { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.5rem; }
    .role-preview span {
      border: 1px solid var(--border);
      background: rgba(11, 18, 32, 0.55);
      color: var(--text-soft);
      border-radius: 999px;
      padding: 0.36rem 0.72rem;
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      font-weight: 700;
    }
    .role-preview span.active {
      border-color: rgba(0, 212, 170, 0.55);
      color: var(--primary);
      background: rgba(0, 212, 170, 0.12);
    }
    .form-panel {
      padding: clamp(1.4rem, 2.3vw, 2.3rem);
      display: grid;
      align-content: center;
      gap: 1rem;
      background: linear-gradient(180deg, rgba(19, 29, 47, 0.9), rgba(12, 20, 33, 0.96));
    }
    .form-header { margin-bottom: 0.5rem; }
    .form-subtitle { color: var(--text-soft); margin-top: 0.35rem; }
    .form-group { display: grid; gap: 0.4rem; }
    label { font-size: 0.88rem; color: var(--text-soft); font-weight: 600; }
    .error-text { color: #ff9ca9; font-size: 0.78rem; }
    .form-footer { margin-top: 0.35rem; padding-top: 1rem; border-top: 1px solid var(--border); text-align: center; }
    .form-footer p { color: var(--text-soft); }

    @media (max-width: 920px) {
      .auth-shell { grid-template-columns: 1fr; }
      .hero-panel { border-right: none; border-bottom: 1px solid var(--border); }
    }

    @media (max-width: 680px) {
      .auth-shell { width: calc(100% - 1rem); margin: 0.75rem auto; }
    }
  `]
})
export class RegisterComponent {
  error = '';

  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    role: ['PATIENT', Validators.required]
  });

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  submit(): void {
    if (this.form.invalid) return;

    this.error = '';
    this.authService.register(this.form.getRawValue()).subscribe({
      next: () => this.router.navigate(['/auth/login']),
      error: (err) => (this.error = err?.error?.error ?? 'Registration failed')
    });
  }
}
