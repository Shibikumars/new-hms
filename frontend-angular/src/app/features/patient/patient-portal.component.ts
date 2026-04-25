import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { Appointment, AppointmentApiService } from '../appointments/appointment-api.service';
import { NotificationItem, NotificationsApiService } from '../notifications/notifications-api.service';
import { PharmacyApiService, Prescription } from '../pharmacy/pharmacy-api.service';
import { LabApiService, LabReport } from '../lab/lab-api.service';
import { MedicalRecordsApiService, VisitNote } from '../medical-records/medical-records-api.service';
import { PatientProfileService } from './patient-profile.service';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-patient-portal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="container clinical-bg">
      <!-- Incomplete Profile Banner -->
      <div class="profile-alert-banner" *ngIf="showProfilePrompt">
        <div class="banner-inner">
          <i class="ph ph-warning-circle"></i>
          <p><strong>Profile Incomplete:</strong> Please provide your demographic details to enable full clinical functionality.</p>
          <button class="ph-btn primary sm" routerLink="/patient/complete-profile">Complete Now</button>
        </div>
      </div>

      <header class="dashboard-header">
        <div class="header-left">
          <h1 class="page-title">Patient Portal</h1>
          <p class="page-subtitle">Your personalized clinical hub. Track your appointments, meds, and labs.</p>
        </div>
        <div class="header-right">
          <button class="ph-btn" routerLink="/patient/appointments"><i class="ph ph-plus-circle"></i> Book Appointment</button>
        </div>
      </header>

      <div class="portal-grid">
        <!-- Main Content Pillar -->
        <div class="main-column">
          
          <!-- Key Metrics -->
          <div class="metrics-row">
            <div class="metric-card">
              <div class="metric-icon blue"><i class="ph ph-calendar"></i></div>
              <div class="metric-data">
                <span class="metric-label">Next Visit</span>
                <div class="metric-value">{{ appointments[0]?.appointmentDate || '--' }}</div>
                <span class="metric-meta">{{ appointments[0]?.appointmentTime || '--' }}</span>
              </div>
            </div>
            <div class="metric-card">
              <div class="metric-icon teal"><i class="ph ph-test-tube"></i></div>
              <div class="metric-data">
                <span class="metric-label">Active Labs</span>
                <div class="metric-value">{{ recentLabs.length }}</div>
                <span class="metric-meta">Pending Review</span>
              </div>
            </div>
            <div class="metric-card">
              <div class="metric-icon amber"><i class="ph ph-pill"></i></div>
              <div class="metric-data">
                <span class="metric-label">Active Meds</span>
                <div class="metric-value">{{ prescriptions.length }}</div>
                <span class="metric-meta">Per Prescription</span>
              </div>
            </div>
          </div>

          <!-- Medication Timeline -->
          <div class="card timeline-card">
            <div class="card-header">
              <h3><i class="ph ph-clock-countdown"></i> Medication Timeline</h3>
              <span class="badge neutral">Today's Schedule</span>
            </div>
            <div class="timeline-body">
              <div class="empty-state sm" *ngIf="prescriptions.length === 0">No active medications scheduled.</div>
              <div class="timeline-list" *ngIf="prescriptions.length > 0">
                <div class="timeline-item" *ngFor="let p of prescriptions | slice:0:4">
                  <div class="tm-marker"></div>
                  <div class="tm-content">
                    <div class="tm-header">
                      <strong>{{ p.medicationName }}</strong>
                      <span class="tm-time">{{ p.frequency }}</span>
                    </div>
                    <div class="tm-sub">{{ p.dose }} · {{ p.instructions }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Visit Summary -->
          <div class="card visit-card">
            <div class="card-header">
              <h3><i class="ph ph-stethoscope"></i> Recent Visit Summary</h3>
              <a routerLink="/patient/records" class="view-all">Full History</a>
            </div>
            <div class="visit-body" *ngIf="recentVisit; else noVisit">
              <div class="visit-meta">
                <div class="visit-date">
                  <i class="ph ph-calendar-blank"></i>
                  {{ recentVisit.visitDate }}
                </div>
                <div class="visit-doctor">
                  <i class="ph ph-user-focus"></i>
                  Consultant ID #{{ recentVisit.doctorId }}
                </div>
              </div>
              <div class="visit-summary">
                <strong>Progress Note Abstract:</strong>
                <p>{{ recentVisit.assessment || 'Patient stable. No new issues reported during the last consultation.' | slice:0:180 }}...</p>
              </div>
              <div class="visit-footer">
                <span class="badge primary">Code: {{ recentVisit.diagnosisCode || 'V70.0' }}</span>
                <button class="ph-btn sm" (click)="downloadSummary(recentVisit.id)"><i class="ph ph-file-pdf"></i> Download PDF</button>
              </div>
            </div>
            <ng-template #noVisit>
                <div class="empty-state sm">No recent clinical visits found in system.</div>
            </ng-template>
          </div>
        </div>

        <!-- Sidebar Pillar -->
        <div class="side-column">
          
          <!-- Alerts -->
          <div class="card alerts-card">
            <div class="card-header">
              <h3>Urgent Alerts</h3>
              <span class="badge red" *ngIf="recentNotifications.length > 0">New</span>
            </div>
            <div class="alert-list">
              <div class="alert-item" *ngFor="let n of recentNotifications" [class.urgent]="n.type === 'CRITICAL'">
                <div class="alert-icon">
                  <i class="ph ph-bell-simple-ringing" *ngIf="n.type === 'CRITICAL'"></i>
                  <i class="ph ph-bell-simple" *ngIf="n.type !== 'CRITICAL'"></i>
                </div>
                <div class="alert-msg">
                  <strong>{{ n.title }}</strong>
                  <p>{{ n.message }}</p>
                </div>
              </div>
              <div class="empty-state sm" *ngIf="recentNotifications.length === 0">Your health journey looks clear.</div>
            </div>
          </div>

          <!-- Quick Access -->
          <div class="card quick-card">
            <h3>Diagnostic Shortcuts</h3>
            <div class="quick-grid">
              <a routerLink="/patient/records" class="quick-link">
                <div class="ql-icon"><i class="ph ph-folders"></i></div>
                <span>Chart</span>
              </a>
              <a routerLink="/patient/lab" class="quick-link">
                <div class="ql-icon"><i class="ph ph-test-tube"></i></div>
                <span>Labs</span>
              </a>
              <a routerLink="/patient/pharmacy" class="quick-link">
                <div class="ql-icon"><i class="ph ph-pill"></i></div>
                <span>Meds</span>
              </a>
              <a routerLink="/patient/billing" class="quick-link">
                <div class="ql-icon"><i class="ph ph-wallet"></i></div>
                <span>Bills</span>
              </a>
            </div>
          </div>

          <!-- Help Widget -->
          <div class="help-card">
            <div class="help-icon"><i class="ph ph-first-aid-kit"></i></div>
            <h4>Emergency Contact</h4>
            <p>If you need urgent assistance, please contact your local facility or dial 911.</p>
            <div class="help-tel">Facilty: +91 98765 43210</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .clinical-bg { padding: 2rem; background: var(--bg); min-height: 100vh; }
    .dashboard-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
    .page-title { font-size: 1.75rem; color: var(--primary); font-weight: 800; }
    .page-subtitle { color: var(--text-muted); font-size: 0.95rem; margin-top: 0.25rem; }
    
    .ph-btn { background: var(--surface); border: 1px solid var(--border); padding: 0.6rem 1.25rem; border-radius: 999px; color: var(--text-soft); font-weight: 700; font-size: 0.85rem; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; transition: 0.2s; text-decoration: none; }
    .ph-btn:hover { border-color: var(--primary); color: var(--primary); transform: translateY(-1px); }
    .ph-btn.sm { padding: 0.4rem 0.8rem; font-size: 0.75rem; }

    .portal-grid { display: grid; grid-template-columns: 1fr 340px; gap: 2rem; }
    
    .metrics-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2rem; }
    .metric-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.25rem; display: flex; gap: 1rem; box-shadow: var(--shadow-soft); }
    .metric-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; flex-shrink: 0; }
    .metric-icon.blue { background: rgba(26, 60, 110, 0.08); color: var(--primary); }
    .metric-icon.teal { background: rgba(13, 126, 106, 0.08); color: var(--accent); }
    .metric-icon.amber { background: rgba(217, 119, 6, 0.08); color: var(--warning); }
    .metric-data { display: flex; flex-direction: column; }
    .metric-label { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .metric-value { font-size: 1.25rem; font-weight: 800; color: var(--text); font-family: 'Syne', sans-serif; margin: 0.1rem 0; }
    .metric-meta { font-size: 0.75rem; color: var(--text-soft); }

    .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.5rem; box-shadow: var(--shadow-soft); margin-bottom: 1.5rem; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .card-header h3 { font-size: 0.9rem; font-weight: 700; color: var(--text); display: flex; align-items: center; gap: 0.5rem; }
    .view-all { font-size: 0.75rem; color: var(--primary); font-weight: 700; text-decoration: none; }

    /* Timeline */
    .timeline-list { display: grid; gap: 1.25rem; border-left: 2px solid var(--border); margin-left: 0.5rem; padding-left: 1.5rem; }
    .timeline-item { position: relative; }
    .tm-marker { position: absolute; left: -1.825rem; top: 0.25rem; width: 10px; height: 10px; border-radius: 50%; background: var(--primary); border: 2px solid #fff; box-shadow: 0 0 0 4px rgba(26,60,110,0.1); }
    .tm-header { display: flex; justify-content: space-between; align-items: baseline; }
    .tm-header strong { font-size: 0.95rem; color: var(--text); }
    .tm-time { font-size: 0.75rem; font-weight: 800; color: var(--primary); background: rgba(26,60,110,0.05); padding: 0.15rem 0.4rem; border-radius: 4px; }
    .tm-sub { font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem; }

    /* Visit Card */
    .visit-meta { display: flex; gap: 1.5rem; margin-bottom: 1.25rem; }
    .visit-date, .visit-doctor { display: flex; align-items: center; gap: 0.4rem; font-size: 0.75rem; font-weight: 700; color: var(--text-soft); }
    .visit-date i, .visit-doctor i { color: var(--primary); font-size: 1rem; }
    .visit-summary { background: var(--surface-soft); padding: 1rem; border-radius: 8px; border-left: 4px solid var(--primary); margin-bottom: 1.25rem; }
    .visit-summary strong { display: block; font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.4rem; }
    .visit-summary p { font-size: 0.85rem; line-height: 1.6; color: var(--text); }
    .visit-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); padding-top: 1rem; }

    /* Sidebar Components */
    .alert-list { display: grid; gap: 1rem; }
    .alert-item { display: flex; gap: 0.75rem; padding: 0.5rem; border-radius: 8px; }
    .alert-icon { font-size: 1.25rem; color: var(--primary); flex-shrink: 0; }
    .urgent .alert-icon { color: var(--error); animation: shake 1s ease-in-out infinite; }
    .alert-msg strong { display: block; font-size: 0.85rem; color: var(--text); }
    .alert-msg p { font-size: 0.72rem; color: var(--text-soft); line-height: 1.4; margin-top: 0.1rem; }

    .quick-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
    .quick-link { text-decoration: none; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 1rem; background: var(--surface-soft); border: 1px solid var(--border); border-radius: 12px; transition: 0.2s; }
    .quick-link span { font-size: 0.75rem; font-weight: 700; color: var(--text-soft); }
    .ql-icon { font-size: 1.5rem; color: var(--primary); }
    .quick-link:hover { transform: translateY(-2px); border-color: var(--primary); background: #fff; box-shadow: var(--shadow-strong); }
    .quick-link:hover span { color: var(--primary); }

    .help-card { background: var(--primary); border-radius: var(--radius-md); padding: 1.5rem; color: #fff; text-align: center; }
    .help-icon { font-size: 2rem; margin-bottom: 0.75rem; }
    .help-card h4 { font-size: 1rem; font-weight: 800; margin-bottom: 0.5rem; }
    .help-card p { font-size: 0.75rem; opacity: 0.9; line-height: 1.5; margin-bottom: 1rem; }
    .help-tel { font-weight: 800; font-family: 'Syne', sans-serif; font-size: 1rem; background: rgba(255,255,255,0.1); padding: 0.5rem; border-radius: 8px; }

    .badge { font-size: 0.65rem; font-weight: 800; padding: 0.15rem 0.5rem; border-radius: 4px; text-transform: uppercase; }
    .badge.red { background: rgba(220, 38, 38, 0.1); color: var(--error); border: 1px solid rgba(220, 38, 38, 0.2); }
    .badge.primary { background: rgba(26, 60, 110, 0.1); color: var(--primary); border: 1px solid rgba(26, 60, 110, 0.2); }
    .badge.neutral { background: var(--surface-strong); color: var(--text-muted); border: 1px solid var(--border); }
    .empty-state { text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 1rem 0; }

    .profile-alert-banner { background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 0.75rem 1.25rem; margin-bottom: 1.5rem; }
    .banner-inner { display: flex; align-items: center; gap: 1rem; color: #92400e; font-size: 0.88rem; }
    .banner-inner i { font-size: 1.25rem; }
    .banner-inner p { flex: 1; margin: 0; }

    @keyframes shake { 0%, 100% { transform: rotate(0); } 20% { transform: rotate(-10deg); } 40% { transform: rotate(10deg); } 60% { transform: rotate(-5deg); } 80% { transform: rotate(5deg); } }
    @media (max-width: 1024px) { .portal-grid { grid-template-columns: 1fr; } .metrics-row { grid-template-columns: 1fr; } }
  `]
})
export class PatientPortalComponent implements OnInit {
  appointments: Appointment[] = [];
  prescriptions: Prescription[] = [];
  recentLabs: LabReport[] = [];
  recentVisit: VisitNote | null = null;
  recentNotifications: NotificationItem[] = [];
  showProfilePrompt = false;

  constructor(
    private appointmentApi: AppointmentApiService,
    private authService: AuthService,
    private notificationApi: NotificationsApiService,
    private pharmacyApi: PharmacyApiService,
    private labApi: LabApiService,
    private medicalApi: MedicalRecordsApiService,
    private patientApi: PatientProfileService
  ) {}

  ngOnInit(): void {
    const userId = this.authService.getUserId();
    if (userId) {
      this.checkProfile(userId);
      this.loadUpcoming(userId);
      this.loadRecentNotifications(userId);
      this.loadPrescriptions(userId);
      this.loadLabs(userId);
      this.loadVisitHistory(userId);
    }
  }

  checkProfile(userId: number): void {
    // Try API first, fallback to localStorage
    this.patientApi.getById(userId).pipe(
      catchError((err) => {
        // Fallback to localStorage when API fails
        const patients = JSON.parse(localStorage.getItem('patients') || '[]');
        const patientProfile = patients.find((p: any) => p.userId === userId);
        
        if (!patientProfile || !patientProfile.firstName) {
          this.showProfilePrompt = true;
        } else {
          this.showProfilePrompt = false;
        }
        
        return of(null);
      })
    ).subscribe({
      next: (profile: any) => {
        if (profile) {
          this.showProfilePrompt = !profile.firstName;
        }
      }
    });
  }

  loadUpcoming(patientId: number): void {
    this.appointmentApi.listUpcomingByPatientId(patientId).pipe(
      catchError(() => {
        // Fallback to localStorage
        const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
        const patientAppointments = appointments.filter((a: any) => a.patientId === patientId);
        this.appointments = patientAppointments;
        return of([]);
      })
    ).subscribe(items => {
      if (items && items.length > 0) {
        this.appointments = items;
      }
    });
  }

  loadPrescriptions(patientId: number): void {
    this.pharmacyApi.getPatientPrescriptions(patientId).pipe(
      catchError(() => {
        // Fallback to localStorage
        const prescriptions = JSON.parse(localStorage.getItem('prescriptions') || '[]');
        const patientPrescriptions = prescriptions.filter((p: any) => p.patientId === patientId);
        this.prescriptions = patientPrescriptions.filter((p: any) => p.status === 'ACTIVE' || p.status === 'ISSUED');
        return of([]);
      })
    ).subscribe(items => {
      if (items && items.length > 0) {
        this.prescriptions = items.filter(p => p.status === 'ACTIVE' || p.status === 'ISSUED');
      }
    });
  }

  loadLabs(patientId: number): void {
    this.labApi.getPatientResults(patientId).pipe(
      catchError(() => {
        // Fallback to localStorage
        const labReports = JSON.parse(localStorage.getItem('labReports') || '[]');
        const patientLabs = labReports.filter((r: any) => r.patientId === patientId);
        this.recentLabs = patientLabs.filter((i: any) => i.status !== 'VERIFIED');
        return of([]);
      })
    ).subscribe(items => {
      if (items && items.length > 0) {
        this.recentLabs = items.filter(i => i.status !== 'VERIFIED');
      }
    });
  }

  loadVisitHistory(patientId: number): void {
    this.medicalApi.getVisits(patientId).subscribe({
      next: items => {
        if (items.length > 0) {
          this.recentVisit = items.sort((a, b) => 
            new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
          )[0];
        }
      }
    });
  }

  loadRecentNotifications(userId: number): void {
    this.notificationApi.getMyNotifications(userId, {}).subscribe({
      next: items => {
        this.recentNotifications = items.filter(i => !i.read).slice(0, 3);
      }
    });
  }

  downloadSummary(visitId: number): void {
    this.medicalApi.downloadVisitPdf(visitId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `visit_summary_${visitId}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      }
    });
  }
}
