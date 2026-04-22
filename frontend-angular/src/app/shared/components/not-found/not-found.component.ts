import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="error-container clinical-bg">
      <div class="error-card">
        <div class="error-icon">
          <i class="ph ph-mask-sad"></i>
        </div>
        <h1 class="error-code">404</h1>
        <h2 class="error-title">Clinical Path Not Found</h2>
        <p class="error-msg">
          The restricted clinical resource or patient record you are attempting to access does not exist or has been moved within the system registry.
        </p>
        
        <div class="error-actions">
          <a routerLink="/" class="ph-btn primary">
            <i class="ph ph-house"></i> Return to Dashboard
          </a>
          <button (click)="reportIssue()" class="ph-btn secondary">
            <i class="ph ph-bug"></i> Report System Anomaly
          </button>
        </div>

        <div class="error-footer">
          <span>Internal Reference: <strong>ERR_PATH_INVALID</strong></span>
          <span>System Integrity: <strong>OPTIMAL</strong></span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .error-container {
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background: var(--bg);
    }
    .error-card {
      background: #fff;
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 4rem 2rem;
      max-width: 500px;
      width: 100%;
      text-align: center;
      box-shadow: var(--shadow-lg);
    }
    .error-icon {
      font-size: 4rem;
      color: var(--danger);
      margin-bottom: 1.5rem;
      opacity: 0.8;
    }
    .error-code {
      font-size: 6rem;
      font-family: 'Syne', sans-serif;
      font-weight: 800;
      color: var(--primary);
      margin: 0;
      line-height: 1;
      letter-spacing: -0.05em;
    }
    .error-title {
      font-size: 1.5rem;
      color: var(--text);
      font-weight: 800;
      margin: 1rem 0;
    }
    .error-msg {
      color: var(--text-soft);
      font-size: 0.95rem;
      line-height: 1.6;
      margin-bottom: 2.5rem;
      font-weight: 600;
    }
    .error-actions {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 3rem;
    }
    .ph-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 0.85rem 1.5rem;
      border-radius: 99px;
      font-weight: 800;
      font-size: 0.9rem;
      text-decoration: none;
      transition: 0.2s;
      border: 1px solid var(--border);
      cursor: pointer;
    }
    .ph-btn.primary {
      background: var(--primary);
      color: #fff;
      border-color: var(--primary);
      box-shadow: 0 4px 12px rgba(26, 60, 110, 0.2);
    }
    .ph-btn.primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(26, 60, 110, 0.3);
    }
    .ph-btn.secondary {
      background: #fff;
      color: var(--text-soft);
    }
    .ph-btn.secondary:hover {
      background: var(--surface-soft);
      color: var(--text);
    }
    .error-footer {
      display: flex;
      justify-content: center;
      gap: 2rem;
      padding-top: 2rem;
      border-top: 1px solid var(--border);
      font-size: 0.7rem;
      color: var(--text-muted);
      text-transform: uppercase;
      font-weight: 700;
    }
    .error-footer strong {
      color: var(--text-soft);
    }
  `]
})
export class NotFoundComponent {
  reportIssue() {
    alert('System anomaly report generated. Diagnostic packet sent to clinical IT operations.');
  }
}
