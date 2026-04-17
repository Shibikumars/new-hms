import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { Appointment, AppointmentApiService, DoctorOption, TimeSlot } from './appointment-api.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-appointment-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="container">
      <div class="toolbar topbar">
        <div>
          <h2>{{ role === 'PATIENT' ? 'Book Appointment' : 'Appointment Workspace' }}</h2>
          <p class="toolbar-subtitle">{{ role === 'PATIENT' ? 'Search doctors and reserve visual time slots' : 'Manage and monitor appointment flow' }}</p>
        </div>
        <button class="secondary" (click)="logout()">Logout</button>
      </div>

      <div class="error" *ngIf="error">{{ error }}</div>

      <div class="booking-layout" *ngIf="role === 'PATIENT'; else standardBooking" aria-describedby="booking-flow-help">
        <section class="card" aria-labelledby="find-doctor-heading">
          <h3 id="find-doctor-heading">1 · Find a Doctor</h3>

          <div class="form-group">
            <label for="search">Search by name or specialty</label>
            <input id="search" type="text" [value]="searchTerm" (input)="onSearchInput($event)" placeholder="e.g. Priya or Cardiology" aria-label="Search doctors by name or specialty" />
          </div>

          <div class="chip-row" *ngIf="specialties.length > 0">
            <button type="button" class="chip" [class.active]="activeSpecialty === ''" (click)="selectSpecialty('')">All</button>
            <button type="button" class="chip" *ngFor="let item of specialties" [class.active]="activeSpecialty === item" (click)="selectSpecialty(item)">{{ item }}</button>
          </div>

          <div class="doctor-list" *ngIf="doctors.length > 0; else noDoctorData">
            <button type="button" class="doctor-card" *ngFor="let doctor of doctors" [class.selected]="selectedDoctor?.id === doctor.id" (click)="selectDoctor(doctor)" [attr.aria-label]="'Select doctor ' + doctor.fullName + ', ' + doctor.specialization">
              <div class="doctor-name">{{ doctor.fullName }}</div>
              <div class="doctor-meta">{{ doctor.specialization }} · {{ doctor.availability }}</div>
            </button>
          </div>
          <ng-template #noDoctorData>
            <p class="muted">No doctors found for current filter.</p>
          </ng-template>
        </section>

        <section class="card" [formGroup]="form" aria-labelledby="pick-slot-heading">
          <h3 id="pick-slot-heading">2 · Pick Date and Slot</h3>

          <div class="form-group">
            <label for="patientId">Patient ID</label>
            <input id="patientId" type="number" formControlName="patientId" placeholder="Your patient ID" />
          </div>

      <p id="booking-flow-help" class="sr-only">Select a doctor, choose a date and available slot, then confirm booking.</p>

          <div class="form-group">
            <label for="appointmentDate">Date</label>
            <input id="appointmentDate" type="date" formControlName="appointmentDate" (change)="loadSlots()" />
          </div>

          <div class="slot-grid" *ngIf="slots.length > 0">
            <button type="button" *ngFor="let slot of slots" [disabled]="slot.status === 'BOOKED'" [class.slot-booked]="slot.status === 'BOOKED'" [class.slot-selected]="selectedSlot === slot.time" (click)="selectSlot(slot.time)" [attr.aria-label]="'Select time slot ' + slot.time.slice(0,5) + (slot.status === 'BOOKED' ? ', booked' : ', available')">
              {{ slot.time.slice(0, 5) }}
            </button>
          </div>

          <div class="form-group">
            <label for="chiefComplaint">Chief complaint (optional)</label>
            <input id="chiefComplaint" type="text" formControlName="chiefComplaint" placeholder="Reason for visit" />
          </div>

          <button type="button" (click)="bookWithSelectedSlot()" [disabled]="!canBookWithSlot()" aria-label="Confirm appointment booking with selected slot">Confirm Booking</button>
        </section>
      </div>

      <ng-template #standardBooking>
        <div class="form-section card">
          <h3>Book New Appointment</h3>
          <form [formGroup]="form" (ngSubmit)="book()">
            <div class="form-row">
              <div class="form-group">
                <label for="patientIdStd">Patient ID</label>
                <input id="patientIdStd" type="number" placeholder="Enter patient ID" formControlName="patientId" />
              </div>
              <div class="form-group">
                <label for="doctorIdStd">Doctor ID</label>
                <input id="doctorIdStd" type="number" placeholder="Enter doctor ID" formControlName="doctorId" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="appointmentDateStd">Date</label>
                <input id="appointmentDateStd" type="date" formControlName="appointmentDate" />
              </div>
              <div class="form-group">
                <label for="appointmentTimeStd">Time</label>
                <input id="appointmentTimeStd" type="time" formControlName="appointmentTime" />
              </div>
            </div>

            <button type="submit" [disabled]="form.invalid">Book Appointment</button>
          </form>
        </div>
      </ng-template>

      <div class="appointments-section" aria-labelledby="appointments-heading" aria-describedby="appointments-help">
        <h3 id="appointments-heading">{{ role === 'PATIENT' ? 'Upcoming Appointments' : 'Appointments' }}</h3>
        <div *ngIf="appointments.length === 0" class="empty-state">
          <p>No appointments found.</p>
        </div>

        <ul class="list" *ngIf="appointments.length > 0">
          <li *ngFor="let item of appointments" [ngClass]="'status-' + (item.status | lowercase)">
            <div class="appointment-header">
              <strong>Appointment #{{ item.id }}</strong>
              <span class="status-badge">{{ item.status }}</span>
            </div>
            <div class="appointment-details">
              <div class="detail"><span class="label">Patient ID</span><span class="value">{{ item.patientId }}</span></div>
              <div class="detail"><span class="label">Doctor ID</span><span class="value">{{ item.doctorId }}</span></div>
              <div class="detail"><span class="label">Date & Time</span><span class="value">{{ item.appointmentDate }} at {{ item.appointmentTime }}</span></div>
            </div>
          </li>
        </ul>
        <p id="appointments-help" class="sr-only">Use this section to review appointment status and schedule details.</p>
      </div>
    </div>
  `,
  styles: [`
    .topbar { margin-bottom: 0.6rem; }
    .toolbar-subtitle { color: var(--text-soft); margin: 0.35rem 0 0; font-size: 0.92rem; }
    .form-section, .appointments-section { margin-top: 1.4rem; }
    .booking-layout { margin-top: 1.1rem; display: grid; grid-template-columns: 1fr 1fr; gap: 0.9rem; }
    .card {
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 0.9rem;
      background: linear-gradient(180deg, rgba(26,39,64,0.65), rgba(15,23,38,0.95));
    }
    .card h3 { margin-bottom: 0.9rem; }
    .chip-row { display: flex; gap: 0.45rem; flex-wrap: wrap; margin-bottom: 0.9rem; }
    .chip {
      border: 1px solid var(--border);
      background: rgba(11, 18, 32, 0.6);
      color: var(--text-soft);
      border-radius: 999px;
      padding: 0.3rem 0.68rem;
      font-size: 0.77rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      font-weight: 700;
    }
    .chip.active { border-color: rgba(0,212,170,0.5); color: var(--primary); background: rgba(0,212,170,0.12); }
    .doctor-list { display: flex; flex-direction: column; gap: 0.55rem; }
    .doctor-card {
      text-align: left;
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 0.7rem;
      background: rgba(11, 18, 32, 0.6);
    }
    .doctor-card.selected { border-color: rgba(0,212,170,0.6); box-shadow: 0 0 0 2px rgba(0,212,170,0.18); }
    .doctor-name { font-weight: 700; }
    .doctor-meta { color: var(--text-soft); font-size: 0.82rem; margin-top: 0.2rem; }
    .slot-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.45rem; margin: 0.8rem 0; }
    .slot-grid button { border: 1px solid var(--border); border-radius: 9px; padding: 0.38rem 0.3rem; }
    .slot-grid button.slot-booked { background: rgba(255,90,114,0.12); color: #ff9ca9; border-color: rgba(255,90,114,0.5); }
    .slot-grid button.slot-selected { background: linear-gradient(135deg, var(--primary), var(--accent)); color: #03131b; border-color: transparent; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; }
    .form-group { margin-bottom: 0.8rem; display: flex; flex-direction: column; }
    .form-group label { margin-bottom: 0.35rem; font-weight: 600; font-size: 0.86rem; color: var(--text-soft); }
    .empty-state { text-align: center; padding: 1.2rem; color: var(--text-soft); border-radius: 12px; border: 1px dashed var(--border); }
    .appointment-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.7rem; }
    .status-badge { font-size: 0.72rem; padding: 0.24rem 0.68rem; border-radius: 999px; font-weight: 700; background: rgba(0,212,170,0.14); color: var(--primary); border: 1px solid rgba(0,212,170,0.45); }
    .appointment-details { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem; }
    .detail { display: flex; flex-direction: column; }
    .detail .label { color: var(--text-muted); font-size: 0.78rem; margin-bottom: 0.2rem; text-transform: uppercase; letter-spacing: 0.04em; }
    .detail .value { color: var(--text); font-weight: 600; }
    .muted { color: var(--text-soft); font-size: 0.9rem; }
    @media (max-width: 900px) { .booking-layout { grid-template-columns: 1fr; } }
    @media (max-width: 768px) {
      .form-row { grid-template-columns: 1fr; }
      .slot-grid { grid-template-columns: repeat(3, 1fr); }
      .chip-row { flex-wrap: nowrap; overflow-x: auto; padding-bottom: 0.25rem; }
      .chip-row .chip { flex: 0 0 auto; }
      .appointment-header { flex-direction: column; align-items: flex-start; }
    }
    @media (max-width: 480px) {
      .slot-grid { grid-template-columns: repeat(2, 1fr); }
      .card { padding: 0.75rem; }
      .topbar { gap: 0.6rem; }
    }
  `]
})
export class AppointmentDashboardComponent implements OnInit {
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

  private searchTimer: number | null = null;

  readonly form = this.fb.nonNullable.group({
    patientId: [0, [Validators.required, Validators.min(1)]],
    doctorId: [0, [Validators.required, Validators.min(1)]],
    appointmentDate: ['', Validators.required],
    appointmentTime: ['', Validators.required],
    chiefComplaint: ['']
  });

  constructor(
    private fb: FormBuilder,
    private appointmentApi: AppointmentApiService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.role = this.authService.getRole();

    if (this.role === 'PATIENT') {
      this.loadSpecialties();
      this.searchDoctors();

      this.form.controls.patientId.valueChanges
        .pipe(debounceTime(250), distinctUntilChanged())
        .subscribe(() => this.refresh());

      return;
    }

    this.refresh();
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value;

    if (this.searchTimer !== null) {
      window.clearTimeout(this.searchTimer);
    }

    this.searchTimer = window.setTimeout(() => this.searchDoctors(), 300);
  }

  selectSpecialty(specialty: string): void {
    this.activeSpecialty = specialty;
    this.searchDoctors();
  }

  selectDoctor(doctor: DoctorOption): void {
    this.selectedDoctor = doctor;
    this.form.controls.doctorId.setValue(doctor.id);
    this.loadSlots();
  }

  loadSlots(): void {
    const doctorId = this.form.controls.doctorId.value;
    const date = this.form.controls.appointmentDate.value;
    if (!doctorId || !date) {
      this.slots = [];
      return;
    }

    this.loadingSlots = true;

    this.appointmentApi.getTimeSlots(doctorId, date).subscribe({
      next: (items) => {
        this.loadingSlots = false;
        this.slots = items;
        this.selectedSlot = '';
        this.form.controls.appointmentTime.setValue('');
      },
      error: () => {
        this.loadingSlots = false;
        this.error = 'Unable to load time slots';
      }
    });
  }

  selectSlot(time: string): void {
    this.selectedSlot = time;
    this.form.controls.appointmentTime.setValue(time);
  }

  canBookWithSlot(): boolean {
    return this.form.controls.patientId.valid
      && this.form.controls.doctorId.valid
      && this.form.controls.appointmentDate.valid
      && this.form.controls.appointmentTime.valid;
  }

  bookWithSelectedSlot(): void {
    if (!this.canBookWithSlot()) return;
    this.book();
  }

  book(): void {
    if (this.form.invalid) return;

    this.error = '';
    this.appointmentApi.create(this.form.getRawValue()).subscribe({
      next: () => {
        this.form.controls.appointmentTime.setValue('');
        this.form.controls.chiefComplaint.setValue('');
        this.selectedSlot = '';
        this.refresh();
        this.loadSlots();
      },
      error: (err) => (this.error = err?.error?.error ?? 'Unable to book appointment')
    });
  }

  refresh(): void {
    const patientId = this.form.controls.patientId.value;

    if (this.role === 'PATIENT') {
      if (!patientId || patientId < 1) {
        this.appointments = [];
        return;
      }

      this.loadingAppointments = true;
      this.appointmentApi.listUpcomingByPatientId(patientId).subscribe({
        next: (items) => {
          this.appointments = items;
          this.loadingAppointments = false;
        },
        error: () => {
          this.loadingAppointments = false;
          this.error = 'Unable to load appointments';
        }
      });
      return;
    }

    if (this.role === 'DOCTOR') {
      this.loadingAppointments = true;
      this.appointmentApi.list().subscribe({
        next: (items) => {
          this.appointments = items;
          this.loadingAppointments = false;
        },
        error: () => {
          this.loadingAppointments = false;
          this.error = 'Unable to load appointments';
        }
      });
      return;
    }

    this.loadingAppointments = true;
    this.appointmentApi.list().subscribe({
      next: (items) => {
        this.appointments = items;
        this.loadingAppointments = false;
      },
      error: () => {
        this.loadingAppointments = false;
        this.error = 'Unable to load appointments';
      }
    });
  }

  private loadSpecialties(): void {
    this.appointmentApi.listSpecialties().subscribe({
      next: (items) => (this.specialties = items),
      error: () => (this.specialties = [])
    });
  }

  private searchDoctors(): void {
    this.loadingDoctors = true;
    this.appointmentApi.searchDoctors(this.searchTerm, this.activeSpecialty).subscribe({
      next: (items) => {
        this.doctors = items;
        this.loadingDoctors = false;
      },
      error: () => {
        this.doctors = [];
        this.loadingDoctors = false;
        this.error = 'Unable to load doctor list';
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}