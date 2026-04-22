import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, Subscription } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { NotificationItem, NotificationPreference, NotificationsApiService } from './notifications-api.service';
import { NotificationsSocketService } from './notifications-socket.service';

type RecordsTab = 'inbox' | 'analytics' | 'settings';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="container overflow-hidden">
      <div class="hero">
        <div>
          <h2>Clinical Communication Hub</h2>
          <p class="subtitle">Real-time alerting, escalation tracking, and notification intelligence.</p>
        </div>
        <div class="hero-actions">
           <span class="status-pill" [class.live]="socketConnected">
             {{ socketConnected ? 'System Live' : 'Polling Sync' }}
           </span>
        </div>
      </div>

      <!-- Main Navigation Tabs (Admin gets Analytics) -->
      <nav class="hub-tabs">
        <button [class.active]="activeTab === 'inbox'" (click)="activeTab = 'inbox'">
           Inbox <span class="badge" *ngIf="unreadCount > 0">{{ unreadCount }}</span>
        </button>
        <button *ngIf="isAdmin" [class.active]="activeTab === 'analytics'" (click)="activeTab = 'analytics'">
           Intelligence Dashboard
        </button>
        <button [class.active]="activeTab === 'settings'" (click)="activeTab = 'settings'">
           Preferences
        </button>
      </nav>

      <div class="hub-workspace card shadow-glass">
        
        <!-- INBOX TAB -->
        <div *ngIf="activeTab === 'inbox'" class="inbox-view">
          <div class="inbox-header">
            <div class="search-wrap">
              <input type="text" [(ngModel)]="searchTerm" placeholder="Search notifications..." />
            </div>
            <div class="bulk-actions">
               <button class="secondary-btn" (click)="markAllRead()" [disabled]="unreadCount === 0 || bulkUpdating">
                 {{ bulkUpdating ? 'Syncing...' : 'Mark All Read' }}
               </button>
            </div>
          </div>

          <div class="loading-grid" *ngIf="loadingNotifications">
             <div class="skeleton sk-item" *ngFor="let i of [1,2,3]"></div>
          </div>

          <div class="empty-state" *ngIf="!loadingNotifications && filteredItems.length === 0">
             <div class="icon">📭</div>
             <h3>All caught up!</h3>
             <p>You have no pending notifications matching your current filters.</p>
          </div>

          <ul class="notification-list" *ngIf="!loadingNotifications && filteredItems.length > 0">
            <li *ngFor="let item of filteredItems" class="notif-item" 
                [class.unread]="!item.read" 
                [class.critical]="isAlert(item)">
              <div class="notif-indicator"></div>
              <div class="notif-body">
                <div class="notif-meta">
                  <span class="notif-type">{{ (item.type || 'INFO').toUpperCase() }}</span>
                  <span class="notif-time">{{ formatTime(item.createdAt) }}</span>
                </div>
                <div class="notif-title">{{ item.title }}</div>
                <div class="notif-msg">{{ item.message }}</div>
                
                <div class="notif-actions">
                  <button *ngIf="!item.read" (click)="markRead(item.id!)" class="text-btn">Mark Seen</button>
                  <button *ngIf="getActionLabel(item)" (click)="goToAction(item)" class="action-btn">
                    {{ getActionLabel(item) }}
                  </button>
                  <span class="escalated-badge" *ngIf="item.escalated">Escalated</span>
                </div>
              </div>
            </li>
          </ul>
        </div>

        <!-- ANALYTICS TAB (Admin Only) -->
        <div *ngIf="activeTab === 'analytics' && isAdmin" class="analytics-view">
           <div class="stats-grid">
              <div class="stat-card">
                 <label>Global Unread</label>
                 <strong>{{ unreadCount }}</strong>
              </div>
              <div class="stat-card warning">
                 <label>SLA Warnings</label>
                 <strong>{{ slaWarningCount }}</strong>
              </div>
              <div class="stat-card error">
                 <label>SLA Breaches</label>
                 <strong>{{ slaBreachCount }}</strong>
              </div>
              <div class="stat-card">
                 <label>Critical Ratio</label>
                 <strong>{{ criticalRatio }}%</strong>
              </div>
           </div>

           <section class="admin-section">
              <h3>Notification Trends (Last 5 Days)</h3>
              <div class="trend-chart">
                 <div class="chart-column" *ngFor="let point of trendPoints">
                   <div class="bar-wrap">
                      <div class="bar" [style.height.%]="point.width"></div>
                   </div>
                   <label>{{ point.label }}</label>
                   <span class="val">{{ point.count }}</span>
                 </div>
              </div>
           </section>

           <section class="admin-section">
              <h3>Escalation Audit Timeline</h3>
              <div class="audit-list">
                 <div class="audit-item" *ngFor="let entry of escalationAudit">
                    <div class="audit-header">
                       <strong>{{ entry.title }}</strong>
                       <span class="status" [class.active]="entry.status === 'ACTIVE'">{{ entry.status }}</span>
                    </div>
                    <div class="audit-meta">Owner: {{ entry.owner }} · Target: {{ entry.target }}</div>
                    <div class="audit-time">{{ entry.escalatedAt | date:'short' }}</div>
                 </div>
              </div>
           </section>
        </div>

        <!-- SETTINGS TAB -->
        <div *ngIf="activeTab === 'settings'" class="settings-view">
           <h3>Delivery Preferences</h3>
           <p class="subtitle">Configure how you receive critical clinical updates.</p>
           
           <form [formGroup]="preferencesForm" (ngSubmit)="savePreferences()" class="pref-form">
             <label class="toggle">
               <input type="checkbox" formControlName="emailAppointmentConfirmation" />
               <span class="slider"></span>
               Email on appointment confirmation
             </label>
             <label class="toggle">
               <input type="checkbox" formControlName="smsReminder24h" />
               <span class="slider"></span>
               SMS 24h reminders
             </label>
             <label class="toggle">
               <input type="checkbox" formControlName="pushLabResults" />
               <span class="slider"></span>
               Real-time push for lab results
             </label>
             <button type="submit" class="primary-btn">Save Changes</button>
           </form>

           <hr class="divider" />

           <section class="test-area">
              <h3>System Test</h3>
              <p class="small text-soft">Send a test notification to your current session to verify socket connectivity.</p>
              <div class="test-form">
                 <input type="text" #testTitle placeholder="Title" />
                 <input type="text" #testMsg placeholder="Message" />
                 <button (click)="publishTest(testTitle.value, testMsg.value); testTitle.value=''; testMsg.value=''">
                   Send Test Alert
                 </button>
              </div>
           </section>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .hero { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
    .subtitle { margin-top: 0.4rem; color: var(--text-soft); }
    .status-pill { 
      padding: 0.4rem 0.8rem; border-radius: 99px; font-size: 0.75rem; font-weight: 700;
      background: rgba(255, 90, 114, 0.1); color: #ff9ca9; border: 1px solid rgba(255, 90, 114, 0.3);
    }
    .status-pill.live { background: rgba(34, 197, 94, 0.1); color: #80e8a6; border-color: rgba(34, 197, 94, 0.3); }

    .hub-tabs { display: flex; gap: 1.5rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; }
    .hub-tabs button { 
      background: none; border: none; color: var(--text-soft); font-weight: 600; padding: 0.5rem 0; cursor: pointer; position: relative;
    }
    .hub-tabs button.active { color: var(--primary); }
    .hub-tabs button.active::after { content: ''; position: absolute; bottom: -0.5rem; left: 0; right: 0; height: 2px; background: var(--primary); box-shadow: 0 0 10px var(--primary); }
    .badge { background: var(--primary); color: #000; font-size: 0.7rem; padding: 0.1rem 0.4rem; border-radius: 4px; margin-left: 0.4rem; vertical-align: middle; }

    .hub-workspace { min-height: 600px; padding: 2rem; position: relative; overflow: hidden; }
    .shadow-glass { background: rgba(26, 39, 64, 0.6); backdrop-filter: blur(20px); border: 1px solid var(--border); border-radius: 16px; }

    /* Inbox Styles */
    .inbox-header { display: flex; justify-content: space-between; margin-bottom: 2rem; gap: 1rem; }
    .search-wrap { flex: 1; }
    .search-wrap input { width: 100%; max-width: 400px; background: rgba(0,0,0,0.2); border: 1px solid var(--border); padding: 0.7rem 1rem; border-radius: 10px; color: #fff; }
    .secondary-btn { background: transparent; border: 1px solid var(--border); color: var(--text-soft); padding: 0.6rem 1rem; border-radius: 8px; cursor: pointer; }

    .notification-list { list-style: none; padding: 0; margin: 0; }
    .notif-item { 
      display: flex; gap: 1.2rem; padding: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.05);
      position: relative; transition: background 0.2s;
    }
    .notif-item:hover { background: rgba(255,255,255,0.02); }
    .notif-item.unread .notif-indicator { width: 8px; height: 8px; background: var(--primary); border-radius: 50%; position: absolute; left: 1rem; top: 1.8rem; box-shadow: 0 0 8px var(--primary); }
    .notif-item.critical { border-left: 4px solid #ff5a72; background: rgba(255, 90, 114, 0.03); }
    
    .notif-body { flex: 1; }
    .notif-meta { display: flex; justify-content: space-between; margin-bottom: 0.4rem; }
    .notif-type { font-size: 0.65rem; letter-spacing: 0.08em; font-weight: 800; color: var(--primary); }
    .notif-time { font-size: 0.75rem; color: var(--text-muted); }
    .notif-title { font-weight: 700; font-size: 1.05rem; margin-bottom: 0.3rem; }
    .notif-msg { color: var(--text-soft); font-size: 0.92rem; line-height: 1.5; }
    
    .notif-actions { display: flex; gap: 1rem; margin-top: 1rem; align-items: center; }
    .text-btn { background: none; border: none; color: var(--text-muted); font-size: 0.8rem; cursor: pointer; text-decoration: underline; }
    .action-btn { background: rgba(255,255,255,0.05); border: 1px solid var(--border); color: #fff; padding: 0.4rem 0.8rem; border-radius: 6px; font-size: 0.8rem; cursor: pointer; }
    .action-btn:hover { border-color: var(--primary); color: var(--primary); }
    .escalated-badge { font-size: 0.6rem; text-transform: uppercase; border: 1px solid #f6b23f; color: #f6b23f; padding: 0.2rem 0.5rem; border-radius: 4px; }

    /* Analytics Styles */
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 3rem; }
    .stat-card { background: rgba(0,0,0,0.2); padding: 1.2rem; border-radius: 12px; border: 1px solid var(--border); }
    .stat-card label { display: block; font-size: 0.7rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.4rem; }
    .stat-card strong { font-size: 1.5rem; font-family: 'Syne', sans-serif; }
    .stat-card.warning { border-color: #f6b23f; color: #f6b23f; }
    .stat-card.error { border-color: #ff5a72; color: #ff5a72; }

    .admin-section { margin-bottom: 3rem; }
    .admin-section h3 { font-size: 1rem; color: var(--text-soft); text-transform: uppercase; margin-bottom: 1.5rem; }
    
    .trend-chart { display: flex; justify-content: space-between; align-items: flex-end; height: 150px; padding-bottom: 2rem; border-bottom: 1px solid var(--border); }
    .chart-column { flex: 1; display: flex; flex-direction: column; align-items: center; }
    .bar-wrap { flex: 1; width: 30px; display: flex; align-items: flex-end; margin-bottom: 0.5rem; }
    .bar { width: 100%; background: linear-gradient(0deg, var(--primary), #6d7cff); border-radius: 4px 4px 0 0; }
    .chart-column label { font-size: 0.7rem; color: var(--text-muted); }
    .chart-column .val { font-size: 0.8rem; font-weight: 700; margin-top: 0.2rem; }

    .audit-list { display: grid; gap: 0.8rem; }
    .audit-item { background: rgba(0,0,0,0.15); padding: 1rem; border-radius: 8px; border: 1px solid var(--border); }
    .audit-header { display: flex; justify-content: space-between; margin-bottom: 0.4rem; }
    .audit-meta { font-size: 0.8rem; color: var(--text-soft); }
    .audit-time { font-size: 0.7rem; color: var(--text-muted); margin-top: 0.4rem; }
    .status { font-size: 0.6rem; padding: 0.1rem 0.4rem; border-radius: 4px; border: 1px solid var(--border); }
    .status.active { color: #f6b23f; border-color: #f6b23f; }

    /* Settings Styles */
    .pref-form { display: grid; gap: 1.5rem; max-width: 500px; }
    .toggle { display: flex; align-items: center; gap: 1rem; cursor: pointer; color: var(--text-soft); }
    .primary-btn { background: var(--primary); color: #000; border: none; padding: 0.8rem 2rem; border-radius: 8px; font-weight: 700; cursor: pointer; justify-self: start; }
    .divider { border: 0; border-top: 1px solid var(--border); margin: 2.5rem 0; }
    .test-form { display: flex; gap: 1rem; margin-top: 1.5rem; }
    .test-form input { background: rgba(0,0,0,0.2); border: 1px solid var(--border); padding: 0.6rem; border-radius: 8px; color: #fff; flex: 1; }
    .test-form button { background: transparent; border: 1px solid var(--border); color: var(--text-soft); padding: 0.6rem 1rem; border-radius: 8px; cursor: pointer; }

    @media (max-width: 900px) {
      .stats-grid { grid-template-columns: 1fr 1fr; }
      .inbox-header { flex-direction: column; }
    }
  `]
})
export class NotificationsComponent implements OnInit, OnDestroy {
  activeTab: RecordsTab = 'inbox';
  isAdmin = false;
  items: NotificationItem[] = [];
  unreadCount = 0;
  loadingNotifications = false;
  bulkUpdating = false;
  searchTerm = '';
  socketConnected = false;
  escalationAudit: any[] = [];
  
  private sub = new Subscription();

  readonly preferencesForm = this.fb.nonNullable.group({
    emailAppointmentConfirmation: [true],
    smsReminder24h: [true],
    pushLabResults: [true]
  });

  constructor(
    private fb: FormBuilder,
    private notificationsApi: NotificationsApiService,
    private auth: AuthService,
    private router: Router,
    private notificationsSocket: NotificationsSocketService
  ) {}

  ngOnInit(): void {
    const role = this.auth.getRole()?.toUpperCase();
    this.isAdmin = role === 'ADMIN';
    this.activeTab = 'inbox';

    const userId = this.auth.getUserId();
    if (userId) {
      this.load(userId);
    }
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    this.notificationsSocket.disconnect();
  }

  load(userId: number): void {
    this.loadingNotifications = true;
    this.notificationsApi.getMyNotifications(userId, {}).subscribe({
      next: items => {
        this.items = items.sort((a,b) => (b.id || 0) - (a.id || 0));
        this.unreadCount = items.filter(i => !i.read).length;
        this.loadingNotifications = false;
        this.syncEscalationAudit();
      },
      error: () => this.loadingNotifications = false
    });

    this.notificationsApi.getPreferences(userId).subscribe({
      next: pref => this.preferencesForm.patchValue(pref)
    });

    this.notificationsSocket.connect(
      userId,
      (incoming) => {
        const existing = this.items.findIndex(i => i.id === incoming.id);
        if (existing >= 0) this.items[existing] = incoming;
        else this.items = [incoming, ...this.items];
        this.unreadCount = this.items.filter(i => !i.read).length;
      },
      () => (this.socketConnected = true),
      () => (this.socketConnected = false)
    );
  }

  get filteredItems(): NotificationItem[] {
    const q = this.searchTerm.toLowerCase().trim();
    return this.items.filter(item => 
      !q || item.title.toLowerCase().includes(q) || item.message.toLowerCase().includes(q)
    );
  }

  get slaWarningCount(): number {
    return this.items.filter(i => !i.read && this.getAgeHours(i.createdAt) > 2).length;
  }

  get slaBreachCount(): number {
    return this.items.filter(i => !i.read && this.getAgeHours(i.createdAt) > 6).length;
  }

  get criticalRatio(): number {
    if (this.items.length === 0) return 0;
    const crit = this.items.filter(i => this.isAlert(i)).length;
    return Math.round((crit / this.items.length) * 100);
  }

  get trendPoints(): any[] {
    const buckets: any[] = [];
    const now = new Date();
    for (let i = 4; i >= 0; i--) {
      const d = new Date(); d.setDate(now.getDate() - i);
      const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const count = this.items.filter(item => {
        const cd = new Date(item.createdAt!);
        return cd.getMonth() === d.getMonth() && cd.getDate() === d.getDate();
      }).length;
      buckets.push({ label, count });
    }
    const max = Math.max(...buckets.map(b => b.count), 1);
    return buckets.map(b => ({ ...b, width: (b.count / max) * 100 }));
  }

  markRead(id: number): void {
    this.notificationsApi.markRead(id).subscribe({
      next: () => {
        const item = this.items.find(i => i.id === id);
        if (item) item.read = true;
        this.unreadCount = this.items.filter(i => !i.read).length;
        window.dispatchEvent(new CustomEvent('hms-unread-count', { detail: this.unreadCount }));
      }
    });
  }

  markAllRead(): void {
    const unreadIds = this.items.filter(i => !i.read).map(i => i.id!);
    if (unreadIds.length === 0) return;
    this.bulkUpdating = true;
    forkJoin(unreadIds.map(id => this.notificationsApi.markRead(id))).subscribe({
      next: () => {
        this.items.forEach(i => i.read = true);
        this.unreadCount = 0;
        this.bulkUpdating = false;
        window.dispatchEvent(new CustomEvent('hms-unread-count', { detail: 0 }));
      },
      error: () => this.bulkUpdating = false
    });
  }

  savePreferences(): void {
    const userId = this.auth.getUserId();
    if (!userId) return;
    this.notificationsApi.updatePreferences(userId, this.preferencesForm.getRawValue()).subscribe();
  }

  publishTest(title: string, message: string): void {
    const userId = this.auth.getUserId();
    if (!userId || !title || !message) return;
    this.notificationsApi.publish({ userId, title, message, type: 'INFO' }).subscribe();
  }

  isAlert(item: NotificationItem): boolean {
    const text = (item.title + item.message).toLowerCase();
    return text.includes('critical') || text.includes('alert') || item.type === 'CRITICAL';
  }

  getActionLabel(item: NotificationItem): string | null {
    const msg = item.message.toLowerCase();
    if (msg.includes('lab')) return 'View Lab';
    if (msg.includes('billing') || msg.includes('invoice')) return 'Pay Bill';
    if (msg.includes('appointment')) return 'View Schedule';
    return null;
  }

  goToAction(item: NotificationItem): void {
    const msg = item.message.toLowerCase();
    const rolePrefix = this.auth.getRole()?.toLowerCase();
    if (msg.includes('lab')) this.router.navigate([`/${rolePrefix}/lab`]);
    else if (msg.includes('billing')) this.router.navigate([`/${rolePrefix}/billing`]);
    else if (msg.includes('appointment')) this.router.navigate([`/${rolePrefix}/appointments`]);
  }

  formatTime(dateStr?: string): string {
    if (!dateStr) return 'Recently';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  private getAgeHours(dateStr?: string): number {
    if (!dateStr) return 0;
    const diff = Date.now() - new Date(dateStr).getTime();
    return diff / (1000 * 60 * 60);
  }

  private syncEscalationAudit(): void {
    // Mimic the escalation audit log from items
    this.escalationAudit = this.items
      .filter(i => i.escalated)
      .map(i => ({
        id: i.id,
        title: i.title,
        status: i.escalationStatus || 'ACTIVE',
        owner: i.escalationOwner || 'System',
        target: i.escalationTarget || 'Admin',
        escalatedAt: i.escalatedAt
      }));
  }
}
