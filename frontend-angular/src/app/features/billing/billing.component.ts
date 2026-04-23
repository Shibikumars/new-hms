import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { BillingApiService, Invoice, RazorpayOrder } from './billing-api.service';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

declare var Razorpay: any;

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, StatusBadgeComponent],
  template: `
    <div class="container clinical-bg">
      <header class="ph-header">
        <div class="header-left">
          <h1 class="page-title">Hospital Ledger</h1>
          <p class="page-subtitle">Track settlements, itemized tax invoices, and insurance claims.</p>
        </div>
        <div class="header-right" *ngIf="!isPatientRole">
          <button class="ph-btn primary" (click)="showNewInvoice = !showNewInvoice">
            <i class="ph ph-plus-circle"></i> Generate Tax Invoice
          </button>
        </div>
      </header>

      <div class="context-banner" [class.no-patient]="!isPatientRole && !form.value.patientId">
        <div class="banner-content">
          <div class="patient-brief">
            <i class="ph ph-wallet-bold"></i>
            <div class="p-meta" *ngIf="isPatientRole">
               <strong>Account: {{ authService.getUsername() }}</strong>
               <span>Patient Ledger · Hospital GSTIN: 29AAAAA0000A1Z5</span>
            </div>
          </div>
          <div class="search-box" *ngIf="!isPatientRole">
             <input type="number" [(ngModel)]="searchPatientId" placeholder="Patient MRN..." (keyup.enter)="loadInvoices()" />
             <button class="ph-btn sm" (click)="loadInvoices()">Search MRN</button>
          </div>
        </div>
      </div>

      <div class="billing-grid">
        <main class="invoices-column">
          <div class="card pane">
            <div class="pane-header">
              <h3>Financial Timeline</h3>
              <div class="pane-stats">
                 <span class="p-stat">Outstanding: <strong>₹{{ totalOutstanding }}</strong></span>
                 <span class="p-stat divider"></span>
                 <span class="p-stat">Paid: <strong>₹{{ totalPaid }}</strong></span>
              </div>
            </div>

            <div class="invoice-list">
               <div class="invoice-item card" *ngFor="let inv of invoices" [class.paid]="inv.status === 'PAID'">
                  <div class="inv-header">
                     <div class="inv-id">
                        <span class="inv-tag">{{ inv.invoiceNumber }}</span>
                        <span class="inv-subtitle">{{ inv.sourceSummary || 'Clinical Investigation' }}</span>
                     </div>
                     <div class="inv-amount-block">
                        <div class="grand-total">₹{{ inv.totalAmount }}</div>
                        <div class="tax-breakdown" *ngIf="inv.taxAmount">
                           Base: ₹{{ inv.baseAmount }} + GST: ₹{{ inv.taxAmount }} ({{ inv.taxRate }}%)
                        </div>
                     </div>
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
                        <label>Insurance</label>
                        <app-status-badge [status]="inv.claimStatus || 'DRAFT'"></app-status-badge>
                     </div>
                  </div>

                  <div class="inv-footer">
                     <div class="actions-row">
                        <button class="ph-btn sm" *ngIf="inv.status !== 'PAID'" (click)="payWithRazorpay(inv)" [disabled]="payingInvoiceId === inv.id">
                           <i class="ph ph-credit-card"></i> Pay Securely
                        </button>
                        <button class="ph-btn sm secondary" *ngIf="inv.status === 'PAID'">
                           <i class="ph ph-receipt"></i> Get Receipt
                        </button>
                        <button class="ph-btn sm secondary" *ngIf="inv.claimStatus === 'DRAFT' || !inv.claimStatus">
                           <i class="ph ph-shield-check"></i> File Claim
                        </button>
                     </div>
                  </div>
               </div>
            </div>

            <div class="empty-state" *ngIf="invoices.length === 0 && !loadingInvoices">
              <i class="ph ph-receipt"></i>
              <p>No billing records found in current ledger.</p>
            </div>
            
            <div class="loading-state" *ngIf="loadingInvoices">
              <i class="ph ph-circle-notch ph-spin"></i>
              <span>Syncing with gateway...</span>
            </div>
          </div>
        </main>

        <aside class="side-column">
          <div class="card order-pane" *ngIf="showNewInvoice">
            <div class="pane-header">
              <h3>Draft Tax Invoice</h3>
              <button class="close-btn" (click)="showNewInvoice = false"><i class="ph ph-x"></i></button>
            </div>
            <form [formGroup]="form" (ngSubmit)="createInvoice()" class="pane-form">
               <div class="form-group">
                  <label>Patient MRN</label>
                  <input type="number" formControlName="patientId" />
               </div>
               <div class="form-group">
                  <label>Gross Amount (₹)</label>
                  <input type="number" formControlName="totalAmount" />
                  <span class="hint">Includes 5% health GST automatically.</span>
               </div>
               <button type="submit" class="ph-btn primary full" [disabled]="form.invalid || creatingInvoice">
                  Generate Final Invoice
               </button>
            </form>
          </div>

          <div class="card summary-pane">
            <div class="pane-header">
              <h3>Institutional Rates</h3>
            </div>
            <div class="summary-list">
              <div class="sum-item" *ngFor="let rate of institutionalRates">
                <i [class]="rate.icon"></i>
                <div class="si-info">
                  <strong>{{ rate.name }}</strong>
                  <span>{{ rate.desc }}</span>
                </div>
                <div class="si-val">₹{{ rate.val }}</div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  `,
  styles: [`
    .clinical-bg { padding: 2.5rem; background: #F8FAFC; min-height: 100vh; font-family: 'Inter', sans-serif; }
    .ph-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; }
    .page-title { font-size: 1.8rem; font-weight: 800; color: #1E293B; letter-spacing: -0.01em; }
    .page-subtitle { color: #64748B; font-size: 0.95rem; margin-top: 0.25rem; }

    .context-banner { background: #fff; border: 1px solid #E2E8F0; border-radius: 20px; padding: 1.5rem; margin-bottom: 2.5rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); display: flex; border-left: 6px solid #6366f1; }
    .banner-content { display: flex; justify-content: space-between; align-items: center; width: 100%; }
    .patient-brief { display: flex; gap: 1.25rem; align-items: center; }
    .patient-brief i { font-size: 2.25rem; color: #6366f1; }
    .p-meta strong { display: block; font-size: 1.1rem; color: #334155; }
    .p-meta span { font-size: 0.75rem; color: #64748B; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; }
    
    .search-box { display: flex; gap: 0.75rem; }
    .search-box input { border: 1px solid #E2E8F0; background: #F8FAFC; padding: 0.75rem 1.25rem; border-radius: 12px; width: 220px; font-weight: 600; }

    .billing-grid { display: grid; grid-template-columns: 1fr 340px; gap: 2.5rem; }
    .card { background: #fff; border: 1px solid #E2E8F0; border-radius: 24px; padding: 2rem; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); }
    
    .pane-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .pane-header h3 { font-size: 1.15rem; font-weight: 800; color: #1E293B; }
    .pane-stats { display: flex; gap: 1.5rem; align-items: center; }
    .p-stat { font-size: 0.85rem; color: #64748B; font-weight: 700; }
    .p-stat strong { color: #1E293B; font-family: 'Syne', sans-serif; font-size: 1.1rem; margin-left: 0.4rem; }
    .p-stat.divider { width: 1px; height: 20px; background: #E2E8F0; }

    .invoice-list { display: flex; flex-direction: column; gap: 1.5rem; }
    .invoice-item { padding: 1.75rem; border-left: 5px solid #E2E8F0; transition: 0.3s; background: #fff; }
    .invoice-item:hover { border-left-color: #6366f1; transform: translateX(5px); }
    .invoice-item.paid { border-left-color: #22C55E; }
    
    .inv-header { display: flex; justify-content: space-between; margin-bottom: 1.5rem; }
    .inv-tag { background: #F1F5F9; color: #6366f1; font-weight: 800; font-family: 'Syne', sans-serif; padding: 0.25rem 0.6rem; border-radius: 6px; font-size: 0.75rem; }
    .inv-subtitle { font-size: 1.1rem; font-weight: 700; color: #1E293B; display: block; margin-top: 0.4rem; }
    .inv-amount-block { text-align: right; }
    .grand-total { font-family: 'Syne', sans-serif; font-weight: 800; color: #1E293B; font-size: 1.6rem; }
    .tax-breakdown { font-size: 0.7rem; color: #64748B; font-weight: 700; margin-top: 0.25rem; }
    
    .inv-details { display: flex; gap: 3rem; margin-bottom: 1.5rem; }
    .detail-grp label { display: block; font-size: 0.65rem; text-transform: uppercase; color: #64748B; font-weight: 800; margin-bottom: 0.4rem; }
    .detail-grp span { font-size: 0.95rem; color: #334155; font-weight: 700; }

    .actions-row { display: flex; gap: 0.75rem; border-top: 1px dashed #E2E8F0; padding-top: 1.25rem; }
    
    .sum-item { display: flex; gap: 1.25rem; align-items: center; padding: 1rem; border-radius: 16px; background: #F1F5F9; margin-bottom: 1rem; }
    .sum-item i { font-size: 1.5rem; color: #6366f1; }
    .si-info strong { font-size: 0.95rem; }
    .si-info span { font-size: 0.75rem; color: #64748B; }
    .si-val { font-family: 'Syne', sans-serif; font-weight: 800; color: #6366f1; margin-left: auto; }

    .form-group label { display: block; font-size: 0.8rem; font-weight: 800; color: #64748B; margin-bottom: 0.5rem; text-transform: uppercase; }
    .form-group input { width: 100%; border: 1px solid #E2E8F0; padding: 1rem; border-radius: 12px; font-weight: 600; font-family: inherit; }
    .hint { font-size: 0.75rem; color: #64748B; font-style: italic; margin-top: 0.4rem; display: block; }

    .ph-btn { padding: 0.8rem 1.5rem; border-radius: 14px; font-weight: 700; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 0.6rem; transition: 0.2s; border: none; }
    .ph-btn.primary { background: #6366f1; color: #fff; }
    .ph-btn.secondary { background: #F1F5F9; color: #475569; }
    .ph-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2); }
  `]
})
export class BillingComponent implements OnInit, OnDestroy {
  invoices: Invoice[] = [];
  loadingInvoices = false;
  creatingInvoice = false;
  payingInvoiceId: number | null = null;
  isPatientRole = false;

  private sub = new Subscription();
  showNewInvoice = false;
  searchPatientId = 0;

  totalOutstanding = 0;
  totalPaid = 0;

  institutionalRates = [
      { name: 'Consultation', desc: 'Standard OPD specialist visit', val: 500, icon: 'ph ph-first-aid' },
      { name: 'Diagnostic Panel', desc: 'Basic blood chemistry', val: 850, icon: 'ph ph-test-tube' },
      { name: 'Emergency Care', desc: 'Acute clinical intervention', val: 1200, icon: 'ph ph-lightning' },
      { name: 'Telemedicine', desc: 'Remote clinical session', val: 450, icon: 'ph ph-info' }
  ];

  readonly form = this.fb.nonNullable.group({
    patientId: [0, [Validators.required, Validators.min(1)]],
    totalAmount: [500, [Validators.required, Validators.min(1)]]
  });

  constructor(
    private fb: FormBuilder,
    private billingApi: BillingApiService,
    public authService: AuthService,
    private toast: ToastService
  ) { }

  ngOnInit(): void {
    const role = (this.authService.getRole() ?? '').toUpperCase();
    this.isPatientRole = role === 'PATIENT';
    if (this.isPatientRole) {
      this.searchPatientId = this.authService.getUserId() ?? 0;
      this.loadInvoices();
    }
  }

  loadInvoices(): void {
    if (!this.searchPatientId || this.searchPatientId < 1) return;
    this.loadingInvoices = true;
    this.billingApi.getInvoicesByPatient(this.searchPatientId).subscribe({
      next: items => {
        this.invoices = items.sort((a, b) => (b.id || 0) - (a.id || 0));
        this.calculateTotals();
        this.loadingInvoices = false;
      },
      error: () => this.loadingInvoices = false
    });
  }

  calculateTotals(): void {
    this.totalPaid = this.invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + (i.totalAmount || 0), 0);
    this.totalOutstanding = this.invoices.filter(i => i.status !== 'PAID').reduce((s, i) => s + (i.totalAmount || 0), 0);
  }

  createInvoice(): void {
    if (this.isPatientRole || this.form.invalid) return;
    this.creatingInvoice = true;
    this.billingApi.createInvoice(this.form.getRawValue()).subscribe({
      next: () => {
        this.toast.success('Invoice Generated', 'New financial record created.');
        this.creatingInvoice = false;
        this.showNewInvoice = false;
        this.loadInvoices();
      },
      error: () => {
        this.creatingInvoice = false;
        this.toast.error('Error', 'Failed to generate record.');
      }
    });
  }

  payWithRazorpay(inv: any): void {
    this.payingInvoiceId = inv.id;
    this.billingApi.createRazorpayOrder(inv.totalAmount * 100).subscribe({
      next: (order: RazorpayOrder) => this.openRazorpay(order, inv),
      error: () => {
        this.payingInvoiceId = null;
        this.toast.error('Payment Error', 'Gateway initiation failed.');
      }
    });
  }

  private openRazorpay(order: RazorpayOrder, inv: any): void {
    const options = {
      key: 'rzp_test_stub_id',
      amount: order.amount,
      currency: order.currency,
      name: 'City Care Hospital',
      description: `Invoice Settlement #${inv.invoiceNumber}`,
      order_id: order.id,
      handler: (response: any) => this.verifyPayment(response, inv.id),
      prefill: { name: this.authService.getUsername() },
      theme: { color: '#6366f1' },
      modal: { ondismiss: () => this.payingInvoiceId = null }
    };
    const rzp = new Razorpay(options);
    rzp.open();
  }

  private verifyPayment(response: any, invoiceId: number): void {
    this.billingApi.verifyRazorpayPayment(response).subscribe({
      next: () => {
        this.billingApi.payInvoice(invoiceId, {
          paymentMethod: 'RAZORPAY',
          paymentReference: response.razorpay_payment_id
        }).subscribe({
          next: () => {
            this.toast.success('Settled', 'Record cleared.');
            this.payingInvoiceId = null;
            this.loadInvoices();
          }
        });
      }
    });
  }

  ngOnDestroy(): void { this.sub.unsubscribe(); }
}
