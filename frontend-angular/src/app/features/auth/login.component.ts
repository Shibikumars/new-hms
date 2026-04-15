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
    <div class="container">
      <h2>Login</h2>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <input placeholder="Username" formControlName="username" />
        <input type="password" placeholder="Password" formControlName="password" />
        <button type="submit" [disabled]="form.invalid">Login</button>
      </form>
      <p class="error" *ngIf="error">{{ error }}</p>
      <a routerLink="/register">Create account</a>
    </div>
  `
})
export class LoginComponent {
  error = '';

  readonly form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
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
      next: () => this.router.navigate(['/appointments']),
      error: () => (this.error = 'Invalid username or password')
    });
  }
}
