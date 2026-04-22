import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Appointment, AppointmentApiService } from '../appointments/appointment-api.service';
import { PatientProfile, PatientProfileService } from '../patient/patient-profile.service';
import { PatientContextService } from '../../core/patient-context.service';
import { AuthService } from '../../core/auth.service';
import { NotificationItem, NotificationsApiService } from '../notifications/notifications-api.service';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="container">
      <div class="hero">
        <div>
          <h2>Welcome, Dr. {{ doctorName }}</h2>
          <p class="subtitle">Your clinical nexus for today. Efficiency meets patient care.</p>
        </div>
        <div class="hero-chip">Clinical Hub</div>
      </div>

      <!-- Patient Context Banner -->
      <div class="context-banner" *ngIf="activePatient$ | async as patient">
        <div class="banner-content">
          <div class="avatar">{{ patient.name.charAt(0) }}</div>
          <div>
            <div class="banner-title">Current Patient: {{ patient.name }}</div>
            <div class="banner-sub">ID: #{{ patient.id }} · Clinical Session Active</div>
          </div>
        </div>
        <div class="banner-actions">
           <button class="primary-btn sm" routerLink="/doctor/records">Open Chart</button>
           <button class="clear-btn" (click)="clearPatient()">Switch</button>
        </div>
      </div>

      <div class="dashboard-grid">
        <!-- Sidebar: Search & Alerts -->
        <div class="sidebar">
          <div class="card search-box">
            <h3>Find Patient</h3>
            <div class="search-input-group">
              <input type="text" [(ngModel)]="searchQuery" (input)="onSearch()" placeholder="Search name or ID..." />
            </div>
            <ul class="search-results" *ngIf="searchResults.length > 0">
              <li *ngFor="let p of searchResults" (click)="selectPatient(p)">
                <strong>{{ p.firstName }} {{ p.lastName }}</strong>
                <span>ID: #{{ p.id }}</span>
              </li>
            </ul>
          </div>

          <div class="card alerts-widget">
             <div class="card-header">
                <h3>Recent Alerts</h3>
                <a routerLink="/doctor/notifications" class="view-all">View All</a>
             </div>
             <div class="empty-msg" *ngIf="recentNotifications.length === 0">No recent alerts.</div>
             <ul class="alert-list">
                <li *ngFor="let n of recentNotifications" [class.critical]="n.type === 'CRITICAL'">
                   <div class="alert-dot"></div>
                   <div class="alert-body">
                      <strong>{{ n.title }}</strong>
                      <p>{{ n.message }}</p>
                   </div>
                </li>
             </ul>
          </div>
        </div>

        <!-- Main Content -->
        <div class="main-content">
          <div class="card quick-actions">
            <h3>Diagnostic Suite</h3>
            <div class="action-grid">
              <a class="action-card" routerLink="/doctor/records">
                <div class="icon">📁</div>
                <div class="label">Records</div>
              </a>
              <a class="action-card" routerLink="/doctor/lab">
                <div class="icon">🔬</div>
                <div class="label">Labs</div>
              </a>
              <a class="action-card" routerLink="/doctor/pharmacy">
                <div class="icon">💊</div>
                <div class="label">Pharmacy</div>
              </a>
              <a class="action-card" routerLink="/doctor/appointments">
                <div class="icon">📅</div>
                <div class="label">Schedule</div>
              </a>
            </div>
          </div>

          <div class="card schedule">
            <h3>On-Call Schedule (Today)</h3>
            <div class="muted" *ngIf="todayAppointments.length === 0">No appointments for today.</div>
            <ul class="appt-list">
              <li *ngFor="let item of todayAppointments" [class.active]="(activePatient$ | async)?.id === item.patientId">
                <div class="appt-time">{{ item.appointmentTime }}</div>
                <div class="appt-info">
                   <div class="appt-patient" (click)="selectPatientById(item.patientId)">Patient #{{ item.patientId }}</div>
                   <div class="appt-status">{{ item.status }}</div>
                </div>
                <button class="ghost-btn" (click)="selectPatientById(item.patientId)">Treat</button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .hero { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; margin-bottom: 2rem; }
    .subtitle { margin-top: 0.4rem; color: var(--text-soft); }
    .hero-chip { border: 1px solid rgba(0, 212, 170, 0.4); color: var(--primary); background: rgba(0, 212, 170, 0.1); border-radius: 999px; padding: 0.35rem 0.75rem; font-size: 0.75rem; font-weight: 700; }

    .context-banner {
      display: flex; justify-content: space-between; align-items: center;
      background: rgba(109, 124, 255, 0.1); border: 1px solid rgba(109, 124, 255, 0.3);
      border-radius: 12px; padding: 1rem; margin-bottom: 2rem; backdrop-filter: blur(10px);
    }
    .banner-content { display: flex; gap: 1rem; align-items: center; }
    .banner-actions { display: flex; gap: 0.5rem; }
    .avatar { width: 44px; height: 44px; background: var(--primary); color: #000; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; }
    .banner-title { font-weight: 700; font-size: 1rem; }
    .banner-sub { font-size: 0.8rem; color: var(--text-soft); }
    .primary-btn.sm { padding: 0.3rem 0.7rem; font-size: 0.8rem; background: var(--primary); color: #000; border: none; border-radius: 4px; cursor: pointer; }
    .clear-btn { background: rgba(255, 90, 114, 0.1); color: #ff9ca9; border: 1px solid rgba(255, 90, 114, 0.3); padding: 0.3rem 0.7rem; border-radius: 4px; font-size: 0.8rem; cursor: pointer; }

    .dashboard-grid { display: grid; grid-template-columns: 320px 1fr; gap: 1.5rem; }
    .card { border: 1px solid var(--border); background: rgba(26, 39, 64, 0.4); border-radius: 16px; padding: 1.2rem; margin-bottom: 1.5rem; }
    .card h3 { font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1rem; }

    .search-input-group input { width: 100%; background: rgba(0, 0, 0, 0.2); border: 1px solid var(--border); padding: 0.6rem; color: #fff; border-radius: 8px; }
    .search-results { list-style: none; padding: 0; margin-top: 0.5rem; border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
    .search-results li { padding: 0.6rem; border-bottom: 1px solid var(--border); cursor: pointer; display: grid; }
    .search-results li:hover { background: rgba(0, 212, 170, 0.1); }
    .search-results li strong { font-size: 0.85rem; }
    .search-results li span { font-size: 0.7rem; color: var(--text-soft); }

    .alerts-widget .card-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .view-all { font-size: 0.7rem; color: var(--primary); text-decoration: none; }
    .alert-list { list-style: none; padding: 0; margin-top: 1rem; display: grid; gap: 0.8rem; }
    .alert-list li { display: flex; gap: 0.8rem; font-size: 0.8rem; }
    .alert-dot { width: 8px; height: 8px; border-radius: 50%; background: #6d7cff; flex-shrink: 0; margin-top: 0.3rem; }
    .alert-list li.critical .alert-dot { background: #ff5a72; box-shadow: 0 0 5px #ff5a72; }
    .alert-body strong { display: block; margin-bottom: 0.1rem; }
    .alert-body p { color: var(--text-soft); font-size: 0.75rem; line-height: 1.3; }

    .action-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
    .action-card { background: rgba(0,0,0,0.15); border: 1px solid var(--border); padding: 1.2rem; border-radius: 12px; text-decoration: none; display: flex; flex-direction: column; align-items: center; transition: all 0.2s; }
    .action-card:hover { border-color: var(--primary); transform: translateY(-2px); }
    .action-card .icon { font-size: 1.5rem; margin-bottom: 0.5rem; }
    .action-card .label { font-size: 0.8rem; font-weight: 700; color: #fff; }

    .appt-list { list-style: none; padding: 0; }
    .appt-list li { display: flex; align-items: center; gap: 1rem; padding: 1rem 0; border-bottom: 1px solid var(--border); }
    .appt-list li.active { background: rgba(109, 124, 255, 0.05); border-left: 2px solid var(--primary); padding-left: 0.5rem; }
    .appt-time { font-size: 0.9rem; font-weight: 800; color: var(--primary); min-width: 60px; }
    .appt-info { flex: 1; }
    .appt-patient { font-weight: 600; cursor: pointer; margin-bottom: 0.2rem; }
    .appt-status { font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; }
    .ghost-btn { background: transparent; border: 1px solid var(--border); color: var(--text-soft); padding: 0.3rem 0.6rem; border-radius: 4px; font-size: 0.75rem; cursor: pointer; }
    .ghost-btn:hover { border-color: var(--primary); color: var(--primary); }

    @media (max-width: 1100px) {
      .dashboard-grid { grid-template-columns: 1fr; }
      .action-grid { grid-template-columns: repeat(2, 1fr); }
    }
  `]
})
export class DoctorDashboardComponent implements OnInit {
  doctorName = '';
  todayAppointments: Appointment[] = [];
  searchQuery = '';
  allPatients: PatientProfile[] = [];
  searchResults: PatientProfile[] = [];
  recentNotifications: NotificationItem[] = [];
  activePatient$ = this.contextService.activePatient$;

  constructor(
    private appointmentApi: AppointmentApiService,
    private patientApi: PatientProfileService,
    private contextService: PatientContextService,
    private auth: AuthService,
    private notificationApi: NotificationsApiService
  ) {}

  ngOnInit(): void {
    this.doctorName = this.auth.getUserName() || 'Doctor';
    const userId = this.auth.getUserId();
    
    this.loadAppointments();
    this.loadAllPatients();
    if (userId) {
      this.loadRecentNotifications(userId);
    }
  }

  loadAppointments(): void {
    const today = new Date().toISOString().slice(0, 10);
    this.appointmentApi.list().subscribe({
      next: items => {
        this.todayAppointments = items
          .filter(item => item.appointmentDate === today)
          .sort((a, b) => a.appointmentTime.localeCompare(b.appointmentTime));
      }
    });
  }

  loadRecentNotifications(userId: number): void {
    this.notificationApi.getMyNotifications(userId, {}).subscribe({
      next: items => {
        this.recentNotifications = items
          .filter(i => !i.read)
          .slice(0, 3);
      }
    });
  }

  loadAllPatients(): void {
    this.patientApi.getAll().subscribe({
      next: items => this.allPatients = items
    });
  }

  onSearch(): void {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) {
      this.searchResults = [];
      return;
    }
    this.searchResults = this.allPatients.filter(p => 
      p.firstName.toLowerCase().includes(q) || 
      p.lastName.toLowerCase().includes(q) || 
      String(p.id).includes(q)
    ).slice(0, 5);
  }

  selectPatient(p: PatientProfile): void {
    this.contextService.setPatient({
      id: p.id,
      name: `${p.firstName} ${p.lastName}`,
      role: 'PATIENT'
    });
    this.searchQuery = '';
    this.searchResults = [];
  }

  selectPatientById(id: number): void {
    const p = this.allPatients.find(x => x.id === id);
    if (p) this.selectPatient(p);
    else {
      this.patientApi.getById(id).subscribe({
        next: profile => this.selectPatient(profile)
      });
    }
  }

  clearPatient(): void {
    this.contextService.clear();
  }
}
