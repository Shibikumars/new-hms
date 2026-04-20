import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AllergyRecord, ProblemRecord, RecordsApiService, VisitNote } from './records-api.service';

@Component({
  selector: 'app-medical-records',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="container">
      <div class="hero">
        <div>
          <h2>Medical Records</h2>
          <p class="subtitle">Structured EMR notes, diagnosis coding and longitudinal history.</p>
        </div>
        <div class="pill">Clinical Core</div>
      </div>

      <div class="success" *ngIf="successMessage" role="status" aria-live="polite">{{ successMessage }}</div>

      <form [formGroup]="lookupForm" (ngSubmit)="loadRecords()" class="lookup card" aria-label="Patient records lookup form">
        <label for="patientId">Patient ID</label>
        <input id="patientId" type="number" formControlName="patientId" />
        <button type="submit" [disabled]="lookupForm.invalid || loadingRecords">{{ loadingRecords ? 'Loading…' : 'Load' }}</button>
      </form>

      <form [formGroup]="allergyForm" (ngSubmit)="addAllergy()" class="visit-form card" aria-labelledby="allergy-heading">
        <h3 id="allergy-heading">Allergy Record</h3>
        <input type="text" formControlName="allergen" placeholder="Allergen" />
        <input type="text" formControlName="reaction" placeholder="Reaction" />
        <input type="text" formControlName="severity" placeholder="Severity (MILD/MODERATE/SEVERE)" />
        <button type="submit" [disabled]="allergyForm.invalid || lookupForm.invalid">Add Allergy</button>
      </form>

      <form [formGroup]="problemForm" (ngSubmit)="addProblem()" class="visit-form card" aria-labelledby="problem-heading">
        <h3 id="problem-heading">Problem List Entry</h3>
        <input type="text" formControlName="diagnosisCode" placeholder="Diagnosis code" />
        <input type="text" formControlName="title" placeholder="Problem title" />
        <input type="text" formControlName="clinicalStatus" placeholder="Clinical status" />
        <button type="submit" [disabled]="problemForm.invalid || lookupForm.invalid">Add Problem</button>
      </form>

      <form [formGroup]="visitForm" (ngSubmit)="createVisit()" class="visit-form card" aria-labelledby="new-visit-heading">
        <h3 id="new-visit-heading">New Visit Note</h3>
        <input type="number" formControlName="doctorId" placeholder="Doctor ID" />
        <input type="date" formControlName="visitDate" />
        <input type="text" formControlName="diagnosisCode" placeholder="Diagnosis code (I10)" />
        <textarea formControlName="notes" rows="4" placeholder="SOAP notes"></textarea>
        <button type="submit" [disabled]="visitForm.invalid || lookupForm.invalid || savingVisit">{{ savingVisit ? 'Saving…' : 'Save Visit' }}</button>
      </form>

      <section class="section card" aria-labelledby="icd-heading">
        <h3 id="icd-heading">ICD-10 Quick Search</h3>
        <input type="text" [value]="icdSearch" (input)="onIcdInput($event)" placeholder="Search ICD code" />
        <div class="loading-text" *ngIf="loadingIcd">Searching ICD codes…</div>
        <ul class="list" *ngIf="!loadingIcd && icdResults.length > 0">
          <li *ngFor="let item of icdResults">{{ item }}</li>
        </ul>
      </section>

      <section class="section card" aria-labelledby="visit-history-heading">
        <h3 id="visit-history-heading">Visit History</h3>
        <div class="loading-text" *ngIf="loadingRecords">Loading visit records…</div>
        <div class="muted" *ngIf="!loadingRecords && visits.length === 0">No records loaded.</div>
        <ul class="list" *ngIf="!loadingRecords && visits.length > 0">
          <li *ngFor="let visit of visits">
            <strong>{{ visit.visitDate }}</strong>
            <span>{{ visit.diagnosisCode || '—' }}</span>
            <p>{{ visit.notes }}</p>
          </li>
        </ul>
      </section>

      <section class="section card" aria-labelledby="allergy-list-heading">
        <h3 id="allergy-list-heading">Allergy List</h3>
        <div class="muted" *ngIf="allergies.length === 0">No allergy records loaded.</div>
        <ul class="list" *ngIf="allergies.length > 0">
          <li *ngFor="let allergy of allergies">
            <strong>{{ allergy.allergen }}</strong>
            <span>{{ allergy.severity || 'UNSPECIFIED' }} · {{ allergy.status || 'ACTIVE' }}</span>
            <p>{{ allergy.reaction || 'No reaction details recorded.' }}</p>
          </li>
        </ul>
      </section>

      <section class="section card" aria-labelledby="problem-list-heading">
        <h3 id="problem-list-heading">Problem List</h3>
        <div class="muted" *ngIf="problems.length === 0">No problem-list records loaded.</div>
        <ul class="list" *ngIf="problems.length > 0">
          <li *ngFor="let problem of problems">
            <strong>{{ problem.title }}</strong>
            <span>{{ problem.diagnosisCode }} · {{ problem.clinicalStatus || 'ACTIVE' }}</span>
            <p>Onset: {{ problem.onsetDate || 'N/A' }}</p>
          </li>
        </ul>
      </section>
    </div>
  `,
  styles: [`
    .hero { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; }
    .subtitle { margin-top: 0.45rem; color: var(--text-soft); }
    .pill { border: 1px solid rgba(109,124,255,0.5); color: #aeb8ff; background: rgba(109,124,255,0.16); border-radius: 999px; padding: 0.35rem 0.75rem; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 700; white-space: nowrap; }
    .success { margin-top: 1rem; border: 1px solid rgba(34,197,94,0.45); background: rgba(34,197,94,0.12); color: #80e8a6; border-radius: 10px; padding: 0.65rem 0.8rem; }
    .card { border: 1px solid var(--border); border-radius: 14px; padding: 0.9rem; background: linear-gradient(180deg, rgba(26,39,64,0.65), rgba(15,23,38,0.95)); }
    .lookup, .visit-form { display: grid; gap: 0.6rem; margin-top: 1rem; }
    .section { margin-top: 1.2rem; }
    .muted { color: var(--text-soft); }
    .list { list-style: none; padding: 0; margin: 0.5rem 0 0; }
    .list li { border: 1px solid var(--border); border-radius: 10px; padding: 0.7rem; margin-bottom: 0.5rem; background: rgba(11, 18, 32, 0.55); }
    .list p { margin-top: 0.4rem; color: var(--text-soft); }

    @media (max-width: 760px) {
      .hero { flex-direction: column; }
    }
  `]
})
export class MedicalRecordsComponent {
  visits: VisitNote[] = [];
  allergies: AllergyRecord[] = [];
  problems: ProblemRecord[] = [];
  icdResults: string[] = [];
  icdSearch = '';
  successMessage = '';
  loadingRecords = false;
  savingVisit = false;
  loadingIcd = false;

  readonly lookupForm = this.fb.nonNullable.group({
    patientId: [0, [Validators.required, Validators.min(1)]]
  });

  readonly visitForm = this.fb.nonNullable.group({
    doctorId: [0, [Validators.required, Validators.min(1)]],
    visitDate: ['', Validators.required],
    diagnosisCode: [''],
    notes: ['', Validators.required]
  });

  readonly allergyForm = this.fb.nonNullable.group({
    allergen: ['', Validators.required],
    reaction: [''],
    severity: ['']
  });

  readonly problemForm = this.fb.nonNullable.group({
    diagnosisCode: ['', Validators.required],
    title: ['', Validators.required],
    clinicalStatus: ['']
  });

  constructor(
    private fb: FormBuilder,
    private recordsApi: RecordsApiService
  ) {}

  loadRecords(): void {
    if (this.lookupForm.invalid) return;
    const patientId = this.lookupForm.controls.patientId.value;
    this.loadingRecords = true;

    this.recordsApi.getVisits(patientId).subscribe({
      next: items => {
        this.visits = items;
        this.loadingRecords = false;
      },
      error: () => {
        this.visits = [];
        this.loadingRecords = false;
      }
    });

    this.recordsApi.getAllergies(patientId).subscribe({
      next: items => {
        this.allergies = items;
      },
      error: () => {
        this.allergies = [];
      }
    });

    this.recordsApi.getProblems(patientId).subscribe({
      next: items => {
        this.problems = items;
      },
      error: () => {
        this.problems = [];
      }
    });
  }

  createVisit(): void {
    if (this.lookupForm.invalid || this.visitForm.invalid) return;

    const payload: VisitNote = {
      patientId: this.lookupForm.controls.patientId.value,
      doctorId: this.visitForm.controls.doctorId.value,
      visitDate: this.visitForm.controls.visitDate.value,
      notes: this.visitForm.controls.notes.value,
      diagnosisCode: this.visitForm.controls.diagnosisCode.value
    };

    this.savingVisit = true;
    this.successMessage = '';

    this.recordsApi.createVisit(payload).subscribe({
      next: () => {
        this.visitForm.controls.notes.setValue('');
        this.successMessage = 'Visit note saved successfully.';
        this.savingVisit = false;
        this.loadRecords();
      },
      error: () => {
        this.savingVisit = false;
      }
    });
  }

  addAllergy(): void {
    if (this.lookupForm.invalid || this.allergyForm.invalid) return;
    const patientId = this.lookupForm.controls.patientId.value;
    const payload: AllergyRecord = {
      patientId,
      allergen: this.allergyForm.controls.allergen.value,
      reaction: this.allergyForm.controls.reaction.value,
      severity: this.allergyForm.controls.severity.value
    };

    this.recordsApi.addAllergy(patientId, payload).subscribe({
      next: () => {
        this.allergyForm.reset({ allergen: '', reaction: '', severity: '' });
        this.successMessage = 'Allergy record added successfully.';
        this.loadRecords();
      }
    });
  }

  addProblem(): void {
    if (this.lookupForm.invalid || this.problemForm.invalid) return;
    const patientId = this.lookupForm.controls.patientId.value;
    const payload: ProblemRecord = {
      patientId,
      diagnosisCode: this.problemForm.controls.diagnosisCode.value,
      title: this.problemForm.controls.title.value,
      clinicalStatus: this.problemForm.controls.clinicalStatus.value
    };

    this.recordsApi.addProblem(patientId, payload).subscribe({
      next: () => {
        this.problemForm.reset({ diagnosisCode: '', title: '', clinicalStatus: '' });
        this.successMessage = 'Problem list entry added successfully.';
        this.loadRecords();
      }
    });
  }

  onIcdInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.icdSearch = target.value;
    this.loadingIcd = true;

    this.recordsApi.searchIcd(this.icdSearch).subscribe({
      next: items => {
        this.icdResults = items;
        this.loadingIcd = false;
      },
      error: () => {
        this.icdResults = [];
        this.loadingIcd = false;
      }
    });
  }
}
