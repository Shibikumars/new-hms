import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { LabApiService, LabOrder, LabReport, LabReportArtifact, LabTest } from './lab-api.service';
import { PatientContextService } from '../../core/patient-context.service';
import { AuthService } from '../../core/auth.service';
import { AutocompleteComponent } from '../../shared/components/autocomplete/autocomplete.component';
import { DataTableComponent, ColumnConfig } from '../../shared/components/data-table/data-table.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

declare var Chart: any;

@Component({
  selector: 'app-lab',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, AutocompleteComponent, DataTableComponent, StatusBadgeComponent],
  template: `
    <div class="container clinical-bg">
      <header class="lab-header">
        <div class="header-left">
          <h1 class="page-title">Diagnostics & Trend Analysis</h1>
          <p class="page-subtitle">Track clinical findings, monitor trends, and ensure patient safety.</p>
        </div>
        <div class="header-right">
          <button class="ph-btn primary" (click)="showNewOrder = !showNewOrder">
            <i class="ph ph-plus-circle"></i> Create Investigation
          </button>
        </div>
      </header>

      <div class="context-banner" [class.no-patient]="!activePatient">
        <div class="banner-content" *ngIf="activePatient">
          <div class="patient-brief">
            <i class="ph ph-test-tube-bold"></i>
            <div class="p-meta">
              <strong>{{ activePatient.name }}</strong>
              <span>MRN #{{ activePatient.id }} · Clinical Lab Portal</span>
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
          <span>Please select a clinical focus patient to access the laboratory module.</span>
        </div>
      </div>

      <div class="lab-grid" *ngIf="activePatient">
        
        <!-- TREND VIEW (Top-wide) -->
        <div class="trend-section card full-width" *ngIf="hasTrendData">
          <div class="pane-header">
            <h3>Investigation Trends: {{ activeTrendTestName }}</h3>
            <div class="trend-controls">
               <select (change)="onTrendTestChange($event)">
                 <option *ngFor="let t of trendableTests" [value]="t.testId">{{ t.testName }}</option>
               </select>
            </div>
          </div>
          <div class="chart-container">
            <canvas #trendChart></canvas>
          </div>
        </div>

        <!-- Main Column: Reports History -->
        <div class="reports-column">
          <div class="card pane">
            <div class="pane-header">
              <h3>Diagnostic Results History</h3>
              <div class="pane-actions">
                <button class="ph-btn sm" (click)="loadReports()"><i class="ph ph-arrows-clockwise"></i> Sync</button>
              </div>
            </div>

            <div class="reports-timeline" *ngIf="reports.length > 0">
              <div class="report-item card" *ngFor="let r of reports" [class.is-critical]="r.isCritical">
                <div class="ri-header">
                  <div class="ri-id">
                    <span class="id-tag">REF #{{ r.id }}</span>
                    <span class="test-title">Clinical Investigation Order</span>
                  </div>
                  <div class="ri-meta">
                    <span>{{ r.reportDate }}</span>
                    <app-status-badge [status]="r.verificationStatus || 'PENDING'"></app-status-badge>
                  </div>
                </div>
                <div class="ri-findings">
                  <div class="finding-block" *ngIf="r.result || r.numericResult">
                    <div class="result-row">
                      <div class="result-val">
                         <label>Finding</label>
                         <div class="val-text" [class.critical]="r.isCritical">
                           {{ r.numericResult ? r.numericResult + ' ' + (r.unit || '') : r.result }}
                           <i class="ph ph-warning-circle-fill" *ngIf="r.isCritical"></i>
                         </div>
                      </div>
                      <div class="ref-range" *ngIf="r.referenceRange">
                         <label>Reference Range</label>
                         <p>{{ r.referenceRange }} {{ r.unit }}</p>
                      </div>
                    </div>
                  </div>
                  <div class="pending-block" *ngIf="!r.result && !r.numericResult">
                    <i class="ph ph-hour-glass"></i>
                    <span>Processing in Central Facility...</span>
                  </div>
                </div>
                <div class="ri-footer">
                  <div class="verif-info" *ngIf="r.verifiedBy">
                    <i class="ph ph-seal-check"></i> Clinically Verified by {{ r.verifiedBy }}
                  </div>
                  <div class="ri-btns">
                    <button class="ph-btn sm" *ngIf="(r.result || r.numericResult) && r.verificationStatus !== 'VERIFIED'" (click)="verify(r.id!)">
                      <i class="ph ph-check"></i> Verify
                    </button>
                    <button class="ph-btn sm secondary" (click)="loadArtifact(r.id!)">
                      <i class="ph ph-download-simple"></i> Summary PDF
                    </button>
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
              <h3>Issue New Order</h3>
              <button class="close-btn" (click)="showNewOrder = false"><i class="ph ph-x"></i></button>
            </div>
            <form [formGroup]="orderForm" (ngSubmit)="placeOrder()" class="pane-form">
              <div class="form-group">
                <label>Investigation Choice</label>
                <select formControlName="testId" (change)="onTestChange($event)" class="custom-select">
                  <option value="0">-- Select Test --</option>
                  <option *ngFor="let test of tests" [value]="test.id">
                    {{ test.testName }} - ₹{{ test.price || '500' }}
                  </option>
                </select>
              </div>
              <button type="submit" class="ph-btn primary full" [disabled]="orderForm.invalid || placingOrder">
                {{ placingOrder ? 'Placing...' : 'Submit to Laboratory' }}
              </button>
            </form>
          </div>

          <div class="card catalog-pane">
            <div class="pane-header">
              <h3>Service Catalog</h3>
            </div>
            <div class="catalog-scroll custom-scroll">
              <div class="cat-item" *ngFor="let t of tests">
                <div class="cat-info">
                  <strong>{{ t.testName }}</strong>
                  <span>Unit: {{ t.unit || 'n/a' }} • Range: {{ t.referenceRange || 'custom' }}</span>
                </div>
                <div class="cat-price">₹{{ t.price || '500' }}</div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  `,
  styles: [`
    .clinical-bg { padding: 2.5rem; background: #F8FAFC; min-height: 100vh; }
    .lab-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .page-title { font-size: 1.8rem; color: #1E293B; font-weight: 800; }
    .page-subtitle { color: #64748B; font-size: 0.95rem; margin-top: 0.25rem; }

    .context-banner { background: #fff; border: 1px solid #E2E8F0; border-radius: 20px; padding: 1.5rem; margin-bottom: 2rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); display: flex; border-left: 6px solid #6366f1; }
    .context-banner.no-patient { border-left-color: #F59E0B; background: #FFFBEB; }
    .banner-content { display: flex; justify-content: space-between; align-items: center; width: 100%; }
    .patient-brief { display: flex; gap: 1.5rem; align-items: center; }
    .patient-brief i { font-size: 2.25rem; color: #6366f1; }
    .p-meta strong { font-size: 1.25rem; color: #1E293B; }
    .p-meta span { font-size: 0.75rem; color: #64748B; font-weight: 700; text-transform: uppercase; }

    .stats-mini { display: flex; gap: 2rem; }
    .sm-item label { display: block; font-size: 0.7rem; color: #64748B; text-transform: uppercase; font-weight: 800; }
    .sm-item strong { font-size: 1.5rem; color: #1E293B; }
    .sm-item.divider { width: 1px; background: #E2E8F0; }

    .trend-section { margin-bottom: 2rem; padding: 2rem; }
    .full-width { grid-column: 1 / -1; }
    .chart-container { height: 300px; position: relative; margin-top: 1rem; }

    .lab-grid { display: grid; grid-template-columns: 1fr 360px; gap: 2rem; }
    .card { background: #fff; border: 1px solid #E2E8F0; border-radius: 20px; padding: 1.5rem; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); }

    .reports-timeline { display: flex; flex-direction: column; gap: 1.5rem; }
    .report-item { padding: 1.75rem; border-left: 5px solid #CBD5E1; transition: 0.3s; }
    .report-item:hover { transform: translateX(5px); border-left-color: #6366f1; }
    .report-item.is-critical { border-left-color: #EF4444; background: #FEF2F2; }
    
    .ri-header { display: flex; justify-content: space-between; margin-bottom: 1.5rem; }
    .test-title { font-size: 1.15rem; font-weight: 800; color: #1E293B; display: block; }
    .id-tag { color: #6366f1; font-weight: 800; font-size: 0.75rem; }

    .result-row { display: flex; gap: 3rem; }
    .val-text { font-size: 1.5rem; font-weight: 800; color: #1E293B; display: flex; align-items: center; gap: 0.75rem; }
    .val-text.critical { color: #EF4444; }
    .ref-range label { font-size: 0.7rem; color: #64748B; text-transform: uppercase; font-weight: 800; display: block; margin-bottom: 0.35rem; }
    .ref-range p { font-weight: 700; color: #334155; }

    .catalog-scroll { max-height: 400px; overflow-y: auto; padding-right: 8px; }
    .cat-item { display: flex; justify-content: space-between; padding: 1rem; border-bottom: 1px solid #F1F5F9; }
    .cat-item strong { display: block; font-size: 0.9rem; }
    .cat-item span { font-size: 0.7rem; color: #64748B; font-weight: 600; }
    .cat-price { color: #6366f1; font-weight: 800; font-family: syne; }

    .ph-btn { padding: 0.75rem 1.5rem; border-radius: 12px; font-weight: 700; cursor: pointer; border: 1px solid #E2E8F0; display: flex; align-items: center; gap:0.6rem; transition: 0.2s; }
    .ph-btn.primary { background: #6366f1; color: #fff; border:none; }
    .ph-btn.secondary { background: #F1F5F9; color: #475569; border:none; }
    .ph-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2); }
    .full { width: 100%; justify-content: center; }

    .custom-scroll::-webkit-scrollbar { width: 6px; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }

    @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
    .pending-block i { animation: pulse 2s infinite; color: #F59E0B; }
  
    .custom-select { 
      width: 100%; padding: 0.8rem 1rem; border: 1px solid var(--border); 
      border-radius: var(--radius-sm); background: var(--surface); 
      font-size: 0.9rem; transition: 0.2s; 
    }
    .custom-select:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1); }
  `]
})
export class LabComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('trendChart') trendChartCanvas!: ElementRef;

  activePatient: any | null = null;
  tests: LabTest[] = [];
  reports: LabReport[] = [];
  testSuggestions: string[] = [];
  catalogSearch = '';
  placingOrder = false;
  showNewOrder = false;
  pendingCount = 0;
  
  trendableTests: { testId: number, testName: string }[] = [];
  activeTrendTestName = '';
  hasTrendData = false;
  private chart: any;

  private sub = new Subscription();

  readonly orderForm = this.fb.nonNullable.group({
    testId: [0, [Validators.required, Validators.min(1)]]
  });

  constructor(
    private fb: FormBuilder,
    private labApi: LabApiService,
    private contextService: PatientContextService,
    private auth: AuthService
  ) {
    // Add form value change debugging
    this.orderForm.valueChanges.subscribe(value => {
      console.log('Lab form value changed:', value);
      console.log('Lab form valid:', this.orderForm.valid);
      console.log('Lab form errors:', this.orderForm.errors);
    });
  }

  ngOnInit(): void {
    const role = this.auth.getRole()?.toUpperCase();
    if (role === 'PATIENT' && !this.contextService.getActivePatient()) {
       const userId = Number(this.auth.getUserId());
       const username = this.auth.getUsername() ?? 'Patient';
       if (userId) this.contextService.setPatient({ id: userId, name: username, role: 'PATIENT' });
    }

    // Load tests immediately on initialization
    this.loadCatalog();
    
    this.sub.add(this.contextService.activePatient$.subscribe(p => {
      this.activePatient = p;
      if (p) this.loadReports();
      else {
          this.reports = [];
          this.hasTrendData = false;
      }
    }));
  }

  ngAfterViewInit(): void {
    // Canvas might not be available yet if hasTrendData is false
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    if (this.chart) this.chart.destroy();
  }

  loadCatalog(): void {
    this.labApi.getTestsCatalogLocal().subscribe({
      next: items => this.tests = items
    });
  }

  onTestChange(event: any): void {
    console.log('onTestChange called with:', event.target.value);
    const testId = Number(event.target.value);
    
    if (testId > 0) {
      const test = this.tests.find(t => t.id === testId);
      if (test) {
        console.log('Found test:', test);
        console.log('Form after change:', this.orderForm.value);
        console.log('Form valid:', this.orderForm.valid);
        console.log('Form errors:', this.orderForm.errors);
      }
    } else {
      console.log('No test selected');
    }
  }

  filterTests(q: string): void {
    console.log('filterTests called with:', q);
    console.log('Available tests:', this.tests);
    this.testSuggestions = this.tests
      .filter(t => t.testName.toLowerCase().includes(q.toLowerCase()))
      .map(t => t.testName);
    console.log('Test suggestions updated:', this.testSuggestions);
  }

  selectTest(name: string): void {
    console.log('selectTest called with:', name);
    const test = this.tests.find(t => t.testName === name);
    if (test) {
      console.log('Found test:', test);
      this.orderForm.patchValue({ testId: test.id! });
      console.log('Form after patch:', this.orderForm.value);
      console.log('Form valid:', this.orderForm.valid);
      console.log('Form errors:', this.orderForm.errors);
    } else {
      console.log('Test not found for:', name);
    }
  }

  placeOrder(): void {
    console.log('placeOrder called');
    console.log('Active patient:', this.activePatient);
    console.log('Form valid:', !this.orderForm.invalid);
    console.log('Form value:', this.orderForm.value);
    console.log('Form errors:', this.orderForm.errors);
    
    if (!this.activePatient || this.orderForm.invalid) {
      console.log('Order submission blocked');
      return;
    }
    
    this.placingOrder = true;
    this.labApi.placeOrder({
      patientId: Number(this.activePatient.id),
      doctorId: Number(this.auth.getUserId()) || 1,
      testId: Number(this.orderForm.controls.testId.value)
    }).subscribe({
      next: () => {
        console.log('Order placed successfully');
        this.placingOrder = false;
        this.showNewOrder = false;
        this.loadReports();
        
        // Medical records will refresh automatically when patient context changes
      },
      error: (err) => {
        console.log('Order placement error:', err);
        this.placingOrder = false;
      }
    });
  }

  loadReports(): void {
    if (!this.activePatient) return;
    this.labApi.getPatientResults(Number(this.activePatient.id)).subscribe({
      next: items => {
        this.reports = items.sort((a,b) => (b.id || 0) - (a.id || 0));
        this.pendingCount = this.reports.filter(r => !r.result && !r.numericResult).length;
        this.extractTrendData();
      }
    });
  }

  extractTrendData(): void {
    const numericResults = this.reports.filter(r => r.numericResult != null);
    if (numericResults.length === 0) {
      this.hasTrendData = false;
      return;
    }

    const testMap = new Map<number, string>();
    numericResults.forEach(r => {
        const testName = this.tests.find(t => t.id === r.testId)?.testName || `Test #${r.testId}`;
        testMap.set(r.testId, testName);
    });

    this.trendableTests = Array.from(testMap.entries()).map(([id, name]) => ({ testId: id, testName: name }));
    
    if (this.trendableTests.length > 0) {
      this.hasTrendData = true;
      setTimeout(() => this.renderChart(this.trendableTests[0].testId), 100);
    }
  }

  onTrendTestChange(event: any): void {
    this.renderChart(Number(event.target.value));
  }

  renderChart(testId: number): void {
    if (!this.trendChartCanvas) return;
    
    const data = this.reports
      .filter(r => r.testId === testId && r.numericResult != null)
      .sort((a,b) => new Date(a.reportDate).getTime() - new Date(b.reportDate).getTime());

    this.activeTrendTestName = this.trendableTests.find(t => t.testId === testId)?.testName || '';

    if (this.chart) this.chart.destroy();

    const ctx = this.trendChartCanvas.nativeElement.getContext('2d');
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(r => r.reportDate),
        datasets: [{
          label: this.activeTrendTestName,
          data: data.map(r => r.numericResult),
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          borderWidth: 3,
          pointRadius: 6,
          pointBackgroundColor: '#6366f1',
          tension: 0.3,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { grid: { borderDash: [5, 5] }, beginAtZero: false },
          x: { grid: { display: false } }
        }
      }
    });
  }

  verify(reportId: number): void {
    this.labApi.verifyReport(reportId).subscribe({
      next: () => this.loadReports()
    });
  }

  loadArtifact(reportId: number): void {
     // Trigger PDF logic
  }
}
