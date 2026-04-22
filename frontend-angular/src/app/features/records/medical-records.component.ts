import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AllergyRecord, ProblemRecord, RecordsApiService, VisitNote } from './records-api.service';
import { PatientContextService } from '../../core/patient-context.service';
import { AuthService } from '../../core/auth.service';

type RecordsTab = 'history' | 'note' | 'allergies' | 'problems';

@Component({
  selector: 'app-medical-records',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="container">
      <div class="hero">
        <div>
          <h2>Electronic Medical Records</h2>
          <p class="subtitle">Longitudinal clinical history, diagnosis coding, and structured SOAP progress notes.</p>
        </div>
        <div class="pill">EMR Core</div>
      </div>

      <div class="success" *ngIf="successMessage" role="status" aria-live="polite">{{ successMessage }}</div>

      <!-- Active Patient Context Indicator -->
      <div class="ctx-alert" *ngIf="activePatient; else noPatient">
        <div class="ctx-info">
          <strong>Chart Open: {{ activePatient.name }}</strong> (ID: #{{ activePatient.id }})
        </div>
        <div class="ctx-badge">EMR Context Locked</div>
      </div>
      <ng-template #noPatient>
        <div class="ctx-alert warning">
          <div class="ctx-info">No patient selected. Please select a patient from the Dashboard to access clinical records.</div>
        </div>
      </ng-template>

      <div class="emr-workspace" *ngIf="activePatient">
        <!-- Tab Navigation -->
        <nav class="tab-nav">
          <button (click)="activeTab = 'history'" [class.active]="activeTab === 'history'">Clinical History</button>
          <button (click)="activeTab = 'note'" [class.active]="activeTab === 'note'">New SOAP Note</button>
          <button (click)="activeTab = 'allergies'" [class.active]="activeTab === 'allergies'">Allergies</button>
          <button (click)="activeTab = 'problems'" [class.active]="activeTab === 'problems'">Problem List</button>
        </nav>

        <div class="tab-content card">
          <!-- Clinical History Tab -->
          <div *ngIf="activeTab === 'history'" class="history-tab">
            <div class="section-header">
              <h3>Visit History & Progress Notes</h3>
              <button class="small-btn" (click)="loadRecords()">Refresh History</button>
            </div>
            <div class="loading-text" *ngIf="loadingRecords">Fetching EMR timeline...</div>
            <div class="empty-state" *ngIf="!loadingRecords && visits.length === 0">No historical visit notes found.</div>
            
            <div class="timeline">
              <div class="timeline-item" *ngFor="let visit of visits">
                <div class="timeline-date">{{ visit.visitDate }}</div>
                <div class="timeline-card">
                  <div class="timeline-header">
                    <span class="diag-code">{{ visit.diagnosisCode || 'V70.0' }}</span>
                    <span class="visit-meta">Seen by Dr. ID #{{ visit.doctorId }}</span>
                  </div>
                  <div class="visit-notes">{{ visit.notes }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- New Progress Note Tab -->
          <div *ngIf="activeTab === 'note'" class="note-tab">
            <h3>New Progress Note (SOAP)</h3>
            <form [formGroup]="visitForm" (ngSubmit)="createVisit()" class="soap-form">
              <div class="form-row">
                <div class="input-group">
                  <label>Visit Date</label>
                  <input type="date" formControlName="visitDate" />
                </div>
                <div class="input-group">
                  <label>Primary Diagnosis (ICD-10)</label>
                  <div class="icd-input-wrap">
                    <input type="text" formControlName="diagnosisCode" placeholder="Search or enter ICD-10..." (input)="onIcdInput($event)" />
                    <ul class="icd-results" *ngIf="icdResults.length > 0">
                      <li *ngFor="let res of icdResults" (click)="selectIcd(res)">{{ res }}</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div class="input-group">
                <label>Clinical Notes (Subjective, Objective, Assessment, Plan)</label>
                <textarea formControlName="notes" rows="10" placeholder="S: Patient reports...\nO: BP 120/80...\nA: Primary HTN controlled...\nP: Continue current regimen..."></textarea>
              </div>

              <div class="form-actions">
                <button type="submit" class="primary-btn" [disabled]="visitForm.invalid || savingVisit">
                  {{ savingVisit ? 'Signing Note...' : 'Sign & Save Progress Note' }}
                </button>
              </div>
            </form>
          </div>

          <!-- Allergies Tab -->
          <div *ngIf="activeTab === 'allergies'" class="allergies-tab">
            <div class="tab-layout">
              <div class="entry-side">
                <h3>Add Allergy Record</h3>
                <form [formGroup]="allergyForm" (ngSubmit)="addAllergy()" class="stacked-form">
                  <input type="text" formControlName="allergen" placeholder="Allergen (e.g. Penicillin)" />
                  <input type="text" formControlName="reaction" placeholder="Reaction (e.g. Hives)" />
                  <select formControlName="severity">
                     <option value="">Select Severity...</option>
                     <option value="MILD">MILD</option>
                     <option value="MODERATE">MODERATE</option>
                     <option value="SEVERE">SEVERE</option>
                  </select>
                  <button type="submit" [disabled]="allergyForm.invalid">Record Allergy</button>
                </form>
              </div>
              <div class="list-side">
                <h3>Active Allergies</h3>
                <ul class="clinical-list">
                  <li *ngFor="let allergy of allergies" [class.severe]="allergy.severity === 'SEVERE'">
                    <strong>{{ allergy.allergen }}</strong>
                    <span class="meta">{{ allergy.severity }} · {{ allergy.reaction }}</span>
                  </li>
                  <div class="muted small" *ngIf="allergies.length === 0">No known allergies.</div>
                </ul>
              </div>
            </div>
          </div>

          <!-- Problem List Tab -->
          <div *ngIf="activeTab === 'problems'" class="problems-tab">
            <div class="tab-layout">
              <div class="entry-side">
                <h3>Update Problem List</h3>
                <form [formGroup]="problemForm" (ngSubmit)="addProblem()" class="stacked-form">
                  <input type="text" formControlName="diagnosisCode" placeholder="Search ICD-10..." (input)="onIcdInput($event)" />
                  <ul class="icd-results small" *ngIf="icdResults.length > 0">
                    <li *ngFor="let res of icdResults" (click)="selectProblemIcd(res)">{{ res }}</li>
                  </ul>
                  <input type="text" formControlName="title" placeholder="Problem Title (e.g. Chronic Kidney Disease)" />
                  <select formControlName="clinicalStatus">
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="DORMANT">DORMANT</option>
                  </select>
                  <button type="submit" [disabled]="problemForm.invalid">Add to Problem List</button>
                </form>
              </div>
              <div class="list-side">
                <h3>Active Problem List</h3>
                <ul class="clinical-list">
                  <li *ngFor="let problem of problems">
                    <strong>{{ problem.title }}</strong>
                    <span class="meta">{{ problem.diagnosisCode }} · {{ problem.clinicalStatus }}</span>
                  </li>
                  <div class="muted small" *ngIf="problems.length === 0">No active problems recorded.</div>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .hero { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; margin-bottom: 2rem; }
    .subtitle { margin-top: 0.45rem; color: var(--text-soft); }
    .pill { border: 1px solid rgba(109, 124, 255, 0.4); color: #aeb8ff; background: rgba(109, 124, 255, 0.1); border-radius: 999px; padding: 0.35rem 0.75rem; font-size: 0.78rem; text-transform: uppercase; font-weight: 700; }

    .success { margin-bottom: 1.5rem; border: 1px solid rgba(34,197,94,0.45); background: rgba(34,197,94,0.12); color: #80e8a6; border-radius: 10px; padding: 0.65rem 0.8rem; }

    .ctx-alert { 
      display: flex; justify-content: space-between; align-items: center; 
      background: rgba(0, 212, 170, 0.08); border: 1px solid rgba(0, 212, 170, 0.25); border-radius: 12px; 
      padding: 1rem; margin-bottom: 2rem; 
    }
    .ctx-alert.warning { background: rgba(255, 90, 114, 0.08); border-color: rgba(255, 90, 114, 0.25); color: #ff9ca9; }
    .ctx-info { font-size: 1rem; }
    .ctx-badge { font-size: 0.7rem; text-transform: uppercase; border: 1px solid var(--primary); color: var(--primary); padding: 0.2rem 0.5rem; border-radius: 4px; }

    .emr-workspace { margin-top: 1rem; }
    .tab-nav { display: flex; gap: 0.5rem; margin-bottom: -1px; position: relative; z-index: 2; }
    .tab-nav button { 
      background: rgba(26, 39, 64, 0.6); border: 1px solid var(--border); border-bottom: none;
      color: var(--text-soft); padding: 0.8rem 1.5rem; border-radius: 12px 12px 0 0; cursor: pointer; transition: all 0.2s;
    }
    .tab-nav button.active { background: rgba(26, 39, 64, 0.9); color: var(--primary); border-top: 2px solid var(--primary); font-weight: 700; }

    .tab-content { border-top-left-radius: 0; min-height: 500px; padding: 2rem; background: rgba(26, 39, 64, 0.65); border: 1px solid var(--border); border-radius: 16px; position: relative; z-index: 1; }

    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .small-btn { background: transparent; border: 1px solid var(--border); color: var(--text-soft); padding: 0.3rem 0.6rem; border-radius: 6px; cursor: pointer; }

    .timeline { position: relative; padding-left: 2rem; }
    .timeline::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 2px; background: var(--border); }
    .timeline-item { position: relative; margin-bottom: 2.5rem; }
    .timeline-item::before { content: ''; position: absolute; left: -2.35rem; top: 0.5rem; width: 12px; height: 12px; background: var(--primary); border-radius: 50%; box-shadow: 0 0 10px var(--primary); }
    .timeline-date { font-weight: 700; color: var(--primary); margin-bottom: 0.5rem; font-size: 0.9rem; }
    .timeline-card { background: rgba(11, 18, 32, 0.4); border: 1px solid var(--border); border-radius: 12px; padding: 1.2rem; }
    .timeline-header { display: flex; justify-content: space-between; margin-bottom: 0.8rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 0.5rem; }
    .diag-code { font-family: monospace; font-weight: 700; font-size: 1rem; color: #fff; }
    .visit-meta { font-size: 0.8rem; color: var(--text-muted); }
    .visit-notes { font-size: 0.95rem; line-height: 1.5; color: var(--text-soft); white-space: pre-wrap; }

    .soap-form { display: grid; gap: 1.5rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .input-group label { display: block; font-size: 0.85rem; margin-bottom: 0.5rem; color: var(--text-muted); font-weight: 600; }
    .input-group input, .input-group textarea { width: 100%; background: rgba(11,18,32,0.8); border: 1px solid var(--border); padding: 0.8rem; color: #fff; border-radius: 8px; font-family: inherit; }
    .icd-input-wrap { position: relative; }
    .icd-results { 
      position: absolute; top: 100%; left: 0; right: 0; z-index: 10;
      background: #1a2740; border: 1px solid var(--primary); border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      list-style: none; padding: 0; margin-top: 4px; max-height: 200px; overflow-y: auto;
    }
    .icd-results li { padding: 0.7rem; border-bottom: 1px solid var(--border); cursor: pointer; color: var(--primary); font-family: monospace; }
    .icd-results li:hover { background: rgba(0,212,170,0.1); }

    .tab-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; }
    .clinical-list { list-style: none; padding: 0; }
    .clinical-list li { 
      background: rgba(11, 18, 32, 0.4); border: 1px solid var(--border); 
      padding: 1rem; border-radius: 10px; margin-bottom: 0.8rem; display: flex; flex-direction: column;
    }
    .clinical-list li.severe { border-left: 4px solid #ff5a72; background: rgba(255, 90, 114, 0.05); }
    .clinical-list .meta { font-size: 0.8rem; color: var(--text-soft); margin-top: 0.3rem; }

    .stacked-form { display: grid; gap: 0.8rem; }
    .stacked-form input, .stacked-form select { width: 100%; background: rgba(11,18,32,0.8); border: 1px solid var(--border); padding: 0.7rem; color: #fff; border-radius: 8px; }
    .stacked-form button { background: var(--primary); color: #000; border: none; padding: 0.7rem; border-radius: 8px; font-weight: 700; cursor: pointer; }

    .primary-btn { background: var(--primary); color: #000; border: none; padding: 1rem 2rem; border-radius: 10px; font-weight: 800; font-size: 1rem; cursor: pointer; display: block; width: 100%; }

    @media (max-width: 900px) {
      .form-row, .tab-layout { grid-template-columns: 1fr; }
    }
  `]
})
export class MedicalRecordsComponent implements OnInit, OnDestroy {
  activeTab: RecordsTab = 'history';
  activePatient: any | null = null;
  visits: VisitNote[] = [];
  allergies: AllergyRecord[] = [];
  problems: ProblemRecord[] = [];
  icdResults: string[] = [];
  successMessage = '';
  loadingRecords = false;
  savingVisit = false;
  private sub = new Subscription();

  readonly visitForm = this.fb.nonNullable.group({
    visitDate: [new Date().toISOString().slice(0, 10), Validators.required],
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
    clinicalStatus: ['ACTIVE']
  });

  constructor(
    private fb: FormBuilder,
    private recordsApi: RecordsApiService,
    private contextService: PatientContextService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.sub.add(this.contextService.activePatient$.subscribe(p => {
      this.activePatient = p;
      if (p) this.loadRecords();
      else {
        this.visits = [];
        this.allergies = [];
        this.problems = [];
      }
    }));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  loadRecords(): void {
    if (!this.activePatient) return;
    const patientId = Number(this.activePatient.id);
    this.loadingRecords = true;

    this.recordsApi.getVisits(patientId).subscribe({
      next: items => {
        this.visits = items.sort((a,b) => b.visitDate.localeCompare(a.visitDate));
        this.loadingRecords = false;
      },
      error: () => this.loadingRecords = false
    });

    this.recordsApi.getAllergies(patientId).subscribe({
      next: items => this.allergies = items
    });

    this.recordsApi.getProblems(patientId).subscribe({
      next: items => this.problems = items
    });
  }

  createVisit(): void {
    if (!this.activePatient || this.visitForm.invalid) return;

    const payload: VisitNote = {
      patientId: Number(this.activePatient.id),
      doctorId: Number(this.auth.getUserId()) || 1,
      visitDate: this.visitForm.controls.visitDate.value,
      notes: this.visitForm.controls.notes.value,
      diagnosisCode: this.visitForm.controls.diagnosisCode.value
    };

    this.savingVisit = true;
    this.successMessage = '';

    this.recordsApi.createVisit(payload).subscribe({
      next: () => {
        this.successMessage = 'Progress note signed and saved to EMR.';
        this.savingVisit = false;
        this.visitForm.patchValue({ notes: '', diagnosisCode: '' });
        this.loadRecords();
        this.activeTab = 'history';
      },
      error: () => this.savingVisit = false
    });
  }

  addAllergy(): void {
    if (!this.activePatient || this.allergyForm.invalid) return;
    const patientId = Number(this.activePatient.id);
    const payload: AllergyRecord = {
      patientId,
      allergen: this.allergyForm.controls.allergen.value,
      reaction: this.allergyForm.controls.reaction.value,
      severity: this.allergyForm.controls.severity.value,
      notedDate: new Date().toISOString().slice(0, 10)
    };

    this.recordsApi.addAllergy(patientId, payload).subscribe({
      next: () => {
        this.allergyForm.reset({ allergen: '', reaction: '', severity: '' });
        this.successMessage = 'Allergy documentation complete.';
        this.loadRecords();
      }
    });
  }

  addProblem(): void {
    if (!this.activePatient || this.problemForm.invalid) return;
    const patientId = Number(this.activePatient.id);
    const payload: ProblemRecord = {
      patientId,
      diagnosisCode: this.problemForm.controls.diagnosisCode.value,
      title: this.problemForm.controls.title.value,
      clinicalStatus: this.problemForm.controls.clinicalStatus.value
    };

    this.recordsApi.addProblem(patientId, payload).subscribe({
      next: () => {
        this.problemForm.reset({ diagnosisCode: '', title: '', clinicalStatus: 'ACTIVE' });
        this.successMessage = 'Problem list status updated.';
        this.loadRecords();
      }
    });
  }

  onIcdInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const q = target.value.trim();
    if (q.length < 2) {
      this.icdResults = [];
      return;
    }
    this.recordsApi.searchIcd(q).subscribe({
      next: items => this.icdResults = items
    });
  }

  selectIcd(code: string): void {
    this.visitForm.patchValue({ diagnosisCode: code });
    this.icdResults = [];
  }

  selectProblemIcd(code: string): void {
    this.problemForm.patchValue({ diagnosisCode: code });
    this.icdResults = [];
  }
}
