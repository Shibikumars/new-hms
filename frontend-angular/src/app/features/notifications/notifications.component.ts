import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { NotificationItem, NotificationPreference, NotificationsApiService } from './notifications-api.service';
import { NotificationsSocketService } from './notifications-socket.service';

type NotificationFilter = 'ALL' | 'UNREAD' | 'ALERT' | 'READ';
type PriorityFilter = 'ALL' | 'CRITICAL' | 'BILLING' | 'APPOINTMENT';

type NotificationGroup = {
  label: string;
  items: NotificationItem[];
};

type FilterPreset = {
  name: string;
  filter: NotificationFilter;
  priority: PriorityFilter;
  search: string;
};

type TrendPoint = {
  label: string;
  count: number;
  width: number;
};

type EscalationEntry = {
  id: number;
  title: string;
  target: 'ADMIN' | 'CARE';
  owner: string;
  escalatedAt: string;
};

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="container">
      <h2>Notifications</h2>
      <p class="subtitle">Global notification center with mark-as-read actions and auto refresh.</p>

      <form [formGroup]="userForm" (ngSubmit)="load()" class="section" *ngIf="manualUserSelection">
        <input type="number" formControlName="userId" placeholder="User ID" />
        <button type="submit" [disabled]="userForm.invalid">Connect</button>
      </form>

      <div class="toolbar" *ngIf="items.length > 0 || loadingNotifications" role="status" aria-live="polite">
        <span class="pill">Unread: {{ unreadCount }}</span>
        <span class="pill" [class.offline]="!socketConnected">{{ socketConnected ? 'Live' : 'Polling' }}</span>
        <button type="button" (click)="markAllRead()" [disabled]="unreadCount === 0 || bulkUpdating">{{ bulkUpdating ? 'Updating…' : 'Mark all read' }}</button>
      </div>

      <div class="sla-grid" *ngIf="filteredItems.length > 0">
        <div class="sla-card">
          <span>Total In View</span>
          <strong>{{ filteredItems.length }}</strong>
        </div>
        <div class="sla-card">
          <span>Unread In View</span>
          <strong>{{ filteredUnreadCount }}</strong>
        </div>
        <div class="sla-card">
          <span>Critical Alerts</span>
          <strong>{{ filteredCriticalCount }}</strong>
        </div>
        <div class="sla-card">
          <span>Avg Alert Age</span>
          <strong>{{ averageAlertAgeHours }}</strong>
        </div>
        <div class="sla-card warning">
          <span>SLA Warnings</span>
          <strong>{{ slaWarningCount }}</strong>
        </div>
        <div class="sla-card breach">
          <span>SLA Breaches</span>
          <strong>{{ slaBreachCount }}</strong>
        </div>
        <div class="sla-card">
          <span>Escalated Alerts</span>
          <strong>{{ escalatedCount }}</strong>
        </div>
      </div>

      <div class="escalation-info" *ngIf="escalationMessage" role="status" aria-live="polite">{{ escalationMessage }}</div>

      <div class="trend card" *ngIf="trendPoints.length > 0">
        <h3>5-Day Notification Trend</h3>
        <div class="trend-row" *ngFor="let point of trendPoints">
          <span>{{ point.label }}</span>
          <div class="bar-track">
            <div class="bar-fill" [style.width.%]="point.width"></div>
          </div>
          <strong>{{ point.count }}</strong>
        </div>
      </div>

      <section class="aging card" *ngIf="oldestUnreadAlerts.length > 0">
        <h3>Alert Aging Spotlight</h3>
        <ul class="list">
            <li *ngFor="let alert of oldestUnreadAlerts">
            <strong>{{ alert.title }}</strong>
            <span>{{ alert.message }}</span>
            <div class="sla-row">
              <small class="meta">Open for {{ getAgeLabel(alert.createdAt) }}</small>
              <span class="sla-chip" [class.ok]="getSlaState(alert.createdAt) === 'OK'" [class.warn]="getSlaState(alert.createdAt) === 'WARN'" [class.breach]="getSlaState(alert.createdAt) === 'BREACH'">
                {{ getSlaLabel(alert.createdAt) }}
              </span>
            </div>
              <div class="actions-row" *ngIf="getSlaState(alert.createdAt) === 'BREACH' && alert.id && !isEscalated(alert.id)">
                <button type="button" (click)="escalateAlert(alert, 'ADMIN')">Escalate to Admin</button>
                <button type="button" (click)="escalateAlert(alert, 'CARE')">Escalate to Care Team</button>
              </div>
          </li>
        </ul>
      </section>

      <div class="filters" *ngIf="items.length > 0">
        <button type="button" class="chip" [class.active]="activeFilter === 'ALL'" (click)="setFilter('ALL')">All</button>
        <button type="button" class="chip" [class.active]="activeFilter === 'UNREAD'" (click)="setFilter('UNREAD')">Unread</button>
        <button type="button" class="chip" [class.active]="activeFilter === 'ALERT'" (click)="setFilter('ALERT')">Alerts</button>
        <button type="button" class="chip" [class.active]="activeFilter === 'READ'" (click)="setFilter('READ')">Read</button>
      </div>

      <div class="filters secondary" *ngIf="items.length > 0">
        <button type="button" class="chip" [class.active]="priorityFilter === 'ALL'" (click)="setPriority('ALL')">Priority: All</button>
        <button type="button" class="chip" [class.active]="priorityFilter === 'CRITICAL'" (click)="setPriority('CRITICAL')">Critical</button>
        <button type="button" class="chip" [class.active]="priorityFilter === 'BILLING'" (click)="setPriority('BILLING')">Billing</button>
        <button type="button" class="chip" [class.active]="priorityFilter === 'APPOINTMENT'" (click)="setPriority('APPOINTMENT')">Appointment</button>
      </div>

      <div class="section" *ngIf="items.length > 0">
        <input #searchBox type="text" [value]="searchTerm" (input)="onSearch($event)" placeholder="Search notifications (/ to focus)" aria-label="Search notifications" />
      </div>

      <div class="preset-row" *ngIf="items.length > 0">
        <button type="button" class="chip" (click)="savePreset()">Save Preset</button>
        <button type="button" class="chip" (click)="exportFiltered()">Export Filtered JSON</button>
      </div>

      <div class="preset-list" *ngIf="presets.length > 0">
        <div class="preset-item" *ngFor="let preset of presets">
          <button type="button" class="chip" (click)="applyPreset(preset)">{{ preset.name }}</button>
          <button type="button" class="chip danger" (click)="deletePreset(preset.name)">Delete</button>
        </div>
      </div>

      <div class="hint" *ngIf="items.length > 0">Shortcuts: <code>/</code> focus search, <code>u</code> unread, <code>a</code> all, <code>r</code> read, <code>c</code> critical</div>

      <form [formGroup]="preferencesForm" (ngSubmit)="savePreferences()" class="section" *ngIf="!userForm.invalid" aria-label="Notification preferences form">
        <h3>Notification Preferences</h3>
        <label class="check-row">
          <input type="checkbox" formControlName="emailAppointmentConfirmation" />
          Email on appointment confirmation
        </label>
        <label class="check-row">
          <input type="checkbox" formControlName="smsReminder24h" />
          SMS 24h reminders
        </label>
        <label class="check-row">
          <input type="checkbox" formControlName="pushLabResults" />
          Push notifications for lab results
        </label>
        <button type="submit">Save Preferences</button>
      </form>

      <form [formGroup]="publishForm" (ngSubmit)="publish()" class="section" aria-label="Publish notification test form">
        <h3>Publish Test Notification</h3>
        <input type="text" formControlName="title" placeholder="Title" />
        <input type="text" formControlName="message" placeholder="Message" />
        <button type="submit" [disabled]="publishForm.invalid || userForm.invalid">Publish</button>
      </form>

      <div *ngIf="loadingNotifications" class="section" role="status" aria-live="polite">
        <div class="skeleton sk-line"></div>
        <div class="skeleton sk-line"></div>
        <div class="skeleton sk-line"></div>
        <span class="loading-text">Loading notifications…</span>
      </div>

      <div *ngIf="!loadingNotifications && groupedItems.length > 0" class="groups">
        <section class="group" *ngFor="let group of groupedItems">
          <h3>{{ group.label }}</h3>
          <ul class="list">
            <li *ngFor="let item of group.items" [class.read]="item.read" [class.alert]="isAlert(item)" [class.warn]="isWarning(item)" [class.sla-warn]="isSlaWarn(item)" [class.sla-breach]="isSlaBreach(item)">
              <div class="row-head">
                <strong>{{ item.title }}</strong>
                <span class="type">{{ (item.type || 'INFO').toUpperCase() }}</span>
              </div>
              <span>{{ item.message }}</span>
              <small class="meta">{{ formatCreatedAt(item.createdAt) }}</small>
              <div class="actions-row">
                <button type="button" *ngIf="item.id && !item.read" (click)="markRead(item.id)" [attr.aria-label]="'Mark notification ' + item.title + ' as read'">Mark Read</button>
                <button type="button" *ngIf="getActionLabel(item)" (click)="goToAction(item)" [attr.aria-label]="(getActionLabel(item) || 'Open') + ' for notification ' + item.title">{{ getActionLabel(item) }}</button>
                <button type="button" *ngIf="item.id && isSlaBreach(item) && !isEscalated(item.id)" (click)="escalateAlert(item, 'ADMIN')">Escalate</button>
                <span class="owner-tag" *ngIf="item.id && isEscalated(item.id)">Owned by {{ getEscalationOwner(item.id) }}</span>
              </div>
            </li>
          </ul>
        </section>
      </div>

      <section class="audit card" *ngIf="escalationAudit.length > 0">
        <h3>Escalation Audit Timeline</h3>
        <ul class="list">
          <li *ngFor="let entry of escalationAudit">
            <div class="row-head">
              <strong>#{{ entry.id }} · {{ entry.title }}</strong>
              <span class="type">{{ entry.target }}</span>
            </div>
            <span>Owner: {{ entry.owner }}</span>
            <small class="meta">Escalated at {{ formatCreatedAt(entry.escalatedAt) }}</small>
            <div class="actions-row">
              <button type="button" (click)="undoEscalation(entry.id)">Undo Escalation</button>
            </div>
          </li>
        </ul>
      </section>

      <section class="history" *ngIf="!loadingNotifications && historyItems.length > 0">
        <button type="button" class="history-toggle" (click)="historyOpen = !historyOpen">
          {{ historyOpen ? 'Hide' : 'Show' }} Read History ({{ historyItems.length }})
        </button>

        <ul class="list" *ngIf="historyOpen">
          <li *ngFor="let item of historyItems">
            <div class="row-head">
              <strong>{{ item.title }}</strong>
              <span class="type">{{ (item.type || 'INFO').toUpperCase() }}</span>
            </div>
            <span>{{ item.message }}</span>
            <small class="meta">{{ formatCreatedAt(item.createdAt) }}</small>
          </li>
        </ul>
      </section>

      <div class="loading-text" *ngIf="!loadingNotifications && groupedItems.length === 0">No notifications yet.</div>
    </div>
  `,
  styles: [`
    .subtitle { color: var(--text-light); margin-top: 0.5rem; }
    .section { margin-top: 1.2rem; display: grid; gap: 0.6rem; }
    .toolbar { margin-top: 1rem; display: flex; gap: 0.6rem; align-items: center; flex-wrap: wrap; }
    .pill { background: rgba(37, 99, 235, 0.1); color: #1d4ed8; border: 1px solid rgba(37, 99, 235, 0.25); border-radius: 999px; padding: 0.2rem 0.6rem; font-size: 0.85rem; }
    .pill.offline { color: #b45309; border-color: rgba(180, 83, 9, 0.25); background: rgba(245, 158, 11, 0.1); }
    .sla-grid { margin-top: 0.9rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.55rem; }
    .sla-card { border: 1px solid var(--border); border-radius: 10px; padding: 0.65rem; background: rgba(11,18,32,0.52); display: grid; gap: 0.22rem; }
    .sla-card span { color: var(--text-muted); font-size: 0.76rem; text-transform: uppercase; letter-spacing: 0.04em; }
    .sla-card strong { color: var(--text); font-family: 'Syne', sans-serif; font-size: 1.05rem; }
    .sla-card.warning { border-color: rgba(246,178,63,0.55); }
    .sla-card.warning strong { color: #ffd58d; }
    .sla-card.breach { border-color: rgba(255,90,114,0.55); }
    .sla-card.breach strong { color: #ff9ca9; }
    .card { margin-top: 0.85rem; border: 1px solid var(--border); border-radius: 12px; padding: 0.75rem; background: rgba(11,18,32,0.52); }
    .escalation-info { margin-top: 0.7rem; border: 1px solid rgba(109,124,255,0.5); background: rgba(109,124,255,0.14); color: #c4ceff; border-radius: 10px; padding: 0.5rem 0.7rem; }
    .trend-row { display: grid; grid-template-columns: 48px 1fr auto; gap: 0.55rem; align-items: center; margin-top: 0.35rem; }
    .trend-row span { color: var(--text-muted); font-size: 0.78rem; }
    .bar-track { height: 8px; border-radius: 999px; background: rgba(255,255,255,0.08); overflow: hidden; }
    .bar-fill { height: 100%; background: linear-gradient(90deg, rgba(0,212,170,0.8), rgba(109,124,255,0.8)); }
    .aging .list { margin-top: 0.55rem; }
    .sla-row { display: flex; justify-content: space-between; gap: 0.5rem; align-items: center; }
    .sla-chip {
      border-radius: 999px;
      border: 1px solid var(--border);
      padding: 0.16rem 0.5rem;
      font-size: 0.66rem;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      font-weight: 700;
    }
    .sla-chip.ok { border-color: rgba(34,197,94,0.45); color: #80e8a6; background: rgba(34,197,94,0.12); }
    .sla-chip.warn { border-color: rgba(246,178,63,0.5); color: #ffd58d; background: rgba(246,178,63,0.12); }
    .sla-chip.breach { border-color: rgba(255,90,114,0.5); color: #ff9ca9; background: rgba(255,90,114,0.12); }
    .filters { margin-top: 0.8rem; display: flex; gap: 0.45rem; flex-wrap: wrap; }
    .filters.secondary { margin-top: 0.45rem; }
    .chip { border: 1px solid var(--border); background: rgba(11,18,32,0.58); color: var(--text-soft); border-radius: 999px; padding: 0.28rem 0.66rem; font-size: 0.76rem; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 700; }
    .chip.active { border-color: rgba(0,212,170,0.6); color: var(--primary); background: rgba(0,212,170,0.12); }
    .chip.danger { border-color: rgba(255,90,114,0.45); color: #ff9ca9; }
    .preset-row { margin-top: 0.7rem; display: flex; gap: 0.45rem; flex-wrap: wrap; }
    .preset-list { margin-top: 0.45rem; display: grid; gap: 0.35rem; }
    .preset-item { display: flex; gap: 0.35rem; flex-wrap: wrap; }
    .hint { margin-top: 0.5rem; color: var(--text-muted); font-size: 0.78rem; }
    .hint code { background: rgba(11,18,32,0.6); border: 1px solid var(--border); border-radius: 6px; padding: 0.05rem 0.3rem; }
    .check-row { display: flex; gap: 0.5rem; align-items: center; color: var(--text-light); }
    .sk-line { height: 44px; }
    .groups { margin-top: 1rem; display: grid; gap: 1rem; }
    .group h3 { margin-bottom: 0.5rem; color: var(--text-soft); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.04em; }
    .list { list-style: none; padding: 0; margin: 0; }
    .list li { border: 1px solid var(--border); border-radius: 8px; padding: 0.7rem; margin-bottom: 0.5rem; display: grid; gap: 0.35rem; }
    .list li.read { opacity: 0.75; }
    .list li.alert { border-color: rgba(255,90,114,0.55); }
    .list li.warn { border-color: rgba(246,178,63,0.55); }
    .list li.sla-warn { box-shadow: inset 0 0 0 1px rgba(246,178,63,0.35); }
    .list li.sla-breach { box-shadow: inset 0 0 0 1px rgba(255,90,114,0.42); }
    .list span { color: var(--text-light); }
    .meta { color: var(--text-muted); font-size: 0.78rem; }
    .row-head { display: flex; justify-content: space-between; gap: 0.6rem; align-items: center; }
    .type { border: 1px solid rgba(0,212,170,0.45); background: rgba(0,212,170,0.12); color: var(--primary); border-radius: 999px; padding: 0.18rem 0.5rem; font-size: 0.68rem; letter-spacing: 0.04em; font-weight: 700; }
    .actions-row { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .owner-tag { border: 1px solid rgba(109,124,255,0.45); background: rgba(109,124,255,0.14); color: #c4ceff; border-radius: 999px; padding: 0.16rem 0.48rem; font-size: 0.68rem; letter-spacing: 0.04em; text-transform: uppercase; }
    .history { margin-top: 1rem; }
    .history-toggle { width: fit-content; }

    @media (max-width: 700px) {
      .toolbar { flex-direction: column; align-items: stretch; }
      .actions-row { display: grid; grid-template-columns: 1fr; }
      .row-head { flex-direction: column; align-items: flex-start; }
      .trend-row { grid-template-columns: 1fr; }
    }
  `]
})
export class NotificationsComponent implements OnInit, OnDestroy {
  @ViewChild('searchBox') searchBox?: ElementRef<HTMLInputElement>;

  items: NotificationItem[] = [];
  unreadCount = 0;
  manualUserSelection = true;
  socketConnected = false;
  loadingNotifications = false;
  bulkUpdating = false;
  activeFilter: NotificationFilter = 'ALL';
  priorityFilter: PriorityFilter = 'ALL';
  historyOpen = false;
  searchTerm = '';
  presets: FilterPreset[] = [];
  escalationMessage = '';
  private escalationSet = new Set<number>();
  escalationAudit: EscalationEntry[] = [];

  private pollHandle: number | null = null;
  private readonly keyHandler = (event: KeyboardEvent) => this.onKeydown(event);
  private activeNotificationUserId: number | null = null;

  readonly userForm = this.fb.nonNullable.group({
    userId: [0, [Validators.required, Validators.min(1)]]
  });

  readonly preferencesForm = this.fb.nonNullable.group({
    emailAppointmentConfirmation: [true],
    smsReminder24h: [true],
    pushLabResults: [true]
  });

  readonly publishForm = this.fb.nonNullable.group({
    title: ['', Validators.required],
    message: ['', Validators.required]
  });

  constructor(
    private fb: FormBuilder,
    private notificationsApi: NotificationsApiService,
    private authService: AuthService,
    private router: Router,
    private notificationsSocket: NotificationsSocketService
  ) {}

  ngOnInit(): void {
    this.loadPresets();
    window.addEventListener('keydown', this.keyHandler);

    const fromToken = this.authService.getUserId();
    const remembered = Number(localStorage.getItem('hms_notifications_user_id') ?? '0');
    const selected = fromToken ?? (remembered > 0 ? remembered : null);

    if (selected && selected > 0) {
      this.manualUserSelection = false;
      this.userForm.controls.userId.setValue(selected);
      this.load();
    }
  }

  get escalatedCount(): number {
    return this.escalationSet.size;
  }

  ngOnDestroy(): void {
    window.removeEventListener('keydown', this.keyHandler);
    this.notificationsSocket.disconnect();
    if (this.pollHandle !== null) {
      window.clearInterval(this.pollHandle);
      this.pollHandle = null;
    }
  }

  get historyItems(): NotificationItem[] {
    return this.items
      .filter(item => item.read)
      .slice(0, 25);
  }

  get filteredItems(): NotificationItem[] {
    return this.getFilteredItems();
  }

  get filteredUnreadCount(): number {
    return this.filteredItems.filter(item => !item.read).length;
  }

  get filteredCriticalCount(): number {
    return this.filteredItems.filter(item => this.isAlert(item)).length;
  }

  get averageAlertAgeHours(): string {
    const alerts = this.filteredItems.filter(item => this.isAlert(item) && !item.read && item.createdAt);
    if (alerts.length === 0) return '0h';

    const now = Date.now();
    const avgMs = alerts.reduce((sum, item) => {
      const ts = new Date(item.createdAt as string).getTime();
      return sum + Math.max(0, now - ts);
    }, 0) / alerts.length;

    return `${(avgMs / (1000 * 60 * 60)).toFixed(1)}h`;
  }

  get slaWarningCount(): number {
    return this.filteredItems
      .filter(item => !item.read && this.isAlert(item))
      .filter(item => this.getSlaState(item.createdAt) === 'WARN')
      .length;
  }

  get slaBreachCount(): number {
    return this.filteredItems
      .filter(item => !item.read && this.isAlert(item))
      .filter(item => this.getSlaState(item.createdAt) === 'BREACH')
      .length;
  }

  get trendPoints(): TrendPoint[] {
    const source = this.filteredItems;
    if (source.length === 0) return [];

    const now = new Date();
    const buckets: Array<{ key: string; label: string; count: number }> = [];
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      buckets.push({ key, label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), count: 0 });
    }

    for (const item of source) {
      const d = item.createdAt ? new Date(item.createdAt) : null;
      if (!d || Number.isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      const bucket = buckets.find(x => x.key === key);
      if (bucket) bucket.count += 1;
    }

    const max = Math.max(...buckets.map(x => x.count), 1);
    return buckets.map(x => ({ label: x.label, count: x.count, width: (x.count / max) * 100 }));
  }

  get oldestUnreadAlerts(): NotificationItem[] {
    return this.filteredItems
      .filter(item => !item.read && this.isAlert(item) && !!item.createdAt)
      .sort((a, b) => new Date(a.createdAt as string).getTime() - new Date(b.createdAt as string).getTime())
      .slice(0, 3);
  }

  get groupedItems(): NotificationGroup[] {
    const filtered = this.getFilteredItems();
    const groups = new Map<string, NotificationItem[]>();

    for (const item of filtered) {
      const bucket = this.getDateBucket(item.createdAt);
      if (!groups.has(bucket)) groups.set(bucket, []);
      groups.get(bucket)?.push(item);
    }

    return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
  }

  setFilter(filter: NotificationFilter): void {
    this.activeFilter = filter;
  }

  setPriority(priority: PriorityFilter): void {
    this.priorityFilter = priority;
  }

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value;
  }

  savePreset(): void {
    const name = window.prompt('Preset name');
    if (!name) return;

    const preset: FilterPreset = {
      name: name.trim(),
      filter: this.activeFilter,
      priority: this.priorityFilter,
      search: this.searchTerm
    };

    if (!preset.name) return;

    this.presets = [
      ...this.presets.filter(item => item.name.toLowerCase() !== preset.name.toLowerCase()),
      preset
    ];

    this.persistPresets();
  }

  applyPreset(preset: FilterPreset): void {
    this.activeFilter = preset.filter;
    this.priorityFilter = preset.priority;
    this.searchTerm = preset.search;
  }

  deletePreset(name: string): void {
    this.presets = this.presets.filter(item => item.name !== name);
    this.persistPresets();
  }

  exportFiltered(): void {
    const rows = this.getFilteredItems();
    const fileName = `notifications-export-${new Date().toISOString().slice(0, 10)}.json`;
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();

    URL.revokeObjectURL(url);
  }

  isEscalated(id: number): boolean {
    return this.escalationSet.has(id);
  }

  getEscalationOwner(id: number): string {
    return this.escalationAudit.find(item => item.id === id)?.owner ?? 'N/A';
  }

  escalateAlert(item: NotificationItem, target: 'ADMIN' | 'CARE'): void {
    const id = item.id;
    if (!id || this.userForm.invalid || this.escalationSet.has(id)) return;

    const payload: NotificationItem = {
      userId: this.userForm.controls.userId.value,
      title: `Escalation · ${target}`,
      message: `Escalated alert from "${item.title}" for ${target} review. Original: ${item.message}`,
      type: 'CRITICAL'
    };

    this.notificationsApi.publish(payload).subscribe({
      next: () => {
        this.escalationSet.add(id);
        this.escalationAudit = [
          {
            id,
            title: item.title,
            target,
            owner: target === 'ADMIN' ? 'Admin Desk' : 'Care Team',
            escalatedAt: new Date().toISOString()
          },
          ...this.escalationAudit.filter(entry => entry.id !== id)
        ];
        this.escalationMessage = `Alert #${id} escalated to ${target}.`;
      }
    });
  }

  undoEscalation(id: number): void {
    this.escalationSet.delete(id);
    this.escalationAudit = this.escalationAudit.filter(entry => entry.id !== id);
    this.escalationMessage = `Escalation removed for alert #${id}.`;
  }

  getAgeLabel(value?: string): string {
    if (!value) return 'unknown time';
    const time = new Date(value).getTime();
    if (Number.isNaN(time)) return 'unknown time';

    const diffMs = Math.max(0, Date.now() - time);
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  }

  getSlaState(value?: string): 'OK' | 'WARN' | 'BREACH' {
    const ageHours = this.getAgeInHours(value);
    if (ageHours >= 6) return 'BREACH';
    if (ageHours >= 2) return 'WARN';
    return 'OK';
  }

  getSlaLabel(value?: string): string {
    const state = this.getSlaState(value);
    if (state === 'BREACH') return 'SLA Breach';
    if (state === 'WARN') return 'SLA Warning';
    return 'On Track';
  }

  isSlaWarn(item: NotificationItem): boolean {
    return !item.read && this.isAlert(item) && this.getSlaState(item.createdAt) === 'WARN';
  }

  isSlaBreach(item: NotificationItem): boolean {
    return !item.read && this.isAlert(item) && this.getSlaState(item.createdAt) === 'BREACH';
  }

  load(): void {
    if (this.userForm.invalid) return;

    const userId = this.userForm.controls.userId.value;
    this.activeNotificationUserId = userId;
    this.loadEscalationState(userId);
    localStorage.setItem('hms_notifications_user_id', String(userId));
    this.loadingNotifications = true;

    this.notificationsApi.getMyNotifications(userId).subscribe({
      next: items => {
        this.setItems(items);
        this.loadingNotifications = false;
      },
      error: () => {
        this.setItems([]);
        this.loadingNotifications = false;
      }
    });

    this.notificationsApi.getPreferences(userId).subscribe({
      next: pref => this.preferencesForm.patchValue({
        emailAppointmentConfirmation: pref.emailAppointmentConfirmation,
        smsReminder24h: pref.smsReminder24h,
        pushLabResults: pref.pushLabResults
      })
    });

    this.notificationsSocket.connect(
      userId,
      (incoming) => this.upsertIncoming(incoming),
      () => (this.socketConnected = true),
      () => (this.socketConnected = false)
    );

    if (this.pollHandle === null) {
      this.pollHandle = window.setInterval(() => this.loadSilent(), 15000);
    }
  }

  private setItems(items: NotificationItem[]): void {
    this.items = items;
    this.unreadCount = items.filter(item => !item.read).length;
    window.dispatchEvent(new CustomEvent<number>('hms-unread-count', { detail: this.unreadCount }));
  }

  private upsertIncoming(incoming: NotificationItem): void {
    const existingIndex = this.items.findIndex(item => item.id === incoming.id);
    if (existingIndex >= 0) {
      this.items[existingIndex] = incoming;
    } else {
      this.items = [incoming, ...this.items];
    }
    this.unreadCount = this.items.filter(item => !item.read).length;
    window.dispatchEvent(new CustomEvent<number>('hms-unread-count', { detail: this.unreadCount }));
  }

  private loadSilent(): void {
    if (this.userForm.invalid) return;
    this.notificationsApi.getMyNotifications(this.userForm.controls.userId.value).subscribe({
      next: items => this.setItems(items)
    });
  }

  savePreferences(): void {
    if (this.userForm.invalid) return;

    const userId = this.userForm.controls.userId.value;
    const payload: NotificationPreference = {
      emailAppointmentConfirmation: this.preferencesForm.controls.emailAppointmentConfirmation.value,
      smsReminder24h: this.preferencesForm.controls.smsReminder24h.value,
      pushLabResults: this.preferencesForm.controls.pushLabResults.value
    };

    this.notificationsApi.updatePreferences(userId, payload).subscribe();
  }

  publish(): void {
    if (this.userForm.invalid || this.publishForm.invalid) return;

    const payload: NotificationItem = {
      userId: this.userForm.controls.userId.value,
      title: this.publishForm.controls.title.value,
      message: this.publishForm.controls.message.value,
      type: 'INFO'
    };

    this.notificationsApi.publish(payload).subscribe({
      next: () => this.loadSilent()
    });
  }

  markRead(id: number): void {
    const existing = this.items.find(item => item.id === id);
    if (!existing || existing.read) return;

    existing.read = true;
    this.unreadCount = this.items.filter(item => !item.read).length;
    window.dispatchEvent(new CustomEvent<number>('hms-unread-count', { detail: this.unreadCount }));

    this.notificationsApi.markRead(id).subscribe({
      error: () => this.loadSilent()
    });
  }

  markAllRead(): void {
    const pendingIds = this.items.filter(item => item.id && !item.read).map(item => item.id as number);
    if (pendingIds.length === 0) return;

    this.bulkUpdating = true;
    this.items.forEach(item => { if (!item.read) item.read = true; });
    this.unreadCount = 0;
    window.dispatchEvent(new CustomEvent<number>('hms-unread-count', { detail: this.unreadCount }));

    forkJoin(pendingIds.map(id => this.notificationsApi.markRead(id))).subscribe({
      next: () => {
        this.bulkUpdating = false;
      },
      error: () => {
        this.bulkUpdating = false;
        this.loadSilent();
      }
    });
  }

  getActionLabel(item: NotificationItem): string | null {
    const route = this.resolveActionRoute(item);
    if (!route) return null;
    if (route.includes('/billing')) return 'View Billing';
    if (route.includes('/lab')) return 'View Lab Results';
    if (route.includes('/appointments')) return 'View Appointments';
    return 'Open';
  }

  goToAction(item: NotificationItem): void {
    const route = this.resolveActionRoute(item);
    if (route) this.router.navigate([route]);
  }

  isAlert(item: NotificationItem): boolean {
    const text = `${item.type ?? ''} ${item.title} ${item.message}`.toLowerCase();
    return text.includes('critical') || text.includes('alert') || text.includes('abnormal');
  }

  isWarning(item: NotificationItem): boolean {
    const text = `${item.type ?? ''} ${item.title} ${item.message}`.toLowerCase();
    return text.includes('bill') || text.includes('invoice') || text.includes('due') || text.includes('warn');
  }

  isAppointment(item: NotificationItem): boolean {
    const text = `${item.type ?? ''} ${item.title} ${item.message}`.toLowerCase();
    return text.includes('appointment') || text.includes('slot') || text.includes('schedule');
  }

  formatCreatedAt(value?: string): string {
    if (!value) return 'Recent';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Recent';
    return date.toLocaleString();
  }

  private getDateBucket(value?: string): string {
    if (!value) return 'Recent';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Recent';

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.round((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return 'Earlier';
  }

  private getAgeInHours(value?: string): number {
    if (!value) return 0;
    const time = new Date(value).getTime();
    if (Number.isNaN(time)) return 0;
    return Math.max(0, (Date.now() - time) / (1000 * 60 * 60));
  }

  private getFilteredItems(): NotificationItem[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.items.filter(item => {
      const text = `${item.title} ${item.message} ${item.type ?? ''}`.toLowerCase();

      if (search && !text.includes(search)) return false;

      if (this.activeFilter === 'UNREAD' && item.read) return false;
      if (this.activeFilter === 'READ' && !item.read) return false;
      if (this.activeFilter === 'ALERT' && !(this.isAlert(item) || this.isWarning(item))) return false;

      if (this.priorityFilter === 'CRITICAL' && !this.isAlert(item)) return false;
      if (this.priorityFilter === 'BILLING' && !this.isWarning(item)) return false;
      if (this.priorityFilter === 'APPOINTMENT' && !this.isAppointment(item)) return false;

      return true;
    });
  }

  private onKeydown(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();

    if (key === '/' && !this.manualUserSelection) {
      event.preventDefault();
      this.searchBox?.nativeElement.focus();
      return;
    }

    const activeElement = document.activeElement as HTMLElement | null;
    const tagName = activeElement?.tagName?.toLowerCase();
    if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
      return;
    }

    if (key === 'u') this.activeFilter = 'UNREAD';
    if (key === 'a') this.activeFilter = 'ALL';
    if (key === 'r') this.activeFilter = 'READ';
    if (key === 'c') this.priorityFilter = 'CRITICAL';
  }

  private loadPresets(): void {
    const raw = localStorage.getItem('hms_notification_presets');
    if (!raw) {
      this.presets = [];
      return;
    }

    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) {
        this.presets = [];
        return;
      }

      this.presets = parsed.filter(item =>
        typeof item?.name === 'string'
        && typeof item?.filter === 'string'
        && typeof item?.priority === 'string'
        && typeof item?.search === 'string'
      ) as FilterPreset[];
    } catch {
      this.presets = [];
    }
  }

  private persistPresets(): void {
    localStorage.setItem('hms_notification_presets', JSON.stringify(this.presets));
  }

  private loadEscalationState(userId: number): void {
    const raw = localStorage.getItem(this.getEscalationStorageKey(userId));
    if (!raw) {
      this.escalationSet = new Set<number>();
      this.escalationAudit = [];
      return;
    }

    try {
      const parsed = JSON.parse(raw) as { ids?: number[]; audit?: EscalationEntry[] };
      const ids = Array.isArray(parsed.ids) ? parsed.ids.filter(id => Number.isInteger(id)) : [];
      const audit = Array.isArray(parsed.audit) ? parsed.audit : [];
      this.escalationSet = new Set<number>(ids);
      this.escalationAudit = audit.filter(entry => Number.isInteger(entry.id));
    } catch {
      this.escalationSet = new Set<number>();
      this.escalationAudit = [];
    }
  }

  private persistEscalationState(): void {
    if (!this.activeNotificationUserId || this.activeNotificationUserId < 1) return;
    const payload = {
      ids: Array.from(this.escalationSet.values()),
      audit: this.escalationAudit
    };
    localStorage.setItem(this.getEscalationStorageKey(this.activeNotificationUserId), JSON.stringify(payload));
  }

  private getEscalationStorageKey(userId: number): string {
    return `hms_notification_escalations_${userId}`;
  }

  private resolveActionRoute(item: NotificationItem): string | null {
    const text = `${item.type ?? ''} ${item.title} ${item.message}`.toLowerCase();
    const role = (this.authService.getRole() ?? '').toUpperCase();

    if (text.includes('bill') || text.includes('invoice') || text.includes('payment')) {
      return role === 'ADMIN' ? '/admin/billing' : '/patient/billing';
    }

    if (text.includes('lab') || text.includes('result')) {
      return role === 'DOCTOR' ? '/doctor/lab' : '/patient/lab';
    }

    if (text.includes('appointment')) {
      if (role === 'DOCTOR') return '/doctor/appointments';
      if (role === 'ADMIN') return '/appointments';
      return '/patient/appointments';
    }

    return null;
  }
}
