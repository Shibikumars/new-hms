import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LabApiService, LabOrder, LabReport, LabReportArtifact, LabTest } from './lab-api.service';

@Component({
  selector: 'app-lab',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="container">
      <div class="hero">
        <div>
          <h2>Lab Results</h2>
          <p class="subtitle">Order tests, enter findings, and review patient diagnostics timeline.</p>
        </div>
        <div class="pill">Diagnostics</div>
      </div>

      <div class="success" *ngIf="successMessage" role="status" aria-live="polite">{{ successMessage }}</div>

      <section class="section card" aria-label="Lab tests catalog section">
        <button type="button" (click)="loadTests()" [disabled]="loadingTests">{{ loadingTests ? 'Loading…' : 'Load Test Catalog' }}</button>
        <div class="loading-text" *ngIf="loadingTests">Fetching test catalog…</div>
        <ul class="list" *ngIf="!loadingTests && tests.length > 0">
          <li *ngFor="let test of tests">
            <strong>{{ test.testName }}</strong>
            <span>{{ test.description || '—' }}</span>
          </li>
        </ul>
      </section>

      <form [formGroup]="orderForm" (ngSubmit)="placeOrder()" class="section card" aria-labelledby="place-lab-order-heading">
        <h3 id="place-lab-order-heading">Place Lab Order</h3>
        <input type="number" formControlName="patientId" placeholder="Patient ID" />
        <input type="number" formControlName="doctorId" placeholder="Doctor ID" />
        <input type="number" formControlName="testId" placeholder="Test ID" />
        <button type="submit" [disabled]="orderForm.invalid || placingOrder">{{ placingOrder ? 'Placing…' : 'Place Order' }}</button>
      </form>

      <form [formGroup]="resultForm" (ngSubmit)="enterResult()" class="section card" aria-labelledby="enter-lab-result-heading">
        <h3 id="enter-lab-result-heading">Enter Result</h3>
        <input type="number" formControlName="orderId" placeholder="Order ID" />
        <input type="text" formControlName="result" placeholder="Result" />
        <button type="submit" [disabled]="resultForm.invalid || submittingResult">{{ submittingResult ? 'Submitting…' : 'Submit Result' }}</button>
      </form>

      <form [formGroup]="lookupForm" (ngSubmit)="loadReports()" class="section card" aria-labelledby="patient-lab-results-heading">
        <h3 id="patient-lab-results-heading">Patient Results</h3>
        <input type="number" formControlName="patientId" placeholder="Patient ID" />
        <input type="text" formControlName="testName" placeholder="Trend test name (optional)" />
        <button type="submit" [disabled]="lookupForm.controls.patientId.invalid || loadingReports">{{ loadingReports ? 'Loading…' : 'Load Reports' }}</button>
      </form>

      <div class="loading-text" *ngIf="loadingReports">Fetching lab reports…</div>
      <ul class="list" *ngIf="!loadingReports && reports.length > 0">
        <li *ngFor="let report of reports">
          <strong>Report #{{ report.id }} · {{ report.reportDate }}</strong>
          <span>{{ report.result }} ({{ report.status }})</span>
            <span class="sub" *ngIf="report.verificationStatus">Verification: {{ report.verificationStatus }}</span>
            <span class="sub" *ngIf="report.verifiedBy">Verified by {{ report.verifiedBy }} <span *ngIf="report.verifiedAt">({{ report.verifiedAt }})</span></span>
            <div class="actions-row">
              <button type="button" *ngIf="report.id && report.verificationStatus !== 'VERIFIED'" (click)="verify(report.id)">Verify Report</button>
              <button type="button" *ngIf="report.id" (click)="loadArtifact(report.id)">View Artifact</button>
            </div>
            <span class="sub" *ngIf="activeArtifact?.reportId === report.id">Artifact: {{ activeArtifact?.artifactUrl }} · {{ activeArtifact?.artifactChecksum }}</span>
        </li>
      </ul>
      <div class="loading-text" *ngIf="!loadingReports && reports.length === 0">No reports loaded yet.</div>
    </div>
  `,
  styles: [`
    .hero { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; }
    .subtitle { margin-top: 0.45rem; color: var(--text-soft); }
    .pill { border: 1px solid rgba(109,124,255,0.5); color: #aeb8ff; background: rgba(109,124,255,0.16); border-radius: 999px; padding: 0.35rem 0.75rem; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 700; white-space: nowrap; }
    .success { margin-top: 1rem; border: 1px solid rgba(34,197,94,0.45); background: rgba(34,197,94,0.12); color: #80e8a6; border-radius: 10px; padding: 0.65rem 0.8rem; }
    .card { border: 1px solid var(--border); border-radius: 14px; padding: 0.9rem; background: linear-gradient(180deg, rgba(26,39,64,0.65), rgba(15,23,38,0.95)); }
    .section { margin-top: 1.2rem; display: grid; gap: 0.6rem; }
    .list { list-style: none; padding: 0; margin: 0.75rem 0 0; }
    .list li { border: 1px solid var(--border); border-radius: 10px; padding: 0.7rem; margin-bottom: 0.5rem; background: rgba(11,18,32,0.55); }
    .list span { display: block; margin-top: 0.2rem; color: var(--text-soft); }
    .sub { font-size: 0.8rem; color: var(--text-muted); }
    .actions-row { display: flex; gap: 0.45rem; flex-wrap: wrap; margin-top: 0.3rem; }

    @media (max-width: 760px) {
      .hero { flex-direction: column; }
    }
  `]
})
export class LabComponent {
  tests: LabTest[] = [];
  reports: LabReport[] = [];
  loadingTests = false;
  placingOrder = false;
  submittingResult = false;
  loadingReports = false;
  successMessage = '';
  activeArtifact: LabReportArtifact | null = null;

  readonly orderForm = this.fb.nonNullable.group({
    patientId: [0, [Validators.required, Validators.min(1)]],
    doctorId: [0, [Validators.required, Validators.min(1)]],
    testId: [0, [Validators.required, Validators.min(1)]]
  });

  readonly resultForm = this.fb.nonNullable.group({
    orderId: [0, [Validators.required, Validators.min(1)]],
    result: ['', Validators.required]
  });

  readonly lookupForm = this.fb.nonNullable.group({
    patientId: [0, [Validators.required, Validators.min(1)]],
    testName: ['']
  });

  constructor(
    private fb: FormBuilder,
    private labApi: LabApiService
  ) {}

  loadTests(): void {
    this.loadingTests = true;
    this.labApi.getTestsCatalog().subscribe({
      next: items => {
        this.tests = items;
        this.loadingTests = false;
      },
      error: () => {
        this.tests = [];
        this.loadingTests = false;
      }
    });
  }

  placeOrder(): void {
    if (this.orderForm.invalid) return;
    const payload: LabOrder = {
      patientId: this.orderForm.controls.patientId.value,
      doctorId: this.orderForm.controls.doctorId.value,
      testId: this.orderForm.controls.testId.value
    };

    this.placingOrder = true;
    this.successMessage = '';

    this.labApi.placeOrder(payload).subscribe({
      next: () => {
        this.successMessage = 'Lab order placed successfully.';
        this.placingOrder = false;
      },
      error: () => {
        this.placingOrder = false;
      }
    });
  }

  enterResult(): void {
    if (this.resultForm.invalid) return;

    this.submittingResult = true;
    this.successMessage = '';

    this.labApi.enterResults(this.resultForm.controls.orderId.value, this.resultForm.controls.result.value).subscribe({
      next: () => {
        this.successMessage = 'Lab result submitted successfully.';
        this.submittingResult = false;
      },
      error: () => {
        this.submittingResult = false;
      }
    });
  }

  loadReports(): void {
    const patientId = this.lookupForm.controls.patientId.value;
    if (!patientId || patientId < 1) return;

    this.loadingReports = true;

    const testName = this.lookupForm.controls.testName.value.trim();
    if (testName) {
      this.labApi.getTrend(patientId, testName).subscribe({
        next: items => {
          this.reports = items;
          this.activeArtifact = null;
          this.loadingReports = false;
        },
        error: () => {
          this.reports = [];
          this.loadingReports = false;
        }
      });
      return;
    }

    this.labApi.getPatientResults(patientId).subscribe({
      next: items => {
        this.reports = items;
        this.activeArtifact = null;
        this.loadingReports = false;
      },
      error: () => {
        this.reports = [];
        this.loadingReports = false;
      }
    });
  }

  verify(reportId: number): void {
    this.labApi.verifyReport(reportId).subscribe({
      next: () => {
        this.successMessage = `Report #${reportId} verified.`;
        this.loadReports();
      }
    });
  }

  loadArtifact(reportId: number): void {
    this.labApi.getReportArtifact(reportId).subscribe({
      next: artifact => {
        this.activeArtifact = artifact;
      }
    });
  }
}
