import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { Appointment, AppointmentApiService, DoctorOption, TimeSlot } from './appointment-api.service';
import { AuthService } from '../../core/auth.service';
import { PatientContextService } from '../../core/patient-context.service';

@Component({
  selector: 'app-appointment-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="container clinical-container">
      <div class="header-band glass">
        <div class="title-group">
          <h2>{{ role === 'PATIENT' ? 'Patient Access Center' : 'Clinical Appointment Workspace' }}</h2>
          <p class="subtitle">{{ role === 'PATIENT' ? 'Search specialists and manage your health schedule' : 'High-efficiency daily agenda and workflow management' }}</p>
        </div>
        <div class="global-actions">
           <div class="status-indicator">
              <span class="pulse"></span>
              {{ role }} Session Secure
           </div>
           <button class="logout-pill" (click)="logout()">Terminate Session</button>
        </div>
      </div>

      <div class="error-msg" *ngIf="error" role="alert">{{ error }}</div>

      <!-- DOCTOR VIEW -->
      <div class="dr-workspace" *ngIf="role !== 'PATIENT'">
         <div class="workflow-grid">
            <!-- Sidebar: Agenda View -->
            <div class="agenda-sidebar card shadow-glass">
               <div class="section-header">
                  <h3>Daily Schedule Agenda</h3>
                  <button class="refresh-pill" (click)="refresh()">Sync API</button>
               </div>

               <div class="daily-timeline custom-scroll">
                  <div class="empty-agenda" *ngIf="appointments.length === 0">No appointments scheduled for today.</div>
                  
                  <div class="agenda-item" *ngFor="let item of appointments" [class.active-slot]="item.id === activeAppointmentId">
                     <div class="agenda-time">
                        {{ item.appointmentTime.slice(0,5) }}
                     </div>
                     <div class="agenda-card" (click)="activeAppointmentId = item.id">
                        <div class="patient-line">
                           <strong>Patient ID #{{ item.patientId }}</strong>
                           <span class="status-dot" [class.waiting]="item.status === 'SCHEDULED'"></span>
                        </div>
                        <div class="complaint-preview" *ngIf="item.chiefComplaint">
                           "{{ item.chiefComplaint }}"
                        </div>
                        <div class="actions-row">
                           <button class="mini-btn primary" (click)="beginSession(item)">Begin Session</button>
                           <span class="type-badge">OPD</span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <!-- Main Panel: Workflow & Selected Appointment Details -->
            <div class="workflow-panel">
               <div class="card shadow-glass empty-panel" *ngIf="!selectedForAction">
                  <div class="placeholder-icon">📋</div>
                  <h4>Select an appointment to view clinical details</h4>
                  <p>Identify patient readiness and synchronize records from the side agenda.</p>
               </div>

               <div class="card shadow-glass flow-active" *ngIf="selectedForAction">
                  <div class="visit-header">
                     <span class="p-id">MRN #{{ selectedForAction.patientId }}</span>
                     <h3>Appointment Detail — #{{ selectedForAction.id }}</h3>
                     <span class="v-status">{{ selectedForAction.status }}</span>
                  </div>

                  <div class="clinical-preview">
                     <div class="vital-snip">
                        <label>Vitals Status</label>
                        <div class="snip-box ready">READY</div>
                     </div>
                     <div class="reason-snip">
                        <label>Chief Complaint</label>
                        <p>{{ selectedForAction.chiefComplaint || 'No specific complaint documented' }}</p>
                     </div>
                  </div>

                  <div class="workflow-actions">
                     <div class="action-card" (click)="beginSession(selectedForAction)">
                        <div class="icon">🏥</div>
                        <div class="txt">
                           <strong>Sync Clinical Context</strong>
                           <span class="small">Auto-open EMR, Lab & Pharmacy for this patient.</span>
                        </div>
                     </div>
                     <div class="action-card muted">
                        <div class="icon">✅</div>
                        <div class="txt">
                           <strong>Mark as Completed</strong>
                           <span class="small">Move visit to billing and checkout phase.</span>
                        </div>
                     </div>
                  </div>
               </div>

               <div class="manual-book-mini card shadow-glass" *ngIf="role === 'ADMIN'">
                   <h3>Administrative Booking</h3>
                   <form [formGroup]="form" (ngSubmit)="book()" class="mini-form">
                      <input type="number" formControlName="patientId" placeholder="Patient ID" />
                      <input type="date" formControlName="appointmentDate" />
                      <input type="time" formControlName="appointmentTime" />
                      <button type="submit" [disabled]="form.invalid">Quick Book</button>
                   </form>
               </div>
            </div>
         </div>
      </div>

      <!-- PATIENT VIEW -->
      <div class="pt-workspace" *ngIf="role === 'PATIENT'">
        <div class="booking-flow">
          <section class="card shadow-glass search-area">
            <h3>1 · Specialist Selection</h3>
            <div class="search-box">
               <input type="text" [value]="searchTerm" (input)="onSearchInput($event)" placeholder="Search doctors or specialty..." />
            </div>

            <div class="filter-chips">
               <button class="chip" [class.active]="activeSpecialty === ''" (click)="selectSpecialty('')">Universal</button>
               <button class="chip" *ngFor="let s of specialties" [class.active]="activeSpecialty === s" (click)="selectSpecialty(s)">{{ s }}</button>
            </div>

            <div class="dr-list custom-scroll">
               <div class="dr-row" *ngFor="let dr of doctors" [class.chosen]="selectedDoctor?.id === dr.id" (click)="selectDoctor(dr)">
                  <div class="dr-main">
                     <strong>{{ dr.fullName }}</strong>
                     <span class="dr-sub">{{ dr.specialization }}</span>
                  </div>
                  <div class="avail">{{ dr.availability }}</div>
               </div>
            </div>
          </section>

          <section class="card shadow-glass time-area" [formGroup]="form">
            <h3>2 · Temporal Preference</h3>
            
            <div class="date-pick">
               <label>Consultation Date</label>
               <input type="date" formControlName="appointmentDate" (change)="loadSlots()" />
            </div>

            <div class="slot-container" *ngIf="slots.length > 0">
               <button type="button" class="slot-btn" *ngFor="let slot of slots" 
                  [disabled]="slot.status === 'BOOKED'" 
                  [class.booked]="slot.status === 'BOOKED'" 
                  [class.selected]="selectedSlot === slot.time" 
                  (click)="selectSlot(slot.time)">
                  {{ slot.time.slice(0, 5) }}
               </button>
            </div>
            <div class="no-slots" *ngIf="slots.length === 0 && form.controls.appointmentDate.value">No availability for selected date.</div>

            <div class="complaint-box">
               <label>Reason for Consultation</label>
               <textarea formControlName="chiefComplaint" rows="2" placeholder="Briefly describe your symptoms..."></textarea>
            </div>

            <button class="primary-action" (click)="bookWithSelectedSlot()" [disabled]="!canBookWithSlot()">
               Confirm & Schedule Appointment
            </button>
          </section>
        </div>

        <section class="upcoming-history card shadow-glass">
            <h3>My Health Schedule</h3>
            <div class="pt-apt-grid">
               <div class="apt-tile" *ngFor="let apt of appointments" [class.confirmed]="apt.status === 'SCHEDULED'">
                  <div class="tile-date">{{ apt.appointmentDate }} @ {{ apt.appointmentTime }}</div>
                  <div class="tile-meta">Doctor Reference #{{ apt.doctorId }}</div>
                  <div class="tile-status">{{ apt.status }}</div>
               </div>
               <div class="empty-state" *ngIf="appointments.length === 0">No upcoming visits scheduled.</div>
            </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .clinical-container { padding-bottom: 3rem; }
    .header-band { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-radius: 16px; margin-bottom: 2rem; border: 1px solid var(--border); }
    .subtitle { margin-top: 0.4rem; color: var(--text-soft); }
    .global-actions { display: flex; items-align: center; gap: 1.5rem; }
    .status-indicator { display: flex; align-items: center; gap: 0.6rem; font-size: 0.8rem; font-weight: 700; color: var(--primary); text-transform: uppercase; }
    .pulse { width: 8px; height: 8px; background: var(--primary); border-radius: 50%; box-shadow: 0 0 8px var(--primary); animation: glow 1.5s infinite; }
    @keyframes glow { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
    .logout-pill { background: rgba(255, 90, 114, 0.1); color: #ff9ca9; border: 1px solid rgba(255, 90, 114, 0.3); padding: 0.4rem 0.8rem; border-radius: 99px; cursor: pointer; }

    .shadow-glass { background: rgba(26, 39, 64, 0.55); backdrop-filter: blur(15px); border: 1px solid var(--border); border-radius: 20px; padding: 1.5rem; }
    .card h3 { font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 1.5rem; }

    /* Doctor Workspace */
    .workflow-grid { display: grid; grid-template-columns: 380px 1fr; gap: 1.5rem; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .refresh-pill { font-size: 0.7rem; background: transparent; border: 1px solid var(--border); color: var(--text-soft); padding: 0.2rem 0.6rem; border-radius: 6px; cursor: pointer; }
    
    .daily-timeline { max-height: 700px; overflow-y: auto; padding-right: 0.5rem; }
    .agenda-item { display: flex; gap: 1rem; margin-bottom: 1.2rem; }
    .agenda-time { font-family: monospace; font-weight: 700; color: var(--primary); padding-top: 0.5rem; }
    .agenda-card { flex: 1; background: rgba(11, 18, 32, 0.4); border: 1px solid var(--border); border-radius: 12px; padding: 1rem; cursor: pointer; transition: 0.2s; }
    .agenda-card:hover { border-color: var(--primary); transform: translateX(4px); }
    .agenda-item.active-slot .agenda-card { border-color: var(--primary); background: rgba(0, 212, 170, 0.05); }
    .patient-line { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #555; }
    .status-dot.waiting { background: #ff9ca9; box-shadow: 0 0 5px #ff9ca9; }
    .complaint-preview { font-size: 0.82rem; color: var(--text-soft); font-style: italic; margin-bottom: 0.8rem; }
    .actions-row { display: flex; justify-content: space-between; align-items: center; }
    .mini-btn { font-size: 0.75rem; font-weight: 800; border: none; padding: 0.3rem 0.7rem; border-radius: 6px; cursor: pointer; }
    .mini-btn.primary { background: var(--primary); color: #000; }
    .type-badge { font-size: 0.65rem; color: var(--text-muted); border: 1px solid var(--border); padding: 0.1rem 0.4rem; border-radius: 4px; }

    .workflow-panel { display: flex; flex-direction: column; gap: 1.5rem; }
    .empty-panel { text-align: center; padding: 4rem; display: flex; flex-direction: column; align-items: center; }
    .placeholder-icon { font-size: 4rem; margin-bottom: 1rem; opacity: 0.3; }
    
    .visit-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; border-bottom: 1px solid var(--border); padding-bottom: 1rem; }
    .p-id { font-family: monospace; color: var(--primary); font-weight: 700; }
    .v-status { background: rgba(109, 124, 255, 0.1); border: 1px solid var(--accent); color: var(--accent); padding: 0.25rem 0.75rem; border-radius: 99px; font-size: 0.75rem; font-weight: 800; }

    .clinical-preview { display: grid; grid-template-columns: 1fr 2fr; gap: 2rem; margin-bottom: 2.5rem; }
    .vital-snip label, .reason-snip label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.5rem; display: block; }
    .snip-box { padding: 1.5rem; border: 1px solid var(--border); border-radius: 12px; background: rgba(0,0,0,0.2); text-align: center; font-weight: 800; }
    .snip-box.ready { color: #80e8a6; border-color: rgba(34, 197, 94, 0.3); }

    .workflow-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .action-card { padding: 1.5rem; background: rgba(11, 18, 32, 0.6); border: 1px solid var(--border); border-radius: 16px; display: flex; gap: 1.2rem; cursor: pointer; transition: 0.2s; }
    .action-card:hover { border-color: var(--primary); background: rgba(0, 212, 170, 0.05); transform: translateY(-3px); }
    .action-card.muted { opacity: 0.5; cursor: not-allowed; }
    .action-card .icon { font-size: 2rem; }
    .action-card .txt strong { display: block; margin-bottom: 0.2rem; }
    .action-card .txt .small { font-size: 0.75rem; color: var(--text-soft); }

    /* Patient Workspace */
    .booking-flow { display: grid; grid-template-columns: 1fr 380px; gap: 1.5rem; margin-bottom: 1.5rem; }
    .search-box input { width: 100%; background: rgba(0,0,0,0.2); border: 1px solid var(--border); padding: 1rem; border-radius: 12px; color: #fff; margin-bottom: 1rem; }
    .filter-chips { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
    .chip { font-size: 0.75rem; font-weight: 700; background: transparent; border: 1px solid var(--border); color: var(--text-soft); padding: 0.3rem 0.8rem; border-radius: 99px; cursor: pointer; }
    .chip.active { background: var(--primary); color: #000; border-color: var(--primary); box-shadow: 0 0 10px rgba(0, 212, 170, 0.3); }
    .dr-list { max-height: 400px; overflow-y: auto; }
    .dr-row { padding: 1.2rem; border: 1px solid var(--border); border-radius: 12px; margin-bottom: 0.8rem; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: 0.2s; }
    .dr-row:hover { border-color: var(--primary); }
    .dr-row.chosen { background: rgba(0, 212, 170, 0.1); border-color: var(--primary); }
    .dr-main strong { display: block; font-size: 1rem; margin-bottom: 0.2rem; }
    .dr-sub { font-size: 0.8rem; color: var(--text-soft); }
    .avail { font-size: 0.7rem; font-weight: 700; color: var(--primary); text-transform: uppercase; }

    .time-area { display: flex; flex-direction: column; gap: 1.5rem; }
    .date-pick label, .complaint-box label { font-size: 0.8rem; font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 0.5rem; }
    .date-pick input, .complaint-box textarea { width: 100%; background: rgba(0,0,0,0.2); border: 1px solid var(--border); padding: 0.8rem; border-radius: 10px; color: #fff; }
    .slot-container { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; }
    .slot-btn { font-size: 0.8rem; font-weight: 700; background: transparent; border: 1px solid var(--border); color: #fff; padding: 0.6rem; border-radius: 8px; cursor: pointer; }
    .slot-btn.booked { opacity: 0.2; cursor: not-allowed; border-style: dotted; }
    .slot-btn.selected { background: var(--primary); color: #000; border-color: var(--primary); }
    .primary-action { background: var(--primary); color: #000; font-weight: 800; border: none; padding: 1.2rem; border-radius: 12px; cursor: pointer; transition: 0.2s; font-size: 1rem; }
    .primary-action:hover:not(:disabled) { box-shadow: 0 0 20px rgba(0, 212, 170, 0.4); transform: translateY(-2px); }
    .primary-action:disabled { background: var(--border); color: var(--text-muted); cursor: not-allowed; }

    .pt-apt-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.2rem; margin-top: 1.5rem; }
    .apt-tile { background: rgba(11, 18, 32, 0.4); border: 1px solid var(--border); padding: 1.2rem; border-radius: 16px; position: relative; }
    .apt-tile.confirmed { border-left: 4px solid var(--primary); }
    .tile-date { font-weight: 800; font-size: 1.1rem; margin-bottom: 0.4rem; }
    .tile-meta { font-size: 0.85rem; color: var(--text-soft); }
    .tile-status { font-size: 0.65rem; text-transform: uppercase; font-weight: 800; color: var(--primary); margin-top: 0.8rem; }

    .custom-scroll::-webkit-scrollbar { width: 5px; }
    .custom-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }

    @media (max-width: 1000px) { .workflow-grid, .booking-flow { grid-template-columns: 1fr; } }
  `]
})
export class AppointmentDashboardComponent implements OnInit, OnDestroy {
  appointments: Appointment[] = [];
  doctors: DoctorOption[] = [];
  specialties: string[] = [];
  slots: TimeSlot[] = [];
  
  loadingAppointments = false;
  loadingDoctors = false;
  loadingSlots = false;
  
  selectedDoctor: DoctorOption | null = null;
  selectedSlot = '';
  searchTerm = '';
  activeSpecialty = '';
  error = '';
  role: string | null = null;
  
  activeAppointmentId: number | null = null;
  private sub = new Subscription();
  private searchTimer: any | null = null;

  get selectedForAction(): Appointment | undefined {
    return this.appointments.find(a => a.id === this.activeAppointmentId);
  }

  readonly form = this.fb.nonNullable.group({
    patientId: [0, [Validators.required, Validators.min(1)]],
    doctorId: [0, [Validators.required, Validators.min(1)]],
    appointmentDate: [new Date().toISOString().slice(0,10), Validators.required],
    appointmentTime: ['', Validators.required],
    chiefComplaint: ['']
  });

  constructor(
    private fb: FormBuilder,
    private appointmentApi: AppointmentApiService,
    private auth: AuthService,
    private context: PatientContextService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.role = this.auth.getRole();
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    if (this.searchTimer) clearTimeout(this.searchTimer);
  }

  private loadInitialData(): void {
    if (this.role === 'PATIENT') {
      const pId = Number(this.auth.getUserId());
      if (pId) this.form.controls.patientId.setValue(pId);
      this.loadSpecialties();
      this.searchDoctors();
    }
    this.refresh();
  }

  refresh(): void {
    this.loadingAppointments = true;
    const pId = this.form.controls.patientId.value;

    if (this.role === 'PATIENT' && pId > 0) {
      this.appointmentApi.listUpcomingByPatientId(pId).subscribe({
        next: items => {
          this.appointments = items;
          this.loadingAppointments = false;
        },
        error: () => this.loadingAppointments = false
      });
    } else {
      this.appointmentApi.list().subscribe({
        next: items => {
          this.appointments = items;
          this.loadingAppointments = false;
          if (items.length > 0 && !this.activeAppointmentId) {
            this.activeAppointmentId = items[0].id || null;
          }
        },
        error: () => this.loadingAppointments = false
      });
    }
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value;
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.searchDoctors(), 300);
  }

  selectSpecialty(s: string): void {
    this.activeSpecialty = s;
    this.searchDoctors();
  }

  selectDoctor(dr: DoctorOption): void {
    this.selectedDoctor = dr;
    this.form.controls.doctorId.setValue(dr.id);
    this.loadSlots();
  }

  loadSlots(): void {
    const drId = this.form.controls.doctorId.value;
    const date = this.form.controls.appointmentDate.value;
    if (!drId || !date) return;

    this.loadingSlots = true;
    this.appointmentApi.getTimeSlots(drId, date).subscribe({
      next: items => {
        this.slots = items;
        this.loadingSlots = false;
        this.selectedSlot = '';
        this.form.controls.appointmentTime.setValue('');
      },
      error: () => this.loadingSlots = false
    });
  }

  selectSlot(time: string): void {
    this.selectedSlot = time;
    this.form.controls.appointmentTime.setValue(time);
  }

  beginSession(apt: Appointment): void {
    // Lock clinical context to this patient
    this.context.setPatient({
       id: apt.patientId,
       name: `Patient #${apt.patientId}`, // In real app, name would be in Appointment DTO
       role: 'PATIENT'
    });
    // Navigate to EMR History for starting the visit
    this.router.navigate(['/records']);
  }

  canBookWithSlot(): boolean {
    return this.form.controls.patientId.valid && 
           this.form.controls.doctorId.valid && 
           this.form.controls.appointmentDate.valid && 
           this.form.controls.appointmentTime.valid;
  }

  bookWithSelectedSlot(): void {
    if (!this.canBookWithSlot()) return;
    this.book();
  }

  book(): void {
    if (this.form.invalid) return;
    this.appointmentApi.create(this.form.getRawValue()).subscribe({
      next: () => {
        this.successMessage('Appointment reserved successfully.');
        this.form.reset({ 
           patientId: Number(this.auth.getUserId()), 
           appointmentDate: new Date().toISOString().slice(0,10) 
        });
        this.selectedSlot = '';
        this.selectedDoctor = null;
        this.refresh();
      },
      error: () => (this.error = 'Booking failed. Slot may no longer be available.')
    });
  }

  private successMessage(msg: string): void {
    // In a real app we'd use ToastService, but keeping localized for now
    this.error = msg; 
    setTimeout(() => this.error = '', 3000);
  }

  private loadSpecialties(): void {
    this.appointmentApi.listSpecialties().subscribe({
      next: items => this.specialties = items
    });
  }

  private searchDoctors(): void {
    this.loadingDoctors = true;
    this.appointmentApi.searchDoctors(this.searchTerm, this.activeSpecialty).subscribe({
      next: items => {
        this.doctors = items;
        this.loadingDoctors = false;
      },
      error: () => this.loadingDoctors = false
    });
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/auth/login']);
  }
}