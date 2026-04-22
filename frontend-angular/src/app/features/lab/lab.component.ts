import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { LabApiService, LabOrder, LabReport, LabReportArtifact, LabTest } from './lab-api.service';
import { PatientContextService } from '../../core/patient-context.service';
import { AuthService } from '../../core/auth.service';
import { AutocompleteComponent } from '../../shared/components/autocomplete/autocomplete.component';
import { DataTableComponent, ColumnConfig } from '../../shared/components/data-table/data-table.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-lab',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, AutocompleteComponent, DataTableComponent, StatusBadgeComponent],
  template: `
    <div class="container clinical-bg">
      <header class="lab-header">
        <div class="header-left">
          <h1 class="page-title">Lab & Diagnostics</h1>
          <p class="page-subtitle">Manage clinical investigations, track specimen results, and verify findings.</p>
        </div>
        <div class="header-right">
          <button class="ph-btn primary" (click)="showNewOrder = !showNewOrder">
            <i class="ph ph-plus-circle"></i> New Investigation
          </button>
        </div>
      </header>

      <div class="alert success" *ngIf="successMessage">
        <i class="ph ph-check-circle"></i> {{ successMessage }}
      </div>

      <div class="context-banner" [class.no-patient]="!activePatient">
        <div class="banner-content" *ngIf="activePatient">
          <div class="patient-brief">
            <i class="ph ph-test-tube-bold"></i>
            <div class="p-meta">
              <strong>Patient: {{ activePatient.name }}</strong>
              <span>Chart #{{ activePatient.id }} · Diagnostics Mode</span>
            </div>
          </div>
          <div class="stats-mini">
            <div class="sm-item">
              <label>Pending</label>
              <strong>{{ pendingCount }}</strong>
            </div>
            <div class="sm-item divider"></div>
            <div class="sm-item">
              <label>Completed</label>
              <strong>{{ reports.length - pendingCount }}</strong>
            </div>
          </div>
        </div>
        <div class="banner-empty" *ngIf="!activePatient">
          <i class="ph ph-warning-diamond"></i>
          <span>Please select a patient to access the laboratory module.</span>
        </div>
      </div>

      <div class="lab-grid" *ngIf="activePatient">
        <!-- Main Column: Reports History -->
        <div class="reports-column">
          <div class="card pane">
            <div class="pane-header">
              <h3>Diagnostic History</h3>
              <div class="pane-actions">
                <button class="ph-btn sm" (click)="loadReports()"><i class="ph ph-arrows-clockwise"></i> Sync</button>
              </div>
            </div>

            <div class="reports-timeline" *ngIf="reports.length > 0">
              <div class="report-item card" *ngFor="let r of reports">
                <div class="ri-header">
                  <div class="ri-id">
                    <span class="id-tag">#{{ r.id }}</span>
                    <span class="test-title">Clinical Investigation</span>
                  </div>
                  <div class="ri-meta">
                    <span>{{ r.reportDate }}</span>
                    <app-status-badge [status]="r.verificationStatus || 'PENDING'"></app-status-badge>
                  </div>
                </div>
                <div class="ri-findings">
                  <div class="finding-block" *ngIf="r.result">
                    <label>Findings / Observation</label>
                    <p>{{ r.result }}</p>
                  </div>
                  <div class="pending-block" *ngIf="!r.result">
                    <i class="ph ph-hour-glass"></i>
                    <span>Awaiting Laboratory Result Input...</span>
                  </div>
                </div>
                <div class="ri-footer">
                  <div class="verif-info" *ngIf="r.verifiedBy">
                    <i class="ph ph-user-focus"></i> Verified by {{ r.verifiedBy }}
                  </div>
                  <div class="ri-btns">
                    <button class="ph-btn sm" *ngIf="r.result && r.verificationStatus !== 'VERIFIED'" (click)="verify(r.id!)">
                      <i class="ph ph-check-square"></i> Verify
                    </button>
                    <button class="ph-btn sm secondary" (click)="loadArtifact(r.id!)">
                      <i class="ph ph-file-pdf"></i> {{ activeArtifact?.reportId === r.id ? 'Hide PDF' : 'View PDF' }}
                    </button>
                  </div>
                </div>
                <div class="artifact-drawer" *ngIf="activeArtifact?.reportId === r.id">
                   <div class="drawer-header">Secure Artifact Link</div>
                   <div class="drawer-body">
                      <code>{{ activeArtifact?.artifactUrl }}</code>
                      <button class="copy-btn"><i class="ph ph-copy"></i></button>
                   </div>
                </div>
              </div>
            </div>

            <div class="empty-state" *ngIf="reports.length === 0">
              <i class="ph ph-folder-open"></i>
              <p>No historical lab investigations found for this patient.</p>
            </div>
          </div>
        </div>

        <!-- Side Column: Catalog & Ordering -->
        <aside class="controls-column">
          <div class="card order-pane" *ngIf="showNewOrder">
            <div class="pane-header">
              <h3>Create Order</h3>
              <button class="close-btn" (click)="showNewOrder = false"><i class="ph ph-x"></i></button>
            </div>
            <form [formGroup]="orderForm" (ngSubmit)="placeOrder()" class="pane-form">
              <div class="form-group">
                <label>Target Investigation</label>
                <app-autocomplete 
                  [suggestions]="testSuggestions"
                  placeholder="e.g. CBC, Lipid Profile..."
                  (onQuery)="filterTests($event)"
                  (onSelect)="selectTest($event)">
                </app-autocomplete>
              </div>
              <p class="order-hint">The order will be routed to the central facility for specimen collection.</p>
              <button type="submit" class="ph-btn primary full" [disabled]="orderForm.invalid || placingOrder">
                {{ placingOrder ? 'Placing...' : 'Submit Lab Order' }}
              </button>
            </form>
          </div>

          <div class="card catalog-pane">
            <div class="pane-header">
              <h3>Test Catalog</h3>
            </div>
            <div class="catalog-search">
              <i class="ph ph-magnifying-glass"></i>
              <input type="text" [(ngModel)]="catalogSearch" (input)="filterCatalog()" placeholder="Search services..." />
            </div>
            <div class="catalog-scroll">
              <div class="cat-item" *ngFor="let t of filteredTests">
                <div class="cat-info">
                  <strong>{{ t.testName }}</strong>
                  <span>{{ t.description || 'Clinical Investigation' }}</span>
                </div>
                <div class="cat-price">\${{ t.price || '45' }}</div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  `,
  styles: [`
    .clinical-bg { padding: 2.5rem; background: var(--bg); min-height: 100vh; }
    .lab-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; }
    .page-title { font-size: 1.6rem; color: var(--primary); font-weight: 800; letter-spacing: -0.01em; }
    .page-subtitle { color: var(--text-muted); font-size: 0.9rem; margin-top: 0.2rem; font-weight: 500; }

    .context-banner { background: #fff; border: 1px solid var(--border); border-radius: 16px; padding: 1.25rem 1.5rem; margin-bottom: 2.5rem; box-shadow: var(--shadow-soft); display: flex; align-items: center; justify-content: space-between; border-left: 5px solid var(--accent); }
    .context-banner.no-patient { border-left-color: var(--warning); background: #FFFBEB; border-color: rgba(217, 119, 6, 0.1); }
    .banner-content { display: flex; justify-content: space-between; align-items: center; width: 100%; }
    .patient-brief { display: flex; gap: 1.25rem; align-items: center; }
    .patient-brief i { font-size: 1.75rem; color: var(--accent); }
    .p-meta strong { display: block; font-size: 1rem; color: var(--text); font-weight: 700; }
    .p-meta span { font-size: 0.72rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
    
    .stats-mini { display: flex; gap: 1.5rem; align-items: center; }
    .sm-item { text-align: center; }
    .sm-item label { display: block; font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; font-weight: 800; margin-bottom: 0.1rem; }
    .sm-item strong { font-size: 1.1rem; color: var(--text); font-family: 'Syne', sans-serif; }
    .sm-item.divider { width: 1px; height: 30px; background: var(--border); }
    .banner-empty { display: flex; align-items: center; gap: 1rem; color: var(--warning); font-weight: 700; }

    .lab-grid { display: grid; grid-template-columns: 1fr 340px; gap: 2rem; }
    .card { background: #fff; border: 1px solid var(--border); border-radius: 16px; padding: 1.5rem; box-shadow: var(--shadow-soft); }
    
    .pane-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .pane-header h3 { font-size: 1rem; font-weight: 800; color: var(--text); }
    
    .reports-timeline { display: grid; gap: 1.5rem; }
    .report-item { border-left: 4px solid var(--border); transition: 0.2s; padding: 1.5rem; border-radius: 0 12px 12px 0; }
    .report-item:hover { border-left-color: var(--primary); background: var(--surface-soft); transform: translateX(2px); }
    .ri-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; }
    .ri-id { display: flex; flex-direction: column; gap: 0.25rem; }
    .id-tag { font-family: 'Syne', sans-serif; font-size: 0.7rem; color: var(--primary); font-weight: 800; letter-spacing: 0.05em; }
    .test-title { font-size: 1.05rem; font-weight: 700; color: var(--text); }
    .ri-meta { text-align: right; display: flex; flex-direction: column; gap: 0.25rem; align-items: flex-end; }
    .ri-meta span { font-size: 0.75rem; color: var(--text-soft); font-weight: 600; }

    .ri-findings { background: var(--bg); padding: 1rem; border-radius: 8px; margin-bottom: 1rem; }
    .finding-block label { display: block; font-size: 0.65rem; text-transform: uppercase; color: var(--text-muted); font-weight: 800; margin-bottom: 0.4rem; }
    .finding-block p { font-size: 0.95rem; color: var(--text); line-height: 1.5; font-weight: 600; }
    .pending-block { display: flex; align-items: center; gap: 0.75rem; color: var(--text-muted); font-size: 0.85rem; font-weight: 700; padding: 0.5rem 0; }
    .pending-block i { color: var(--warning); animation: pulse 2s infinite; }

    .ri-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed var(--border); padding-top: 1rem; }
    .verif-info { font-size: 0.75rem; color: var(--accent); font-weight: 700; display: flex; align-items: center; gap: 0.4rem; }
    .ri-btns { display: flex; gap: 0.5rem; }
    
    .artifact-drawer { margin-top: 1rem; background: var(--surface-soft); padding: 0.75rem; border-radius: 8px; border: 1px solid var(--border); }
    .drawer-header { font-size: 0.65rem; text-transform: uppercase; font-weight: 800; color: var(--text-muted); margin-bottom: 0.5rem; }
    .drawer-body { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
    .drawer-body code { font-size: 0.7rem; color: var(--primary); word-break: break-all; }
    .copy-btn { background: transparent; border: none; color: var(--text-soft); cursor: pointer; }

    /* Controls Side */
    .controls-column { display: flex; flex-direction: column; gap: 1.5rem; }
    .catalog-search { position: relative; margin-bottom: 1.25rem; }
    .catalog-search i { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); }
    .catalog-search input { width: 100%; border: 1px solid var(--border); background: var(--bg); padding: 0.75rem 1rem 0.75rem 2.5rem; border-radius: 999px; font-size: 0.85rem; }
    .catalog-scroll { max-height: 500px; overflow-y: auto; display: grid; gap: 0.75rem; }
    .cat-item { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--surface-soft); border-radius: 8px; border: 1px solid transparent; transition: 0.2s; }
    .cat-item:hover { border-color: var(--primary); transform: translateY(-1px); }
    .cat-info { display: flex; flex-direction: column; gap: 0.15rem; }
    .cat-info strong { font-size: 0.85rem; color: var(--text); }
    .cat-info span { font-size: 0.72rem; color: var(--text-muted); }
    .cat-price { font-family: 'Syne', sans-serif; font-weight: 800; color: var(--primary); font-size: 0.9rem; }

    .pane-form { display: grid; gap: 1.5rem; }
    .form-group label { display: block; font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.5rem; }
    .order-hint { font-size: 0.72rem; color: var(--text-soft); line-height: 1.4; font-style: italic; }

    .ph-btn { background: #fff; border: 1px solid var(--border); padding: 0.6rem 1.25rem; border-radius: 999px; color: var(--text-soft); font-weight: 700; font-size: 0.8rem; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; transition: 0.2s; justify-content: center; box-shadow: var(--shadow-soft); }
    .ph-btn:hover { border-color: var(--primary); color: var(--primary); transform: translateY(-1px); box-shadow: var(--shadow-strong); }
    .ph-btn.primary { background: var(--primary); color: #fff; border-color: var(--primary); }
    .ph-btn.secondary { background: var(--surface-strong); border-color: transparent; }
    .ph-btn.full { width: 100%; }
    .ph-btn.sm { padding: 0.4rem 0.8rem; font-size: 0.75rem; }

    .alert.success { background: rgba(13, 126, 106, 0.1); color: var(--accent); border: 1px solid rgba(13, 126, 106, 0.2); padding: 1rem; border-radius: 12px; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.75rem; font-weight: 700; }
    .empty-state { text-align: center; padding: 4rem 1rem; color: var(--text-muted); }
    .empty-state i { font-size: 3rem; opacity: 0.3; margin-bottom: 1rem; }

    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    @media (max-width: 1024px) { .lab-grid { grid-template-columns: 1fr; } .controls-column { order: -1; } }
  `]
})
export class LabComponent implements OnInit, OnDestroy {
  activePatient: any | null = null;
  tests: LabTest[] = [];
  filteredTests: LabTest[] = [];
  reports: LabReport[] = [];
  testSuggestions: string[] = [];
  catalogSearch = '';
  placingOrder = false;
  loadingReports = false;
  showNewOrder = false;
  successMessage = '';
  activeArtifact: LabReportArtifact | null = null;
  pendingCount = 0;
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
    this.loadCatalog();
    this.sub.add(this.contextService.activePatient$.subscribe(p => {
      this.activePatient = p;
      if (p) this.loadReports();
      else this.reports = [];
    }));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  loadCatalog(): void {
    this.labApi.getTestsCatalog().subscribe({
      next: items => {
        this.tests = items;
        this.filteredTests = items;
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

  filterTests(q: string): void {
    if (q.length < 1) {
      this.testSuggestions = [];
      return;
    }
    this.testSuggestions = this.tests
      .filter(t => t.testName.toLowerCase().includes(q.toLowerCase()))
      .map(t => t.testName);
  }

  selectTest(name: string): void {
    const test = this.tests.find(t => t.testName === name);
    if (test) {
      this.orderForm.patchValue({ testId: test.id! });
    }
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
    this.labApi.placeOrder(payload).subscribe({
      next: () => {
        this.successMessage = 'Diagnostic investigation order issued successfully.';
        this.placingOrder = false;
        this.orderForm.reset({ testId: 0 });
        this.showNewOrder = false;
        this.loadReports();
        setTimeout(() => this.successMessage = '', 5000);
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
        this.pendingCount = this.reports.filter(r => !r.result).length;
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
        this.successMessage = `Findings verified for Investigation #${reportId}`;
        this.loadReports();
        setTimeout(() => this.successMessage = '', 3000);
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

