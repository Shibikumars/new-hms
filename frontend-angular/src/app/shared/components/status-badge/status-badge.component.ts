import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="badge" [ngClass]="statusClass">
      <i *ngIf="icon" [class]="'ph ' + icon"></i>
      {{ text || status }}
    </span>
  `,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.25rem 0.6rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }

    .status-success { background: rgba(22, 163, 74, 0.1); color: var(--success); border: 1px solid rgba(22, 163, 74, 0.2); }
    .status-error { background: rgba(220, 38, 38, 0.1); color: var(--error); border: 1px solid rgba(220, 38, 38, 0.2); }
    .status-warning { background: rgba(217, 119, 6, 0.1); color: var(--warning); border: 1px solid rgba(217, 119, 6, 0.2); }
    .status-info { background: rgba(26, 60, 110, 0.1); color: var(--primary); border: 1px solid rgba(26, 60, 110, 0.2); }
    .status-neutral { background: rgba(100, 116, 139, 0.1); color: var(--text-muted); border: 1px solid rgba(100, 116, 139, 0.2); }
  `]
})
export class StatusBadgeComponent {
  @Input() status: string = 'neutral';
  @Input() text?: string;
  @Input() type: 'success' | 'error' | 'warning' | 'info' | 'neutral' = 'neutral';
  @Input() icon?: string;

  get statusClass() {
    const s = this.type || this.inferType(this.status);
    return `status-${s}`;
  }

  private inferType(status: string): string {
    const s = status.toLowerCase();
    if (['active', 'completed', 'success', 'up', 'online'].includes(s)) return 'success';
    if (['cancelled', 'failed', 'error', 'down', 'offline', 'critical'].includes(s)) return 'error';
    if (['pending', 'warning', 'scheduled', 'holding'].includes(s)) return 'warning';
    if (['info', 'processing', 'in_progress'].includes(s)) return 'info';
    return 'neutral';
  }
}
