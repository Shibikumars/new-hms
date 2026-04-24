import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Subscription, interval } from 'rxjs';
import { AllergyRecord, MedicalRecordsApiService, ProblemRecord, VisitNote, VitalRecord } from '../medical-records/medical-records-api.service';
import { PatientContextService } from '../../core/patient-context.service';
import { AuthService } from '../../core/auth.service';
import { PharmacyApiService, Prescription, PrescriptionItem, Medication } from '../pharmacy/pharmacy-api.service';
import { LabApiService, LabOrder, LabTest, LabReport } from '../lab/lab-api.service';
import { ToastService } from '../../core/toast.service';
import { AutocompleteComponent } from '../../shared/components/autocomplete/autocomplete.component';
import { DataTableComponent, ColumnConfig } from '../../shared/components/data-table/data-table.component';
import { DatePickerComponent } from '../../shared/components/date-picker/date-picker.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { MRNDisplayComponent } from '../../shared/components/mrn-display/mrn-display.component';

declare var Chart: any;

type RecordsTab = 'history' | 'note' | 'vitals' | 'allergies' | 'problems' | 'pharmacy' | 'lab';

@Component({
  selector: 'app-medical-records',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, AutocompleteComponent, DataTableComponent, DatePickerComponent, StatusBadgeComponent, MRNDisplayComponent],
  template: `
    <div class="container clinical-bg">
      <!-- ALLERGY ALERT BANNER (CRITICAL STEP 5) -->
      <div class="allergy-critical-alert" *ngIf="allergies.length > 0">
         <i class="ph ph-warning-octagon-fill"></i>
         <div class="alert-msg">
            <strong>CLINICAL ALERT: KNOWN ALLERGIES</strong>
            <span>{{ allergySummary }}</span>
         </div>
      </div>

      <header class="emr-header">
        <div class="header-left">
          <h1 class="page-title">Electronic Health Record (EHR)</h1>
          <p class="page-subtitle">Longitudinal patient history, clinical vitals, and structured SOAP notes.</p>
        </div>
        <div class="header-right" *ngIf="activePatient">
          <app-mrn-display [mrn]="activePatient.id"></app-mrn-display>
        </div>
      </header>

      <!-- VITALS QUICK BAR (STEP 5) -->
      <div class="vitals-quick-bar card shadow-glass" *ngIf="latestVitals">
         <div class="v-item">
            <label>Blood Pressure</label>
            <strong>{{ latestVitals.bloodPressure || '120/80' }}</strong>
            <span>mmHg</span>
         </div>
         <div class="v-item">
            <label>Heart Rate</label>
            <strong>{{ latestVitals.heartRate || '72' }}</strong>
            <span>bpm</span>
         </div>
         <div class="v-item">
            <label>Temperature</label>
            <strong>{{ latestVitals.temperature || '98.6' }}</strong>
            <span>°F</span>
         </div>
         <div class="v-item">
            <label>SpO2</label>
            <strong>{{ latestVitals.spo2 || '98' }}</strong>
            <span>%</span>
         </div>
         <div class="v-item-action">
            <button class="ph-btn sm secondary" (click)="activeTab = 'vitals'"><i class="ph ph-pencil"></i> Log Vitals</button>
         </div>
      </div>

      <div class="context-banner" [class.no-patient]="!activePatient">
        <div class="banner-content" *ngIf="activePatient">
          <div class="patient-brief">
            <div class="p-avatar">{{ activePatient.name?.charAt(0) }}</div>
            <div class="p-meta">
              <strong>{{ activePatient.name }}</strong>
              <span>Clinical Session · Provider: {{ auth.getUsername() }}</span>
            </div>
          </div>
          <div class="session-timer">
            <i class="ph ph-play-circle-bold"></i>
            <span>Session Duration: {{ sessionTime }}</span>
          </div>
        </div>
        <div class="banner-empty" *ngIf="!activePatient">
          <i class="ph ph-lock-keyhole-bold"></i>
          <span>No active patient context. Please select a patient to begin documentation.</span>
        </div>
      </div>

      <div class="emr-shell" *ngIf="activePatient">
        <aside class="emr-sidebar">
          <button (click)="activeTab = 'history'" [class.active]="activeTab === 'history'">
            <i class="ph ph-clock-counter-clockwise"></i> Visit History
          </button>
          <button (click)="activeTab = 'vitals'" [class.active]="activeTab === 'vitals'">
            <i class="ph ph-heartbeat"></i> Vitals & Trends
          </button>
          <button (click)="activeTab = 'note'" [class.active]="activeTab === 'note'">
            <i class="ph ph-note-pencil"></i> New SOAP Note
          </button>
          <button (click)="activeTab = 'allergies'" [class.active]="activeTab === 'allergies'">
            <i class="ph ph-warning-circle"></i> Allergies
          </button>
          <button (click)="activeTab = 'problems'" [class.active]="activeTab === 'problems'">
            <i class="ph ph-list-checks"></i> Problem List
          </button>
          <button (click)="activeTab = 'pharmacy'" [class.active]="activeTab === 'pharmacy'">
            <i class="ph ph-prescription"></i> E-Prescribe
          </button>
          <button (click)="activeTab = 'lab'" [class.active]="activeTab === 'lab'">
            <i class="ph ph-test-tube"></i> Order Labs
          </button>
        </aside>

        <main class="emr-main">
          <!-- History Tab -->
          <div *ngIf="activeTab === 'history'" class="tab-pane">
            <div class="pane-header">
              <h3>Clinical Timeline</h3>
              <button class="ph-btn sm" (click)="loadRecords()">Refresh</button>
            </div>
            <div class="clinical-timeline-table card">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Diagnosis</th>
                    <th>Findings</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let v of visits">
                    <td>{{ v.visitDate }}</td>
                    <td><span class="badge neutral">{{ v.diagnosisCode }}</span></td>
                    <td>{{ v.assessment | slice:0:60 }}...</td>
                    <td>
                      <button class="ph-btn sm secondary" (click)="downloadSummary(v.id!)">
                        <i class="ph ph-file-pdf"></i> PDF
                      </button>
                    </td>
                  </tr>
                  <tr *ngIf="visits.length === 0">
                    <td colspan="4" class="text-center">No visits found.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Vitals Tab (Step 5 Trending) -->
          <div *ngIf="activeTab === 'vitals'" class="tab-pane">
             <div class="pane-header">
                <h3>Vitals Monitoring</h3>
             </div>
             <div class="vitals-layout">
                <div class="vitals-form card">
                   <h4>New Reading</h4>
                   <form [formGroup]="vitalForm" (ngSubmit)="logVitals()" class="stack-form">
                      <div class="form-row">
                         <input type="text" formControlName="bloodPressure" placeholder="BP (e.g. 120/80)" />
                         <input type="number" formControlName="heartRate" placeholder="HR (bpm)" />
                      </div>
                      <div class="form-row">
                         <input type="number" formControlName="temperature" placeholder="Temp (°F)" />
                         <input type="number" formControlName="spo2" placeholder="SpO2 (%)" />
                      </div>
                      <button type="submit" class="ph-btn primary full">Log Vitals</button>
                   </form>
                </div>
                <div class="vitals-trends">
                   <h4>Clinical Trends (HR)</h4>
                   <div class="chart-container">
                      <canvas #vitalsChart></canvas>
                   </div>
                </div>
             </div>
          </div>

          <!-- SOAP Note Tab -->
          <div *ngIf="activeTab === 'note'" class="tab-pane">
            <div class="pane-header">
              <h3>Structured SOAP Progress Note</h3>
              <span class="badge neutral">New Clinical Entry</span>
            </div>
            <form [formGroup]="visitForm" (ngSubmit)="createVisit()" class="soap-grid">
              <div class="soap-meta">
                <div class="form-group">
                  <label>Primary Diagnosis (ICD-10 Search)</label>
                  <app-autocomplete [suggestions]="icdSuggestions" placeholder="Ex: Fever (R50.9)" (onQuery)="searchIcd($event)" (onSelect)="selectIcd($event)"></app-autocomplete>
                </div>
              </div>
              <div class="soap-sections">
                <div class="form-group"><label>Subjective (S)</label><textarea formControlName="subjective" placeholder="Patient reports..." rows="3"></textarea></div>
                <div class="form-group"><label>Objective (O)</label><textarea formControlName="objective" placeholder="Exam findings, vitals..." rows="3"></textarea></div>
                <div class="form-group"><label>Assessment (A)</label><textarea formControlName="assessment" placeholder="Diagnosis reasoning..." rows="3"></textarea></div>
                <div class="form-group"><label>Plan (P)</label><textarea formControlName="plan" placeholder="Treatment, prescriptions, labs..." rows="3"></textarea></div>
              </div>
              <div class="form-footer">
                <button type="submit" class="ph-btn primary xl" [disabled]="visitForm.invalid || savingVisit">Sign & Submit Note</button>
              </div>
            </form>
          </div>

          <!-- Allergies Tab -->
          <div *ngIf="activeTab === 'allergies'" class="tab-pane">
            <div class="pane-header"><h3>Active Allergies</h3></div>
            <div class="split-layout">
              <div class="entry-box card">
                <h4>Log Allergen</h4>
                <form [formGroup]="allergyForm" (ngSubmit)="addAllergy()" class="stack-form">
                  <input type="text" formControlName="allergen" placeholder="Substance" />
                  <input type="text" formControlName="reaction" placeholder="Reaction" />
                  <select formControlName="severity"><option value="MILD">MILD</option><option value="MODERATE">MODERATE</option><option value="SEVERE">SEVERE</option></select>
                  <button type="submit" class="ph-btn primary">Add Record</button>
                </form>
              </div>
              <div class="list-box">
                <app-data-table [data]="allergies" [columns]="allergyColumns"></app-data-table>
              </div>
            </div>
          <!-- Pharmacy Tab -->
          <div *ngIf="activeTab === 'pharmacy'" class="tab-pane">
            <div class="pane-header">
               <h3>Electronic Prescription Pad</h3>
               <span class="badge success">New Order</span>
            </div>
            
            <div class="prescription-workspace">
               <div class="med-search">
                  <app-autocomplete [suggestions]="medSuggestions" placeholder="Find Drug (Generic/Brand)" (onQuery)="searchMeds($event)" (onSelect)="addMedToPrescription($event)"></app-autocomplete>
               </div>
               
               <div class="items-list card shadow-glass mt-1">
                  <div class="item-header">
                     <span>Medication</span>
                     <span>Dosage</span>
                     <span>Freq</span>
                     <span>Dur</span>
                     <span></span>
                  </div>
                  <div class="presc-item" *ngFor="let item of currentPrescItems; let i = index">
                     <strong>{{ item.medicationName }}</strong>
                     <input type="text" [(ngModel)]="item.dose" placeholder="500mg" />
                     <input type="text" [(ngModel)]="item.frequency" placeholder="1-0-1" />
                     <input type="text" [(ngModel)]="item.duration" placeholder="5 Days" />
                     <button class="btn-icon delete" (click)="currentPrescItems.splice(i, 1)"><i class="ph ph-trash"></i></button>
                  </div>
                  <div class="empty-presc" *ngIf="currentPrescItems.length === 0">No medications added. Search above to start prescribing.</div>
               </div>
               
               <div class="presc-actions mt-2">
                  <button class="ph-btn primary xl" (click)="issuePrescription()" [disabled]="currentPrescItems.length === 0">Sign & Route to Pharmacy</button>
               </div>
            </div>
          </div>

          <!-- Lab Tab -->
          <div *ngIf="activeTab === 'lab'" class="tab-pane">
            <div class="pane-header">
               <h3>Diagnostic Orders</h3>
               <span class="badge info">STAT Enabled</span>
            </div>
            <div class="lab-workspace">
               <div class="test-catalog-grid">
                  <div class="test-card-simple" *ngFor="let test of labCatalog" (click)="placeLabOrder(test)">
                     <div class="test-icon"><i class="ph ph-flask"></i></div>
                     <div class="test-info">
                        <strong>{{ test.testName }}</strong>
                        <span>{{ test.loincCode || 'Diagnostic' }} • ₹{{ test.price }}</span>
                     </div>
                     <i class="ph ph-plus-circle"></i>
                  </div>
               </div>
            </div>
          </div>
    </div>
  `,
  styles: [`
    .clinical-bg { padding: 2rem; background: #F8FAFC; min-height: 100vh; }
    .allergy-critical-alert { background: #EF4444; color: #fff; padding: 1rem 2rem; border-radius: 12px; margin-bottom: 2rem; display: flex; align-items: center; gap: 1rem; animation: slideInDown 0.5s; }
    .allergy-critical-alert i { font-size: 2rem; }
    .alert-msg strong { display: block; font-size: 0.8rem; letter-spacing: 0.1em; }
    .alert-msg span { font-weight: 700; font-size: 1.1rem; }

    .emr-header { display: flex; justify-content: space-between; margin-bottom: 2rem; }
    .page-title { font-size: 1.8rem; color: #1E293B; font-weight: 800; }
    .page-subtitle { color: #64748B; font-size: 0.95rem; }

    .vitals-quick-bar { display: flex; gap: 3rem; padding: 1.5rem 2.5rem; margin-bottom: 2rem; background: #fff; align-items: center; }
    .v-item { display: flex; flex-direction: column; }
    .v-item label { font-size: 0.7rem; text-transform: uppercase; font-weight: 800; color: #64748B; }
    .v-item strong { font-size: 1.5rem; color: #1E293B; font-family: 'Syne', sans-serif; }
    .v-item span { font-size: 0.75rem; color: #64748B; font-weight: 700; }
    .v-item-action { margin-left: auto; }

    .session-timer { background: #E2E8F0; padding: 0.5rem 1.25rem; border-radius: 99px; font-weight: 800; font-size: 0.85rem; color: #1E293B; display: flex; align-items: center; gap: 0.5rem; }

    .emr-shell { display: grid; grid-template-columns: 260px 1fr; gap: 2.5rem; }
    .emr-sidebar { display: grid; gap: 0.5rem; height: fit-content; }
    .emr-sidebar button { background: transparent; border: none; padding: 1rem 1.5rem; border-radius: 14px; text-align: left; font-weight: 700; color: #475569; display: flex; align-items: center; gap: 1rem; cursor: pointer; transition: 0.2s; }
    .emr-sidebar button.active { background: #6366f1; color: #fff; box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.3); }

    .tab-pane { background: #fff; border: 1px solid #E2E8F0; border-radius: 24px; padding: 2.5rem; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); }

    .clinical-timeline-table { padding: 0; overflow: hidden; margin-top: 1rem; }
    .clinical-timeline-table table { width: 100%; border-collapse: collapse; }
    .clinical-timeline-table th { background: #F8FAFC; text-align: left; padding: 1rem; font-size: 0.75rem; text-transform: uppercase; color: #64748B; border-bottom: 1px solid #E2E8F0; }
    .clinical-timeline-table td { padding: 1rem; border-bottom: 1px solid #E2E8F0; font-size: 0.85rem; color: #1E293B; }
    .clinical-timeline-table tr:hover { background: #F8FAFC; }
    .text-center { text-align: center; }

    .vitals-layout { display: grid; grid-template-columns: 320px 1fr; gap: 2.5rem; }
    .chart-container { height: 300px; margin-top: 1.5rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

    .stack-form input, .stack-form select, textarea { width: 100%; border: 1px solid #E2E8F0; padding: 0.85rem; border-radius: 12px; background: #F8FAFC; font-weight: 600; margin-bottom: 0.5rem; }
    .soap-sections { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-top: 1.5rem; }
    
    .ph-btn { padding: 0.75rem 1.5rem; border-radius: 12px; font-weight: 700; border: none; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; }
    .ph-btn.primary { background: #6366f1; color: #fff; }
    .ph-btn.secondary { background: #F1F5F9; color: #475569; }
    .ph-btn.xl { width: 100%; justify-content: center; padding: 1.25rem; font-size: 1.1rem; }

    /* Pharmacy & Lab Workspace Styles */
    .mt-1 { margin-top: 1rem; }
    .mt-2 { margin-top: 2rem; }
    .item-header { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 50px; gap: 1rem; padding: 1rem; background: #F1F5F9; font-weight: 800; font-size: 0.75rem; text-transform: uppercase; color: #64748B; border-radius: 12px 12px 0 0; }
    .presc-item { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 50px; gap: 1rem; align-items: center; padding: 1rem; border-bottom: 1px solid #F1F5F9; }
    .presc-item input { padding: 0.5rem; border-radius: 8px; border: 1px solid #E2E8F0; font-size: 0.85rem; font-weight: 600; width: 100%; }
    .btn-icon.delete { color: #EF4444; background: transparent; border: none; cursor: pointer; font-size: 1.2rem; }
    .empty-presc { padding: 3rem; text-align: center; color: #94A3B8; font-weight: 600; }
    
    .test-catalog-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; margin-top: 1.5rem; }
    .test-card-simple { display: flex; align-items: center; gap: 1.25rem; padding: 1.5rem; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 20px; cursor: pointer; transition: 0.2s; }
    .test-card-simple:hover { border-color: #6366f1; background: #fff; box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.1); transform: translateY(-3px); }
    .test-icon { font-size: 2rem; color: #6366f1; }
    .test-info { display: flex; flex-direction: column; }
    .test-info strong { font-size: 1rem; color: #1E293B; }
    .test-info span { font-size: 0.75rem; color: #64748B; font-weight: 700; }

    @keyframes slideInDown { from { transform: translateY(-50PX); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  `]
})
export class MedicalRecordsComponent implements OnInit, OnDestroy {
  @ViewChild('vitalsChart') vitalsChartCanvas!: ElementRef;

  activeTab: RecordsTab = 'history';
  activePatient: any | null = null;
  visits: VisitNote[] = [];
  vitals: VitalRecord[] = [];
  latestVitals: VitalRecord | null = null;
  allergies: AllergyRecord[] = [];
  problems: ProblemRecord[] = [];
  icdSuggestions: string[] = [];
  successMessage = '';
  savingVisit = false;
  sessionTime = '00:00';
  private sub = new Subscription();
  private chart: any;
  
  // Pharmacy/Lab Props
  medSuggestions: string[] = [];
  currentPrescItems: PrescriptionItem[] = [];
  labCatalog: LabTest[] = [];

  readonly visitColumns: ColumnConfig[] = [
    { key: 'visitDate', label: 'Date' },
    { key: 'diagnosisCode', label: 'ICD-10' },
    { key: 'assessment', label: 'Findings' }
  ];

  readonly allergyColumns: ColumnConfig[] = [
    { key: 'allergen', label: 'Allergen' },
    { key: 'severity', label: 'Severity', cellTemplate: 'badge' }
  ];

  readonly visitForm = this.fb.nonNullable.group({
    diagnosisCode: ['', Validators.required],
    subjective: ['', Validators.required],
    objective: ['', Validators.required],
    assessment: ['', Validators.required],
    plan: ['', Validators.required]
  });

  readonly vitalForm = this.fb.nonNullable.group({
    bloodPressure: ['120/80'],
    heartRate: [72],
    temperature: [98.6],
    spo2: [98]
  });

  readonly allergyForm = this.fb.nonNullable.group({
    allergen: ['', Validators.required],
    reaction: [''],
    severity: ['MILD']
  });

  constructor(
    private fb: FormBuilder, 
    private medicalApi: MedicalRecordsApiService, 
    private pharmacyApi: PharmacyApiService,
    private labApi: LabApiService,
    private toast: ToastService,
    private contextService: PatientContextService, 
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    const role = this.auth.getRole()?.toUpperCase();
    if (role === 'PATIENT' && !this.contextService.getActivePatient()) {
       const userId = Number(this.auth.getUserId());
       const username = this.auth.getUsername() ?? 'Patient';
       if (userId) this.contextService.setPatient({ id: userId, name: username, role: 'PATIENT' });
    }

    this.loadLabCatalog();
    this.sub.add(this.contextService.activePatient$.subscribe(p => {
      this.activePatient = p;
      if (p) this.loadRecords();
    }));
    this.sub.add(interval(1000).subscribe(n => {
       const mins = Math.floor(n / 60);
       const secs = n % 60;
       this.sessionTime = `${mins}:${secs < 10 ? '0'+secs : secs}`;
    }));
  }

  ngOnDestroy(): void { this.sub.unsubscribe(); if (this.chart) this.chart.destroy(); }

  loadRecords(): void {
    if (!this.activePatient) return;
    const pId = Number(this.activePatient.id);
    this.medicalApi.getVisits(pId).subscribe(items => this.visits = items);
    this.medicalApi.getAllergies(pId).subscribe(items => this.allergies = items);
    this.medicalApi.getProblems(pId).subscribe(items => this.problems = items);
    this.medicalApi.getVitals(pId).subscribe(items => {
       this.vitals = items.sort((a,b) => new Date(a.recordedAt!).getTime() - new Date(b.recordedAt!).getTime());
       this.latestVitals = items[items.length - 1] || null;
       if (this.activeTab === 'vitals') this.renderChart();
    });
  }

  get allergySummary(): string {
     return this.allergies.map(a => `${a.allergen} (${a.severity})`).join(', ');
  }

  logVitals(): void {
     if (!this.activePatient) return;
     this.medicalApi.addVital(Number(this.activePatient.id), {
        patientId: Number(this.activePatient.id),
        ...this.vitalForm.getRawValue(),
        recordedAt: new Date().toISOString()
     } as VitalRecord).subscribe(() => {
        this.loadRecords();
        this.vitalForm.reset({ bloodPressure: '120/80', heartRate: 72, temperature: 98.6, spo2: 98 });
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

  renderChart(): void {
     if (!this.vitalsChartCanvas || this.vitals.length === 0) return;
     if (this.chart) this.chart.destroy();
     const ctx = this.vitalsChartCanvas.nativeElement.getContext('2d');
     this.chart = new Chart(ctx, {
        type: 'line',
        data: {
           labels: this.vitals.map(v => new Date(v.recordedAt!).toLocaleTimeString()),
           datasets: [{
              label: 'Heart Rate (bpm)',
              data: this.vitals.map(v => v.heartRate),
              borderColor: '#6366f1',
              tension: 0.4,
              fill: true,
              backgroundColor: 'rgba(99, 102, 241, 0.1)'
           }]
        },
        options: { responsive: true, maintainAspectRatio: false }
     });
  }

  searchIcd(q: string) { this.medicalApi.searchIcd(q).subscribe(s => this.icdSuggestions = s); }
  selectIcd(c: string) { this.visitForm.patchValue({ diagnosisCode: c }); }
  
  createVisit(): void {
    if (!this.activePatient || this.visitForm.invalid) return;
    this.savingVisit = true;
    this.medicalApi.createVisit({
      patientId: Number(this.activePatient.id),
      doctorId: Number(this.auth.getUserId()) || 1,
      visitDate: new Date().toISOString().slice(0,10),
      ...this.visitForm.getRawValue()
    }).subscribe(() => {
      this.savingVisit = false;
      this.visitForm.reset();
      this.loadRecords();
      this.toastSuccess('Session Signed');
    });
  }

  private toastSuccess(m: string) { this.successMessage = m; this.toast.success('Clinical Entry', m); }
  
  // Pharmacy Logic
  searchMeds(q: string) { this.pharmacyApi.searchMedications(q).subscribe(ms => this.medSuggestions = ms.map(m => m.medicationName)); }
  addMedToPrescription(name: string) {
     this.currentPrescItems.push({ medicationName: name, dose: '500mg', frequency: '1-0-1', duration: '5 Days' });
  }
  issuePrescription() {
     if (!this.activePatient || this.currentPrescItems.length === 0) return;
     const payload: Prescription = {
        patientId: Number(this.activePatient.id),
        doctorId: Number(this.auth.getUserId()) || 1,
        items: this.currentPrescItems,
        status: 'ACTIVE'
     };
     this.pharmacyApi.issuePrescription(payload).subscribe(() => {
        this.toast.success('e-Prescription', 'Order signed and routed to pharmacy queue.');
        this.currentPrescItems = [];
        this.activeTab = 'history';
     });
  }

  // Lab Logic
  loadLabCatalog() { this.labApi.getTestsCatalog().subscribe(c => this.labCatalog = c); }
  placeLabOrder(test: LabTest) {
     if (!this.activePatient) return;
     const payload: LabOrder = {
        patientId: Number(this.activePatient.id),
        doctorId: Number(this.auth.getUserId()) || 1,
        testId: test.id!,
        status: 'ORDERED'
     };
     this.labApi.placeOrder(payload).subscribe(() => {
        this.toast.success('Lab Order', `${test.testName} requisition created successfully.`);
     });
  }

  addAllergy(): void { /* ... */ }
}
