import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { Appointment, AppointmentApiService } from '../appointments/appointment-api.service';

@Component({
  selector: 'app-patient-portal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="container">
      <div class="hero">
        <div>
          <h2>Patient Portal</h2>
          <p class="subtitle">Book, track, and manage your healthcare journey from one secure dashboard.</p>
        </div>
        <div class="hero-pill">Self Service</div>
      </div>

      <div class="stats">
        <div class="stat-card">
          <span class="label">Upcoming</span>
          <strong>{{ appointments.length }}</strong>
          <span class="sub">appointments loaded</span>
        </div>
        <div class="stat-card">
          <span class="label">Next Visit</span>
          <strong>{{ appointments[0]?.appointmentDate || '—' }}</strong>
          <span class="sub">{{ appointments[0]?.appointmentTime || 'No booking yet' }}</span>
        </div>
        <div class="stat-card">
          <span class="label">Primary Doctor</span>
          <strong>{{ appointments[0]?.doctorId ? ('#' + appointments[0]?.doctorId) : '—' }}</strong>
          <span class="sub">from latest schedule</span>
        </div>
      </div>

      <nav class="toolbar chips toolbar-scroll" aria-label="Patient quick actions">
        <a class="chip" routerLink="/patient/appointments">Appointments</a>
        <a class="chip" routerLink="/patient/records">Records</a>
        <a class="chip" routerLink="/patient/pharmacy">Prescriptions</a>
        <a class="chip" routerLink="/patient/billing">Billing</a>
        <a class="chip" routerLink="/patient/notifications">Notifications</a>
        <a class="chip" routerLink="/patient/lab">Lab Results</a>
      </nav>

      <form [formGroup]="form" (ngSubmit)="loadUpcoming()" class="lookup">
        <div class="field">
          <label for="patientId">Patient ID</label>
          <input id="patientId" type="number" formControlName="patientId" placeholder="Enter your patient id" [readonly]="isPatientRole" />
        </div>
        <button type="submit" [disabled]="form.invalid">Load Upcoming</button>
      </form>

      <div class="section">
        <h3>Upcoming Appointments</h3>
        <div class="muted" *ngIf="appointments.length === 0">No upcoming appointments loaded.</div>
        <ul class="list" *ngIf="appointments.length > 0">
          <li *ngFor="let item of appointments">
            <div class="row-head">
              <strong>{{ item.appointmentDate }} · {{ item.appointmentTime }}</strong>
              <span class="status" [class.cancelled]="item.status === 'CANCELLED'" [class.completed]="item.status === 'COMPLETED'">{{ item.status }}</span>
            </div>
            <span>Doctor #{{ item.doctorId }} · Patient #{{ item.patientId }}</span>
          </li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .hero { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; }
    .subtitle { margin-top: 0.45rem; color: var(--text-soft); max-width: 52ch; }
    .hero-pill {
      border: 1px solid rgba(0, 212, 170, 0.45);
      background: rgba(0, 212, 170, 0.12);
      color: var(--primary);
      border-radius: 999px;
      padding: 0.35rem 0.75rem;
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      font-weight: 700;
      white-space: nowrap;
    }
    .stats {
      margin-top: 1rem;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 0.7rem;
    }
    .stat-card {
      border: 1px solid var(--border);
      background: linear-gradient(180deg, rgba(26,39,64,0.65), rgba(15,23,38,0.95));
      border-radius: 12px;
      padding: 0.8rem;
      display: grid;
      gap: 0.2rem;
    }
    .label { color: var(--text-muted); font-size: 0.74rem; text-transform: uppercase; letter-spacing: 0.05em; }
    .stat-card strong { font-family: 'Syne', sans-serif; font-size: 1.1rem; color: var(--text); }
    .sub { color: var(--text-soft); font-size: 0.82rem; }
    .chips { margin-top: 1rem; gap: 0.5rem; flex-wrap: wrap; }
    .chip {
      border: 1px solid var(--border);
      background: rgba(11, 18, 32, 0.58);
      border-radius: 999px;
      padding: 0.36rem 0.72rem;
      color: var(--text-soft);
      font-weight: 600;
      font-size: 0.82rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .chip:hover { color: var(--primary); border-color: rgba(0, 212, 170, 0.55); }
    .lookup { display: flex; gap: 0.75rem; align-items: end; margin-top: 1.4rem; flex-wrap: wrap; }
    .field { min-width: 220px; }
    .field label { font-size: 0.85rem; font-weight: 600; color: var(--text-soft); display: block; margin-bottom: 0.3rem; }
    .section { margin-top: 1.6rem; }
    .muted { color: var(--text-soft); }
    .row-head { display: flex; justify-content: space-between; align-items: center; gap: 0.8rem; }
    .status {
      border-radius: 999px;
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 0.22rem 0.56rem;
      border: 1px solid rgba(0, 212, 170, 0.45);
      color: var(--primary);
      background: rgba(0, 212, 170, 0.1);
    }
    .status.cancelled { border-color: rgba(255,90,114,0.5); color: #ff9ca9; background: rgba(255,90,114,0.12); }
    .status.completed { border-color: rgba(34,197,94,0.45); color: #80e8a6; background: rgba(34,197,94,0.12); }

    @media (max-width: 760px) {
      .hero { flex-direction: column; }
      .lookup { align-items: stretch; }
      .field { min-width: 100%; }
      .chips { flex-wrap: nowrap; }
    }
  `]
})
export class PatientPortalComponent implements OnInit {
  appointments: Appointment[] = [];
  isPatientRole = false;

  readonly form = this.fb.nonNullable.group({
    patientId: [0, [Validators.required, Validators.min(1)]]
  });

  constructor(
    private fb: FormBuilder,
    private appointmentApi: AppointmentApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.isPatientRole = (this.authService.getRole() ?? '').toUpperCase() === 'PATIENT';
    const userId = this.authService.getUserId() ?? 0;
    if (this.isPatientRole && userId > 0) {
      this.form.controls.patientId.setValue(userId);
      this.loadUpcoming();
    }
  }

  loadUpcoming(): void {
    const patientId = this.isPatientRole
      ? (this.authService.getUserId() ?? 0)
      : this.form.controls.patientId.value;

    if (!patientId || patientId < 1) {
      this.appointments = [];
      return;
    }

    this.appointmentApi.listUpcomingByPatientId(patientId).subscribe({
      next: items => (this.appointments = items),
      error: () => (this.appointments = [])
    });
  }
}
