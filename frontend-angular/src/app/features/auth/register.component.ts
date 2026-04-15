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
    <div class="container">
      <h2>Register</h2>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <input placeholder="Username" formControlName="username" />
        <input type="password" placeholder="Password" formControlName="password" />
        <select formControlName="role">
          <option value="PATIENT">PATIENT</option>
          <option value="DOCTOR">DOCTOR</option>
          <option value="ADMIN">ADMIN</option>
        </select>
        <button type="submit" [disabled]="form.invalid">Register</button>
      </form>
      <p class="error" *ngIf="error">{{ error }}</p>
      <a routerLink="/login">Back to login</a>
    </div>
  `
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
      next: () => this.router.navigate(['/login']),
      error: (err) => (this.error = err?.error?.error ?? 'Registration failed')
    });
  }
}
