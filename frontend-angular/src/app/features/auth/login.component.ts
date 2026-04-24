import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-shell" role="main" aria-labelledby="login-title">
      <section class="hero-panel" aria-label="Healthcare platform introduction">
        <div class="brand">HMS</div>
        <h1>Intelligent care operations.<br />Human-first experience.</h1>
        <p>One connected platform for doctors, patients, labs, billing and real-time care coordination.</p>
        <div class="hero-stats">
          <div><strong>500+</strong><span>Doctors</span></div>
          <div><strong>50k+</strong><span>Patients</span></div>
          <div><strong>99.9%</strong><span>Uptime</span></div>
        </div>
      </section>

      <section class="form-panel" aria-label="Login form">
        <div class="form-header">
          <h2 id="login-title">Welcome Back</h2>
          <p class="form-subtitle">Sign in to continue to your role workspace</p>
        </div>

        <div class="error" *ngIf="error">{{ error }}</div>

        <form [formGroup]="form" (ngSubmit)="submit()" aria-describedby="login-help">
          <div class="form-group">
            <label for="username">Username</label>
            <input id="username" type="text" placeholder="Enter your username" formControlName="username" autocomplete="username" />
            <p class="error-text" *ngIf="form.get('username')?.touched && form.get('username')?.invalid">Username is required</p>
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input id="password" type="password" placeholder="Enter your password" formControlName="password" autocomplete="current-password" />
            <p class="error-text" *ngIf="form.get('password')?.touched && form.get('password')?.invalid">Password is required</p>
          </div>

          <div class="remember-me">
            <label class="remember-inner">
              <input id="rememberMe" type="checkbox" formControlName="rememberMe" />
              <span>Remember me</span>
            </label>
          </div>

          <button type="submit" [disabled]="form.invalid">Sign In</button>
        </form>

        <p id="login-help" class="sr-only">Enter your username and password, then submit the form to access your dashboard.</p>

        <div class="form-footer">
          <p>Don’t have an account? <a routerLink="/auth/register">Create one now</a></p>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .auth-shell {
      width: min(1200px, calc(100% - 2rem));
      margin: 1.5rem auto;
      display: grid;
      grid-template-columns: 1.06fr 0.94fr;
      border: 1px solid var(--border);
      border-radius: 22px;
      overflow: hidden;
      background: var(--surface);
      box-shadow: var(--shadow-strong);
      min-height: 78vh;
    }
    .hero-panel {
      padding: clamp(1.6rem, 3vw, 3rem);
      background:
        radial-gradient(circle at 18% 14%, rgba(26, 60, 110, 0.05), transparent 40%),
        radial-gradient(circle at 78% 12%, rgba(79, 70, 229, 0.05), transparent 42%),
        linear-gradient(160deg, #FFFFFF 0%, #F8FAFC 45%, #F1F5F9 100%);
      border-right: 1px solid var(--border);
      display: grid;
      align-content: space-between;
      gap: 1.2rem;
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
    .hero-panel h1 {
      font-size: clamp(1.7rem, 3vw, 2.7rem);
      line-height: 1.1;
      color: var(--text-strong);
    }
    .hero-panel p {
      max-width: 40ch;
      color: var(--text-soft);
      line-height: 1.6;
      font-size: 0.98rem;
    }
    .hero-stats {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.5rem;
      margin-top: 0.6rem;
    }
    .hero-stats div {
      background: var(--surface-soft);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 0.72rem;
      display: grid;
      gap: 0.2rem;
    }
    .hero-stats strong {
      font-family: 'Syne', sans-serif;
      color: var(--primary);
      font-size: 1rem;
    }
    .hero-stats span {
      color: var(--text-muted);
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .form-panel {
      padding: clamp(1.4rem, 2.3vw, 2.4rem);
      display: grid;
      align-content: center;
      gap: 1rem;
      background: var(--surface);
    }
    .form-header { margin-bottom: 0.6rem; }
    .form-subtitle { color: var(--text-soft); margin-top: 0.4rem; }
    .form-group { display: grid; gap: 0.4rem; }
    label { font-size: 0.88rem; color: var(--text-soft); font-weight: 600; }
    .error-text { color: #ff9ca9; font-size: 0.78rem; }
    .remember-me { margin-top: -0.1rem; }
    .remember-inner { display: inline-flex; gap: 0.45rem; align-items: center; color: var(--text-soft); cursor: pointer; }
    .remember-inner input { width: auto; }
    .form-footer { margin-top: 0.3rem; padding-top: 1rem; border-top: 1px solid var(--border); text-align: center; }
    .form-footer p { color: var(--text-soft); }

    @media (max-width: 940px) {
      .auth-shell { grid-template-columns: 1fr; min-height: auto; }
      .hero-panel { border-right: none; border-bottom: 1px solid var(--border); }
      .hero-stats { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    }

    @media (max-width: 680px) {
      .auth-shell { width: calc(100% - 1rem); margin: 0.75rem auto; }
      .hero-stats { grid-template-columns: 1fr; }
    }
  `]
})
export class LoginComponent {
  error = '';

  readonly form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
    rememberMe: [false]
  });

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  submit(): void {
    if (this.form.invalid) return;

    this.error = '';
    this.authService.login(this.form.getRawValue()).subscribe({
      next: (response) => {
        if (response.otpRequired) {
          this.router.navigate(['/auth/verify'], { queryParams: { username: this.form.value.username } });
        } else {
          const rolePath = this.getRolePath(response.role ?? this.authService.getRole());
          this.router.navigate([rolePath]);
        }
      },
      error: () => (this.error = 'Invalid username or password')
    });
  }

  private getRolePath(role: string | null): string {
    switch ((role ?? '').toUpperCase()) {
      case 'ADMIN':
        return '/admin/dashboard';
      case 'DOCTOR':
        return '/doctor/dashboard';
      case 'PATIENT':
        return '/patient/portal';
      default:
        return '/appointments';
    }
  }
}
