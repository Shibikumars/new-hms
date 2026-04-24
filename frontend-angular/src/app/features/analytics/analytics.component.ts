import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportingApiService, DashboardSummary } from './reporting-api.service';

declare var Chart: any;

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container clinical-bg">
      <header class="ph-header">
        <div class="header-left">
          <h1 class="page-title">Operational Intelligence</h1>
          <p class="page-subtitle">Real-time clinical metrics and departmental performance monitoring.</p>
        </div>
        <div class="header-right">
          <div class="last-sync">
             <i class="ph ph-clock-counter-clockwise"></i>
             <span>Last Updated: <strong>{{ lastSync | date:'shortTime' }}</strong></span>
          </div>
        </div>
      </header>

      <!-- KPI Ribbon -->
      <div class="kpi-ribbon" *ngIf="summary">
        <div class="kpi-card">
          <div class="kpi-icon patients"><i class="ph ph-users-three"></i></div>
          <div class="kpi-data">
            <label>Total Patients</label>
            <strong>{{ summary.totalPatients | number }}</strong>
            <span class="trend up"><i class="ph ph-trend-up"></i> 4.2%</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon appointments"><i class="ph ph-calendar-check"></i></div>
          <div class="kpi-data">
            <label>Today's Load</label>
            <strong>{{ summary.todayAppointments }}</strong>
            <span class="trend">Appointments</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon doctors"><i class="ph ph-stethoscope"></i></div>
          <div class="kpi-data">
            <label>On-Call Staff</label>
            <strong>{{ summary.activeDoctors }}</strong>
            <span class="trend">Active Doctors</span>
          </div>
        </div>
        <div class="kpi-card revenue">
          <div class="kpi-icon revenue"><i class="ph ph-currency-dollar"></i></div>
          <div class="kpi-data">
            <label>Daily Revenue</label>
            <strong>₹{{ summary.todayRevenue | number }}</strong>
            <span class="trend up"><i class="ph ph-trend-up"></i> 12%</span>
          </div>
        </div>
      </div>

      <div class="dashboard-grid">
        <!-- Main: Charts and Progress -->
        <main class="analytics-main">
          <section class="card pane">
            <div class="pane-header">
               <h3>Department Capacity Load</h3>
               <p class="pane-subtitle">Live utilization across clinical wings.</p>
            </div>
            
            <div class="loading-box" *ngIf="loadingDepartmentLoad">
              <i class="ph ph-circle-notch ph-spin"></i>
            </div>

            <div class="dept-load-list" *ngIf="!loadingDepartmentLoad">
              <div class="dept-item" *ngFor="let row of departmentLoadEntries">
                 <div class="dept-info">
                   <span class="dept-name">{{ row[0] }}</span>
                   <span class="dept-val">{{ row[1] }}% Capacity</span>
                 </div>
                 <div class="load-bar-wrap">
                    <div class="load-bar" [style.width.%]="row[1]" [class.critical]="row[1] > 85"></div>
                 </div>
              </div>
            </div>
          </section>

          <div class="chart-row mt-8">
            <section class="card pane chart-pane">
               <h3>Encounter Volume (7d)</h3>
               <div class="chart-box"><canvas #aptChart></canvas></div>
            </section>
            <section class="card pane chart-pane">
               <h3>Revenue Velocity (7d)</h3>
               <div class="chart-box"><canvas #revChart></canvas></div>
            </section>
          </div>

          <section class="card pane mt-8">
            <div class="pane-header">
               <h3>Clinic Outcomes & Trends</h3>
               <p class="pane-subtitle">Aggregated clinical performance indicators.</p>
            </div>
            <div class="trends-stats">
               <div class="trend-box">
                  <span class="t-val">3.2m</span>
                  <label>Wait Time (Avg)</label>
               </div>
               <div class="trend-box">
                  <span class="t-val">98%</span>
                  <label>Patient Satisfaction</label>
               </div>
               <div class="trend-box">
                  <span class="t-val">1.4h</span>
                  <label>Discharge Speed</label>
               </div>
            </div>
          </section>
        </main>

        <!-- Sidebar: Performance -->
        <aside class="analytics-side">
          <section class="card pane perf-pane">
            <div class="pane-header">
               <h3>Top Performers</h3>
               <p class="pane-subtitle">Staff ranking by patient volume.</p>
            </div>
            
            <div class="loading-box" *ngIf="loadingDoctorPerformance">
              <i class="ph ph-circle-notch ph-spin"></i>
            </div>

            <div class="perf-list" *ngIf="!loadingDoctorPerformance">
              <div class="perf-item" *ngFor="let row of doctorPerformance; let i = index">
                 <div class="rank">#{{ i + 1 }}</div>
                 <div class="doc-brief">
                   <strong>{{ row['name'] }}</strong>
                   <span>{{ row['rating'] }} Rating · {{ row['patients'] }} Cases</span>
                 </div>
                 <div class="perf-badge"><i class="ph ph-medal"></i></div>
              </div>
            </div>
          </section>

          <div class="card operation-summary mt-8">
             <h3>Operational Health</h3>
             <div class="health-gauge">
                <i class="ph ph-activity"></i>
                <div class="hg-data">
                   <span class="hg-label">System Stability</span>
                   <span class="hg-val">99.9% Optimal</span>
                </div>
             </div>
          </div>
        </aside>
      </div>
    </div>
  `,
  styles: [`
    .clinical-bg { padding: 2rem; background: var(--bg); min-height: 100vh; }
    .ph-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
    .page-title { font-size: 1.75rem; color: var(--primary); font-weight: 800; }
    .page-subtitle { color: var(--text-muted); font-size: 0.95rem; margin-top: 0.25rem; }

    .last-sync { display: flex; align-items: center; gap: 0.5rem; color: var(--text-muted); font-size: 0.8rem; font-weight: 700; background: #fff; padding: 0.4rem 1rem; border-radius: 99px; border: 1px solid var(--border); }
    .last-sync strong { color: var(--text); }

    /* KPI Ribbon */
    .kpi-ribbon { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; margin-bottom: 2rem; }
    .kpi-card { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.5rem; display: flex; gap: 1rem; align-items: center; box-shadow: var(--shadow-soft); transition: 0.2s; }
    .kpi-card:hover { transform: translateY(-3px); border-color: var(--primary); }
    .kpi-icon { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
    .kpi-icon.patients { background: rgba(26, 60, 110, 0.1); color: var(--primary); }
    .kpi-icon.appointments { background: rgba(13, 126, 106, 0.1); color: var(--accent); }
    .kpi-icon.doctors { background: rgba(217, 119, 6, 0.1); color: var(--warning); }
    .kpi-icon.revenue { background: rgba(22, 163, 74, 0.1); color: #16a34a; }
    
    .kpi-data { display: flex; flex-direction: column; }
    .kpi-data label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 800; }
    .kpi-data strong { font-size: 1.5rem; color: var(--text); font-family: 'Syne', sans-serif; font-weight: 800; }
    .trend { font-size: 0.7rem; color: var(--text-muted); font-weight: 700; }
    .trend.up { color: #16a34a; }
    
    /* Layout */
    .dashboard-grid { display: grid; grid-template-columns: 1fr 340px; gap: 2rem; }
    .card { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 2rem; box-shadow: var(--shadow-soft); }
    .pane-header { margin-bottom: 2rem; }
    .pane-header h3 { font-size: 1.1rem; font-weight: 800; color: var(--text); margin-bottom: 0.25rem; }
    .pane-header .pane-subtitle { font-size: 0.85rem; color: var(--text-muted); font-weight: 600; }

    /* Department Load */
    .dept-load-list { display: grid; gap: 1.5rem; }
    .dept-item { display: grid; gap: 0.6rem; }
    .dept-info { display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 800; color: var(--text); }
    .dept-val { color: var(--primary); }
    .load-bar-wrap { height: 8px; background: var(--bg); border-radius: 99px; overflow: hidden; }
    .load-bar { height: 100%; background: var(--primary); border-radius: 99px; transition: 1s cubic-bezier(0.19, 1, 0.22, 1); }
    .load-bar.critical { background: #EF4444; }

    .chart-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .chart-box { height: 220px; margin-top: 1rem; }

    /* Trends Box */
    .trends-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
    .trend-box { text-align: center; padding: 1.5rem; background: var(--surface-soft); border-radius: 12px; }
    .t-val { display: block; font-size: 1.5rem; font-family: 'Syne', sans-serif; font-weight: 800; color: var(--primary); }
    .trend-box label { font-size: 0.75rem; color: var(--text-muted); font-weight: 800; text-transform: uppercase; }

    /* Performance List */
    .perf-list { display: grid; gap: 1rem; }
    .perf-item { display: flex; align-items: center; gap: 1.25rem; padding: 1.25rem; background: var(--surface-soft); border-radius: 12px; border: 1px solid var(--border); }
    .rank { width: 32px; font-family: 'Syne', sans-serif; font-weight: 800; color: var(--primary); font-size: 1.1rem; }
    .doc-brief { flex: 1; display: flex; flex-direction: column; }
    .doc-brief strong { font-size: 0.95rem; color: var(--text); font-weight: 800; }
    .doc-brief span { font-size: 0.75rem; color: var(--text-muted); font-weight: 700; }
    .perf-badge { color: var(--warning); font-size: 1.25rem; }

    /* Health Gauge */
    .operation-summary h3 { font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1rem; }
    .health-gauge { display: flex; align-items: center; gap: 1rem; background: rgba(13, 126, 106, 0.05); padding: 1.25rem; border-radius: 12px; border: 1px solid rgba(13, 126, 106, 0.2); }
    .health-gauge i { font-size: 1.75rem; color: var(--accent); }
    .hg-data { display: flex; flex-direction: column; }
    .hg-label { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: 800; }
    .hg-val { font-size: 0.9rem; color: var(--accent); font-weight: 800; }

    .loading-box { display: flex; justify-content: center; padding: 3rem; font-size: 2rem; color: var(--primary); }
    .mt-8 { margin-top: 2rem; }

    @media (max-width: 1200px) {
      .kpi-ribbon { grid-template-columns: repeat(2, 1fr); }
      .dashboard-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class AnalyticsComponent implements OnInit, AfterViewInit {
  @ViewChild('aptChart') aptChartRef!: ElementRef;
  @ViewChild('revChart') revChartRef!: ElementRef;

  summary: DashboardSummary | null = null;
  departmentLoadEntries: Array<[string, number]> = [];
  doctorPerformance: Array<Record<string, unknown>> = [];
  lastSync = new Date();

  loadingSummary = false;
  loadingDepartmentLoad = false;
  loadingDoctorPerformance = false;

  constructor(private reportingApi: ReportingApiService) {}

  ngOnInit(): void {
    this.refresh();
  }

  ngAfterViewInit(): void {
    // We will render charts after data is loaded and views are ready
  }

  refresh(): void {
    this.loadingSummary = true;
    this.reportingApi.getSummary().subscribe({
      next: data => {
        this.summary = data;
        this.loadingSummary = false;
        // Trigger chart rendering after summary loads (as summary contains total info)
        setTimeout(() => this.initCharts(), 500);
      },
      error: () => this.loadingSummary = false
    });

    this.loadingDepartmentLoad = true;
    this.reportingApi.getDepartmentLoad().subscribe({
      next: data => {
        this.departmentLoadEntries = Object.entries(data) as Array<[string, number]>;
        this.loadingDepartmentLoad = false;
      },
      error: () => this.loadingDepartmentLoad = false
    });

    this.loadingDoctorPerformance = true;
    this.reportingApi.getDoctorsPerformance().subscribe({
      next: data => {
        this.doctorPerformance = data;
        this.loadingDoctorPerformance = false;
      },
      error: () => this.loadingDoctorPerformance = false
    });
  }

  private initCharts(): void {
    if (!this.aptChartRef || !this.revChartRef) return;

    this.reportingApi.getAppointmentsVolume().subscribe(data => {
      new Chart(this.aptChartRef.nativeElement, {
        type: 'line',
        data: {
          labels: Object.keys(data),
          datasets: [{
            label: 'Encounters',
            data: Object.values(data),
            borderColor: '#6366f1',
            tension: 0.4,
            fill: true,
            backgroundColor: 'rgba(99, 102, 241, 0.1)'
          }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
    });

    this.reportingApi.getRevenue().subscribe(data => {
      new Chart(this.revChartRef.nativeElement, {
        type: 'bar',
        data: {
          labels: Object.keys(data),
          datasets: [{
            label: 'Revenue (₹)',
            data: Object.values(data),
            backgroundColor: '#10b981',
            borderRadius: 6
          }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
    });
  }
}

