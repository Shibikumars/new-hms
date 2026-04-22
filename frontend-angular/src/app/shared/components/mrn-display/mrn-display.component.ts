import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mrn-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mrn-box" [class.small]="size === 'small'" [class.large]="size === 'large'">
      <span class="label">MRN</span>
      <span class="value">{{ mrn || 'UNASSIGNED' }}</span>
      <button *ngIf="copyable && mrn" class="copy-btn" (click)="copyToClipboard($event)">
        <i class="ph ph-copy"></i>
      </button>
    </div>
  `,
  styles: [`
    .mrn-box {
      display: inline-flex;
      align-items: center;
      background: var(--surface-strong);
      border: 1px solid var(--border-strong);
      border-radius: 6px;
      padding: 0.25rem 0.5rem;
      font-family: 'Monaco', 'Consolas', monospace;
      gap: 0.5rem;
    }

    .label {
      font-size: 0.65rem;
      font-weight: 800;
      color: var(--primary);
      background: rgba(26, 60, 110, 0.1);
      padding: 0.1rem 0.3rem;
      border-radius: 3px;
    }

    .value {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text);
      letter-spacing: 0.05em;
    }

    .copy-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 0.2rem;
      border-radius: 4px;
      min-height: auto;
      transition: all 0.2s;
    }
    .copy-btn:hover {
      color: var(--primary);
      background: rgba(0,0,0,0.05);
      box-shadow: none;
      transform: none;
    }

    .small .value { font-size: 0.75rem; }
    .large { padding: 0.5rem 1rem; }
    .large .value { font-size: 1.1rem; }
    .large .label { font-size: 0.75rem; }
  `]
})
export class MRNDisplayComponent {
  @Input() mrn?: string;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() copyable = true;

  copyToClipboard(event: MouseEvent) {
    event.stopPropagation();
    if (this.mrn) {
      navigator.clipboard.writeText(this.mrn);
      // Optional: Add a toast notification here
    }
  }
}
