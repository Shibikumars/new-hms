import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Appointment, AppointmentApiService, DoctorOption, TimeSlot } from './appointment-api.service';
import { AuthService } from '../../core/auth.service';
import { PatientContextService } from '../../core/patient-context.service';
import { BillingApiService, RazorpayOrder } from '../billing/billing-api.service';
import { ToastService } from '../../core/toast.service';
import { ReportingApiService } from '../analytics/reporting-api.service';

declare var Razorpay: any;

@Component({
  selector: 'app-appointment-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="container clinical-container">
      <header class="header-band glass">
        <div class="title-group">
          <h2>{{ role === 'PATIENT' ? 'Health Journey Dashboard' : 'Clinical Workspace' }}</h2>
          <p class="subtitle">{{ role === 'PATIENT' ? 'Manage your specialist visits and medical timeline' : 'Patient queue and clinical documentation management' }}</p>
        </div>
        <div class="global-actions">
           <div class="status-indicator">
              <span class="pulse"></span>
              {{ role }} Session Active
           </div>
           <button class="logout-pill" (click)="logout()"><i class="ph ph-sign-out"></i> Leave</button>
        </div>
      </header>

      <div class="workspace-layout">
        
        <!-- SIDEBAR: Selection -->
        <aside class="sidebar-panel card shadow-glass">
          <ng-container *ngIf="role === 'PATIENT'">
            <div class="section-header">
              <h3><span class="step-num">1</span> Choose Specialist</h3>
            </div>
            <div class="search-box">
              <i class="ph ph-magnifying-glass"></i>
              <input type="text" [value]="searchTerm" (input)="onSearchInput($event)" placeholder="Name, Specialty, Condition..." />
            </div>
            <div class="filter-chips toolbar-scroll">
              <button class="chip" [class.active]="activeSpecialty === ''" (click)="selectSpecialty('')">All Specialists</button>
              <button class="chip" *ngFor="let s of specialties" [class.active]="activeSpecialty === s" (click)="selectSpecialty(s)">{{ s }}</button>
            </div>
            <div class="item-list custom-scroll">
              <div class="dr-card-mini" *ngFor="let dr of doctors" [class.active]="selectedDoctor?.id === dr.id" (click)="selectDoctor(dr)">
                <div class="dr-avatar" [style.background-image]="dr.profilePhotoUrl ? 'url(' + dr.profilePhotoUrl + ')' : ''">
                  <span *ngIf="!dr.profilePhotoUrl">{{ dr.fullName.charAt(0) }}</span>
                </div>
                <div class="dr-info">
                  <strong>{{ dr.fullName }}</strong>
                  <span class="spec">{{ dr.specialization }}</span>
                  <div class="dr-meta">
                    <span class="rating"><i class="ph ph-star-fill"></i> {{ dr.rating || '4.9' }}</span>
                    <span class="fee">₹{{ dr.consultationFee || '500' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </ng-container>

          <ng-container *ngIf="role !== 'PATIENT'">
            <div class="section-header">
              <h3>Patient Agenda</h3>
              <button class="refresh-pill" (click)="refresh()"><i class="ph ph-arrows-clockwise"></i></button>
            </div>
            <div class="item-list custom-scroll">
              <div class="agenda-item" *ngFor="let apt of appointments" [class.active]="activeAppointmentId === apt.id" (click)="activeAppointmentId = apt.id">
                <div class="time-block">{{ apt.appointmentTime.slice(0,5) }}</div>
                <div class="apt-content">
                  <strong>{{ apt.patientName || 'Patient #' + apt.patientId }}</strong>
                  <span class="status-tag" [attr.data-status]="apt.status">{{ apt.status }}</span>
                  <p class="complaint" *ngIf="apt.chiefComplaint">"{{ apt.chiefComplaint }}"</p>
                </div>
              </div>
            </div>
          </ng-container>
        </aside>

        <!-- MAIN WORKSPACE -->
        <main class="content-panel">
          <ng-container *ngIf="role === 'PATIENT'">
            <div class="card shadow-glass" *ngIf="selectedDoctor && bookingView === 'SELECT'">
              <div class="dr-profile-detailed">
                <div class="dr-profile-header">
                  <div class="dr-large-avatar" [style.background-image]="selectedDoctor.profilePhotoUrl ? 'url(' + selectedDoctor.profilePhotoUrl + ')' : ''"></div>
                  <div class="dr-title">
                    <h4>{{ selectedDoctor.fullName }}</h4>
                    <p>{{ selectedDoctor.specialization }} • {{ selectedDoctor.yearsOfExperience || '12' }} Years Experience</p>
                    <div class="qualifications">{{ selectedDoctor.qualifications || 'MBBS, MD (Specialist)' }}</div>
                  </div>
                  <div class="dr-consult-fee">
                    <label>Consultation Fee</label>
                    <div class="fee-amount">₹{{ selectedDoctor.consultationFee || 500 }}</div>
                  </div>
                </div>
                
                <div class="dr-facts">
                  <div class="fact"><i class="ph ph-translate"></i> <span>{{ selectedDoctor.languagesSpoken || 'English, Hindi, Bengali' }}</span></div>
                  <div class="fact"><i class="ph ph-stethoscope"></i> <span>{{ selectedDoctor.subSpecialties || 'Critical Care, Diagnostics' }}</span></div>
                </div>

                <div class="booking-options" [formGroup]="form">
                  <div class="options-row">
                    <div class="input-wrap">
                      <label>Preferred Visit Date</label>
                      <input type="date" formControlName="appointmentDate" (change)="loadSlots()" [min]="todayDate" />
                    </div>
                    <div class="input-wrap">
                      <label>Encounter Type</label>
                      <select formControlName="type">
                        <option value="OPD">OPD Specialist Visit (₹500)</option>
                        <option value="FOLLOW_UP">Post-Consultation Follow-up (₹300)</option>
                        <option value="TELEMEDICINE">Virtual Tele-Health (₹450)</option>
                        <option value="EMERGENCY">Acute Emergency Care (₹1200)</option>
                      </select>
                    </div>
                  </div>

                  <div class="slots-section">
                    <label>Clinically Available Slots</label>
                    <div class="slot-grid">
                      <button type="button" class="slot-btn" *ngFor="let slot of slots" 
                        [disabled]="slot.status === 'BOOKED'" 
                        [class.active]="selectedSlot === slot.time"
                        (click)="selectSlot(slot.time)">
                        {{ slot.time.slice(0,5) }}
                      </button>
                    </div>
                    <p class="no-slots" *ngIf="!loadingSlots && slots.length === 0">No clinical slots available for selected date.</p>
                  </div>

                  <div class="complaint-wrap">
                    <label>Narrative / Chief Complaint</label>
                    <textarea formControlName="chiefComplaint" placeholder="Please describe symptoms, duration, and any urgency..."></textarea>
                  </div>

                  <button class="btn-book-final" (click)="initiateBooking()" [disabled]="form.invalid || !selectedSlot">
                    Secure Booking & Payment
                  </button>
                </div>
              </div>
            </div>

            <!-- CONFIRMED VIEW -->
            <div class="card shadow-glass booking-success" *ngIf="bookingView === 'CONFIRMED'">
              <div class="success-icon-wrap">
                <i class="ph ph-seal-check-fill"></i>
              </div>
              <h3 class="success-title">Booking Secured!</h3>
              <p class="success-msg">Your clinical encounter with {{ confirmedAptDoctor }} is official.</p>
              
              <div class="confirmation-details">
                <div class="detail"><label>ID</label><span>APT-{{ lastCreatedAptId }}</span></div>
                <div class="detail">
                  <label>Schedule</label>
                  <span>{{ confirmedAptDate }} &#64; {{ confirmedAptTime }}</span>
                </div>
                <div class="detail"><label>Ledger</label><span class="paid-status">PAID • ₹{{ confirmedAptFee }}</span></div>
              </div>

              <div class="post-actions">
                <button class="ph-btn secondary" (click)="downloadSummary(lastCreatedAptId!)"><i class="ph ph-file-pdf"></i> Summary PDF</button>
                <button class="ph-btn secondary" (click)="addToCalendar()"><i class="ph ph-calendar-plus"></i> Add to Calendar</button>
                <button class="ph-btn primary" (click)="resetFlow()"><i class="ph ph-plus-circle"></i> New Booking</button>
              </div>
              <div class="reminder-note">
                <i class="ph ph-info"></i>
                A digital reminder will be sent to your registered device 24 hours prior to the session.
              </div>
            </div>

            <div class="card shadow-glass empty-state" *ngIf="!selectedDoctor && bookingView === 'SELECT'">
              <i class="ph ph-hospital"></i>
              <h4>City Care Clinical Portal</h4>
              <p>Explore our network of world-class specialists and secure your consultation in seconds.</p>
            </div>
          </ng-container>

          <!-- DOCTOR VIEW -->
          <ng-container *ngIf="role !== 'PATIENT'">
            <div class="card shadow-glass" *ngIf="selectedForAction">
              <div class="visit-pane-header">
                <div class="patient-id">MRN-{{ selectedForAction.patientId }}</div>
                <h4>Active Consultation</h4>
                <div class="visit-timer">LIVE SESSION</div>
              </div>
              
              <div class="action-grid">
                <button class="workflow-tile" (click)="beginSession(selectedForAction)">
                  <i class="ph ph-browsers"></i>
                  <span>Patient EMR</span>
                </button>
                <button class="workflow-tile">
                  <i class="ph ph-prescription"></i>
                  <span>E-Prescribe</span>
                </button>
                <button class="workflow-tile">
                  <i class="ph ph-test-tube"></i>
                  <span>Order Labs</span>
                </button>
                <button class="workflow-tile success">
                  <i class="ph ph-check-fat"></i>
                  <span>Complete</span>
                </button>
              </div>
            </div>
          </ng-container>
        </main>
      </div>

      <!-- BOTTOM SCHEDULE -->
      <section class="card shadow-glass health-schedule" *ngIf="role === 'PATIENT' && appointments.length > 0">
        <div class="schedule-header">
           <i class="ph ph-clock-countdown"></i>
           <h3>Active Health Timeline</h3>
        </div>
        <div class="apt-grid-bottom">
           <div class="apt-tile-mini" *ngFor="let apt of appointments" [attr.data-status]="apt.status">
              <div class="apt-mini-header">
                <strong>{{ apt.appointmentDate }} &#64; {{ apt.appointmentTime.slice(0,5) }}</strong>
                <span class="status-dot"></span>
              </div>
              <div class="apt-mini-meta">
                Doc #{{ apt.doctorId }} • {{ apt.type }} Encounter
              </div>
              <div class="apt-mini-btns">
                 <button class="btn-tiny" (click)="downloadSummary(apt.id!)" *ngIf="apt.status === 'COMPLETED'">
                   <i class="ph ph-receipt"></i> Details
                 </button>
                 <button class="btn-tiny" (click)="addToCalendar()" *ngIf="apt.status === 'SCHEDULED'">
                   <i class="ph ph-calendar"></i> Sync
                 </button>
              </div>
           </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .clinical-container { padding: 2rem; background: #F8FAFC; min-height: 100vh; }
    .header-band { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem 2.5rem; border-radius: 20px; margin-bottom: 2rem; background: #fff; border: 1px solid #E2E8F0; }
    .title-group h2 { font-size: 1.5rem; font-weight: 800; color: #1E293B; }
    .subtitle { font-size: 0.9rem; color: #64748B; font-weight: 500; }
    .status-indicator { display: flex; align-items: center; gap: 0.6rem; font-size: 0.75rem; font-weight: 800; color: #6366f1; text-transform: uppercase; }
    .logout-pill { padding: 0.5rem 1rem; border-radius: 10px; border: 1px solid #F1F5F9; background: #fff; cursor: pointer; font-weight: 700; color: #EF4444; }

    .workspace-layout { display: grid; grid-template-columns: 360px 1fr; gap: 2rem; }
    .card { background: #fff; border: 1px solid #E2E8F0; border-radius: 24px; }
    .shadow-glass { box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); }

    .sidebar-panel { padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem; }
    .step-num { background: #6366f1; color: #fff; width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 0.7rem; margin-right: 0.5rem; }
    .section-header h3 { font-size: 1rem; font-weight: 800; color: #1E293B; }
    
    .search-box { position: relative; }
    .search-box i { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #64748B; }
    .search-box input { width: 100%; padding: 0.85rem 1rem 0.85rem 2.75rem; border-radius: 14px; border: 1px solid #E2E8F0; background: #F8FAFC; }

    .filter-chips { display: flex; gap: 0.5rem; overflow-x: auto; padding-bottom: 0.5rem; }
    .chip { padding: 0.4rem 1rem; border-radius: 10px; border: 1px solid #E2E8F0; background: #fff; font-size: 0.8rem; font-weight: 700; cursor: pointer; white-space: nowrap; }
    .chip.active { background: #6366f1; color: #fff; border-color: #6366f1; }

    .item-list { display: flex; flex-direction: column; gap: 1rem; }
    .dr-card-mini { display: flex; gap: 1.25rem; align-items: center; padding: 1.25rem; border-radius: 18px; border: 1px solid transparent; cursor: pointer; background: #F8FAFC; }
    .dr-card-mini.active { background: rgba(99, 102, 241, 0.05); border-color: #6366f1; }
    
    .dr-profile-detailed { padding: 2.5rem; }
    .dr-profile-header { display: flex; gap: 2.5rem; align-items: center; border-bottom: 1px solid #F1F5F9; padding-bottom: 2rem; margin-bottom: 2rem; }
    .dr-large-avatar { width: 110px; height: 110px; border-radius: 24px; background: #CBD5E1; background-size: cover; border: 4px solid #fff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .dr-title h4 { font-size: 1.6rem; font-weight: 800; color: #1E293B; }
    .fee-amount { font-family: 'Syne', sans-serif; font-size: 2.2rem; font-weight: 800; color: #6366f1; }

    .btn-book-final { margin-top: 2rem; width: 100%; padding: 1.5rem; border-radius: 20px; background: #6366f1; color: #fff; font-size: 1.15rem; font-weight: 800; border: none; cursor: pointer; transition: 0.3s; }
    .btn-book-final:hover:not(:disabled) { box-shadow: 0 20px 25px -5px rgba(99, 102, 241, 0.3); transform: translateY(-3px); }

    .booking-success { padding: 4rem; display: flex; flex-direction: column; align-items: center; }
    .success-icon-wrap { font-size: 6rem; color: #22C55E; margin-bottom: 1.5rem; }
    .success-title { font-size: 2rem; font-weight: 800; color: #1E293B; }
    .confirmation-details { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 2rem; width: 100%; border: 1px solid #E2E8F0; border-radius: 24px; padding: 2rem; margin: 2rem 0; background: #F8FAFC; }
    
    .ph-btn { padding: 0.85rem 1.5rem; border-radius: 14px; font-weight: 700; display: flex; align-items: center; gap: 0.6rem; cursor: pointer; border: none; }
    .ph-btn.primary { background: #6366f1; color: #fff; }
    .ph-btn.secondary { background: #F1F5F9; color: #475569; }

    .reminder-note { margin-top: 2rem; font-size: 0.85rem; color: #64748B; display: flex; align-items: center; gap: 0.6rem; font-weight: 600; padding: 1rem; border-radius: 12px; border: 1px solid #E2E8F0; }

    .health-schedule { margin-top: 2.5rem; padding: 2rem; }
    .schedule-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; color: #1E293B; }
    .schedule-header h3 { font-size: 1.25rem; font-weight: 800; }
    .apt-tile-mini { border: 1px solid #E2E8F0; padding: 1.25rem; border-radius: 18px; position: relative; }
    .status-dot { width: 10px; height: 10px; border-radius: 50%; background: #6366f1; }
    .btn-tiny { padding: 0.4rem 0.8rem; font-size: 0.75rem; border-radius: 8px; border: 1px solid #E2E8F0; background: #fff; cursor: pointer; font-weight: 700; margin-top: 1rem; }

    .empty-state { padding: 8rem 4rem; text-align: center; }
    .empty-state i { font-size: 5rem; color: #CBD5E1; margin-bottom: 2rem; display: block; }
  `]
})
export class AppointmentDashboardComponent implements OnInit, OnDestroy {
  appointments: Appointment[] = [];
  doctors: DoctorOption[] = [];
  specialties: string[] = [];
  slots: TimeSlot[] = [];

  selectedDoctor: DoctorOption | null = null;
  selectedSlot = '';
  searchTerm = '';
  activeSpecialty = '';
  role: string | null = null;
  todayDate = new Date().toISOString().slice(0, 10);

  activeAppointmentId: number | null = null;
  bookingView: 'SELECT' | 'CONFIRMED' = 'SELECT';

  confirmedAptDoctor = '';
  confirmedAptDate = '';
  confirmedAptTime = '';
  confirmedAptFee = 0;
  lastCreatedAptId: number | null = null;

  private sub = new Subscription();
  private searchTimer: any | null = null;

  readonly form = this.fb.nonNullable.group({
    patientId: [0, [Validators.required, Validators.min(1)]],
    doctorId: [0, [Validators.required, Validators.min(1)]],
    appointmentDate: [new Date().toISOString().slice(0, 10), Validators.required],
    appointmentTime: ['', Validators.required],
    type: ['OPD', Validators.required],
    chiefComplaint: ['']
  });

  constructor(
    private fb: FormBuilder,
    private appointmentApi: AppointmentApiService,
    private billingApi: BillingApiService,
    private auth: AuthService,
    private context: PatientContextService,
    private toast: ToastService,
    private reportingApi: ReportingApiService,
    private router: Router
  ) { }

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
    const pId = this.form.controls.patientId.value;
    if (this.role === 'PATIENT' && pId > 0) {
      this.appointmentApi.listUpcomingByPatientId(pId).subscribe({
        next: items => this.appointments = items
      });
    } else {
      this.appointmentApi.list().subscribe({
        next: items => {
          this.appointments = items;
          if (items.length > 0 && !this.activeAppointmentId) this.activeAppointmentId = items[0].id || null;
        }
      });
    }
  }

  onSearchInput(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
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
    this.appointmentApi.getTimeSlots(drId, date).subscribe({
      next: items => {
        this.slots = items;
        this.selectedSlot = '';
        this.form.controls.appointmentTime.setValue('');
      }
    });
  }

  selectSlot(time: string): void {
    this.selectedSlot = time;
    this.form.controls.appointmentTime.setValue(time);
  }

  initiateBooking(): void {
    if (this.form.invalid) return;
    const fee = this.getFee(this.form.controls.type.value);
    this.billingApi.createRazorpayOrder(fee * 100).subscribe({
      next: (order: RazorpayOrder) => this.openRazorpay(order, fee)
    });
  }

  private getFee(type: string): number {
    if (type === 'FOLLOW_UP') return 300;
    if (type === 'TELEMEDICINE') return 450;
    if (type === 'EMERGENCY') return 1200;
    return 500;
  }

  private openRazorpay(order: RazorpayOrder, fee: number): void {
    const options = {
      key: 'rzp_test_stub',
      amount: order.amount,
      currency: order.currency,
      name: 'City Care Hospital',
      description: `Consultation with ${this.selectedDoctor?.fullName}`,
      order_id: order.id,
      handler: (res: any) => this.verifyAndFinalize(res, fee),
      prefill: { name: this.auth.getUsername() },
      theme: { color: '#6366f1' }
    };
    new Razorpay(options).open();
  }

  private verifyAndFinalize(res: any, fee: number): void {
    this.billingApi.verifyRazorpayPayment(res).subscribe({
      next: () => {
        this.appointmentApi.create({
          ...this.form.getRawValue(),
          status: 'SCHEDULED',
          paymentStatus: 'PAID',
          razorpayOrderId: res.razorpay_order_id,
          razorpayPaymentId: res.razorpay_payment_id,
          feeAmount: fee
        }).subscribe({
          next: (apt) => {
            this.confirmedAptDoctor = this.selectedDoctor?.fullName || 'Specialist';
            this.confirmedAptDate = apt.appointmentDate;
            this.confirmedAptTime = apt.appointmentTime.slice(0, 5);
            this.confirmedAptFee = fee;
            this.lastCreatedAptId = apt.id || 0;
            this.bookingView = 'CONFIRMED';
            this.refresh();
          }
        });
      }
    });
  }

  addToCalendar(): void {
    const calendarContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `DTSTART:${this.confirmedAptDate.replace(/-/g, '')}T${this.confirmedAptTime.replace(':', '')}00`,
      `DTEND:${this.confirmedAptDate.replace(/-/g, '')}T${this.confirmedAptTime.replace(':', '')}30`,
      `SUMMARY:Medical Consultation with ${this.confirmedAptDoctor}`,
      `DESCRIPTION:Appointment at City Care Hospital. Ref: APT-${this.lastCreatedAptId}`,
      'LOCATION:City Care General Hospital, Central Wing',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\\n');

    const blob = new Blob([calendarContent], { type: 'text/calendar' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Appointment_${this.lastCreatedAptId}.ics`;
    a.click();
    window.URL.revokeObjectURL(url);
    this.toast.success('Synced', 'Added to clinical schedule.');
  }

  downloadSummary(id: number): void {
    this.reportingApi.downloadDischargeSummaryPdf(id).subscribe({
      next: (b) => {
        const u = window.URL.createObjectURL(b);
        const a = document.createElement('a');
        a.href = u;
        a.download = `Summary_${id}.pdf`;
        a.click();
        this.toast.success('Document Ready', 'Clinical summary downloaded.');
      }
    });
  }

  resetFlow() { this.bookingView = 'SELECT'; this.selectedDoctor = null; }
  
  beginSession(apt: Appointment): void {
    this.context.setPatient({ id: apt.patientId, name: `Patient #${apt.patientId}`, role: 'PATIENT' });
    this.router.navigate(['/records']);
  }

  private loadSpecialties() { this.appointmentApi.listSpecialties().subscribe(s => this.specialties = s); }
  private searchDoctors() { this.appointmentApi.searchDoctors(this.searchTerm, this.activeSpecialty).subscribe(d => this.doctors = d); }
  logout() { this.auth.logout(); this.router.navigate(['/auth/login']); }
  
  get selectedForAction(): Appointment | undefined {
    return this.appointments.find(a => a.id === this.activeAppointmentId);
  }
}