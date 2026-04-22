import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { LabApiService, LabOrder, LabReport, LabReportArtifact, LabTest } from './lab-api.service';
import { PatientContextService } from '../../core/patient-context.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-lab',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="container">
      <div class="hero">
        <div>
          <h2>Lab Results & Diagnostics</h2>
          <p class="subtitle">Clinical investigations, findings verification, and longitudinal trends.</p>
        </div>
        <div class="pill">Clinical Lab</div>
      </div>

      <div class="success" *ngIf="successMessage" role="status" aria-live="polite">{{ successMessage }}</div>

      <!-- Active Patient Context Indicator -->
      <div class="ctx-alert" *ngIf="activePatient; else noPatient">
        <div class="ctx-info">
          <strong>Active Chart: {{ activePatient.name }}</strong> (ID: #{{ activePatient.id }})
        </div>
        <div class="ctx-badge">Clinical Context Active</div>
      </div>
      <ng-template #noPatient>
        <div class="ctx-alert warning">
          <div class="ctx-info">No patient selected. Please select a patient from the Dashboard to perform lab actions.</div>
        </div>
      </ng-template>

      <div class="lab-layout" *ngIf="activePatient">
        <!-- Left: Ordering & Catalog -->
        <div class="lab-controls">
          <section class="card">
            <h3>New Lab Order</h3>
            <form [formGroup]="orderForm" (ngSubmit)="placeOrder()" class="order-form">
              <div class="input-group">
                <label>Select Test</label>
                <select formControlName="testId">
                  <option [value]="0">Choose a test...</option>
                  <option *ngFor="let t of tests" [value]="t.id">{{ t.testName }}</option>
                </select>
              </div>
              <div class="muted small" *ngIf="tests.length === 0">Loading test catalog...</div>
              <button type="submit" [disabled]="orderForm.invalid || placingOrder || orderForm.value.testId === 0">
                {{ placingOrder ? 'Placing Order...' : 'Place Lab Order' }}
              </button>
            </form>
          </section>

          <section class="card catalog">
            <h3>Test Catalog</h3>
            <input type="text" [(ngModel)]="catalogSearch" (input)="filterCatalog()" placeholder="Search catalog..." class="small-input" />
            <ul class="catalog-list">
              <li *ngFor="let t of filteredTests">
                <div class="test-name">{{ t.testName }}</div>
                <div class="test-desc">{{ t.description || 'No description available' }}</div>
              </li>
            </ul>
          </section>
        </div>

        <!-- Right: Results & Timeline -->
        <div class="lab-main">
          <section class="card reports-section">
            <div class="section-header">
              <h3>Diagnostic Reports</h3>
              <button class="refresh-btn" (click)="loadReports()" [disabled]="loadingReports">Refresh</button>
            </div>
            
            <div class="loading-text" *ngIf="loadingReports">Searching diagnostic history...</div>
            <div class="empty-state" *ngIf="!loadingReports && reports.length === 0">
              No laboratory reports found for this patient.
            </div>

            <ul class="report-list" *ngIf="!loadingReports && reports.length > 0">
              <li *ngFor="let report of reports" class="report-card">
                <div class="report-header">
                  <div class="report-id">ORDER #{{ report.id }}</div>
                  <div class="report-date">{{ report.reportDate }}</div>
                  <div class="status-badge" [class.verified]="report.verificationStatus === 'VERIFIED'">
                    {{ report.verificationStatus || 'PENDING' }}
                  </div>
                </div>
                
                <div class="report-body">
                  <div class="result-display">
                     <span class="label">Finding:</span>
                     <span class="value">{{ report.result || 'Pending Result...' }}</span>
                  </div>
                  
                  <div class="verification-meta" *ngIf="report.verifiedBy">
                    Verified by {{ report.verifiedBy }} on {{ report.verifiedAt }}
                  </div>

                  <!-- Inline Result Entry (if pending) -->
                  <div class="result-entry" *ngIf="!report.result">
                    <input #resInput type="text" placeholder="Enter findings..." class="res-field" />
                    <button class="submit-res" (click)="enterResultFromList(report.id, resInput.value)">Submit</button>
                  </div>
                </div>

                <div class="report-actions">
                  <button class="verify-btn" *ngIf="report.result && report.verificationStatus !== 'VERIFIED'" (click)="verify(report.id!)">Verify Findings</button>
                  <button class="artifact-btn" (click)="loadArtifact(report.id!)">View Artifact</button>
                </div>

                <!-- Artifact Preview -->
                <div class="artifact-preview" *ngIf="activeArtifact?.reportId === report.id">
                   <div class="art-url">URL: {{ activeArtifact?.artifactUrl }}</div>
                   <div class="art-extra">Checksum: {{ activeArtifact?.artifactChecksum }}</div>
                </div>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .hero { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; margin-bottom: 2rem; }
    .subtitle { margin-top: 0.45rem; color: var(--text-soft); }
    .pill { border: 1px solid rgba(0, 212, 170, 0.4); color: var(--primary); background: rgba(0, 212, 170, 0.1); border-radius: 999px; padding: 0.35rem 0.75rem; font-size: 0.78rem; text-transform: uppercase; font-weight: 700; }
    
    .success { margin-bottom: 1.5rem; border: 1px solid rgba(34,197,94,0.45); background: rgba(34,197,94,0.12); color: #80e8a6; border-radius: 10px; padding: 0.65rem 0.8rem; }

    .ctx-alert { 
      display: flex; justify-content: space-between; align-items: center; 
      background: rgba(109, 124, 255, 0.12); border: 1px solid rgba(109, 124, 255, 0.3); border-radius: 12px; 
      padding: 1rem; margin-bottom: 2rem; 
    }
    .ctx-alert.warning { background: rgba(255, 90, 114, 0.08); border-color: rgba(255, 90, 114, 0.25); color: #ff9ca9; }
    .ctx-info { font-size: 1rem; }
    .ctx-badge { font-size: 0.7rem; text-transform: uppercase; border: 1px solid var(--primary); color: var(--primary); padding: 0.2rem 0.5rem; border-radius: 4px; }

    .lab-layout { display: grid; grid-template-columns: 350px 1fr; gap: 1.5rem; }
    .card { border: 1px solid var(--border); border-radius: 16px; padding: 1.2rem; background: rgba(26,39,64,0.45); margin-bottom: 1.5rem; }
    .card h3 { font-size: 1rem; margin-bottom: 1.2rem; color: var(--text-soft); text-transform: uppercase; letter-spacing: 0.05em; }

    .order-form { display: grid; gap: 1rem; }
    .input-group label { display: block; font-size: 0.85rem; margin-bottom: 0.4rem; color: var(--text-muted); }
    .input-group select { width: 100%; background: var(--bg); border: 1px solid var(--border); padding: 0.7rem; color: #fff; border-radius: 8px; }

    .catalog-list { list-style: none; padding: 0; max-height: 400px; overflow-y: auto; }
    .catalog-list li { padding: 0.8rem 0; border-bottom: 1px solid var(--border); }
    .test-name { font-weight: 700; font-size: 0.9rem; }
    .test-desc { font-size: 0.78rem; color: var(--text-soft); margin-top: 0.2rem; }
    .small-input { width: 100%; background: rgba(0,0,0,0.2); border: 1px solid var(--border); padding: 0.5rem; border-radius: 6px; color: #fff; margin-bottom: 1rem; }

    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .refresh-btn { background: transparent; border: 1px solid var(--border); color: var(--text-soft); padding: 0.3rem 0.7rem; border-radius: 6px; cursor: pointer; }
    
    .report-list { list-style: none; padding: 0; }
    .report-card { 
      background: rgba(11, 18, 32, 0.4); border: 1px solid var(--border); 
      border-radius: 12px; padding: 1.2rem; margin-bottom: 1.5rem; 
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    }
    .report-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; }
    .report-id { font-family: monospace; color: var(--primary); font-weight: 700; }
    .report-date { font-size: 0.85rem; color: var(--text-soft); }
    .status-badge { 
      margin-left: auto; font-size: 0.7rem; padding: 0.2rem 0.6rem; border-radius: 999px; 
      border: 1px solid rgba(160, 160, 160, 0.4); color: #ccc;
    }
    .status-badge.verified { color: #80e8a6; border-color: rgba(34, 197, 94, 0.5); background: rgba(34, 197, 94, 0.1); }

    .result-display { margin-bottom: 1rem; font-size: 1.1rem; }
    .result-display .label { color: var(--text-soft); margin-right: 0.5rem; }
    .result-display .value { font-weight: 700; }

    .verification-meta { font-size: 0.8rem; font-style: italic; color: var(--text-muted); margin-bottom: 1rem; }

    .result-entry { display: flex; gap: 0.5rem; margin-top: 1rem; background: rgba(0,0,0,0.2); padding: 0.6rem; border-radius: 8px; }
    .res-field { flex: 1; background: transparent; border: 1px solid var(--border); border-radius: 4px; padding: 0.4rem; color: #fff; }
    .submit-res { background: var(--primary); color: #000; border: none; padding: 0.4rem 0.8rem; border-radius: 4px; font-weight: 700; cursor: pointer; }

    .report-actions { display: flex; gap: 0.6rem; margin-top: 1rem; border-top: 1px solid var(--border); padding-top: 1rem; }
    .verify-btn { background: rgba(34, 197, 94, 0.2); color: #80e8a6; border: 1px solid rgba(34,197,94,0.4); padding: 0.4rem 0.8rem; border-radius: 6px; cursor: pointer; }
    .artifact-btn { background: transparent; border: 1px solid var(--border); color: var(--text-soft); padding: 0.4rem 0.8rem; border-radius: 6px; cursor: pointer; }

    .artifact-preview { margin-top: 1rem; background: rgba(0,0,0,0.4); padding: 0.8rem; border-radius: 8px; font-family: monospace; font-size: 0.8rem; }

    @media (max-width: 900px) {
      .lab-layout { grid-template-columns: 1fr; }
    }
  `]
})
export class LabComponent implements OnInit, OnDestroy {
  activePatient: any | null = null;
  tests: LabTest[] = [];
  filteredTests: LabTest[] = [];
  reports: LabReport[] = [];
  catalogSearch = '';
  loadingTests = false;
  placingOrder = false;
  loadingReports = false;
  successMessage = '';
  activeArtifact: LabReportArtifact | null = null;
  private sub = new Subscription();

  readonly orderForm = this.fb.nonNullable.group({
    testId: [0, [Validators.required, Validators.min(1)]]
  });

  constructor(
    private fb: FormBuilder,
    private labApi: LabApiService,
    private contextService: PatientContextService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadTests();
    this.sub.add(this.contextService.activePatient$.subscribe(p => {
      this.activePatient = p;
      if (p) this.loadReports();
      else this.reports = [];
    }));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  loadTests(): void {
    this.loadingTests = true;
    this.labApi.getTestsCatalog().subscribe({
      next: items => {
        this.tests = items;
        this.filteredTests = items;
        this.loadingTests = false;
      }
    });
  }

  filterCatalog(): void {
    const q = this.catalogSearch.toLowerCase().trim();
    if (!q) {
      this.filteredTests = this.tests;
      return;
    }
    this.filteredTests = this.tests.filter(t => 
      t.testName.toLowerCase().includes(q) || 
      t.description?.toLowerCase().includes(q)
    );
  }

  placeOrder(): void {
    if (!this.activePatient || this.orderForm.invalid) return;
    const doctorId = Number(this.auth.getUserId()) || 1;
    
    const payload: LabOrder = {
      patientId: Number(this.activePatient.id),
      doctorId: doctorId,
      testId: Number(this.orderForm.controls.testId.value)
    };

    this.placingOrder = true;
    this.successMessage = '';

    this.labApi.placeOrder(payload).subscribe({
      next: () => {
        this.successMessage = 'Diagnostic order placed successfully.';
        this.placingOrder = false;
        this.orderForm.reset({ testId: 0 });
        this.loadReports();
      },
      error: () => this.placingOrder = false
    });
  }

  loadReports(): void {
    if (!this.activePatient) return;

    this.loadingReports = true;
    this.labApi.getPatientResults(Number(this.activePatient.id)).subscribe({
      next: items => {
        this.reports = items.sort((a,b) => (b.id || 0) - (a.id || 0));
        this.loadingReports = false;
      },
      error: () => {
        this.reports = [];
        this.loadingReports = false;
      }
    });
  }

  enterResultFromList(orderId: number, result: string): void {
    if (!result.trim()) return;
    this.labApi.enterResults(orderId, result).subscribe({
      next: () => {
        this.successMessage = `Results submitted for Order #${orderId}`;
        this.loadReports();
      }
    });
  }

  verify(reportId: number): void {
    this.labApi.verifyReport(reportId).subscribe({
      next: () => {
        this.successMessage = `Findings verified for Report #${reportId}`;
        this.loadReports();
      }
    });
  }

  loadArtifact(reportId: number): void {
    if (this.activeArtifact?.reportId === reportId) {
      this.activeArtifact = null;
      return;
    }
    this.labApi.getReportArtifact(reportId).subscribe({
      next: artifact => this.activeArtifact = artifact
    });
  }
}
