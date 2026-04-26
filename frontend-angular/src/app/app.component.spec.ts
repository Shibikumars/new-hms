import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent, RouterTestingModule, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with shell hidden', () => {
    expect(component.showShell).toBeFalse();
  });

  it('should initialize with profile menu closed', () => {
    expect(component.profileMenuOpen).toBeFalse();
  });

  it('should toggle profile menu', () => {
    component.toggleProfileMenu();
    expect(component.profileMenuOpen).toBeTrue();
    component.toggleProfileMenu();
    expect(component.profileMenuOpen).toBeFalse();
  });

  it('should close profile menu', () => {
    component.profileMenuOpen = true;
    component.closeProfileMenu();
    expect(component.profileMenuOpen).toBeFalse();
  });

  it('should toggle sidebar collapsed state', () => {
    spyOnProperty(window, 'innerWidth').and.returnValue(1200);
    component.sidebarCollapsed = false;
    component.toggleSidebar();
    expect(component.sidebarCollapsed).toBeTrue();
  });

  it('should toggle group collapse state', () => {
    component.toggleGroup('Test Group');
    expect(component.isGroupCollapsed('Test Group')).toBeTrue();
    component.toggleGroup('Test Group');
    expect(component.isGroupCollapsed('Test Group')).toBeFalse();
  });

  it('should return false for collapsed group by default', () => {
    expect(component.isGroupCollapsed('Nonexistent Group')).toBeFalse();
  });

  it('should remove toast', () => {
    spyOn(component['toastService'], 'remove');
    component.removeToast('test-id');
    expect(component['toastService'].remove).toHaveBeenCalledWith('test-id');
  });

  it('should logout and navigate to login', () => {
    spyOn(component['authService'], 'logout');
    spyOn(component['router'], 'navigate');
    component.logout();
    expect(component['authService'].logout).toHaveBeenCalled();
    expect(component['router'].navigate).toHaveBeenCalledWith(['/auth/login']);
  });

  it('should stay logged in on stayLoggedIn', () => {
    component.isIdle = true;
    spyOn(component['idleService'], 'reset');
    component.stayLoggedIn();
    expect(component.isIdle).toBeFalse();
    expect(component['idleService'].reset).toHaveBeenCalled();
  });

  it('should configure navigation for ADMIN role', () => {
    component['configureNavigation']('ADMIN');
    expect(component.profileRoute).toBe('/admin/dashboard');
    expect(component.navGroups.length).toBe(3);
    expect(component.navGroups[0].title).toBe('Command Center');
    expect(component.quickActions.length).toBe(1);
    expect(component.quickActions[0].label).toBe('Analytics');
  });

  it('should configure navigation for DOCTOR role', () => {
    component['configureNavigation']('DOCTOR');
    expect(component.profileRoute).toBe('/doctor/dashboard');
    expect(component.navGroups.length).toBe(3);
    expect(component.navGroups[0].title).toBe('Clinical Workspace');
    expect(component.quickActions.length).toBe(2);
  });

  it('should configure navigation for PATIENT role', () => {
    component['configureNavigation']('PATIENT');
    expect(component.profileRoute).toBe('/patient/portal');
    expect(component.navGroups.length).toBe(3);
    expect(component.navGroups[0].title).toBe('Patient Portal');
    expect(component.quickActions.length).toBe(2);
  });

  it('should configure navigation for unknown role (defaults to PATIENT)', () => {
    component['configureNavigation']('UNKNOWN');
    expect(component.profileRoute).toBe('/patient/portal');
    expect(component.navGroups.length).toBeGreaterThan(0);
  });

  it('should refresh notification badge count', () => {
    component.navGroups = [
      {
        title: 'Messages',
        items: [{ label: 'Notifications', path: '/notifications', icon: 'bell', badge: 0 }]
      }
    ];
    component['refreshNotificationBadgeCount'](5);
    expect(component.navGroups[0].items[0].badge).toBe(5);
  });

  it('should unsubscribe on destroy', () => {
    const subSpy = spyOn(component['sub'], 'unsubscribe');
    component.ngOnDestroy();
    expect(subSpy).toHaveBeenCalled();
  });

  it('should render router outlet', () => {
    const routerOutlet = fixture.nativeElement.querySelector('router-outlet');
    expect(routerOutlet).toBeTruthy();
  });

  it('should render command palette', () => {
    const commandPalette = fixture.nativeElement.querySelector('app-command-palette');
    expect(commandPalette).toBeTruthy();
  });

  it('should render toast container', () => {
    const toastContainer = fixture.nativeElement.querySelector('.toast-container');
    expect(toastContainer).toBeTruthy();
  });
});
