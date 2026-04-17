import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Medication, PharmacyApiService, Prescription } from './pharmacy-api.service';

@Component({
  selector: 'app-pharmacy',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="container">
      <div class="hero">
        <div>
          <h2>Pharmacy & Prescriptions</h2>
          <p class="subtitle">Medication intelligence, prescription issuance and refill history.</p>
        </div>
        <div class="pill">Medication Desk</div>
      </div>

      <div class="success" *ngIf="successMessage" role="status" aria-live="polite">{{ successMessage }}</div>

      <section class="section card" aria-labelledby="med-search-heading">
        <h3 id="med-search-heading">Medication Search</h3>
        <input type="text" [value]="search" (input)="onSearch($event)" placeholder="Search medication" />
        <div class="loading-text" *ngIf="loadingMedications">Searching medications…</div>
        <ul class="list" *ngIf="!loadingMedications && medications.length > 0">
          <li *ngFor="let med of medications">
            <strong>{{ med.medicationName }}</strong>
            <span>{{ med.genericName || '—' }} {{ med.strength || '' }}</span>
          </li>
        </ul>
      </section>

      <form [formGroup]="form" (ngSubmit)="issue()" class="section card" aria-labelledby="issue-rx-heading">
        <h3 id="issue-rx-heading">Issue Prescription</h3>
        <input type="number" formControlName="patientId" placeholder="Patient ID" />
        <input type="number" formControlName="doctorId" placeholder="Doctor ID" />
        <input type="text" formControlName="medicationName" placeholder="Medication" />
        <input type="text" formControlName="dose" placeholder="Dose" />
        <input type="text" formControlName="frequency" placeholder="Frequency" />
        <input type="text" formControlName="duration" placeholder="Duration" />
        <button type="submit" [disabled]="form.invalid || issuingPrescription">{{ issuingPrescription ? 'Issuing…' : 'Issue Prescription' }}</button>
      </form>

      <section class="section card" aria-labelledby="rx-history-heading">
        <h3 id="rx-history-heading">Patient Prescription History</h3>
        <button type="button" (click)="loadHistory()" [disabled]="form.controls.patientId.invalid || loadingHistory">{{ loadingHistory ? 'Loading…' : 'Load History' }}</button>
        <div class="loading-text" *ngIf="loadingHistory">Fetching prescription history…</div>
        <ul class="list" *ngIf="!loadingHistory && history.length > 0">
          <li *ngFor="let item of history">
            <strong>{{ item.medicationName }}</strong>
            <span>{{ item.dose || '—' }} · {{ item.frequency || '—' }} · {{ item.status || 'ACTIVE' }}</span>
          </li>
        </ul>
        <div class="loading-text" *ngIf="!loadingHistory && history.length === 0">No prescriptions found for this patient.</div>
      </section>
    </div>
  `,
  styles: [`
    .hero { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; }
    .subtitle { margin-top: 0.45rem; color: var(--text-soft); }
    .pill { border: 1px solid rgba(0,212,170,0.45); color: var(--primary); background: rgba(0,212,170,0.12); border-radius: 999px; padding: 0.35rem 0.75rem; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 700; white-space: nowrap; }
    .success { margin-top: 1rem; border: 1px solid rgba(34,197,94,0.45); background: rgba(34,197,94,0.12); color: #80e8a6; border-radius: 10px; padding: 0.65rem 0.8rem; }
    .card { border: 1px solid var(--border); border-radius: 14px; padding: 0.9rem; background: linear-gradient(180deg, rgba(26,39,64,0.65), rgba(15,23,38,0.95)); }
    .section { margin-top: 1.2rem; display: grid; gap: 0.6rem; }
    .list { list-style: none; padding: 0; margin: 0.5rem 0 0; }
    .list li { border: 1px solid var(--border); border-radius: 10px; padding: 0.7rem; margin-bottom: 0.5rem; background: rgba(11,18,32,0.55); }
    .list span { display: block; margin-top: 0.2rem; color: var(--text-soft); }

    @media (max-width: 760px) {
      .hero { flex-direction: column; }
    }
  `]
})
export class PharmacyComponent {
  search = '';
  medications: Medication[] = [];
  history: Prescription[] = [];
  loadingMedications = false;
  issuingPrescription = false;
  loadingHistory = false;
  successMessage = '';

  readonly form = this.fb.nonNullable.group({
    patientId: [0, [Validators.required, Validators.min(1)]],
    doctorId: [0, [Validators.required, Validators.min(1)]],
    medicationName: ['', Validators.required],
    dose: [''],
    frequency: [''],
    duration: ['']
  });

  constructor(
    private fb: FormBuilder,
    private pharmacyApi: PharmacyApiService
  ) {}

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.search = target.value;
    this.loadingMedications = true;

    this.pharmacyApi.searchMedications(this.search).subscribe({
      next: items => {
        this.medications = items;
        this.loadingMedications = false;
      },
      error: () => {
        this.medications = [];
        this.loadingMedications = false;
      }
    });
  }

  issue(): void {
    if (this.form.invalid) return;

    this.issuingPrescription = true;
    this.successMessage = '';

    this.pharmacyApi.issuePrescription(this.form.getRawValue()).subscribe({
      next: () => {
        this.successMessage = 'Prescription issued successfully.';
        this.issuingPrescription = false;
        this.loadHistory();
      },
      error: () => {
        this.issuingPrescription = false;
      }
    });
  }

  loadHistory(): void {
    const patientId = this.form.controls.patientId.value;
    if (!patientId || patientId < 1) return;

    this.loadingHistory = true;

    this.pharmacyApi.getPatientPrescriptions(patientId).subscribe({
      next: items => {
        this.history = items;
        this.loadingHistory = false;
      },
      error: () => {
        this.history = [];
        this.loadingHistory = false;
      }
    });
  }
}
