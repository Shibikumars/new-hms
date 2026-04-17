import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Appointment, AppointmentApiService } from '../appointments/appointment-api.service';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container">
      <div class="hero">
        <div>
          <h2>Doctor Workspace</h2>
          <p class="subtitle">Your daily schedule, patient flow, and clinical shortcuts in one place.</p>
        </div>
        <div class="hero-chip">Today Focus</div>
      </div>

      <nav class="actions toolbar-scroll" aria-label="Doctor quick actions">
        <a class="link" routerLink="/doctor/appointments">Appointments</a>
        <a class="link" routerLink="/doctor/records">Medical Records</a>
        <a class="link" routerLink="/doctor/pharmacy">Pharmacy</a>
        <a class="link" routerLink="/doctor/notifications">Notifications</a>
        <a class="link" routerLink="/doctor/lab">Lab</a>
      </nav>

      <div class="section">
        <h3>Today's Appointments</h3>
        <div class="muted" *ngIf="todayAppointments.length === 0">No appointments scheduled for today.</div>

        <ul class="list" *ngIf="todayAppointments.length > 0">
          <li *ngFor="let item of todayAppointments">
            <div class="appointment-row">
              <strong>{{ item.appointmentTime }}</strong>
              <span class="status" [class.cancelled]="item.status === 'CANCELLED'" [class.completed]="item.status === 'COMPLETED'">{{ item.status }}</span>
            </div>
            <span>Patient #{{ item.patientId }} · Doctor #{{ item.doctorId }}</span>
          </li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .hero { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; }
    .subtitle { margin-top: 0.45rem; color: var(--text-soft); }
    .hero-chip {
      border: 1px solid rgba(109, 124, 255, 0.5);
      background: rgba(109, 124, 255, 0.16);
      color: #aeb8ff;
      border-radius: 999px;
      padding: 0.35rem 0.75rem;
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      font-weight: 700;
      white-space: nowrap;
    }
    .actions { margin-top: 1rem; display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .link {
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
    .link:hover { color: var(--primary); border-color: rgba(0, 212, 170, 0.55); }
    .section { margin-top: 1.5rem; }
    .muted { color: var(--text-soft); }
    .appointment-row { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
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
    .status.cancelled {
      border-color: rgba(255, 90, 114, 0.5);
      color: #ff9ca9;
      background: rgba(255, 90, 114, 0.12);
    }
    .status.completed {
      border-color: rgba(34, 197, 94, 0.45);
      color: #80e8a6;
      background: rgba(34, 197, 94, 0.12);
    }

    @media (max-width: 760px) {
      .hero { flex-direction: column; }
      .actions { flex-wrap: nowrap; }
    }
  `]
})
export class DoctorDashboardComponent implements OnInit {
  todayAppointments: Appointment[] = [];

  constructor(private appointmentApi: AppointmentApiService) {}

  ngOnInit(): void {
    const today = new Date().toISOString().slice(0, 10);
    this.appointmentApi.list().subscribe({
      next: items => {
        this.todayAppointments = items
          .filter(item => item.appointmentDate === today)
          .sort((a, b) => a.appointmentTime.localeCompare(b.appointmentTime))
          .slice(0, 8);
      },
      error: () => {
        this.todayAppointments = [];
      }
    });
  }
}
