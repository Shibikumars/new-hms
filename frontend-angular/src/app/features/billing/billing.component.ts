import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { BillingApiService, ClaimTransitionRequest, Invoice } from './billing-api.service';
import { AuthService } from '../../core/auth.service';
import { DataTableComponent, ColumnConfig } from '../../shared/components/data-table/data-table.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { PaymentModalComponent, PaymentResult } from '../../shared/components/payment-modal/payment-modal.component';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, DataTableComponent, StatusBadgeComponent, PaymentModalComponent],
  template: `
    <div class="container clinical-bg">
      <app-payment-modal 
        *ngIf="showPaymentModal"
        [amount]="paymentAmount"
        [title]="paymentTitle"
        (confirmed)="handlePaymentConfirmed($event)"
        (cancelled)="handlePaymentCancelled()">
      </app-payment-modal>
      <header class="ph-header">
        <div class="header-left">
          <h1 class="page-title">Billing & Revenue</h1>
          <p class="page-subtitle">Manage clinical invoices, insurance claims, and patient accounts.</p>
        </div>
        <div class="header-right" *ngIf="!isPatientRole">
          <button class="ph-btn primary" (click)="showNewInvoice = !showNewInvoice">
            <i class="ph ph-plus-circle"></i> Generate Invoice
          </button>
        </div>
      </header>

      <div class="alert success" *ngIf="successMessage">
        <i class="ph ph-check-circle"></i> {{ successMessage }}
      </div>

      <div class="context-banner" [class.no-patient]="!isPatientRole && !form.value.patientId">
        <div class="banner-content">
          <div class="patient-brief">
            <i class="ph ph-wallet-bold"></i>
            <div class="p-meta" *ngIf="isPatientRole">
               <strong>Account Holder: {{ authService.getUsername() }}</strong>
               <span>Patient Billing Access · ID #{{ authService.getUserId() }}</span>
            </div>
            <div class="p-meta" *ngIf="!isPatientRole">
               <strong>Revenue Operations Console</strong>
               <span>Financial Oversight · Staff Portal</span>
            </div>
          </div>
          <div class="search-box" *ngIf="!isPatientRole">
             <input type="number" [(ngModel)]="searchPatientId" placeholder="Patient ID..." (keyup.enter)="loadInvoices()" />
             <button class="ph-btn sm secondary" (click)="loadInvoices()">Load Records</button>
          </div>
        </div>
      </div>

      <div class="billing-grid">
        <!-- Main: Invoices & Claims -->
        <main class="invoices-column">
          <div class="card pane">
            <div class="pane-header">
              <h3>Recent Invoices</h3>
              <div class="pane-stats">
                 <span class="p-stat">Outstanding: <strong>\${{ totalOutstanding }}</strong></span>
                 <span class="p-stat divider"></span>
                 <span class="p-stat">Paid: <strong>\${{ totalPaid }}</strong></span>
              </div>
            </div>

            <div class="invoice-list">
               <div class="invoice-item card" *ngFor="let inv of invoices">
                  <div class="inv-header">
                     <div class="inv-id">
                        <span class="inv-tag">#{{ inv.invoiceNumber }}</span>
                        <span class="inv-subtitle">{{ inv.sourceSummary || 'Clinical Encounter' }}</span>
                     </div>
                     <div class="inv-amount">\${{ inv.totalAmount }}</div>
                  </div>
                  <div class="inv-details">
                     <div class="detail-grp">
                        <label>Issue Date</label>
                        <span>{{ inv.invoiceDate }}</span>
                     </div>
                     <div class="detail-grp">
                        <label>Status</label>
                        <app-status-badge [status]="inv.status || 'UNPAID'"></app-status-badge>
                     </div>
                     <div class="detail-grp">
                        <label>Claim Status</label>
                        <app-status-badge [status]="inv.claimStatus || 'DRAFT'"></app-status-badge>
                     </div>
                  </div>

                  <div class="claim-notes" *ngIf="inv.claimRejectionCode || inv.claimDecisionReason">
                    <i class="ph ph-warning-circle"></i>
                    <p>{{ inv.claimRejectionCode }}: {{ inv.claimDecisionReason }}</p>
                  </div>

                  <div class="inv-footer">
                     <div class="patient-actions" *ngIf="inv.status !== 'PAID'">
                        <button class="ph-btn primary sm" (click)="pay(inv.id!)" [disabled]="payingInvoiceId === inv.id">
                           <i class="ph ph-credit-card"></i> {{ payingInvoiceId === inv.id ? 'Processing...' : 'Settle Now' }}
                        </button>
                     </div>
                     <div class="staff-actions" *ngIf="!isPatientRole && inv.claimStatus !== 'SETTLED'">
                        <div class="staff-row">
                          <input type="text" [(ngModel)]="claimReasonById[inv.id!]" placeholder="Decision reason..." />
                          <div class="staff-btns">
                            <button class="ico-btn" (click)="transitionClaim(inv.id!, 'SUBMIT')" title="Submit Claim"><i class="ph ph-paper-plane-right"></i></button>
                            <button class="ico-btn" (click)="transitionClaim(inv.id!, 'APPROVE')" title="Approve"><i class="ph ph-check-circle"></i></button>
                            <button class="ico-btn danger" (click)="transitionClaim(inv.id!, 'REJECT')" title="Reject"><i class="ph ph-prohibit"></i></button>
                            <button class="ico-btn" (click)="transitionClaim(inv.id!, 'SETTLE')" title="Settle"><i class="ph ph-handshake"></i></button>
                          </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <div class="empty-state" *ngIf="invoices.length === 0 && !loadingInvoices">
              <i class="ph ph-receipt"></i>
              <p>No billing records found for this account.</p>
            </div>
            
            <div class="loading-state" *ngIf="loadingInvoices">
              <i class="ph ph-circle-notch ph-spin"></i>
              <span>Syncing financial ledger...</span>
            </div>
          </div>
        </main>

        <!-- Sidebar: Catalog & New Invoice -->
        <aside class="side-column">
          <div class="card order-pane" *ngIf="showNewInvoice">
            <div class="pane-header">
              <h3>Draft Invoice</h3>
              <button class="close-btn" (click)="showNewInvoice = false"><i class="ph ph-x"></i></button>
            </div>
            <form [formGroup]="form" (ngSubmit)="createInvoice()" class="pane-form">
               <div class="form-group">
                  <label>Patient ID</label>
                  <input type="number" formControlName="patientId" />
               </div>
               <div class="form-group">
                  <label>Service Amount ($)</label>
                  <input type="number" formControlName="totalAmount" />
               </div>
               <button type="submit" class="ph-btn primary full" [disabled]="form.invalid || creatingInvoice">
                  {{ creatingInvoice ? 'Generating...' : 'Finalize Invoice' }}
               </button>
            </form>
          </div>

          <div class="card summary-pane">
            <div class="pane-header">
              <h3>Service Summary</h3>
            </div>
            <div class="summary-list">
              <div class="sum-item">
                <i class="ph ph-first-aid"></i>
                <div class="si-info">
                  <strong>Consultation Fee</strong>
                  <span>Standard office visit</span>
                </div>
                <div class="si-val">$150.00</div>
              </div>
              <div class="sum-item">
                <i class="ph ph-test-tube"></i>
                <div class="si-info">
                  <strong>Lab Investigations</strong>
                  <span>Diagnostic panel</span>
                </div>
                <div class="si-val">$85.00</div>
              </div>
              <div class="sum-item">
                <i class="ph ph-pill"></i>
                <div class="si-info">
                  <strong>Pharmacology</strong>
                  <span>Supplies & Admin</span>
                </div>
                <div class="si-val">$45.00</div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  `,
  styles: [`
    .clinical-bg { padding: 2rem; background: var(--bg); min-height: 100vh; }
    .ph-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
    .page-title { font-size: 1.75rem; color: var(--primary); font-weight: 800; }
    .page-subtitle { color: var(--text-muted); font-size: 0.95rem; margin-top: 0.25rem; }

    .context-banner { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 2rem; box-shadow: var(--shadow-soft); display: flex; align-items: center; justify-content: space-between; border-left: 6px solid var(--primary); }
    .banner-content { display: flex; justify-content: space-between; align-items: center; width: 100%; }
    .patient-brief { display: flex; gap: 1rem; align-items: center; }
    .patient-brief i { font-size: 2rem; color: var(--primary); }
    .p-meta strong { display: block; font-size: 1rem; color: var(--text); }
    .p-meta span { font-size: 0.75rem; color: var(--text-muted); font-weight: 700; }
    
    .search-box { display: flex; gap: 0.5rem; align-items: center; }
    .search-box input { border: 1px solid var(--border); padding: 0.5rem 1rem; border-radius: 999px; width: 150px; font-size: 0.85rem; }

    .billing-grid { display: grid; grid-template-columns: 1fr 320px; gap: 2rem; }
    .card { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 2rem; box-shadow: var(--shadow-soft); }
    
    .pane-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .pane-header h3 { font-size: 1.1rem; font-weight: 800; color: var(--text); }
    .pane-stats { display: flex; gap: 1rem; align-items: center; }
    .p-stat { font-size: 0.85rem; color: var(--text-muted); font-weight: 700; }
    .p-stat strong { color: var(--primary); font-family: 'Syne', sans-serif; }
    .p-stat.divider { width: 1px; height: 16px; background: var(--border); }

    .invoice-list { display: grid; gap: 1.5rem; }
    .invoice-item { padding: 1.25rem; border-left: 4px solid var(--border); transition: 0.2s; }
    .invoice-item:hover { border-left-color: var(--primary); transform: translateX(4px); }
    .inv-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; }
    .inv-tag { font-family: 'Syne', sans-serif; font-weight: 800; color: var(--primary); font-size: 0.75rem; display: block; }
    .inv-subtitle { font-size: 1rem; font-weight: 700; color: var(--text); }
    .inv-amount { font-family: 'Syne', sans-serif; font-weight: 800; color: var(--text); font-size: 1.25rem; }
    
    .inv-details { display: flex; gap: 2rem; margin-bottom: 1.5rem; }
    .detail-grp label { display: block; font-size: 0.65rem; text-transform: uppercase; color: var(--text-muted); font-weight: 800; margin-bottom: 0.25rem; }
    .detail-grp span { font-size: 0.85rem; color: var(--text); font-weight: 700; }

    .claim-notes { background: rgba(217, 119, 6, 0.05); border: 1px solid rgba(217, 119, 6, 0.2); border-radius: 8px; padding: 0.75rem; display: flex; gap: 0.75rem; align-items: center; margin-bottom: 1rem; }
    .claim-notes i { color: var(--warning); }
    .claim-notes p { margin: 0; font-size: 0.75rem; color: var(--text-soft); font-weight: 600; }

    .inv-footer { border-top: 1px dashed var(--border); padding-top: 1rem; }
    .staff-row { display: flex; gap: 1rem; align-items: center; }
    .staff-row input { flex: 1; border: 1px solid var(--border); background: var(--bg); border-radius: 8px; padding: 0.5rem 0.75rem; font-size: 0.8rem; }
    .staff-btns { display: flex; gap: 0.5rem; }
    .ico-btn { width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border); background: #fff; color: var(--text-soft); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
    .ico-btn:hover { border-color: var(--primary); color: var(--primary); }
    .ico-btn.danger:hover { border-color: var(--danger); color: var(--danger); }

    .side-column { display: flex; flex-direction: column; gap: 1.5rem; }
    .summary-list { display: grid; gap: 1rem; }
    .sum-item { display: flex; align-items: center; gap: 1rem; padding: 1rem; background: var(--surface-soft); border-radius: 12px; }
    .sum-item i { font-size: 1.25rem; color: var(--primary); }
    .si-info { flex: 1; display: flex; flex-direction: column; }
    .si-info strong { font-size: 0.85rem; color: var(--text); }
    .si-info span { font-size: 0.7rem; color: var(--text-muted); }
    .si-val { font-family: 'Syne', sans-serif; font-weight: 800; color: var(--primary); font-size: 0.9rem; }

    .pane-form { display: grid; gap: 1.25rem; }
    .form-group label { display: block; font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.5rem; }
    .form-group input { width: 100%; border: 1px solid var(--border); padding: 0.75rem; border-radius: 8px; background: var(--bg); }

    .close-btn { background: transparent; border: none; font-size: 1.25rem; color: var(--text-soft); cursor: pointer; }

    .ph-btn { background: var(--surface); border: 1px solid var(--border); padding: 0.6rem 1.25rem; border-radius: 999px; color: var(--text-soft); font-weight: 700; font-size: 0.85rem; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; transition: 0.2s; justify-content: center; }
    .ph-btn:hover { border-color: var(--primary); color: var(--primary); transform: translateY(-1px); }
    .ph-btn.primary { background: var(--primary); color: #fff; border-color: var(--primary); }
    .ph-btn.full { width: 100%; }
    .ph-btn.sm { padding: 0.4rem 0.8rem; font-size: 0.75rem; }

    .alert.success { background: rgba(13, 126, 106, 0.1); color: var(--accent); border: 1px solid rgba(13, 126, 106, 0.2); padding: 1rem; border-radius: 12px; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.75rem; font-weight: 700; }
    .empty-state { text-align: center; padding: 4rem 1rem; color: var(--text-muted); }
    .empty-state i { font-size: 3rem; opacity: 0.3; margin-bottom: 1rem; }
    .loading-state { text-align: center; padding: 2rem; color: var(--primary); display: flex; align-items: center; justify-content: center; gap: 0.75rem; font-weight: 700; }

    @media (max-width: 1024px) { .billing-grid { grid-template-columns: 1fr; } .side-column { order: -1; } }
  `]
})
export class BillingComponent implements OnInit {
  invoices: Invoice[] = [];
  loadingInvoices = false;
  creatingInvoice = false;
  payingInvoiceId: number | null = null;
  claimUpdatingId: number | null = null;
  successMessage = '';
  isPatientRole = false;
  
  showPaymentModal = false;
  paymentAmount = 0;
  paymentTitle = '';
  private currentInvoiceId: number | null = null;

  private sub = new Subscription();
  showNewInvoice = false;
  searchPatientId = 0;
  claimReasonById: Record<number, string> = {};
  claimRejectionCodeById: Record<number, string> = {};
  claimRejectionTaxonomy: Record<string, string> = {};

  totalOutstanding = 0;
  totalPaid = 0;

  readonly form = this.fb.nonNullable.group({
    patientId: [0, [Validators.required, Validators.min(1)]],
    totalAmount: [150, [Validators.required, Validators.min(1)]]
  });

  constructor(
    private fb: FormBuilder,
    private billingApi: BillingApiService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    const role = (this.authService.getRole() ?? '').toUpperCase();
    this.isPatientRole = role === 'PATIENT';
    
    if (this.isPatientRole) {
      this.searchPatientId = this.authService.getUserId() ?? 0;
      this.loadInvoices();
    } else {
      this.billingApi.getClaimRejectionTaxonomy().subscribe({
        next: data => this.claimRejectionTaxonomy = data
      });
    }
  }

  loadInvoices(): void {
    if (!this.searchPatientId || this.searchPatientId < 1) return;
    this.loadingInvoices = true;
    this.billingApi.getInvoicesByPatient(this.searchPatientId).subscribe({
      next: items => {
        this.invoices = items.sort((a,b) => (b.id || 0) - (a.id || 0));
        this.calculateTotals();
        this.loadingInvoices = false;
      },
      error: () => this.loadingInvoices = false
    });
  }

  calculateTotals(): void {
    this.totalPaid = this.invoices
      .filter(inv => inv.status === 'PAID')
      .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    this.totalOutstanding = this.invoices
      .filter(inv => inv.status !== 'PAID')
      .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  }

  createInvoice(): void {
    if (this.isPatientRole || this.form.invalid) return;
    this.creatingInvoice = true;
    this.billingApi.createInvoice(this.form.getRawValue()).subscribe({
      next: () => {
        this.successMessage = 'Financial invoice generated and routed to patient ledger.';
        this.creatingInvoice = false;
        this.showNewInvoice = false;
        this.loadInvoices();
        setTimeout(() => this.successMessage = '', 5000);
      },
      error: () => this.creatingInvoice = false
    });
  }

  pay(invoiceId: number): void {
    const inv = this.invoices.find(i => i.id === invoiceId);
    if (!inv) return;

    this.currentInvoiceId = invoiceId;
    this.paymentAmount = inv.totalAmount || 0;
    this.paymentTitle = `Invoice #${inv.invoiceNumber || invoiceId}`;
    this.showPaymentModal = true;
  }

  handlePaymentConfirmed(result: PaymentResult): void {
    this.showPaymentModal = false;
    if (!this.currentInvoiceId) return;

    if (result.method === 'LATER') {
      this.successMessage = 'Instruction saved: Invoice will be settled via monthly clinical ledger.';
      setTimeout(() => this.successMessage = '', 4000);
      return;
    }

    this.payingInvoiceId = this.currentInvoiceId;
    this.billingApi.payInvoice(this.currentInvoiceId, {
      paymentMethod: 'RUPAY',
      paymentReference: result.upiId
    }).subscribe({
      next: () => {
        this.successMessage = `RuPay payment verified. Invoice #${this.currentInvoiceId} settled successfully.`;
        this.payingInvoiceId = null;
        this.loadInvoices();
        setTimeout(() => this.successMessage = '', 5000);
      },
      error: () => this.payingInvoiceId = null
    });
  }

  handlePaymentCancelled(): void {
    this.showPaymentModal = false;
    this.currentInvoiceId = null;
  }

  transitionClaim(invoiceId: number, action: ClaimTransitionRequest['action']): void {
    this.claimUpdatingId = invoiceId;
    const payload: ClaimTransitionRequest = {
      action,
      reason: this.claimReasonById[invoiceId] || 'Staff Decision',
      decidedBy: this.authService.getUsername() ?? undefined
    };
    this.billingApi.transitionClaim(invoiceId, payload).subscribe({
      next: () => {
        this.successMessage = `Policy claim transition [${action}] applied to Invoice #${invoiceId}.`;
        this.claimUpdatingId = null;
        this.loadInvoices();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: () => this.claimUpdatingId = null
    });
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}

