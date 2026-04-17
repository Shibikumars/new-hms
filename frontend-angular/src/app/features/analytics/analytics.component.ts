import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportingApiService } from './reporting-api.service';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <div class="hero">
        <div>
          <h2>Analytics</h2>
          <p class="subtitle">Operational intelligence powered by reporting-service.</p>
        </div>
        <div class="pill">Insights</div>
      </div>

      <div class="loading-text" *ngIf="loadingSummary">Loading KPI summary…</div>
      <div class="cards" *ngIf="!loadingSummary && summary">
        <div class="card"><span class="label">Total Patients</span><strong>{{ summary.totalPatients }}</strong></div>
        <div class="card"><span class="label">Today Appointments</span><strong>{{ summary.todayAppointments }}</strong></div>
        <div class="card"><span class="label">Active Doctors</span><strong>{{ summary.activeDoctors }}</strong></div>
        <div class="card revenue"><span class="label">Today Revenue</span><strong>₹{{ summary.todayRevenue }}</strong></div>
      </div>
      <div class="loading-text" *ngIf="!loadingSummary && !summary">Summary data unavailable right now.</div>

      <section class="section card" aria-labelledby="dept-load-heading">
        <h3 id="dept-load-heading">Department Load</h3>
        <div class="loading-text" *ngIf="loadingDepartmentLoad">Loading department metrics…</div>
        <ul class="list" *ngIf="!loadingDepartmentLoad && departmentLoadEntries.length > 0">
          <li *ngFor="let row of departmentLoadEntries">
            <strong>{{ row[0] }}</strong>
            <span>{{ row[1] }}%</span>
          </li>
        </ul>
        <div class="loading-text" *ngIf="!loadingDepartmentLoad && departmentLoadEntries.length === 0">No department data available.</div>
      </section>

      <section class="section card" aria-labelledby="top-doctors-heading">
        <h3 id="top-doctors-heading">Top Doctors</h3>
        <div class="loading-text" *ngIf="loadingDoctorPerformance">Loading doctor performance…</div>
        <ul class="list" *ngIf="!loadingDoctorPerformance && doctorPerformance.length > 0">
          <li *ngFor="let row of doctorPerformance">
            <strong>{{ row['name'] }}</strong>
            <span>Patients: {{ row['patients'] }} · Rating: {{ row['rating'] }}</span>
          </li>
        </ul>
        <div class="loading-text" *ngIf="!loadingDoctorPerformance && doctorPerformance.length === 0">No doctor performance records available.</div>
      </section>
    </div>
  `,
  styles: [`
    .hero { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; }
    .subtitle { margin-top: 0.45rem; color: var(--text-soft); }
    .pill { border: 1px solid rgba(109,124,255,0.5); color: #aeb8ff; background: rgba(109,124,255,0.16); border-radius: 999px; padding: 0.35rem 0.75rem; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 700; white-space: nowrap; }
    .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem; margin-top: 1rem; }
    .card { border: 1px solid var(--border); border-radius: 12px; padding: 0.85rem; display: grid; gap: 0.25rem; background: linear-gradient(180deg, rgba(26,39,64,0.65), rgba(15,23,38,0.95)); }
    .label { color: var(--text-muted); font-size: 0.74rem; text-transform: uppercase; letter-spacing: 0.05em; }
    .card strong { font-family: 'Syne', sans-serif; color: var(--text); font-size: 1.15rem; }
    .card.revenue strong { color: var(--primary); }
    .section { margin-top: 1.2rem; }
    .list { list-style: none; padding: 0; margin: 0.5rem 0 0; }
    .list li { border: 1px solid var(--border); border-radius: 10px; padding: 0.72rem; margin-bottom: 0.5rem; background: rgba(11,18,32,0.55); }
    .list span { display: block; color: var(--text-soft); margin-top: 0.25rem; }

    @media (max-width: 760px) {
      .hero { flex-direction: column; }
    }
  `]
})
export class AnalyticsComponent implements OnInit {
  summary: { totalPatients: number; todayAppointments: number; activeDoctors: number; todayRevenue: number; } | null = null;
  departmentLoadEntries: Array<[string, number]> = [];
  doctorPerformance: Array<Record<string, unknown>> = [];

  loadingSummary = false;
  loadingDepartmentLoad = false;
  loadingDoctorPerformance = false;

  constructor(private reportingApi: ReportingApiService) {}

  ngOnInit(): void {
    this.loadingSummary = true;
    this.reportingApi.getSummary().subscribe({
      next: data => {
        this.summary = data;
        this.loadingSummary = false;
      },
      error: () => {
        this.summary = null;
        this.loadingSummary = false;
      }
    });

    this.loadingDepartmentLoad = true;
    this.reportingApi.getDepartmentLoad().subscribe({
      next: data => {
        this.departmentLoadEntries = Object.entries(data) as Array<[string, number]>;
        this.loadingDepartmentLoad = false;
      },
      error: () => {
        this.departmentLoadEntries = [];
        this.loadingDepartmentLoad = false;
      }
    });

    this.loadingDoctorPerformance = true;
    this.reportingApi.getDoctorsPerformance().subscribe({
      next: data => {
        this.doctorPerformance = data;
        this.loadingDoctorPerformance = false;
      },
      error: () => {
        this.doctorPerformance = [];
        this.loadingDoctorPerformance = false;
      }
    });
  }
}
