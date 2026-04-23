import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Appointment, AppointmentApiService } from '../appointments/appointment-api.service';
import { PatientProfile, PatientProfileService } from '../patient/patient-profile.service';
import { PatientContextService } from '../../core/patient-context.service';
import { AuthService } from '../../core/auth.service';
import { NotificationItem, NotificationsApiService } from '../notifications/notifications-api.service';
import { MedicalRecordsApiService, VitalRecord } from '../medical-records/medical-records-api.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, FullCalendarModule],
  template: `
    <div class="container clinical-bg">
      <header class="dashboard-header">
        <div class="header-left">
          <h1 class="page-title">Doctor's Command</h1>
          <p class="page-subtitle">Welcome back, Dr. {{ doctorName }}. You have {{ todayAppointments.length }} scheduled visits today.</p>
        </div>
        <div class="header-right">
           <button class="ph-btn" (click)="loadAppointments()"><i class="ph ph-arrows-clockwise"></i> Sync</button>
        </div>
      </header>

      <div class="doctor-grid">
        <!-- Center Pillar: Schedule -->
        <div class="schedule-column">
          <div class="card calendar-card">
            <div class="card-header">
              <h3><i class="ph ph-calendar"></i> Clinical Schedule</h3>
            </div>
            <div class="calendar-wrapper">
              <full-calendar [options]="calendarOptions"></full-calendar>
            </div>
          </div>
        </div>

        <!-- Right Pillar: Active Context & Tools -->
        <div class="tools-column">
          
          <!-- Active Patient Context Panel -->
          <div class="card context-card" *ngIf="activePatient$ | async as patient; else noPatient">
            <div class="context-header">
              <div class="avatar large">{{ patient.name.charAt(0) }}</div>
              <div class="context-info">
                <h3>{{ patient.name }}</h3>
                <div class="badge-row">
                  <span class="badge primary">Patient Active</span>
                  <span class="badge neutral">ID: #{{ patient.id }}</span>
                </div>
              </div>
              <button class="close-ctx" (click)="clearPatient()"><i class="ph ph-x"></i></button>
            </div>

            <div class="vitals-panel">
              <div class="panel-title">Latest Vitals</div>
              <div class="vitals-grid" *ngIf="latestVitals; else noVitals">
                <div class="vital-item">
                  <div class="vital-top"><i class="ph ph-thermometer red"></i> Temp</div>
                  <div class="vital-value">{{ latestVitals.temperature }}°C</div>
                </div>
                <div class="vital-item">
                  <div class="vital-top"><i class="ph ph-gauge blue"></i> BP</div>
                  <div class="vital-value">{{ latestVitals.bloodPressure }}</div>
                </div>
                <div class="vital-item">
                  <div class="vital-top"><i class="ph ph-heartbeat pink"></i> HR</div>
                  <div class="vital-value">{{ latestVitals.heartRate }} bpm</div>
                </div>
                <div class="vital-item">
                  <div class="vital-top"><i class="ph ph-wind teal"></i> SpO2</div>
                  <div class="vital-value">{{ latestVitals.spo2 }}%</div>
                </div>
              </div>
              <ng-template #noVitals>
                <div class="empty-state sm">No vitals recorded recently.</div>
              </ng-template>
            </div>

            <div class="context-actions">
              <button class="action-btn primary" routerLink="/doctor/records">
                <i class="ph ph-notebook"></i> View Patient Chart
              </button>
              <button class="action-btn secondary" routerLink="/doctor/lab">
                <i class="ph ph-test-tube"></i> Order Lab Test
              </button>
            </div>
          </div>

          <ng-template #noPatient>
            <div class="card empty-card">
              <i class="ph ph-identification-card icon-fade"></i>
              <p>No patient selected. Select a patient from your schedule to begin consultation.</p>
              <div class="search-mini">
                <i class="ph ph-magnifying-glass"></i>
                <input type="text" [(ngModel)]="searchQuery" (input)="onSearch()" placeholder="Find patient by name/ID..." />
                <ul class="mini-results" *ngIf="searchResults.length > 0">
                  <li *ngFor="let p of searchResults" (click)="selectPatient(p)">
                    {{ p.firstName }} {{ p.lastName }} <span>#{{ p.id }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </ng-template>

          <!-- Diagnostic Shortcuts -->
          <div class="card shortcuts-card">
            <h3>Quick Access</h3>
            <div class="shortcut-grid">
              <a routerLink="/doctor/pharmacy" class="sc-item"><i class="ph ph-pill"></i> Pharmacy</a>
              <a routerLink="/doctor/lab" class="sc-item"><i class="ph ph-microscope"></i> Labs</a>
              <a routerLink="/doctor/appointments" class="sc-item"><i class="ph ph-users-three"></i> All Patients</a>
            </div>
          </div>

          <!-- Alerts -->
          <div class="card alerts-card">
             <div class="header-split">
                <h3>Urgent Alerts</h3>
                <span class="badge red" *ngIf="recentNotifications.length > 0">{{ recentNotifications.length }} New</span>
             </div>
             <div class="alert-stack">
                <div class="alert-item" *ngFor="let n of recentNotifications" [class.urgent]="n.type === 'CRITICAL'">
                  <div class="alert-indicator"></div>
                  <div class="alert-msg">
                    <strong>{{ n.title }}</strong>
                    <span>{{ n.message }}</span>
                  </div>
                </div>
                <div class="empty-state sm" *ngIf="recentNotifications.length === 0">System stable. No new alerts.</div>
             </div>
          </div>
        </div>
      </div>

      <!-- Floating Action Button -->
      <button class="fab-btn" *ngIf="activePatient$ | async" (click)="writeNote()">
        <i class="ph ph-note-pencil"></i>
        <span>Write SOAP Note</span>
      </button>
    </div>
  `,
  styles: [`
    .clinical-bg { padding: 2rem; background: var(--bg); min-height: 100vh; }
    .dashboard-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
    .page-title { font-size: 1.75rem; color: var(--primary); font-weight: 800; }
    .page-subtitle { color: var(--text-muted); font-size: 0.95rem; margin-top: 0.25rem; }
    
    .ph-btn { background: var(--surface); border: 1px solid var(--border); padding: 0.5rem 1rem; border-radius: 8px; color: var(--text-soft); font-weight: 600; font-size: 0.85rem; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; transition: 0.2s; }
    .ph-btn:hover { border-color: var(--primary); color: var(--primary); }

    .doctor-grid { display: grid; grid-template-columns: 1fr 380px; gap: 2rem; }
    .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.5rem; box-shadow: var(--shadow-soft); margin-bottom: 1.5rem; }
    .card h3 { font-size: 0.9rem; font-weight: 700; color: var(--text); border-bottom: 1px solid var(--border); padding-bottom: 0.75rem; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; }

    /* Calendar Pillar */
    .calendar-card { padding: 1rem; }
    .calendar-wrapper { height: 750px; }
    ::ng-deep .fc { --fc-border-color: var(--border); --fc-today-bg-color: rgba(26, 60, 110, 0.05); font-family: inherit; }
    ::ng-deep .fc .fc-toolbar-title { font-size: 1.1rem; font-weight: 700; color: var(--primary); }
    ::ng-deep .fc .fc-button-primary { background: var(--surface); border: 1px solid var(--border); color: var(--text-soft); font-weight: 600; text-transform: capitalize; }
    ::ng-deep .fc .fc-button-primary:hover { background: var(--border); color: var(--primary); }
    ::ng-deep .fc .fc-button-active { background: var(--primary) !important; border-color: var(--primary) !important; color: #fff !important; }

    /* Context Card */
    .context-header { display: flex; gap: 1rem; align-items: center; position: relative; }
    .avatar.large { width: 56px; height: 56px; background: var(--primary); color: #fff; font-size: 1.5rem; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 800; }
    .context-info { flex: 1; }
    .context-info h3 { border: none; padding: 0; margin: 0; font-size: 1.1rem; }
    .badge-row { display: flex; gap: 0.5rem; margin-top: 0.25rem; }
    .close-ctx { position: absolute; right: -0.5rem; top: -0.5rem; background: transparent; border: none; color: var(--text-muted); cursor: pointer; padding: 0.5rem; }
    .close-ctx:hover { color: var(--error); }

    .vitals-panel { margin-top: 1.5rem; background: var(--surface-soft); border: 1px solid var(--border); border-radius: 8px; padding: 1rem; }
    .panel-title { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.75rem; letter-spacing: 0.05em; }
    .vitals-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .vital-item { display: flex; flex-direction: column; gap: 0.25rem; }
    .vital-top { font-size: 0.7rem; font-weight: 600; color: var(--text-soft); display: flex; align-items: center; gap: 0.3rem; }
    .vital-value { font-weight: 700; color: var(--text); font-size: 1rem; }
    .ph.red { color: var(--error); }
    .ph.blue { color: var(--primary); }
    .ph.pink { color: #DB2777; }
    .ph.teal { color: var(--accent); }

    .context-actions { display: grid; gap: 0.75rem; margin-top: 1.5rem; }
    .action-btn { display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem; border-radius: 8px; font-weight: 700; font-size: 0.85rem; border: none; cursor: pointer; transition: 0.2s; }
    .action-btn.primary { background: var(--primary); color: #fff; }
    .action-btn.primary:hover { background: var(--primary-strong); transform: translateY(-1px); }
    .action-btn.secondary { background: var(--surface-strong); color: var(--primary); }
    .action-btn.secondary:hover { background: var(--border); }

    /* Empty Card & Search Mini */
    .empty-card { text-align: center; padding: 3rem 1.5rem; color: var(--text-muted); }
    .icon-fade { font-size: 3rem; opacity: 0.2; margin-bottom: 1rem; display: block; }
    .empty-card p { font-size: 0.85rem; line-height: 1.5; margin-bottom: 1.5rem; }
    .search-mini { position: relative; background: var(--surface-soft); border: 1px solid var(--border); border-radius: 8px; display: flex; align-items: center; padding: 0 0.75rem; }
    .search-mini input { border: none; background: transparent; padding: 0.75rem; font-size: 0.85rem; flex: 1; color: var(--text); }
    .search-mini input:focus { outline: none; }
    .mini-results { position: absolute; top: 100%; left: 0; width: 100%; background: var(--surface); border: 1px solid var(--border); border-radius: 0 0 8px 8px; list-style: none; padding: 0; z-index: 10; shadow: var(--shadow-strong); }
    .mini-results li { padding: 0.6rem 0.75rem; font-size: 0.85rem; border-bottom: 1px solid var(--border); cursor: pointer; text-align: left; }
    .mini-results li:hover { background: var(--surface-soft); color: var(--primary); }
    .mini-results li span { font-size: 0.7rem; opacity: 0.6; margin-left: 0.5rem; }

    .shortcut-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .sc-item { text-decoration: none; font-size: 0.75rem; font-weight: 700; color: var(--text-soft); background: var(--surface-soft); border: 1px solid var(--border); padding: 0.4rem 0.75rem; border-radius: 6px; display: flex; align-items: center; gap: 0.4rem; transition: 0.2s; }
    .sc-item:hover { border-color: var(--primary); color: var(--primary); }

    .header-split { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 0.75rem; margin-bottom: 1rem; }
    .header-split h3 { border: none; margin: 0; padding: 0; }
    .badge { font-size: 0.65rem; font-weight: 800; padding: 0.2rem 0.5rem; border-radius: 4px; text-transform: uppercase; }
    .badge.red { background: rgba(220, 38, 38, 0.1); color: var(--error); border: 1px solid rgba(220, 38, 38, 0.2); }
    .badge.primary { background: rgba(26, 60, 110, 0.1); color: var(--primary); border: 1px solid rgba(26, 60, 110, 0.2); }
    .badge.neutral { background: var(--surface-strong); color: var(--text-muted); border: 1px solid var(--border); }

    .alert-stack { display: grid; gap: 0.75rem; }
    .alert-item { display: flex; gap: 0.75rem; padding: 0.5rem; border-radius: 6px; transition: 0.2s; }
    .alert-item:hover { background: var(--surface-soft); }
    .alert-indicator { width: 6px; height: 6px; border-radius: 50%; background: var(--primary); margin-top: 0.4rem; flex-shrink: 0; }
    .urgent .alert-indicator { background: var(--error); box-shadow: 0 0 8px var(--error); }
    .alert-msg { display: flex; flex-direction: column; }
    .alert-msg strong { font-size: 0.85rem; color: var(--text); }
    .alert-msg span { font-size: 0.72rem; color: var(--text-muted); line-height: 1.4; }

    .fab-btn { position: fixed; bottom: 2rem; right: 2rem; background: var(--primary); color: #fff; border: none; border-radius: 999px; padding: 1rem 1.5rem; display: flex; align-items: center; gap: 0.75rem; font-weight: 800; box-shadow: 0 10px 30px var(--primary-glow); cursor: pointer; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); z-index: 1000; }
    .fab-btn:hover { transform: scale(1.05) translateY(-5px); box-shadow: 0 15px 40px var(--primary-glow); background: var(--primary-strong); }
    .fab-btn i { font-size: 1.5rem; }

    @media (max-width: 1200px) { .doctor-grid { grid-template-columns: 1fr; } .tools-column { order: -1; } .large { grid-column: auto; } }
  `]
})
export class DoctorDashboardComponent implements OnInit, OnDestroy {
  doctorName = '';
  todayAppointments: Appointment[] = [];
  searchQuery = '';
  allPatients: PatientProfile[] = [];
  searchResults: PatientProfile[] = [];
  recentNotifications: NotificationItem[] = [];
  activePatient$ = this.contextService.activePatient$;
  latestVitals: VitalRecord | null = null;
  
  private subs = new Subscription();

  // FullCalendar Options
  calendarOptions: any = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'timeGridDay',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'timeGridDay,timeGridWeek'
    },
    selectable: true,
    slotMinTime: '08:00:00',
    slotMaxTime: '20:00:00',
    height: 'auto',
    allDaySlot: false,
    eventClick: (info: any) => this.selectPatientById(info.event.extendedProps.patientId),
    events: []
  };

  constructor(
    private appointmentApi: AppointmentApiService,
    private patientApi: PatientProfileService,
    private contextService: PatientContextService,
    private auth: AuthService,
    private notificationApi: NotificationsApiService,
    private medicalApi: MedicalRecordsApiService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.doctorName = this.auth.getUsername() || 'Doctor';
    const userId = this.auth.getUserId();

    this.loadAppointments();
    this.loadAllPatients();
    if (userId) {
      this.loadRecentNotifications(userId);
    }

    this.subs.add(
      this.activePatient$.subscribe(patient => {
        if (patient) {
          this.loadPatientVitals(patient.id);
        } else {
          this.latestVitals = null;
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  loadAppointments(): void {
    const today = new Date().toISOString().slice(0, 10);
    this.appointmentApi.list().subscribe({
      next: items => {
        this.todayAppointments = items.filter(item => item.appointmentDate === today);
        
        // Map to Calendar Events
        this.calendarOptions.events = items.map(appt => ({
          id: String(appt.id),
          title: `Appt: #${appt.patientId}`,
          start: `${appt.appointmentDate}T${appt.appointmentTime}`,
          end: `${appt.appointmentDate}T${this.addMinutes(appt.appointmentTime, 30)}`,
          backgroundColor: appt.status === 'COMPLETED' ? '#0D7E6A' : '#1A3C6E',
          borderColor: 'transparent',
          extendedProps: { patientId: appt.patientId }
        }));
      }
    });
  }

  private addMinutes(time: string, mins: number): string {
    const [h, m] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m + mins);
    return date.toTimeString().slice(0, 5);
  }

  loadPatientVitals(patientId: number): void {
    this.medicalApi.getVitals(patientId).subscribe({
      next: vitals => {
        if (vitals.length > 0) {
          this.latestVitals = vitals.sort((a, b) => 
            new Date(b.recordedAt!).getTime() - new Date(a.recordedAt!).getTime()
          )[0];
        }
      }
    });
  }

  loadRecentNotifications(userId: number): void {
    this.notificationApi.getMyNotifications(userId, {}).subscribe({
      next: items => {
        this.recentNotifications = items.filter(i => !i.read).slice(0, 5);
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
    if (p.id !== undefined) {
      this.contextService.setPatient({
        id: p.id,
        name: `${p.firstName} ${p.lastName}`,
        role: 'PATIENT'
      });
    }
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

  writeNote(): void {
    this.router.navigate(['/doctor/records']);
  }
}

