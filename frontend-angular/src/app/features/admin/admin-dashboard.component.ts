import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions, ChartType } from 'chart.js';
import { DashboardSummary, ReportingApiService } from '../analytics/reporting-api.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, BaseChartDirective],
  template: `
    <div class="container clinical-bg">
      <header class="dashboard-header">
        <div class="header-left">
          <h1 class="page-title">Executive Overview</h1>
          <p class="page-subtitle">Real-time operational metrics and health system status</p>
        </div>
        <div class="header-right">
          <div class="live-status">
            <span class="status-dot pulse"></span>
            Operational Systems Live
          </div>
        </div>
      </header>

      <div class="stat-grid" *ngIf="summary">
        <div class="stat-card">
          <div class="stat-icon patient-icon"><i class="ph ph-users"></i></div>
          <div class="stat-content">
            <span class="stat-label">Total Patients</span>
            <div class="stat-value">{{ summary.totalPatients }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon doctor-icon"><i class="ph ph-stethoscope"></i></div>
          <div class="stat-content">
            <span class="stat-label">Active Doctors</span>
            <div class="stat-value">{{ summary.activeDoctors }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon appt-icon"><i class="ph ph-calendar-check"></i></div>
          <div class="stat-content">
            <span class="stat-label">Today's Visits</span>
            <div class="stat-value">{{ summary.todayAppointments }}</div>
          </div>
        </div>
        <div class="stat-card revenue">
          <div class="stat-icon rev-icon"><i class="ph ph-currency-circle-dollar"></i></div>
          <div class="stat-content">
            <span class="stat-label">System Revenue</span>
            <div class="stat-value">₹{{ summary.todayRevenue }}</div>
          </div>
        </div>
      </div>

      <div class="visual-grid">
        <div class="chart-card large">
          <div class="card-header">
            <h3>Appointment Volume (30 Days)</h3>
            <span class="trend up"><i class="ph ph-trend-up"></i> +12%</span>
          </div>
          <div class="chart-body">
            <canvas baseChart
              [data]="lineChartData"
              [options]="lineChartOptions"
              [type]="'line'">
            </canvas>
          </div>
        </div>

        <div class="chart-card">
          <div class="card-header">
            <h3>Revenue by Dept</h3>
          </div>
          <div class="chart-body">
            <canvas baseChart
              [data]="barChartData"
              [options]="barChartOptions"
              [type]="'bar'">
            </canvas>
          </div>
        </div>

        <div class="chart-card">
          <div class="card-header">
            <h3>Appt Distribution</h3>
          </div>
          <div class="chart-body donut">
            <canvas baseChart
              [data]="donutChartData"
              [options]="donutChartOptions"
              [type]="'doughnut'">
            </canvas>
          </div>
        </div>

        <div class="chart-card large user-management-card">
          <div class="card-header">
            <h3>User & Identity Management</h3>
            <div class="live-status">
              <span class="status-dot"></span>
              {{ users.length }} System Users
            </div>
          </div>
          <div class="user-table-wrap">
            <table class="clinical-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let user of users">
                  <td>{{ user.username }}</td>
                  <td><span class="badge info">{{ user.role }}</span></td>
                  <td>
                    <span class="badge success" *ngIf="user.isVerified">Verified</span>
                    <span class="badge warning" *ngIf="!user.isVerified">Pending</span>
                  </td>
                  <td>
                    <button *ngIf="!user.isVerified" 
                            (click)="verifyUser(user.userId || user.id)" 
                            class="action-btn verify">
                      Verify
                    </button>
                    <span *ngIf="user.isVerified">-</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div class="chart-card large admin-ops-card">
          <div class="card-header">
            <h3>Doctor & Staff Management</h3>
            <span class="badge info">Quick Register</span>
          </div>
          <div class="admin-form-shell">
            <p class="form-instruction">Onboard new specialists to the clinical network. Credentials will be routed for verification.</p>
            <div class="form-row">
               <div class="input-wrap">
                  <label>Full Name</label>
                  <input type="text" placeholder="Dr. Sarah Johnson" />
               </div>
               <div class="input-wrap">
                  <label>Specialization</label>
                  <select>
                     <option>Cardiology</option>
                     <option>Pediatrics</option>
                     <option>Neurology</option>
                     <option>General Surgery</option>
                  </select>
               </div>
            </div>
            <div class="form-row">
               <div class="input-wrap">
                  <label>License Number</label>
                  <input type="text" placeholder="REG-2024-XXXX" />
               </div>
               <div class="input-wrap">
                  <label>Consultation Fee (₹)</label>
                  <input type="number" value="500" />
               </div>
            </div>
            <button class="nav-btn primary-solid full mt-1">
               <i class="ph ph-user-plus"></i> Finalize Onboarding
            </button>
          </div>
        </div>

        <div class="chart-card">
          <div class="card-header">
             <h3>System Health</h3>
          </div>
          <div class="health-stack">
             <div class="health-item"><span>Auth Service</span> <span class="badge success">UP</span></div>
             <div class="health-item"><span>Patient Service</span> <span class="badge success">UP</span></div>
             <div class="health-item"><span>Billing Gateway</span> <span class="badge success">UP</span></div>
             <div class="health-item"><span>Notification Hub</span> <span class="badge warning">STUB</span></div>
          </div>
        </div>
      </div>

      <nav class="quick-nav">
        <a class="nav-btn" routerLink="/appointments"><i class="ph ph-calendar"></i> Managed Appointments</a>
        <a class="nav-btn" routerLink="/admin/billing"><i class="ph ph-wallet"></i> Financial Ledger</a>
        <a class="nav-btn" routerLink="/admin/analytics"><i class="ph ph-graph"></i> Advanced Analytics</a>
        <button class="nav-btn" (click)="generateMonthlyReport()"><i class="ph ph-file-pdf"></i> Export Monthly GST Report</button>
      </nav>
    </div>
  `,
  styles: [`
    .clinical-bg { padding: 2rem; }
    .dashboard-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
    .page-title { font-size: 1.75rem; color: var(--primary); font-weight: 800; }
    .page-subtitle { color: var(--text-muted); font-size: 0.95rem; margin-top: 0.25rem; }
    
    .live-status { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; font-weight: 700; color: var(--accent); background: rgba(13, 126, 106, 0.05); padding: 0.5rem 1rem; border-radius: 999px; border: 1px solid rgba(13, 126, 106, 0.1); }
    .status-dot { width: 8px; height: 8px; background: var(--accent); border-radius: 50%; }
    .pulse { animation: pulse-anim 2s infinite; }

    .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
    .stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.5rem; display: flex; align-items: center; gap: 1.25rem; box-shadow: var(--shadow-soft); }
    .stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
    .patient-icon { background: rgba(26, 60, 110, 0.08); color: var(--primary); }
    .doctor-icon { background: rgba(13, 126, 106, 0.08); color: var(--accent); }
    .appt-icon { background: rgba(217, 119, 6, 0.08); color: var(--warning); }
    .rev-icon { background: rgba(26, 60, 110, 0.1); color: var(--primary); }
    .stat-label { color: var(--text-muted); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    .stat-value { font-size: 1.5rem; font-weight: 800; color: var(--text); font-family: 'Syne', sans-serif; }

    .visual-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
    .chart-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.5rem; box-shadow: var(--shadow-soft); display: flex; flex-direction: column; }
    .large { grid-column: span 2; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .card-header h3 { font-size: 1rem; color: var(--text); font-weight: 700; }
    
    .chart-body { flex: 1; height: 300px; display: flex; align-items: center; }
    .donut { height: 250px; }

    .ward-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
    .ward { background: var(--surface-soft); padding: 1rem; border-radius: 8px; }
    .ward-title { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.75rem; text-transform: uppercase; }
    .bed-grid { display: grid; grid-template-columns: repeat(8, 1fr); gap: 4px; }
    .bed { width: 12px; height: 12px; border-radius: 2px; border: 1px solid var(--border); background: #E2E8F0; }
    .bed.occupied { background: var(--primary); border-color: var(--primary); }
    .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
    .available { background: #E2E8F0; }
    .occupied { background: var(--primary); }
    .map-legend { font-size: 0.7rem; color: var(--text-muted); display: flex; gap: 1rem; }

    .quick-nav { grid-column: span 3; display: flex; gap: 0.75rem; margin-top: 2rem; }
    .nav-btn { background: var(--surface); border: 1px solid var(--border); padding: 0.75rem 1.25rem; border-radius: 999px; text-decoration: none; color: var(--text-soft); font-weight: 700; font-size: 0.85rem; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s; }
    .nav-btn:hover { border-color: var(--primary); color: var(--primary); box-shadow: var(--shadow-soft); }
    .primary-solid { background: var(--primary); color: #fff; }
    .primary-solid:hover { background: var(--primary-strong); color: #fff; }
    .full { width: 100%; justify-content: center; margin-top: 1rem; }

    /* Admin Form & Health Styles */
    .admin-form-shell { margin-top: 0.5rem; }
    .form-instruction { font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1.5rem; line-height: 1.5; }
    .input-wrap { display: flex; flex-direction: column; gap: 0.4rem; }
    .health-stack { display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1rem; }
    .health-item { display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; font-weight: 600; padding: 0.5rem 0; border-bottom: 1px dashed var(--border); }
    .badge { font-size: 0.65rem; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 800; }
    .badge.success { background: #DCFCE7; color: #15803D; }
    .badge.warning { background: #FEF3C7; color: #B45309; }
    .badge.info { background: #DBEAFE; color: #1D4ED8; }
    
    /* Table Styles */
    .user-table-wrap { overflow-x: auto; margin-top: 1rem; }
    .clinical-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    .clinical-table th { text-align: left; padding: 0.75rem; color: var(--text-muted); border-bottom: 1px solid var(--border); }
    .clinical-table td { padding: 0.75rem; border-bottom: 1px solid var(--border-soft); color: var(--text-soft); }
    .action-btn { padding: 0.4rem 0.8rem; border-radius: 6px; border: none; font-weight: 700; font-size: 0.75rem; cursor: pointer; transition: 0.2s; }
    .action-btn.verify { background: var(--accent); color: #fff; }
    .action-btn.verify:hover { background: #0A6656; }

    @keyframes pulse-anim { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }
    @media (max-width: 1024px) { .large { grid-column: span 3; } .visual-grid { grid-template-columns: 1fr; } }
  `]
})
export class AdminDashboardComponent implements OnInit {
  summary: DashboardSummary | null = null;
  users: any[] = [];
  
  // Real-time Bed Mock
  wards = [
    { name: 'ICU-A', beds: Array(16).fill(0).map((_, i) => ({ id: i, occupied: Math.random() > 0.4 })) },
    { name: 'General Ward-1', beds: Array(24).fill(0).map((_, i) => ({ id: i, occupied: Math.random() > 0.7 })) },
    { name: 'Pediatrics', beds: Array(16).fill(0).map((_, i) => ({ id: i, occupied: Math.random() > 0.3 })) },
    { name: 'Cardiology', beds: Array(16).fill(0).map((_, i) => ({ id: i, occupied: Math.random() > 0.5 })) }
  ];

  // Charts Config
  public lineChartData: ChartConfiguration['data'] = {
    datasets: [{
      data: [65, 59, 80, 81, 56, 55, 40, 70, 75, 85, 90, 82, 70, 75, 80, 85, 95, 100, 110, 105, 100, 110, 115, 120, 125, 130, 120, 115, 110, 105],
      label: 'Visits',
      backgroundColor: 'rgba(26, 60, 110, 0.1)',
      borderColor: '#1A3C6E',
      pointBackgroundColor: '#1A3C6E',
      pointBorderColor: '#fff',
      fill: 'origin',
      tension: 0.4
    }],
    labels: Array(30).fill(0).map((_, i) => `Day ${i + 1}`)
  };

  public lineChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { grid: { color: '#F1F5F9' }, ticks: { font: { size: 10 } } },
      x: { grid: { display: false }, ticks: { display: false } }
    }
  };

  public barChartData: ChartConfiguration['data'] = {
    datasets: [{
      data: [12000, 19000, 3000, 5000, 2000, 3000],
      label: 'Revenue',
      backgroundColor: ['#1A3C6E', '#0D7E6A', '#D97706', '#DC2626', '#FFB0C1', '#F1F5F9'],
      borderRadius: 4
    }],
    labels: ['Cardio', 'ENT', 'Pedia', 'ICU', 'General', 'Dental']
  };

  public barChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: '#F1F5F9' } },
      x: { grid: { display: false } }
    }
  };

  public donutChartData: ChartConfiguration['data'] = {
    labels: ['Completed', 'Pending', 'Cancelled'],
    datasets: [{
      data: [350, 450, 100],
      backgroundColor: ['#0D7E6A', '#D97706', '#DC2626'],
      hoverOffset: 4
    }]
  };

  public donutChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
    }
  };

  constructor(private reportingApi: ReportingApiService, private authService: AuthService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.reportingApi.getSummary().subscribe({
      next: data => (this.summary = data),
      error: () => (this.summary = null)
    });

    this.authService.getDebugUsers().subscribe({
      next: users => (this.users = users),
      error: () => (this.users = [])
    });
  }

  verifyUser(userId: number): void {
    if (!userId) return;
    this.authService.adminVerifyUser(userId).subscribe({
      next: () => {
        window.alert('User verified successfully!');
        this.loadData();
      },
      error: (err) => {
        console.error('Verification failed', err);
        window.alert('Verification failed. See console.');
      }
    });
  }

  generateMonthlyReport() {
    window.alert('Generating consolidated GST Monthly Report (₹)... Data aggregation in progress.');
  }
}

