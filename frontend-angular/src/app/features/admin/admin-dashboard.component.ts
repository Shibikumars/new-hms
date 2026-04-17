import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardSummary, ReportingApiService } from '../analytics/reporting-api.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container">
      <div class="hero">
        <div>
          <h2>Admin Command Center</h2>
          <p class="subtitle">Real-time operational intelligence across patients, doctors, appointments and revenue.</p>
        </div>
        <div class="hero-badge">Live · Reporting Connected</div>
      </div>

      <div class="cards" *ngIf="summary">
        <div class="card">
          <span class="card-label">Total Patients</span>
          <strong>{{ summary.totalPatients }}</strong>
        </div>
        <div class="card">
          <span class="card-label">Active Doctors</span>
          <strong>{{ summary.activeDoctors }}</strong>
        </div>
        <div class="card">
          <span class="card-label">Today Appointments</span>
          <strong>{{ summary.todayAppointments }}</strong>
        </div>
        <div class="card revenue">
          <span class="card-label">Today Revenue</span>
          <strong>₹{{ summary.todayRevenue }}</strong>
        </div>
      </div>

      <div class="section">
        <h3>Department Load</h3>
        <ul class="list" *ngIf="departmentLoad.length > 0">
          <li *ngFor="let item of departmentLoad">
            <strong>{{ item[0] }}</strong>
            <span>{{ item[1] }}% capacity</span>
          </li>
        </ul>
      </div>

      <nav class="actions toolbar-scroll" aria-label="Admin quick actions">
        <a class="link" routerLink="/appointments">Appointments</a>
        <a class="link" routerLink="/admin/billing">Billing</a>
        <a class="link" routerLink="/admin/notifications">Notifications</a>
        <a class="link" routerLink="/admin/analytics">Analytics</a>
      </nav>
    </div>
  `,
  styles: [`
    .hero { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; }
    .subtitle { margin-top: 0.45rem; color: var(--text-soft); max-width: 56ch; }
    .hero-badge {
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
    .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.8rem; margin-top: 1rem; }
    .card {
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 0.85rem;
      background: linear-gradient(180deg, rgba(26,39,64,0.65), rgba(15,23,38,0.95));
      display: grid;
      gap: 0.3rem;
    }
    .card-label { color: var(--text-muted); font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.05em; }
    .card strong { font-family: 'Syne', sans-serif; color: var(--text); font-size: 1.15rem; }
    .card.revenue strong { color: var(--primary); }
    .section { margin-top: 1.4rem; }
    .list li span { display: block; margin-top: 0.25rem; color: var(--text-soft); }
    .actions { margin-top: 1.2rem; display: flex; gap: 0.5rem; flex-wrap: wrap; }
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

    @media (max-width: 780px) {
      .hero { flex-direction: column; }
      .actions { flex-wrap: nowrap; }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  summary: DashboardSummary | null = null;
  departmentLoad: Array<[string, number]> = [];

  constructor(private reportingApi: ReportingApiService) {}

  ngOnInit(): void {
    this.reportingApi.getSummary().subscribe({
      next: data => (this.summary = data),
      error: () => (this.summary = null)
    });

    this.reportingApi.getDepartmentLoad().subscribe({
      next: data => (this.departmentLoad = Object.entries(data) as Array<[string, number]>),
      error: () => (this.departmentLoad = [])
    });
  }
}
