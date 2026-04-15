import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Appointment, AppointmentApiService } from './appointment-api.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-appointment-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="container">
      <div class="toolbar">
        <h2>Appointments</h2>
        <button class="secondary" (click)="logout()">Logout</button>
      </div>

      <form [formGroup]="form" (ngSubmit)="book()">
        <input type="number" placeholder="Patient ID" formControlName="patientId" />
        <input type="number" placeholder="Doctor ID" formControlName="doctorId" />
        <input type="date" formControlName="appointmentDate" />
        <input type="time" formControlName="appointmentTime" />
        <button type="submit" [disabled]="form.invalid">Book Appointment</button>
      </form>

      <p class="error" *ngIf="error">{{ error }}</p>

      <ul class="list">
        <li *ngFor="let item of appointments">
          <strong>#{{ item.id }}</strong>
          Doctor: {{ item.doctorId }} | Patient: {{ item.patientId }} |
          {{ item.appointmentDate }} {{ item.appointmentTime }} | Status: {{ item.status }}
        </li>
      </ul>
    </div>
  `
})
export class AppointmentDashboardComponent implements OnInit {
  appointments: Appointment[] = [];
  error = '';

  readonly form = this.fb.nonNullable.group({
    patientId: [0, [Validators.required, Validators.min(1)]],
    doctorId: [0, [Validators.required, Validators.min(1)]],
    appointmentDate: ['', Validators.required],
    appointmentTime: ['', Validators.required]
  });

  constructor(
    private fb: FormBuilder,
    private appointmentApi: AppointmentApiService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.refresh();
  }

  book(): void {
    if (this.form.invalid) return;

    this.error = '';
    this.appointmentApi.create(this.form.getRawValue()).subscribe({
      next: () => {
        this.form.patchValue({ appointmentTime: '' });
        this.refresh();
      },
      error: (err) => (this.error = err?.error?.error ?? 'Unable to book appointment')
    });
  }

  refresh(): void {
    this.appointmentApi.list().subscribe({
      next: (items) => (this.appointments = items),
      error: (err) => (this.error = err?.error?.error ?? 'Unable to load appointments')
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
