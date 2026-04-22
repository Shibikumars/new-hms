import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { Appointment, AppointmentApiService } from '../appointments/appointment-api.service';
import { NotificationItem, NotificationsApiService } from '../notifications/notifications-api.service';

@Component({
  selector: 'app-patient-portal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="container">
      <div class="hero">
        <div>
          <h2>Patient Command Center</h2>
          <p class="subtitle">Securely managing your clinical records, appointments, and care journey.</p>
        </div>
        <div class="hero-chip">Patient Portal</div>
      </div>

      <div class="portal-grid">
        <!-- Main Content: Appointments -->
        <div class="main-content">
          <div class="stats-row">
            <div class="stat-box">
              <label>Next Visit</label>
              <strong>{{ appointments[0]?.appointmentDate || 'No Schedule' }}</strong>
              <span>{{ appointments[0]?.appointmentTime || '--:--' }}</span>
            </div>
            <div class="stat-box">
              <label>Active Labs</label>
              <strong>{{ appointments.length }}</strong>
              <span>Scheduled visits</span>
            </div>
          </div>

          <div class="card glass">
            <div class="card-header">
              <h3>Upcoming Schedule</h3>
              <a routerLink="/patient/appointments" class="view-link">Manage All</a>
            </div>
            <div class="empty-msg" *ngIf="appointments.length === 0">Your schedule is clear.</div>
            <ul class="appt-list" *ngIf="appointments.length > 0">
              <li *ngFor="let item of appointments">
                <div class="appt-time">
                  <strong>{{ item.appointmentDate }}</strong>
                  <span>{{ item.appointmentTime }}</span>
                </div>
                <div class="appt-details">
                   <strong>Doctor Consulation</strong>
                   <span class="meta">Provider #{{ item.doctorId }}</span>
                </div>
                <div class="status-badge" [class.cancelled]="item.status === 'CANCELLED'">
                  {{ item.status }}
                </div>
              </li>
            </ul>
          </div>
        </div>

        <!-- Sidebar: Alerts & Quick Links -->
        <div class="sidebar">
          <div class="card alerts-card" [class.has-alerts]="recentNotifications.length > 0">
             <div class="card-header">
                <h3>Recent Alerts</h3>
                <a routerLink="/patient/notifications" class="view-link" *ngIf="recentNotifications.length > 0">Inbox</a>
             </div>
             <div class="empty-msg" *ngIf="recentNotifications.length === 0">No new alerts.</div>
             <ul class="alert-preview">
                <li *ngFor="let n of recentNotifications" [class.critical]="n.type === 'CRITICAL'">
                   <strong>{{ n.title }}</strong>
                   <p>{{ n.message }}</p>
                </li>
             </ul>
          </div>

          <div class="card actions-card">
             <h3>Quick Services</h3>
             <div class="link-grid">
                <a routerLink="/patient/records" class="svc-link">
                  <span class="icon">📋</span>
                  <span class="label">Records</span>
                </a>
                <a routerLink="/patient/lab" class="svc-link">
                  <span class="icon">🧪</span>
                  <span class="label">Labs</span>
                </a>
                <a routerLink="/patient/pharmacy" class="svc-link">
                  <span class="icon">💊</span>
                  <span class="label">Meds</span>
                </a>
                <a routerLink="/patient/billing" class="svc-link">
                  <span class="icon">💳</span>
                  <span class="label">Billing</span>
                </a>
             </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .hero { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; margin-bottom: 2rem; }
    .subtitle { margin-top: 0.4rem; color: var(--text-soft); }
    .hero-chip { border: 1px solid rgba(0, 212, 170, 0.4); color: var(--primary); background: rgba(0, 212, 170, 0.1); border-radius: 999px; padding: 0.35rem 0.75rem; font-size: 0.75rem; font-weight: 700; }

    .portal-grid { display: grid; grid-template-columns: 1fr 340px; gap: 1.5rem; }
    
    .stats-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-box { background: rgba(0,0,0,0.2); border: 1px solid var(--border); border-radius: 16px; padding: 1.2rem; }
    .stat-box label { display: block; font-size: 0.7rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.4rem; }
    .stat-box strong { font-size: 1.3rem; font-family: 'Syne', sans-serif; display: block; }
    .stat-box span { font-size: 0.8rem; color: var(--text-soft); }

    .card { border: 1px solid var(--border); background: rgba(26, 39, 64, 0.4); border-radius: 16px; padding: 1.5rem; }
    .card-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 1.5rem; }
    .card h3 { font-size: 0.8rem; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em; }
    .view-link { font-size: 0.75rem; color: var(--primary); text-decoration: none; }

    .appt-list { list-style: none; padding: 0; display: grid; gap: 1rem; }
    .appt-list li { display: flex; align-items: center; gap: 1.5rem; padding: 1rem; background: rgba(255,255,255,0.03); border-radius: 12px; }
    .appt-time { display: grid; min-width: 100px; }
    .appt-time strong { font-size: 0.95rem; color: var(--primary); }
    .appt-time span { font-size: 0.75rem; color: var(--text-soft); }
    .appt-details { flex: 1; }
    .appt-details strong { display: block; margin-bottom: 0.1rem; font-size: 0.95rem; }
    .meta { font-size: 0.75rem; color: var(--text-muted); }
    
    .status-badge { font-size: 0.65rem; padding: 0.2rem 0.6rem; border-radius: 99px; border: 1px solid rgba(0,212,170,0.4); color: var(--primary); background: rgba(0,212,170,0.05); text-transform: uppercase; font-weight: 700; }
    .status-badge.cancelled { border-color: rgba(255,90,114,0.4); color: #ff9ca9; background: rgba(255,90,114,0.05); }

    .alerts-card.has-alerts { border-color: rgba(109,124,255,0.4); background: rgba(109,124,255,0.05); }
    .alert-preview { list-style: none; padding: 0; display: grid; gap: 1rem; }
    .alert-preview li { border-left: 3px solid #6d7cff; padding-left: 0.8rem; }
    .alert-preview li.critical { border-color: #ff5a72; }
    .alert-preview li strong { font-size: 0.85rem; display: block; margin-bottom: 0.2rem; }
    .alert-preview li p { font-size: 0.75rem; color: var(--text-soft); line-height: 1.4; }

    .link-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; margin-top: 1rem; }
    .svc-link { display: flex; flex-direction: column; align-items: center; background: rgba(0,0,0,0.2); border: 1px solid var(--border); padding: 1rem; border-radius: 10px; text-decoration: none; transition: 0.2s; }
    .svc-link:hover { border-color: var(--primary); background: rgba(0,212,170,0.05); }
    .svc-link .icon { font-size: 1.3rem; margin-bottom: 0.4rem; }
    .svc-link .label { font-size: 0.75rem; font-weight: 700; color: #fff; }

    .empty-msg { font-size: 0.85rem; color: var(--text-muted); text-align: center; padding: 2rem 0; }

    @media (max-width: 1000px) {
      .portal-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class PatientPortalComponent implements OnInit {
  appointments: Appointment[] = [];
  recentNotifications: NotificationItem[] = [];

  constructor(
    private appointmentApi: AppointmentApiService,
    private authService: AuthService,
    private notificationApi: NotificationsApiService
  ) {}

  ngOnInit(): void {
    const userId = this.authService.getUserId();
    if (userId) {
      this.loadUpcoming(userId);
      this.loadRecentNotifications(userId);
    }
  }

  loadUpcoming(patientId: number): void {
    this.appointmentApi.listUpcomingByPatientId(patientId).subscribe({
      next: items => (this.appointments = items),
      error: () => (this.appointments = [])
    });
  }

  loadRecentNotifications(userId: number): void {
    this.notificationApi.getMyNotifications(userId, {}).subscribe({
      next: items => {
        this.recentNotifications = items
          .filter(i => !i.read)
          .slice(0, 2);
      }
    });
  }
}
