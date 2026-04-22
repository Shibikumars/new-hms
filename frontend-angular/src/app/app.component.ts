import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { AuthService } from './core/auth.service';
import { NotificationsBadgeSocketService } from './core/notifications-badge-socket.service';
import { ToastService, Toast } from './core/toast.service';
import { NotificationItem, NotificationsApiService } from './features/notifications/notifications-api.service';
import { NotificationsSocketService } from './features/notifications/notifications-socket.service';
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

    <!-- Global Toast Container -->
    <div class="toast-container" aria-live="polite">
      <div *ngFor="let toast of toasts$ | async" class="toast" [class]="toast.type" (click)="removeToast(toast.id)">
        <div class="toast-body">
          <div class="toast-header">
            <strong>{{ toast.title }}</strong>
            <span class="toast-close">×</span>
          </div>
          <div class="toast-msg">{{ toast.message }}</div>
        </div>
      </div>
    </div>

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
                  (click)="onNavItemClick()"
                >
                  <span class="menu-icon">{{ item.icon }}</span>
                  <span class="menu-label">{{ item.label }}</span>
                  <span class="menu-badge" *ngIf="item.badge && item.badge > 0">{{ item.badge }}</span>
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
                  (click)="onNavItemClick()"
                >
                  <span class="menu-icon">{{ item.icon }}</span>
                  <span class="menu-label">{{ item.label }}</span>
                  <span class="menu-badge" *ngIf="item.badge && item.badge > 0">{{ item.badge }}</span>
                </a>
              </div>
            </section>
          </nav>
        </aside>

        <div class="workspace" (click)="closeProfileMenu()">
          <header class="topbar">
            <div class="topbar-left">
              <button type="button" class="menu-toggle" (click)="toggleSidebar($event)">☰</button>
              <div class="breadcrumb">{{ breadcrumbText }}</div>
            </div>

            <div class="quick-actions" *ngIf="quickActions.length > 0">
              <a *ngFor="let action of quickActions" [routerLink]="action.path" class="quick-btn">
                <span>{{ action.icon }}</span>
                <span>{{ action.label }}</span>
              </a>
            </div>

            <div class="profile-wrap">
              <button type="button" class="profile-btn" (click)="toggleProfileMenu($event)">
                <span class="avatar">{{ profileInitials }}</span>
                <span class="profile-meta">
                  <strong>{{ profileName }}</strong>
                  <small>{{ roleLabel }}</small>
                </span>
              </button>

              <div class="profile-menu" *ngIf="profileMenuOpen">
                <a [routerLink]="profileRoute" (click)="closeProfileMenu()">View Dashboard</a>
                <button type="button" (click)="logout()">Logout</button>
              </div>
            </div>
          </header>

          <main id="main-content" tabindex="-1">
            <router-outlet />
          </main>
        </div>
      </div>
    </ng-container>

    <ng-template #authLayout>
      <main id="main-content" tabindex="-1">
        <router-outlet />
      </main>
    </ng-template>
  `,
  styles: [`
    .toast-container { position: fixed; bottom: 2rem; right: 2rem; z-index: 2000; display: grid; gap: 0.75rem; pointer-events: none; }
    .toast { 
      min-width: 300px; max-width: 400px; background: rgba(12, 19, 34, 0.95); backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 1rem; color: #fff;
      box-shadow: 0 10px 40px rgba(0,0,0,0.5); pointer-events: auto; cursor: pointer; transition: all 0.3s;
    }
    .toast:hover { transform: translateY(-2px); }
    .toast.success { border-left: 4px solid var(--primary); }
    .toast.info { border-left: 4px solid #6d7cff; }
    .toast.warning { border-left: 4px solid #f6b23f; }
    .toast.error { border-left: 4px solid #ff5a72; }
    .toast-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem; }
    .toast-header strong { font-size: 0.9rem; letter-spacing: 0.02em; }
    .toast-close { font-size: 1.2rem; opacity: 0.6; }
    .toast-msg { font-size: 0.85rem; color: var(--text-soft); line-height: 1.4; }

    .skip-link { position: absolute; left: 0.75rem; top: -40px; z-index: 2000; background: #0b1322; color: #fff; border: 1px solid var(--primary); border-radius: 8px; padding: 0.45rem 0.75rem; text-decoration: none; font-weight: 600; }
    .skip-link:focus { top: 0.75rem; }

    .shell { display: grid; grid-template-columns: 260px 1fr; min-height: 100vh; gap: 0; }
    .sidebar { border-right: 1px solid var(--border); background: linear-gradient(180deg, rgba(12,19,34,0.96), rgba(7,12,23,0.98)); padding: 1rem 0.85rem; position: sticky; top: 0; height: 100vh; overflow-y: auto; }
    .brand { display: grid; gap: 0.35rem; margin-bottom: 1rem; padding-bottom: 0.85rem; border-bottom: 1px solid var(--border); }
    .brand-mark { font-family: 'Syne', sans-serif; letter-spacing: 0.06em; color: var(--primary); font-weight: 800; font-size: 1.15rem; }
    .brand-sub { color: var(--text-muted); font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.04em; }

    .menu { display: grid; gap: 0.7rem; }
    .menu-group { border: 1px solid var(--border); border-radius: 10px; background: rgba(11, 18, 32, 0.38); overflow: hidden; }
    .menu-group.group-active { border-color: rgba(0, 212, 170, 0.45); }
    .group-toggle { width: 100%; display: flex; justify-content: space-between; align-items: center; border: none; border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(15, 24, 39, 0.8); color: var(--text-soft); text-transform: uppercase; letter-spacing: 0.04em; font-size: 0.72rem; font-weight: 700; padding: 0.45rem 0.55rem; }

    .group-items { display: grid; gap: 0.2rem; padding: 0.35rem; max-height: 800px; overflow: hidden; transition: all 0.2s; }
    .group-items.collapsed { max-height: 0; padding-top: 0; padding-bottom: 0; }

    .menu-item { display: flex; align-items: center; gap: 0.6rem; border: 1px solid transparent; border-radius: 8px; padding: 0.45rem 0.5rem; color: var(--text-soft); text-decoration: none; font-size: 0.9rem; background: rgba(11, 18, 32, 0.45); transition: all 0.2s; }
    .menu-item.active, .menu-item:hover { border-color: rgba(0, 212, 170, 0.55); color: var(--primary); background: rgba(0, 212, 170, 0.1); }
    .menu-icon { width: 1.2rem; text-align: center; }
    .menu-label { flex: 1; }
    .menu-badge { min-width: 18px; height: 18px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.66rem; font-weight: 700; color: #001f17; background: var(--primary); padding: 0 0.28rem; }

    .workspace { min-width: 0; }
    .topbar { position: sticky; top: 0; z-index: 100; display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 1.5rem; padding: 0.7rem 1.5rem; border-bottom: 1px solid var(--border); background: rgba(7, 12, 23, 0.84); backdrop-filter: blur(8px); }
    .topbar-left { display: flex; align-items: center; gap: 1rem; }
    .breadcrumb { color: var(--text-soft); font-size: 0.84rem; font-weight: 600; text-transform: capitalize; }
    .quick-actions { display: flex; gap: 0.6rem; }
    .quick-btn { border: 1px solid var(--border); border-radius: 999px; background: rgba(11,18,32,0.58); color: var(--text-soft); text-decoration: none; padding: 0.35rem 0.8rem; font-size: 0.76rem; display: flex; align-items: center; gap: 0.4rem; text-transform: uppercase; font-weight: 700; transition: all 0.2s; }
    .quick-btn:hover { color: var(--primary); border-color: var(--primary); }

    .menu-toggle { border: 1px solid var(--border); background: rgba(11, 18, 32, 0.68); color: var(--text); border-radius: 8px; width: 36px; height: 36px; display: none; }

    .profile-wrap { position: relative; }
    .profile-btn { border: 1px solid var(--border); border-radius: 999px; background: rgba(11, 18, 32, 0.65); color: var(--text); display: flex; align-items: center; gap: 0.6rem; padding: 0.34rem 0.62rem; transition: all 0.2s; }
    .profile-btn:hover { border-color: var(--primary); }
    .avatar { width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.8rem; background: rgba(0, 212, 170, 0.2); color: var(--primary); border: 1px solid rgba(0, 212, 170, 0.5); }
    .profile-meta { display: grid; text-align: left; }
    .profile-meta strong { font-size: 0.85rem; color: var(--text); }
    .profile-meta small { color: var(--text-muted); font-size: 0.72rem; }

    .profile-menu { position: absolute; right: 0; top: calc(100% + 0.5rem); min-width: 180px; border: 1px solid var(--border); background: rgba(12, 19, 34, 0.98); border-radius: 12px; padding: 0.5rem; display: grid; gap: 0.25rem; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    .profile-menu a, .profile-menu button { border: none; background: transparent; color: var(--text-soft); border-radius: 8px; padding: 0.6rem; text-align: left; text-decoration: none; font-size: 0.85rem; transition: all 0.2s; }
    .profile-menu a:hover, .profile-menu button:hover { background: rgba(255,255,255,0.05); color: var(--primary); }

    @media (max-width: 980px) {
      .shell { grid-template-columns: 1fr; }
      .sidebar { position: fixed; left: 0; top: 0; bottom: 0; width: 260px; transform: translateX(-100%); z-index: 1200; }
      .shell.sidebar-open .sidebar { transform: translateX(0); }
      .menu-toggle { display: block; }
      .profile-meta { display: none; }
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
  
  toasts$ = this.toastService.toasts$;

  private groupCollapseState: Record<string, boolean> = {};
  private readonly sub = new Subscription();
  private notificationSub: any = null;

  private readonly unreadSyncHandler = (event: Event) => {
    const custom = event as CustomEvent<number>;
    this.refreshNotificationBadgeCount(custom.detail);
  };

  constructor(
    private router: Router,
    private authService: AuthService,
    private toastService: ToastService,
    private notificationSocket: NotificationsSocketService,
    private notificationsApi: NotificationsApiService
  ) {}

  ngOnInit(): void {
    window.addEventListener('hms-unread-count', this.unreadSyncHandler as EventListener);
    
    this.sub.add(
      this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
        this.refreshShellState();
      })
    );

    this.refreshShellState();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    if (this.notificationSub) this.notificationSub.unsubscribe();
    window.removeEventListener('hms-unread-count', this.unreadSyncHandler as EventListener);
    this.notificationSocket.disconnect();
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

  removeToast(id: string): void {
    this.toastService.remove(id);
  }

  logout(): void {
    this.authService.logout();
    this.notificationSocket.disconnect();
    this.profileMenuOpen = false;
    this.router.navigate(['/auth/login']);
  }

  private refreshShellState(): void {
    const url = this.router.url || '';
    const isAuthRoute = url.startsWith('/auth');

    this.showShell = this.authService.isAuthenticated() && !isAuthRoute;
    if (!this.showShell) {
      this.notificationSocket.disconnect();
      return;
    }

    const role = (this.authService.getRole() ?? '').toUpperCase();
    this.roleLabel = role || 'User';
    this.profileName = this.authService.getUserName() ?? 'User';
    this.profileInitials = (this.profileName || 'U').charAt(0).toUpperCase();

    this.configureNavigation(role);
    this.breadcrumbText = url.split('/').pop() || 'Home';
    
    // Connect to real-time notifications if not already connected
    const userId = this.authService.getUserId();
    if (userId) {
      this.notificationSocket.connect(userId, (item) => {
        this.toastService.show({
          title: item.title,
          message: item.message,
          type: item.type?.toLowerCase() === 'critical' || item.type?.toLowerCase() === 'alert' ? 'error' : 'info'
        });
        this.fetchUnreadCount(userId);
      });
      this.fetchUnreadCount(userId);
    }
  }

  private fetchUnreadCount(userId: number): void {
    this.notificationsApi.getMyNotifications(userId, {}).subscribe(items => {
      const count = items.filter(i => !i.read).length;
      this.refreshNotificationBadgeCount(count);
    });
  }

  private refreshNotificationBadgeCount(count: number): void {
    this.navGroups.forEach(group => {
      group.items.forEach(item => {
        if (item.path.includes('notifications')) {
          item.badge = count;
        }
      });
    });
  }

  private configureNavigation(role: string): void {
    if (role === 'ADMIN') {
      this.profileRoute = '/admin/dashboard';
      this.navGroups = [
        { title: 'Command Center', items: [
          { label: 'Dashboard', path: '/admin/dashboard', icon: '📊' },
          { label: 'Analytics', path: '/admin/analytics', icon: '📈' }
        ]},
        { title: 'Operations', items: [
          { label: 'Billing', path: '/admin/billing', icon: '💳' },
          { label: 'Appointments', path: '/appointments', icon: '📅' }
        ]},
        { title: 'System', items: [
          { label: 'Notifications', path: '/admin/notifications', icon: '🔔' }
        ]}
      ];
      this.quickActions = [{ label: 'Analytics', path: '/admin/analytics', icon: '📈' }];
    } else if (role === 'DOCTOR') {
      this.profileRoute = '/doctor/dashboard';
      this.navGroups = [
        { title: 'Clinical Workspace', items: [
          { label: 'Dashboard', path: '/doctor/dashboard', icon: '🩺' },
          { label: 'Appointments', path: '/doctor/appointments', icon: '📅' },
          { label: 'Medical Records', path: '/doctor/records', icon: '📋' }
        ]},
        { title: 'Diagnostics', items: [
          { label: 'Lab Results', path: '/doctor/lab', icon: '🧪' },
          { label: 'Pharmacy', path: '/doctor/pharmacy', icon: '💊' }
        ]},
        { title: 'Messages', items: [
          { label: 'Notifications', path: '/doctor/notifications', icon: '🔔' }
        ]}
      ];
      this.quickActions = [
        { label: 'Lab', path: '/doctor/lab', icon: '🧪' },
        { label: 'Records', path: '/doctor/records', icon: '📋' }
      ];
    } else {
      this.profileRoute = '/patient/portal';
      this.navGroups = [
        { title: 'Patient Portal', items: [
          { label: 'Dashboard', path: '/patient/portal', icon: '🏥' },
          { label: 'Profile', path: '/patient/profile', icon: '👤' }
        ]},
        { title: 'Medical', items: [
          { label: 'Appointments', path: '/patient/appointments', icon: '📅' },
          { label: 'Records', path: '/patient/records', icon: '📋' },
          { label: 'Labs', path: '/patient/lab', icon: '🧪' },
          { label: 'Meds', path: '/patient/pharmacy', icon: '💊' }
        ]},
        { title: 'Finances', items: [
          { label: 'Billing', path: '/patient/billing', icon: '💳' },
          { label: 'Alerts', path: '/patient/notifications', icon: '🔔' }
        ]}
      ];
      this.quickActions = [
        { label: 'Book', path: '/patient/appointments', icon: '📅' },
        { label: 'Meds', path: '/patient/pharmacy', icon: '💊' }
      ];
    }
  }

  private getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }
}
