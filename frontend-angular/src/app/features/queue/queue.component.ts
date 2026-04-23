import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, interval } from 'rxjs';
import { QueueApiService, QueueToken, DoctorQueueStatus } from './queue-api.service';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-queue',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container queue-bg">
      <header class="queue-header">
        <div class="header-content">
          <h1 class="page-title">Live Clinic Queue</h1>
          <p class="page-subtitle">Real-time token management and wait-time estimation.</p>
        </div>
        <div class="header-right">
          <div class="live-clock">{{ currentTime | date:'HH:mm:ss' }}</div>
        </div>
      </header>

      <div class="queue-layout">
        
        <!-- SECTION 1: PUBLIC DISPLAY (KIOSK MODE) -->
        <div class="card display-panel shadow-glass">
          <div class="panel-header">
             <i class="ph ph-broadcast-bold"></i>
             <h3>Public Token Display</h3>
             <span class="live-tag">LIVE UPDATES</span>
          </div>
          
          <div class="display-grid">
             <div class="token-tile calling" *ngFor="let t of activeTokens">
                <div class="tile-meta">Doctor #{{ t.doctorId }}</div>
                <div class="token-num">{{ t.tokenNumber }}</div>
                <div class="token-status">{{ t.status }}</div>
             </div>
          </div>
          
          <div class="empty-display" *ngIf="activeTokens.length === 0">
             <i class="ph ph-user-list"></i>
             <p>No active consultations currently in progress.</p>
          </div>
        </div>

        <!-- SECTION 2: PATIENT CHECK-IN & STATUS -->
        <div class="card patient-panel shadow-glass">
          <div class="panel-header">
             <i class="ph ph-user-focus"></i>
             <h3>My Position</h3>
          </div>

          <div class="check-in-mode" *ngIf="!myToken">
             <div class="check-in-form">
                <i class="ph ph-qr-code"></i>
                <h4>At the Hospital?</h4>
                <p>Enter your Appointment ID to issue a live consultation token.</p>
                <div class="input-row">
                   <input type="number" [(ngModel)]="aptIdToCheckIn" placeholder="Appt # (e.g. 101)" />
                   <button class="ph-btn primary" (click)="checkIn()" [disabled]="!aptIdToCheckIn">Check In</button>
                </div>
             </div>
          </div>

          <div class="token-status-mode" *ngIf="myToken">
             <div class="status-card">
                <div class="sc-header">Your Token Number</div>
                <div class="sc-token">#{{ myToken.tokenNumber }}</div>
                <div class="sc-wait">
                   <i class="ph ph-timer"></i>
                   Est. Wait: <strong>{{ myToken.estimatedWaitMinutes }} Mins</strong>
                </div>
                <div class="sc-status-pill">{{ myToken.status }}</div>
                <p class="sc-hint">Please remain in the waiting area. You will be called shortly.</p>
             </div>
          </div>
        </div>

      </div>

      <!-- SECTION 3: DOCTOR QUEUE INSIGHTS (IF STAFF) -->
      <section class="staff-section" *ngIf="!isPatientRole">
         <div class="card staff-card shadow-glass">
            <div class="panel-header">
               <i class="ph ph-chart-line-up"></i>
               <h3>Clinic Load Statistics</h3>
            </div>
            <div class="stats-row">
               <div class="stat-item">
                  <label>Waiting Count</label>
                  <strong>{{ stats?.waitingCount || 0 }}</strong>
               </div>
               <div class="stat-item">
                  <label>Average TAT</label>
                  <strong>{{ stats?.estimatedAverageWait || 15 }}m</strong>
               </div>
               <div class="stat-item">
                  <label>Next In Line</label>
                  <strong>#{{ stats?.nextInLine || 'None' }}</strong>
               </div>
            </div>
         </div>
      </section>
    </div>
  `,
  styles: [`
    .queue-bg { padding: 2.5rem; background: #F8FAFC; min-height: 100vh; }
    .queue-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; }
    .page-title { font-size: 1.8rem; font-weight: 800; color: #1E293B; margin: 0; }
    .page-subtitle { color: #64748B; font-size: 0.95rem; margin-top: 0.25rem; }
    .live-clock { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1.5rem; color: #6366f1; background: #fff; padding: 0.5rem 1.25rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }

    .queue-layout { display: grid; grid-template-columns: 1fr 400px; gap: 2.5rem; }
    .card { background: #fff; border: 1px solid #E2E8F0; border-radius: 24px; padding: 2rem; }
    .shadow-glass { box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); }
    
    .panel-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 2rem; }
    .panel-header i { font-size: 1.5rem; color: #6366f1; }
    .panel-header h3 { font-size: 1.15rem; font-weight: 800; color: #1E293B; margin: 0; }
    .live-tag { font-size: 0.65rem; font-weight: 800; background: #FEF2F2; color: #EF4444; padding: 0.2rem 0.5rem; border-radius: 6px; letter-spacing: 0.05em; }

    /* Public Display */
    .display-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 1.5rem; }
    .token-tile { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 20px; padding: 1.5rem; text-align: center; transition: 0.3s; }
    .token-tile.calling { border-color: #6366f1; background: rgba(99, 102, 241, 0.05); animation: border-pulse 2s infinite; }
    .token-num { font-size: 3rem; font-family: 'Syne', sans-serif; font-weight: 800; color: #1E293B; line-height: 1; margin: 0.5rem 0; }
    .tile-meta { font-size: 0.75rem; font-weight: 700; color: #64748B; text-transform: uppercase; }
    .token-status { font-size: 0.7rem; font-weight: 800; color: #6366f1; text-transform: uppercase; }

    /* Patient Panel */
    .check-in-form { text-align: center; padding: 2rem 0; }
    .check-in-form i { font-size: 4rem; color: #CBD5E1; margin-bottom: 1.5rem; }
    .check-in-form h4 { font-size: 1.25rem; font-weight: 800; margin-bottom: 0.5rem; }
    .check-in-form p { font-size: 0.9rem; color: #64748B; margin-bottom: 1.5rem; }
    .input-row { display: flex; gap: 0.75rem; }
    .input-row input { flex: 1; border: 1px solid #E2E8F0; padding: 0.85rem; border-radius: 12px; font-weight: 600; text-align: center; }

    .status-card { text-align: center; background: #6366f1; color: #fff; border-radius: 20px; padding: 2.5rem 2rem; position: relative; overflow: hidden; }
    .sc-header { font-size: 0.85rem; text-transform: uppercase; font-weight: 800; letter-spacing: 0.1em; opacity: 0.8; }
    .sc-token { font-size: 5rem; font-family: 'Syne', sans-serif; font-weight: 800; margin: 0.5rem 0; }
    .sc-wait { font-size: 1.1rem; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
    .sc-status-pill { background: rgba(255,255,255,0.2); width: fit-content; margin: 1.5rem auto 1rem; padding: 0.4rem 1rem; border-radius: 99px; font-weight: 800; font-size: 0.75rem; text-transform: uppercase; }
    .sc-hint { font-size: 0.8rem; opacity: 0.9; line-height: 1.4; }

    /* Staff Section */
    .staff-section { margin-top: 2.5rem; }
    .stats-row { display: flex; gap: 4rem; }
    .stat-item label { display: block; font-size: 0.75rem; font-weight: 800; color: #64748B; text-transform: uppercase; margin-bottom: 0.5rem; }
    .stat-item strong { font-size: 2.5rem; font-family: 'Syne', sans-serif; font-weight: 800; color: #1E293B; }

    @keyframes border-pulse { 
       0% { border-color: #E2E8F0; } 
       50% { border-color: #6366f1; box-shadow: 0 0 15px rgba(99, 102, 241, 0.2); } 
       100% { border-color: #E2E8F0; } 
    }

    .ph-btn { padding: 0.85rem 1.5rem; border-radius: 12px; font-weight: 700; cursor: pointer; border: none; }
    .ph-btn.primary { background: #6366f1; color: #fff; }
    .empty-display { text-align: center; padding: 4rem 0; color: #CBD5E1; }
    .empty-display i { font-size: 3rem; margin-bottom: 1rem; }
  `]
})
export class QueueComponent implements OnInit, OnDestroy {
  currentTime = new Date();
  activeTokens: QueueToken[] = [];
  myToken: QueueToken | null = null;
  stats: DoctorQueueStatus | null = null;
  aptIdToCheckIn: number | null = null;
  isPatientRole = false;

  private sub = new Subscription();

  constructor(
    private queueApi: QueueApiService,
    private auth: AuthService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    const role = (this.auth.getRole() || '').toUpperCase();
    this.isPatientRole = role === 'PATIENT';
    
    this.refreshDisplay();
    this.loadMyStatus();
    
    this.sub.add(interval(5000).subscribe(() => this.refreshDisplay()));
    this.sub.add(interval(1000).subscribe(() => this.currentTime = new Date()));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  refreshDisplay(): void {
    this.queueApi.getDisplayQueue().subscribe(tokens => {
      this.activeTokens = tokens;
    });

    if (!this.isPatientRole) {
       const drId = Number(this.auth.getUserId()) || 1;
       this.queueApi.getDoctorStatus(drId).subscribe(s => this.stats = s);
    }
  }

  loadMyStatus(): void {
    if (!this.isPatientRole) return;
    const pId = Number(this.auth.getUserId());
    if (pId) {
      this.queueApi.getPatientToken(pId).subscribe(t => this.myToken = t);
    }
  }

  checkIn(): void {
    if (!this.aptIdToCheckIn) return;
    this.queueApi.checkIn(this.aptIdToCheckIn).subscribe({
      next: token => {
        this.myToken = token;
        this.toast.success('Check-in Complete', `Your Token Number is #${token.tokenNumber}`);
        this.refreshDisplay();
      },
      error: () => this.toast.error('Check-in Failed', 'Invalid Appointment ID or Session expired.')
    });
  }
}
