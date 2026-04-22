import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface PaymentResult {
  method: 'LATER' | 'RUPAY';
  upiId?: string;
}

@Component({
  selector: 'app-payment-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="payment-overlay" (click)="onCancel()">
      <div class="payment-card" (click)="$event.stopPropagation()">
        <header class="p-header">
          <div class="header-main">
            <h3>Secure Checkout</h3>
            <span class="secure-tag"><i class="ph ph-shield-check"></i> SSL Secure</span>
          </div>
          <button class="close-btn" (click)="onCancel()"><i class="ph ph-x"></i></button>
        </header>

        <div class="payment-body">
          <div class="order-summary">
            <div class="summary-item">
              <label>Service</label>
              <span>{{ title }}</span>
            </div>
            <div class="summary-item total">
              <label>Total Due</label>
              <span class="amount">₹{{ amount }}</span>
            </div>
          </div>

          <div class="payment-options" *ngIf="view === 'CHOICE'">
            <button class="opt-btn rupay" (click)="selectRuPay()">
              <div class="opt-content">
                <i class="ph ph-qr-code"></i>
                <div class="opt-txt">
                  <strong>Pay with RuPay / UPI</strong>
                  <span>Instant verification & receipt</span>
                </div>
              </div>
              <i class="ph ph-caret-right"></i>
            </button>

            <button class="opt-btn later" (click)="selectLater()">
              <div class="opt-content">
                <i class="ph ph-clock"></i>
                <div class="opt-txt">
                  <strong>Pay Later (On Account)</strong>
                  <span>Add to your monthly clinical ledger</span>
                </div>
              </div>
              <i class="ph ph-caret-right"></i>
            </button>
          </div>

          <div class="upi-flow" *ngIf="view === 'UPI_INPUT'">
            <div class="flow-header">
              <button class="back-btn" (click)="view = 'CHOICE'"><i class="ph ph-arrow-left"></i></button>
              <h4>RuPay / UPI Verification</h4>
            </div>
            
            <div class="upi-field">
              <label>Link UPI ID / VPA</label>
              <div class="input-wrap">
                <input type="text" [(ngModel)]="upiId" placeholder="example&#64;okaxis" [disabled]="processing" />
                <span class="upi-badge">RUPAY</span>
              </div>
              <p class="helper">Typical format: name&#64;bankname or mobile&#64;upi</p>
            </div>

            <button class="pay-finish-btn" [disabled]="processing || !upiId" (click)="processPay()">
              <span *ngIf="!processing">Authorize & Pay ₹{{ amount }}</span>
              <span *ngIf="processing" class="loader-wrap">
                <i class="ph ph-spinner-gap spin"></i> Verifying with Gateway...
              </span>
            </button>
          </div>

          <div class="success-flow" *ngIf="view === 'SUCCESS'">
            <div class="success-icon">
              <div class="check-ring"></div>
              <i class="ph ph-check"></i>
            </div>
            <h4>Payment Successful</h4>
            <p>Verification Ref: <span>HMS-TEST-{{ ref }}</span></p>
            <div class="success-details">
               Your clinical session is now authorized.
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .payment-overlay { fixed: inset 0; position: fixed; inset: 0; background: rgba(12, 19, 34, 0.85); backdrop-filter: blur(8px); z-index: 5000; display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
    .payment-card { background: #fff; width: 100%; max-width: 440px; border-radius: 20px; box-shadow: var(--shadow-strong); overflow: hidden; animation: slideUp 0.3s ease-out; }
    
    .p-header { padding: 1.5rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
    .header-main h3 { font-size: 1.15rem; color: var(--text); font-weight: 800; }
    .secure-tag { font-size: 0.65rem; color: var(--accent); font-weight: 800; text-transform: uppercase; display: flex; align-items: center; gap: 0.3rem; margin-top: 0.2rem; }
    .close-btn { background: transparent; border: none; font-size: 1.25rem; color: var(--text-muted); cursor: pointer; }

    .payment-body { padding: 1.5rem; }
    .order-summary { background: var(--bg); border: 1px solid var(--border); border-radius: 12px; padding: 1rem; margin-bottom: 1.5rem; }
    .summary-item { display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; margin-bottom: 0.5rem; }
    .summary-item label { color: var(--text-muted); font-weight: 600; }
    .summary-item span { font-weight: 700; color: var(--text); }
    .summary-item.total { margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px dashed var(--border); }
    .total span.amount { font-size: 1.25rem; color: var(--primary); font-family: 'Syne', sans-serif; font-weight: 800; }

    .payment-options { display: grid; gap: 1rem; }
    .opt-btn { width: 100%; background: #fff; border: 1px solid var(--border); padding: 1.25rem; border-radius: 16px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; transition: 0.2s; }
    .opt-btn:hover { border-color: var(--primary); background: var(--bg); transform: translateY(-2px); }
    .opt-content { display: flex; align-items: center; gap: 1.25rem; }
    .opt-content i { font-size: 1.75rem; color: var(--text-muted); }
    .opt-btn.rupay i { color: var(--primary); }
    .opt-txt { text-align: left; }
    .opt-txt strong { display: block; font-size: 0.95rem; color: var(--text); }
    .opt-txt span { font-size: 0.75rem; color: var(--text-muted); }

    .upi-flow { animation: fadeIn 0.3s; }
    .flow-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
    .back-btn { background: var(--bg); border: 1px solid var(--border); width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; }
    .upi-field label { display: block; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.6rem; }
    .input-wrap { position: relative; }
    .input-wrap input { width: 100%; background: var(--bg); border: 2px solid var(--border); padding: 1rem; border-radius: 12px; font-size: 1.1rem; font-weight: 700; color: var(--text); }
    .input-wrap input:focus { border-color: var(--primary); outline: none; }
    .upi-badge { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); font-size: 0.65rem; font-weight: 800; background: var(--primary); color: #fff; padding: 0.2rem 0.5rem; border-radius: 4px; }
    .helper { font-size: 0.72rem; color: var(--text-muted); margin-top: 0.5rem; font-style: italic; }

    .pay-finish-btn { width: 100%; background: var(--primary); color: #fff; border: none; padding: 1.15rem; border-radius: 12px; font-size: 1rem; font-weight: 800; margin-top: 2rem; cursor: pointer; transition: 0.3s; }
    .pay-finish-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .spin { display: inline-block; animation: spin 1s linear infinite; }
    
    .success-flow { text-align: center; padding: 1rem 0; animation: bounceIn 0.5s; }
    .success-icon { width: 80px; height: 80px; background: rgba(22, 163, 74, 0.1); color: var(--success); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; position: relative; font-size: 2.5rem; }
    .check-ring { position: absolute; inset: -10px; border: 2px solid var(--success); border-radius: 50%; animation: ringExpand 1s forwards; opacity: 0; }
    .success-flow h4 { font-size: 1.25rem; font-weight: 800; color: var(--text); margin-bottom: 0.5rem; }
    .success-flow p { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem; }
    .success-flow p span { color: var(--text); font-weight: 700; font-family: monospace; }
    .success-details { font-size: 0.9rem; color: var(--text-soft); font-weight: 600; }

    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes ringExpand { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1.1); opacity: 0.2; } }
    @keyframes bounceIn { 0% { transform: scale(0.85); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
  `]
})
export class PaymentModalComponent {
  @Input() amount: number = 0;
  @Input() title: string = '';
  
  @Output() confirmed = new EventEmitter<PaymentResult>();
  @Output() cancelled = new EventEmitter<void>();

  view: 'CHOICE' | 'UPI_INPUT' | 'SUCCESS' = 'CHOICE';
  upiId = '';
  processing = false;
  ref = Math.random().toString(36).substring(7).toUpperCase();

  selectRuPay() {
    this.view = 'UPI_INPUT';
  }

  selectLater() {
    this.confirmed.emit({ method: 'LATER' });
  }

  processPay() {
    this.processing = true;
    // Simulate gateway delay
    setTimeout(() => {
      this.processing = false;
      this.view = 'SUCCESS';
      // Auto close after success
      setTimeout(() => {
        this.confirmed.emit({ method: 'RUPAY', upiId: this.upiId });
      }, 2000);
    }, 2500);
  }

  onCancel() {
    if (!this.processing && this.view !== 'SUCCESS') {
      this.cancelled.emit();
    }
  }
}
