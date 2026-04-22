import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop" *ngIf="isOpen" (click)="closeOnBackdrop ? closeModal() : null">
      <div class="modal-container" (click)="$event.stopPropagation()">
        
        <div class="modal-header">
          <h3 class="modal-title">{{ title }}</h3>
          <button class="close-btn" (click)="closeModal()" aria-label="Close modal">
            <i class="ph ph-x"></i>
          </button>
        </div>

        <div class="modal-body custom-scroll">
          <ng-content></ng-content>
        </div>

        <div class="modal-footer" *ngIf="showFooter">
          <button type="button" class="btn-cancel" (click)="closeModal()">{{ cancelText }}</button>
          <button type="button" class="btn-confirm" (click)="onConfirm()" [disabled]="confirmDisabled">
            {{ confirmText }}
          </button>
        </div>
        
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.2s ease-out;
    }
    
    .modal-container {
      background: var(--surface);
      border-radius: var(--radius-lg);
      width: 90%; max-width: 500px; max-height: 90vh;
      display: flex; flex-direction: column;
      box-shadow: var(--shadow-strong);
      animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .modal-header {
      padding: 1.2rem 1.5rem;
      border-bottom: 1px solid var(--border);
      display: flex; justify-content: space-between; align-items: center;
    }

    .modal-title { font-size: 1.1rem; color: var(--text); font-weight: 700; margin: 0; }

    .close-btn {
      background: transparent; border: none; font-size: 1.2rem;
      color: var(--text-muted); cursor: pointer; padding: 0.4rem;
      border-radius: 4px; min-height: auto;
    }
    .close-btn:hover { background: rgba(0,0,0,0.05); color: var(--text); box-shadow: none; transform: none; }

    .modal-body {
      padding: 1.5rem;
      overflow-y: auto;
    }

    .modal-footer {
      padding: 1.2rem 1.5rem;
      border-top: 1px solid var(--border);
      display: flex; justify-content: flex-end; gap: 0.8rem;
    }

    .btn-cancel {
      background: var(--surface-strong); color: var(--text-soft); box-shadow: none;
    }
    .btn-cancel:hover { background: var(--border); color: var(--text); box-shadow: none; transform: none; }

    @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
  `]
})
export class ModalComponent {
  @Input() isOpen = false;
  @Input() title = 'Modal Title';
  @Input() showFooter = true;
  @Input() closeOnBackdrop = true;
  @Input() cancelText = 'Cancel';
  @Input() confirmText = 'Confirm';
  @Input() confirmDisabled = false;

  @Output() closed = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<void>();

  closeModal() {
    this.isOpen = false;
    this.closed.emit();
  }

  onConfirm() {
    if (!this.confirmDisabled) {
      this.confirmed.emit();
    }
  }
}
