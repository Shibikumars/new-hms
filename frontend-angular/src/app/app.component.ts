import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { AuthService } from './core/auth.service';
import { NotificationsBadgeSocketService } from './core/notifications-badge-socket.service';
import { UiFeedbackService, UiToastKind } from './core/ui-feedback.service';
import { NotificationItem, NotificationsApiService } from './features/notifications/notifications-api.service';
import { PatientProfileService } from './features/patient/patient-profile.service';

type NavItem = { label: string; path: string; icon: string; badge?: number };
type NavGroup = { title: string; items: NavItem[] };

type QuickAction = { label: string; path: string; icon: string };

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <a class="skip-link" href="#main-content">Skip to main content</a>

    <ng-container *ngIf="showShell; else authLayout">
      <div class="shell" [class.sidebar-collapsed]="sidebarCollapsed" [class.sidebar-open]="sidebarOpenMobile">
        <aside class="sidebar" aria-label="Main navigation">
          <div class="brand">
            <div class="brand-mark">HMS</div>
            <div class="brand-sub">Healthcare OS</div>
          </div>

          <nav class="menu">
            <section class="menu-group" *ngIf="favoriteItems.length > 0">
              <button type="button" class="group-toggle" aria-expanded="true">
                <span>Favorites</span>
                <span class="caret">★</span>
              </button>

              <div class="group-items">
                <a
                  *ngFor="let item of favoriteItems"
                  [routerLink]="item.path"
                  routerLinkActive="active"
                  class="menu-item"
                  [attr.aria-label]="item.label"
                  (click)="onNavItemClick()"
                >
                  <span class="menu-icon">{{ item.icon }}</span>
                  <span class="menu-label">{{ item.label }}</span>
                  <span class="menu-badge" *ngIf="item.badge && item.badge > 0">{{ item.badge }}</span>
                  <button type="button" class="fav-btn" (click)="toggleFavorite(item, $event)" aria-label="Remove from favorites">★</button>
                </a>
              </div>
            </section>

            <section class="menu-group" *ngFor="let group of navGroups" [class.group-active]="groupHasActiveRoute(group)">
              <button
                type="button"
                class="group-toggle"
                [attr.aria-expanded]="!isGroupCollapsed(group.title)"
                (click)="toggleGroup(group.title)"
              >
                <span>{{ group.title }}</span>
                <span class="caret">{{ isGroupCollapsed(group.title) ? '▸' : '▾' }}</span>
              </button>

              <div class="group-items" [class.collapsed]="isGroupCollapsed(group.title)">
                <a
                  *ngFor="let item of group.items"
                  [routerLink]="item.path"
                  routerLinkActive="active"
                  class="menu-item"
                  [attr.aria-label]="item.label"
                  (click)="onNavItemClick()"
                >
                  <span class="menu-icon">{{ item.icon }}</span>
                  <span class="menu-label">{{ item.label }}</span>
                  <span class="menu-badge" *ngIf="item.badge && item.badge > 0">{{ item.badge }}</span>
                  <button type="button" class="fav-btn" (click)="toggleFavorite(item, $event)" [attr.aria-label]="isFavorite(item.path) ? 'Remove from favorites' : 'Add to favorites'">
                    {{ isFavorite(item.path) ? '★' : '☆' }}
                  </button>
                </a>
              </div>
            </section>
          </nav>
        </aside>

        <div class="workspace" (click)="closeProfileMenu()">
          <header class="topbar">
            <div class="topbar-left">
              <button type="button" class="menu-toggle" (click)="toggleSidebar($event)" aria-label="Toggle sidebar menu">☰</button>
              <div class="breadcrumb" aria-label="Breadcrumb navigation">{{ breadcrumbText }}</div>
            </div>

            <div class="quick-actions" *ngIf="quickActions.length > 0">
              <a *ngFor="let action of quickActions" [routerLink]="action.path" class="quick-btn" [attr.aria-label]="action.label">
                <span>{{ action.icon }}</span>
                <span>{{ action.label }}</span>
              </a>
            </div>

            <div class="profile-wrap">
              <button type="button" class="profile-btn" (click)="toggleProfileMenu($event)" aria-label="Open profile menu">
                <span class="avatar">{{ profileInitials }}</span>
                <span class="profile-meta">
                  <strong>{{ profileName }}</strong>
                  <small>{{ roleLabel }}</small>
                </span>
              </button>

              <div class="profile-menu" *ngIf="profileMenuOpen">
                <a [routerLink]="profileRoute" (click)="closeProfileMenu()">View Profile</a>
                <button type="button" (click)="logout()">Logout</button>
              </div>
            </div>
          </header>

          <div class="notify-toast" [class.error]="toastKind === 'error'" [class.warn]="toastKind === 'warn'" *ngIf="notificationToast" role="status" aria-live="polite">
            {{ notificationToast }}
          </div>

          <main id="main-content" tabindex="-1" aria-label="Hospital management main content">
            <router-outlet />
          </main>
        </div>
      </div>
    </ng-container>

    <ng-template #authLayout>
      <main id="main-content" tabindex="-1" aria-label="Authentication content">
        <router-outlet />
      </main>
    </ng-template>
  `,
  styles: [`
    .skip-link {
      position: absolute;
      left: 0.75rem;
      top: -40px;
      z-index: 2000;
      background: #0b1322;
      color: #ffffff;
      border: 1px solid rgba(0, 212, 170, 0.7);
      border-radius: 8px;
      padding: 0.45rem 0.75rem;
      text-decoration: none;
      font-weight: 600;
    }
    .skip-link:focus { top: 0.75rem; }

    .shell {
      display: grid;
      grid-template-columns: 260px 1fr;
      min-height: 100vh;
      gap: 0;
    }

    .sidebar {
      border-right: 1px solid var(--border);
      background: linear-gradient(180deg, rgba(12,19,34,0.96), rgba(7,12,23,0.98));
      padding: 1rem 0.85rem;
      position: sticky;
      top: 0;
      height: 100vh;
      overflow-y: auto;
    }

    .brand {
      display: grid;
      gap: 0.35rem;
      margin-bottom: 1rem;
      padding-bottom: 0.85rem;
      border-bottom: 1px solid var(--border);
    }

    .brand-mark {
      font-family: 'Syne', sans-serif;
      letter-spacing: 0.06em;
      color: var(--primary);
      font-weight: 800;
      font-size: 1.15rem;
    }

    .brand-sub { color: var(--text-muted); font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.04em; }

    .menu { display: grid; gap: 0.7rem; }

    .menu-group {
      border: 1px solid var(--border);
      border-radius: 10px;
      background: rgba(11, 18, 32, 0.38);
      overflow: hidden;
      transition: border-color 0.18s ease;
    }

    .menu-group.group-active {
      border-color: rgba(0, 212, 170, 0.45);
    }

    .group-toggle {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border: none;
      border-bottom: 1px solid rgba(255,255,255,0.04);
      background: rgba(15, 24, 39, 0.8);
      color: var(--text-soft);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 0.45rem 0.55rem;
      min-height: 34px;
    }

    .caret { color: var(--text-muted); }

    .group-items {
      display: grid;
      gap: 0.2rem;
      padding: 0.35rem;
      max-height: 500px;
      opacity: 1;
      transition: max-height 0.2s ease, opacity 0.2s ease, padding 0.2s ease;
    }

    .group-items.collapsed {
      max-height: 0;
      opacity: 0;
      overflow: hidden;
      padding-top: 0;
      padding-bottom: 0;
    }

    .menu-item {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      border: 1px solid transparent;
      border-radius: 8px;
      padding: 0.45rem 0.5rem;
      color: var(--text-soft);
      text-decoration: none;
      font-size: 0.9rem;
      background: rgba(11, 18, 32, 0.45);
      min-height: 40px;
    }

    .menu-item.active,
    .menu-item:hover {
      border-color: rgba(0, 212, 170, 0.55);
      color: var(--primary);
      background: rgba(0, 212, 170, 0.1);
    }

    .menu-icon { width: 1.2rem; text-align: center; font-size: 0.95rem; }
    .menu-label { flex: 1; }
    .menu-badge {
      min-width: 18px;
      height: 18px;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.66rem;
      font-weight: 700;
      color: #001f17;
      background: var(--primary);
      padding: 0 0.28rem;
      border: 1px solid rgba(0, 212, 170, 0.6);
    }

    .fav-btn {
      border: 1px solid transparent;
      background: transparent;
      color: var(--text-muted);
      min-height: 24px;
      width: 24px;
      padding: 0;
      border-radius: 6px;
      font-size: 0.8rem;
    }

    .fav-btn:hover {
      border-color: rgba(0,212,170,0.45);
      color: var(--primary);
    }

    .workspace { min-width: 0; }

    .topbar {
      position: sticky;
      top: 0;
      z-index: 100;
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: 0.8rem;
      padding: 0.7rem 1rem;
      border-bottom: 1px solid var(--border);
      background: rgba(7, 12, 23, 0.84);
      backdrop-filter: blur(8px);
    }

    .topbar-left {
      display: flex;
      align-items: center;
      gap: 0.7rem;
      min-width: 0;
    }

    .breadcrumb {
      color: var(--text-soft);
      font-size: 0.84rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 36vw;
    }

    .quick-actions {
      display: flex;
      gap: 0.45rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .quick-btn {
      border: 1px solid var(--border);
      border-radius: 999px;
      background: rgba(11,18,32,0.58);
      color: var(--text-soft);
      text-decoration: none;
      padding: 0.3rem 0.58rem;
      font-size: 0.76rem;
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      font-weight: 700;
    }

    .quick-btn:hover { color: var(--primary); border-color: rgba(0,212,170,0.5); }

    .menu-toggle {
      border: 1px solid var(--border);
      background: rgba(11, 18, 32, 0.68);
      color: var(--text);
      border-radius: 8px;
      width: 40px;
      height: 40px;
      min-height: 40px;
      padding: 0;
    }

    .profile-wrap { position: relative; }

    .profile-btn {
      border: 1px solid var(--border);
      border-radius: 999px;
      background: rgba(11, 18, 32, 0.65);
      color: var(--text);
      display: flex;
      align-items: center;
      gap: 0.55rem;
      padding: 0.34rem 0.62rem;
      min-height: 40px;
    }

    .avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.76rem;
      background: rgba(0, 212, 170, 0.2);
      color: var(--primary);
      border: 1px solid rgba(0, 212, 170, 0.5);
    }

    .profile-meta { display: grid; text-align: left; }
    .profile-meta strong { font-size: 0.85rem; color: var(--text); line-height: 1.1; }
    .profile-meta small { color: var(--text-muted); font-size: 0.72rem; }

    .profile-menu {
      position: absolute;
      right: 0;
      top: calc(100% + 0.4rem);
      min-width: 170px;
      border: 1px solid var(--border);
      background: rgba(12, 19, 34, 0.98);
      border-radius: 10px;
      padding: 0.42rem;
      display: grid;
      gap: 0.25rem;
      box-shadow: var(--shadow-soft);
    }

    .profile-menu a,
    .profile-menu button {
      border: 1px solid transparent;
      background: rgba(11, 18, 32, 0.62);
      color: var(--text-soft);
      border-radius: 8px;
      padding: 0.45rem 0.58rem;
      text-align: left;
      text-decoration: none;
      font-size: 0.84rem;
      min-height: 36px;
    }

    .profile-menu a:hover,
    .profile-menu button:hover {
      border-color: rgba(0, 212, 170, 0.45);
      color: var(--primary);
    }

    .notify-toast {
      position: fixed;
      right: 1rem;
      top: 4.25rem;
      z-index: 1300;
      border: 1px solid rgba(0,212,170,0.45);
      background: rgba(7, 18, 31, 0.95);
      color: var(--text);
      border-radius: 10px;
      padding: 0.6rem 0.8rem;
      box-shadow: var(--shadow-soft);
      max-width: 360px;
      font-size: 0.84rem;
    }

    .notify-toast.warn {
      border-color: rgba(246,178,63,0.55);
      color: #ffe0a8;
      background: rgba(40, 27, 12, 0.95);
    }

    .notify-toast.error {
      border-color: rgba(255,90,114,0.55);
      color: #ffc4cf;
      background: rgba(38, 14, 20, 0.95);
    }

    main { min-width: 0; }

    .sidebar-collapsed {
      grid-template-columns: 76px 1fr;
    }

    .sidebar-collapsed .brand-sub,
    .sidebar-collapsed .group-toggle span:first-child,
    .sidebar-collapsed .menu-item .menu-label,
    .sidebar-collapsed .menu-item .menu-badge,
    .sidebar-collapsed .menu-item .fav-btn {
      display: none;
    }

    .sidebar-collapsed .group-toggle {
      justify-content: center;
      padding: 0.35rem;
    }

    .sidebar-collapsed .menu-item {
      justify-content: center;
    }

    .sidebar-collapsed .menu-group {
      background: transparent;
      border-color: transparent;
    }

    @media (max-width: 1180px) {
      .topbar {
        grid-template-columns: auto 1fr;
      }
      .quick-actions {
        grid-column: 1 / -1;
        justify-content: flex-start;
      }
      .profile-wrap {
        justify-self: end;
      }
    }

    @media (max-width: 980px) {
      .shell {
        grid-template-columns: 1fr;
      }

      .sidebar {
        position: fixed;
        left: 0;
        top: 0;
        bottom: 0;
        width: 240px;
        transform: translateX(-100%);
        transition: transform 0.2s ease;
        z-index: 1200;
      }

      .shell.sidebar-open .sidebar {
        transform: translateX(0);
      }

      .sidebar-collapsed {
        grid-template-columns: 1fr;
      }

      .sidebar-collapsed .brand-sub,
      .sidebar-collapsed .group-toggle span:first-child,
      .sidebar-collapsed .menu-item .menu-label,
      .sidebar-collapsed .menu-item .menu-badge,
      .sidebar-collapsed .menu-item .fav-btn {
        display: initial;
      }

      .sidebar-collapsed .group-toggle,
      .sidebar-collapsed .menu-item {
        justify-content: flex-start;
      }

      .breadcrumb {
        max-width: 52vw;
      }

      .profile-meta {
        display: none;
      }
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  showShell = false;
  sidebarCollapsed = false;
  sidebarOpenMobile = false;
  profileMenuOpen = false;

  roleLabel = 'Guest';
  profileName = 'User';
  profileInitials = 'U';
  profileRoute = '/auth/login';
  breadcrumbText = 'Home';

  navGroups: NavGroup[] = [];
  quickActions: QuickAction[] = [];
  favoriteItems: NavItem[] = [];
  notificationToast = '';
  toastKind: UiToastKind = 'info';
  private toastHandle: number | null = null;

  private groupCollapseState: Record<string, boolean> = {};
  private unreadRefreshHandle: number | null = null;
  private unreadCount = 0;
  private badgeSocketConnected = false;
  private disableNotificationBadge = false;
  private disablePatientProfileLookup = false;
  private patientProfileLoaded = false;
  private readonly sub = new Subscription();
  private readonly unreadSyncHandler = (event: Event) => {
    const custom = event as CustomEvent<number>;
    const count = Number(custom.detail ?? 0);
    if (Number.isFinite(count) && count >= 0) {
      this.applyNotificationBadge(count);
    }
  };

  constructor(
    private router: Router,
    private authService: AuthService,
    private badgeSocket: NotificationsBadgeSocketService,
    private uiFeedback: UiFeedbackService,
    private patientProfileService: PatientProfileService,
    private notificationsApi: NotificationsApiService
  ) {}

  ngOnInit(): void {
    window.addEventListener('hms-unread-count', this.unreadSyncHandler as EventListener);

    this.sub.add(
      this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
        this.refreshShellState();
      })
    );

    this.sub.add(
      this.uiFeedback.messages$.subscribe(({ message, kind }) => {
        this.showNotificationToast(message, kind);
      })
    );

    this.refreshShellState();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    window.removeEventListener('hms-unread-count', this.unreadSyncHandler as EventListener);
    this.badgeSocket.disconnect();
    if (this.unreadRefreshHandle !== null) {
      window.clearInterval(this.unreadRefreshHandle);
      this.unreadRefreshHandle = null;
    }
    if (this.toastHandle !== null) {
      window.clearTimeout(this.toastHandle);
      this.toastHandle = null;
    }
  }

  toggleSidebar(event?: Event): void {
    event?.stopPropagation();
    if (window.innerWidth <= 980) {
      this.sidebarOpenMobile = !this.sidebarOpenMobile;
      return;
    }
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  toggleProfileMenu(event?: Event): void {
    event?.stopPropagation();
    this.profileMenuOpen = !this.profileMenuOpen;
  }

  closeProfileMenu(): void {
    this.profileMenuOpen = false;
  }

  onNavItemClick(): void {
    if (window.innerWidth <= 980) {
      this.sidebarOpenMobile = false;
    }
  }

  toggleGroup(groupTitle: string): void {
    this.groupCollapseState[groupTitle] = !this.groupCollapseState[groupTitle];
  }

  isGroupCollapsed(groupTitle: string): boolean {
    return this.groupCollapseState[groupTitle] ?? false;
  }

  groupHasActiveRoute(group: NavGroup): boolean {
    const url = this.router.url || '';
    return group.items.some(item => url.startsWith(item.path));
  }

  toggleFavorite(item: NavItem, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const key = this.getFavoritesStorageKey();
    const existing = this.getFavoritePaths();

    const updated = existing.includes(item.path)
      ? existing.filter(path => path !== item.path)
      : [...existing, item.path];

    localStorage.setItem(key, JSON.stringify(updated));
    this.rebuildFavorites();
  }

  isFavorite(path: string): boolean {
    return this.getFavoritePaths().includes(path);
  }

  logout(): void {
    this.authService.logout();
    this.profileMenuOpen = false;
    this.router.navigate(['/auth/login']);
  }

  private refreshShellState(): void {
    const url = this.router.url || '';
    const isAuthRoute = url.startsWith('/auth');

    this.showShell = this.authService.isAuthenticated() && !isAuthRoute;
    if (!this.showShell) {
      this.navGroups = [];
      this.quickActions = [];
      this.favoriteItems = [];
      this.breadcrumbText = 'Home';
      this.disableNotificationBadge = false;
      this.disablePatientProfileLookup = false;
      this.patientProfileLoaded = false;
      this.badgeSocket.disconnect();
      this.badgeSocketConnected = false;
      if (this.unreadRefreshHandle !== null) {
        window.clearInterval(this.unreadRefreshHandle);
        this.unreadRefreshHandle = null;
      }
      return;
    }

    const role = (this.authService.getRole() ?? '').toUpperCase();
    this.roleLabel = role || 'User';
    this.profileName = this.authService.getUsername() ?? 'User';
    this.profileInitials = this.getInitials(this.profileName);
    this.disableNotificationBadge = role === 'PATIENT';

    this.configureRoleNavigation(role);
    this.configureQuickActions(role);
    this.rebuildFavorites();
    this.loadProfileIdentity(role, url);
    this.refreshNotificationBadge();
    this.connectBadgeStream();
    this.ensureUnreadRefreshLoop();
    this.breadcrumbText = this.resolveBreadcrumb(url);
  }

  private configureRoleNavigation(role: string): void {
    if (role === 'ADMIN') {
      this.profileRoute = '/admin/dashboard';
      this.navGroups = [
        {
          title: 'Overview',
          items: [
            { label: 'Dashboard', path: '/admin/dashboard', icon: '📊' },
            { label: 'Analytics', path: '/admin/analytics', icon: '📈' }
          ]
        },
        {
          title: 'Operations',
          items: [
            { label: 'Billing', path: '/admin/billing', icon: '💳' },
            { label: 'Appointments', path: '/appointments', icon: '📅' }
          ]
        },
        {
          title: 'Communication',
          items: [
            { label: 'Notifications', path: '/admin/notifications', icon: '🔔' }
          ]
        }
      ];
      return;
    }

    if (role === 'DOCTOR') {
      this.profileRoute = '/doctor/dashboard';
      this.navGroups = [
        {
          title: 'Workspace',
          items: [
            { label: 'Dashboard', path: '/doctor/dashboard', icon: '🩺' },
            { label: 'Appointments', path: '/doctor/appointments', icon: '📅' },
            { label: 'Records', path: '/doctor/records', icon: '📋' }
          ]
        },
        {
          title: 'Clinical',
          items: [
            { label: 'Lab', path: '/doctor/lab', icon: '🧪' },
            { label: 'Pharmacy', path: '/doctor/pharmacy', icon: '💊' }
          ]
        },
        {
          title: 'Communication',
          items: [
            { label: 'Notifications', path: '/doctor/notifications', icon: '🔔' }
          ]
        }
      ];
      return;
    }

    this.profileRoute = '/patient/profile';
    this.navGroups = [
      {
        title: 'My Space',
        items: [
          { label: 'Portal', path: '/patient/portal', icon: '🏥' },
          { label: 'Profile', path: '/patient/profile', icon: '👤' }
        ]
      },
      {
        title: 'Care Services',
        items: [
          { label: 'Appointments', path: '/patient/appointments', icon: '📅' },
          { label: 'Records', path: '/patient/records', icon: '📋' },
          { label: 'Lab', path: '/patient/lab', icon: '🧪' },
          { label: 'Pharmacy', path: '/patient/pharmacy', icon: '💊' }
        ]
      },
      {
        title: 'Support',
        items: [
          { label: 'Billing', path: '/patient/billing', icon: '💳' },
          { label: 'Notifications', path: '/patient/notifications', icon: '🔔' }
        ]
      }
    ];
  }

  private configureQuickActions(role: string): void {
    if (role === 'ADMIN') {
      this.quickActions = [
        { label: 'Analytics', path: '/admin/analytics', icon: '📈' },
        { label: 'Billing', path: '/admin/billing', icon: '💳' },
        { label: 'Alerts', path: '/admin/notifications', icon: '🔔' }
      ];
      return;
    }

    if (role === 'DOCTOR') {
      this.quickActions = [
        { label: 'Today', path: '/doctor/appointments', icon: '📅' },
        { label: 'Lab', path: '/doctor/lab', icon: '🧪' },
        { label: 'Records', path: '/doctor/records', icon: '📋' }
      ];
      return;
    }

    this.quickActions = [
      { label: 'Book', path: '/patient/appointments', icon: '📅' },
      { label: 'Lab', path: '/patient/lab', icon: '🧪' },
      { label: 'Billing', path: '/patient/billing', icon: '💳' }
    ];
  }

  private loadProfileIdentity(role: string, currentUrl: string): void {
    if (role !== 'PATIENT') {
      this.profileName = this.authService.getUsername() ?? 'User';
      this.profileInitials = this.getInitials(this.profileName);
      this.patientProfileLoaded = false;
      this.disablePatientProfileLookup = false;
      return;
    }

    if (!currentUrl.startsWith('/patient/profile')) {
      return;
    }

    if (this.disablePatientProfileLookup || this.patientProfileLoaded) {
      return;
    }

    const userId = this.authService.getUserId();
    if (!userId || userId < 1) return;

    this.patientProfileService.getById(userId).subscribe({
      next: profile => {
        const fullName = profile.fullName || `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim();
        if (fullName) {
          this.profileName = fullName;
          this.profileInitials = this.getInitials(fullName);
        }
        this.patientProfileLoaded = true;
      },
      error: () => {
        this.disablePatientProfileLookup = true;
        this.patientProfileLoaded = true;
      }
    });
  }

  private connectBadgeStream(): void {
    if (this.disableNotificationBadge) return;
    if (this.badgeSocketConnected) return;

    this.badgeSocket.connect(
      (incoming) => this.onRealtimeNotification(incoming),
      () => (this.badgeSocketConnected = false)
    );

    this.badgeSocketConnected = true;
  }

  private onRealtimeNotification(incoming: NotificationItem): void {
    if (!incoming) return;
    if (incoming.read) return;
    this.applyNotificationBadge(this.unreadCount + 1);
    this.showNotificationToast(incoming.title || 'New notification received');
  }

  private showNotificationToast(message: string, kind: UiToastKind = 'info'): void {
    this.notificationToast = message;
    this.toastKind = kind;
    if (this.toastHandle !== null) {
      window.clearTimeout(this.toastHandle);
    }
    this.toastHandle = window.setTimeout(() => {
      this.notificationToast = '';
      this.toastKind = 'info';
      this.toastHandle = null;
    }, 2600);
  }

  private refreshNotificationBadge(): void {
    if (this.disableNotificationBadge) return;

    const userId = this.authService.getUserId();
    if (!userId || userId < 1) return;

    this.notificationsApi.getMyNotifications(userId).subscribe({
      next: items => {
        const unread = items.filter(item => !item.read).length;
        this.applyNotificationBadge(unread);
      },
      error: (err) => {
        if (err?.status === 401 || err?.status === 403) {
          this.disableNotificationBadge = true;
          this.badgeSocket.disconnect();
          this.badgeSocketConnected = false;
          if (this.unreadRefreshHandle !== null) {
            window.clearInterval(this.unreadRefreshHandle);
            this.unreadRefreshHandle = null;
          }
        }
        this.applyNotificationBadge(0);
      }
    });
  }

  private ensureUnreadRefreshLoop(): void {
    if (this.unreadRefreshHandle !== null) return;
    this.unreadRefreshHandle = window.setInterval(() => {
      if (this.showShell) {
        this.refreshNotificationBadge();
      }
    }, 20000);
  }

  private applyNotificationBadge(unreadCount: number): void {
    this.unreadCount = unreadCount;

    this.navGroups = this.navGroups.map(group => ({
      ...group,
      items: group.items.map(item =>
        item.label === 'Notifications'
          ? { ...item, badge: unreadCount > 0 ? unreadCount : undefined }
          : item
      )
    }));

    this.favoriteItems = this.favoriteItems.map(item =>
      item.label === 'Notifications'
        ? { ...item, badge: unreadCount > 0 ? unreadCount : undefined }
        : item
    );
  }

  private rebuildFavorites(): void {
    const favoritePaths = this.getFavoritePaths();
    const allItems = this.navGroups.flatMap(group => group.items);
    this.favoriteItems = favoritePaths
      .map(path => allItems.find(item => item.path === path))
      .filter((item): item is NavItem => Boolean(item));
  }

  private getFavoritePaths(): string[] {
    const key = this.getFavoritesStorageKey();
    const raw = localStorage.getItem(key);
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((x): x is string => typeof x === 'string');
    } catch {
      return [];
    }
  }

  private getFavoritesStorageKey(): string {
    const role = (this.authService.getRole() ?? 'USER').toUpperCase();
    return `hms_sidebar_favorites_${role}`;
  }

  private resolveBreadcrumb(url: string): string {
    const clean = url.split('?')[0];
    for (const group of this.navGroups) {
      const match = group.items.find(item => clean.startsWith(item.path));
      if (match) {
        const rolePrefix = this.roleLabel ? this.roleLabel.toUpperCase() : 'HOME';
        return `${rolePrefix} / ${group.title} / ${match.label}`;
      }
    }
    return 'HOME';
  }

  private getInitials(value: string): string {
    const parts = value.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
}
