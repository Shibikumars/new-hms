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

import { CommandPaletteComponent } from './shared/components/command-palette/command-palette.component';
import { IdleService } from './core/idle.service';

type NavItem = { label: string; path: string; icon: string; badge?: number };
type NavGroup = { title: string; items: NavItem[] };
type QuickAction = { label: string; path: string; icon: string };

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, CommandPaletteComponent],
  template: `
    <a class="skip-link" href="#main-content">Skip to main content</a>

    <!-- Global Command Palette -->
    <app-command-palette></app-command-palette>

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

    <!-- Idle Timeout Modal -->
    <div class="modal-backdrop" *ngIf="isIdle">
      <div class="idle-modal">
        <div class="idle-icon">
          <i class="ph ph-shield-warning"></i>
        </div>
        <h3>Session Security Alert</h3>
        <p>This clinical terminal has been idle for 15 minutes. To protect patient data, your session will automatically terminate in:</p>
        
        <div class="countdown-clock">
          <span class="seconds">{{ idleCountdown }}</span>
          <label>Seconds Remaining</label>
        </div>

        <div class="idle-actions">
          <button class="ph-btn primary" (click)="stayLoggedIn()">
            <i class="ph ph-key-return"></i> Extend Session
          </button>
          <button class="ph-btn secondary" (click)="logout()">
            <i class="ph ph-sign-out"></i> Logout Now
          </button>
        </div>
      </div>
    </div>

    <ng-container *ngIf="showShell; else authLayout">
      <div class="shell" [class.sidebar-collapsed]="sidebarCollapsed" [class.sidebar-open]="sidebarOpenMobile">
        <aside class="sidebar">
          <div class="brand">
            <div class="brand-mark">
              <i class="ph ph-heartbeat"></i> HMS
            </div>
            <div class="brand-sub">Healthcare OS</div>
          </div>

          <nav class="menu">
            <section class="menu-group" *ngFor="let group of navGroups">
              <button type="button" class="group-toggle" (click)="toggleGroup(group.title)">
                <span>{{ group.title }}</span>
                <i class="ph" [class.ph-caret-right]="isGroupCollapsed(group.title)" [class.ph-caret-down]="!isGroupCollapsed(group.title)"></i>
              </button>

              <div class="group-items" [class.collapsed]="isGroupCollapsed(group.title)">
                <a *ngFor="let item of group.items"
                   [routerLink]="item.path"
                   routerLinkActive="active"
                   class="menu-item"
                   (click)="onNavItemClick()">
                  <i class="ph" [class]="'ph-' + item.icon"></i>
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
              <button type="button" class="menu-toggle" (click)="toggleSidebar($event)">
                <i class="ph ph-list"></i>
              </button>
              <div class="breadcrumb">{{ breadcrumbText }}</div>
            </div>

            <div class="quick-actions">
              <a *ngFor="let action of quickActions" [routerLink]="action.path" class="quick-btn">
                <i class="ph" [class]="'ph-' + action.icon"></i>
                <span>{{ action.label }}</span>
              </a>
            </div>

            <div class="profile-wrap">
              <button type="button" class="profile-btn" (click)="toggleProfileMenu($event)">
                <span class="avatar">{{ profileInitials }}</span>
                <div class="profile-meta">
                  <strong>{{ profileName }}</strong>
                  <small>{{ roleLabel }}</small>
                </div>
              </button>

              <div class="profile-menu" *ngIf="profileMenuOpen">
                <a [routerLink]="profileRoute" (click)="closeProfileMenu()">
                  <i class="ph ph-layout"></i> Dashboard
                </a>
                <button (click)="logout()">
                  <i class="ph ph-sign-out"></i> Logout
                </button>
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
    .sidebar { background: #0F172A; padding: 1rem 0.85rem; position: sticky; top: 0; height: 100vh; overflow-y: auto; border-right: 1px solid rgba(255,255,255,0.05); }
    .brand { display: grid; gap: 0.35rem; margin-bottom: 1rem; padding-bottom: 0.85rem; border-bottom: 1px solid var(--border); }
    .brand-mark { font-family: 'Syne', sans-serif; letter-spacing: 0.06em; color: var(--primary); font-weight: 800; font-size: 1.15rem; }
    .brand-sub { color: var(--text-muted); font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.04em; }

    .menu { display: grid; gap: 0.75rem; }
    .menu-group { border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; background: rgba(255, 255, 255, 0.03); overflow: hidden; }
    .menu-group.group-active { border-color: var(--primary); }
    .group-toggle { width: 100%; display: flex; justify-content: space-between; align-items: center; border: none; border-bottom: 1px solid rgba(255,255,255,0.05); background: rgba(255, 255, 255, 0.02); color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; font-size: 0.7rem; font-weight: 800; padding: 0.6rem 0.75rem; }

    .group-items { display: grid; gap: 0.2rem; padding: 0.35rem; max-height: 800px; overflow: hidden; transition: all 0.2s; }
    .group-items.collapsed { max-height: 0; padding-top: 0; padding-bottom: 0; }

    .menu-item { display: flex; align-items: center; gap: 0.75rem; border-radius: 8px; padding: 0.6rem 0.75rem; color: #94a3b8; text-decoration: none; font-size: 0.9rem; transition: all 0.2s; font-weight: 500; }
    .menu-item.active, .menu-item:hover { color: #fff; background: rgba(255, 255, 255, 0.08); }
    .menu-icon { width: 1.2rem; text-align: center; }
    .menu-label { flex: 1; }
    .menu-badge { min-width: 18px; height: 18px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.62rem; font-weight: 800; color: #fff; background: var(--error); padding: 0 0.28rem; }

    .workspace { min-width: 0; }
    .topbar { position: sticky; top: 0; z-index: 100; display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 1.5rem; padding: 0.75rem 1.5rem; border-bottom: 1px solid var(--border); background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(12px); }
    .topbar-left { display: flex; align-items: center; gap: 1rem; }
    .breadcrumb { color: var(--text); font-size: 0.85rem; font-weight: 700; text-transform: capitalize; }
    .quick-actions { display: flex; gap: 0.5rem; }
    .quick-btn { border: 1px solid var(--border); border-radius: 999px; background: #fff; color: var(--text-soft); text-decoration: none; padding: 0.4rem 1rem; font-size: 0.7rem; display: flex; align-items: center; gap: 0.4rem; text-transform: uppercase; font-weight: 800; transition: all 0.2s; box-shadow: var(--shadow-soft); }
    .quick-btn:hover { color: var(--primary); border-color: var(--primary); transform: translateY(-1px); }

    .menu-toggle { border: 1px solid var(--border); background: rgba(11, 18, 32, 0.68); color: var(--text); border-radius: 8px; width: 36px; height: 36px; display: none; }

    .profile-wrap { position: relative; }
    .profile-btn { border: 1px solid var(--border); border-radius: 999px; background: #fff; color: var(--text); display: flex; align-items: center; gap: 0.75rem; padding: 0.4rem 0.75rem; transition: all 0.2s; box-shadow: var(--shadow-soft); }
    .profile-btn:hover { border-color: var(--primary); }
    .avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.8rem; background: var(--surface-strong); color: var(--primary); border: 1px solid var(--border); }
    .profile-meta { display: grid; text-align: left; }
    .profile-meta strong { font-size: 0.85rem; color: var(--text); font-weight: 700; }
    .profile-meta small { color: var(--text-muted); font-size: 0.7rem; font-weight: 600; }

    .profile-menu { position: absolute; right: 0; top: calc(100% + 0.5rem); min-width: 200px; border: 1px solid var(--border); background: #fff; border-radius: 12px; padding: 0.5rem; display: grid; gap: 0.25rem; box-shadow: var(--shadow-strong); }
    .profile-menu a, .profile-menu button { border: none; background: transparent; color: var(--text-soft); border-radius: 8px; padding: 0.75rem; text-align: left; text-decoration: none; font-size: 0.85rem; transition: all 0.2s; font-weight: 600; }
    .profile-menu a:hover, .profile-menu button:hover { background: var(--surface-soft); color: var(--primary); }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(12, 19, 34, 0.85); backdrop-filter: blur(8px); z-index: 3000; display: flex; align-items: center; justify-content: center; padding: 2rem; }
    .idle-modal { background: #fff; border-radius: 20px; border: 1px solid var(--border); padding: 3rem 2rem; max-width: 460px; width: 100%; text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
    .idle-icon { font-size: 4rem; color: var(--warning); margin-bottom: 1.5rem; }
    .idle-modal h3 { font-size: 1.5rem; color: var(--text); font-weight: 800; margin-bottom: 1rem; }
    .idle-modal p { color: var(--text-soft); font-size: 0.95rem; line-height: 1.6; margin-bottom: 2rem; font-weight: 600; }
    
    .countdown-clock { background: var(--surface-soft); border: 2px solid var(--border); border-radius: 16px; padding: 1.5rem; margin-bottom: 2.5rem; display: flex; flex-direction: column; align-items: center; }
    .countdown-clock .seconds { font-size: 3.5rem; font-family: 'Syne', sans-serif; font-weight: 800; color: var(--primary); line-height: 1; }
    .countdown-clock label { color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; font-weight: 800; letter-spacing: 0.05em; margin-top: 0.5rem; }

    .idle-actions { display: grid; gap: 1rem; }
    .ph-btn { display: flex; align-items: center; justify-content: center; gap: 0.75rem; padding: 0.85rem 1.5rem; border-radius: 99px; font-weight: 800; font-size: 0.9rem; transition: 0.2s; border: 1px solid var(--border); cursor: pointer; }
    .ph-btn.primary { background: var(--primary); color: #fff; border-color: var(--primary); }
    .ph-btn.secondary { background: #fff; color: var(--text-soft); }

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
  profileName = '';
  profileInitials = '';
  roleLabel = '';
  breadcrumbText = '';
  profileRoute = '';
  navGroups: NavGroup[] = [];
  quickActions: QuickAction[] = [];
  groupCollapseState: Record<string, boolean> = {};

  isIdle = false;
  idleCountdown = 0;

  private sub = new Subscription();
  private notificationSub?: Subscription;
  public toasts$ = this.toastService.toasts$;

  private readonly unreadSyncHandler = (event: Event) => {
    const custom = event as CustomEvent<number>;
    this.refreshNotificationBadgeCount(custom.detail);
  };

  constructor(
    private router: Router,
    private authService: AuthService,
    private toastService: ToastService,
    private notificationSocket: NotificationsSocketService,
    private notificationsApi: NotificationsApiService,
    private idleService: IdleService
  ) { }

  ngOnInit(): void {
    window.addEventListener('hms-unread-count', this.unreadSyncHandler as EventListener);

    this.sub.add(
      this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
        this.refreshShellState();
      })
    );

    this.sub.add(
      this.idleService.idleState$.subscribe(isIdle => {
        this.isIdle = isIdle;
      })
    );

    this.sub.add(
      this.idleService.countdownState$.subscribe(count => {
        this.idleCountdown = count;
      })
    );

    this.refreshShellState();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    if (this.notificationSub) this.notificationSub.unsubscribe();
    window.removeEventListener('hms-unread-count', this.unreadSyncHandler as EventListener);
    this.notificationSocket.disconnect();
    this.idleService.stopTracking();
  }

  stayLoggedIn() {
    this.isIdle = false;
    this.idleService.reset();
  }

  // ... (rest of the methods remain similar but with icon mapping)

  private refreshShellState(): void {
    const url = this.router.url || '';
    const isAuthRoute = url.startsWith('/auth');

    this.showShell = this.authService.isAuthenticated() && !isAuthRoute;
    if (!this.showShell) {
      this.notificationSocket.disconnect();
      this.idleService.stopTracking();
      return;
    }

    this.idleService.startTracking();

    const role = (this.authService.getRole() ?? '').toUpperCase();
    this.roleLabel = role || 'User';
    this.profileName = this.authService.getUsername() ?? 'User';
    this.profileInitials = (this.profileName || 'U').charAt(0).toUpperCase();

    this.configureNavigation(role);
    this.breadcrumbText = url.split('/').pop() || 'Home';

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

  private configureNavigation(role: string): void {
    if (role === 'ADMIN') {
      this.profileRoute = '/admin/dashboard';
      this.navGroups = [
        {
          title: 'Command Center', items: [
            { label: 'Dashboard', path: '/admin/dashboard', icon: 'chart-bar' },
            { label: 'Analytics', path: '/admin/analytics', icon: 'presentation-chart' }
          ]
        },
        {
          title: 'Operations', items: [
            { label: 'Billing', path: '/admin/billing', icon: 'credit-card' },
            { label: 'Appointments', path: '/appointments', icon: 'calendar' }
          ]
        },
        {
          title: 'System', items: [
            { label: 'Notifications', path: '/admin/notifications', icon: 'bell' }
          ]
        }
      ];
      this.quickActions = [{ label: 'Analytics', path: '/admin/analytics', icon: 'presentation-chart' }];
    } else if (role === 'DOCTOR') {
      this.profileRoute = '/doctor/dashboard';
      this.navGroups = [
        {
          title: 'Clinical Workspace', items: [
            { label: 'Dashboard', path: '/doctor/dashboard', icon: 'stethoscope' },
            { label: 'Appointments', path: '/doctor/appointments', icon: 'calendar' },
            { label: 'Medical Records', path: '/doctor/records', icon: 'clipboard-text' }
          ]
        },
        {
          title: 'Diagnostics', items: [
            { label: 'Lab Results', path: '/doctor/lab', icon: 'test-tube' },
            { label: 'Pharmacy', path: '/doctor/pharmacy', icon: 'pill' }
          ]
        },
        {
          title: 'Messages', items: [
            { label: 'Notifications', path: '/doctor/notifications', icon: 'bell' }
          ]
        }
      ];
      this.quickActions = [
        { label: 'Lab', path: '/doctor/lab', icon: 'test-tube' },
        { label: 'Records', path: '/doctor/records', icon: 'clipboard-text' }
      ];
    } else {
      this.profileRoute = '/patient/portal';
      this.navGroups = [
        {
          title: 'Patient Portal', items: [
            { label: 'Dashboard', path: '/patient/portal', icon: 'hospital' },
            { label: 'Profile', path: '/patient/profile', icon: 'user' }
          ]
        },
        {
          title: 'Medical', items: [
            { label: 'Appointments', path: '/patient/appointments', icon: 'calendar' },
            { label: 'Records', path: '/patient/records', icon: 'clipboard-text' },
            { label: 'Labs', path: '/patient/lab', icon: 'test-tube' },
            { label: 'Meds', path: '/patient/pharmacy', icon: 'pill' }
          ]
        },
        {
          title: 'Finances', items: [
            { label: 'Billing', path: '/patient/billing', icon: 'credit-card' },
            { label: 'Alerts', path: '/patient/notifications', icon: 'bell' }
          ]
        }
      ];
      this.quickActions = [
        { label: 'Book', path: '/patient/appointments', icon: 'calendar' },
        { label: 'Meds', path: '/patient/pharmacy', icon: 'pill' }
      ];
    }
  }

  // Helper methods remained same (toggleSidebar, toggleGroup etc.)
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
    this.idleService.stopTracking();
    this.profileMenuOpen = false;
    this.router.navigate(['/auth/login']);
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
}

