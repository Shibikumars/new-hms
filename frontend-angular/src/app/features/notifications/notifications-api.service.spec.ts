import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NotificationsApiService, NotificationItem, NotificationPreference } from './notifications-api.service';
import { environment } from '../../../environments/environment';

describe('NotificationsApiService', () => {
  let service: NotificationsApiService;
  let httpMock: HttpTestingController;

  const mockNotification: NotificationItem = {
    id: 1,
    userId: 1,
    title: 'Test Notification',
    message: 'Test message',
    type: 'INFO',
    read: false,
  };

  const mockPreference: NotificationPreference = {
    id: 1,
    userId: 1,
    emailAppointmentConfirmation: true,
    smsReminder24h: true,
    pushLabResults: false,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(NotificationsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getMyNotifications() should GET user notifications', () => {
    service.getMyNotifications(1).subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/notifications/me?userId=1`);
    expect(req.request.method).toBe('GET');
    req.flush([mockNotification]);
  });

  it('getMyNotifications() should include escalatedOnly filter', () => {
    service.getMyNotifications(1, { escalatedOnly: true }).subscribe();
    const req = httpMock.expectOne(r => r.url.includes('escalatedOnly=true'));
    expect(req.request.method).toBe('GET');
    req.flush([mockNotification]);
  });

  it('getMyNotifications() should include resolvedOnly filter', () => {
    service.getMyNotifications(1, { resolvedOnly: true }).subscribe();
    const req = httpMock.expectOne(r => r.url.includes('resolvedOnly=true'));
    expect(req.request.method).toBe('GET');
    req.flush([mockNotification]);
  });

  it('markRead() should PUT to mark as read', () => {
    service.markRead(1).subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/notifications/1/read`);
    expect(req.request.method).toBe('PUT');
    req.flush(mockNotification);
  });

  it('getPreferences() should GET user preferences', () => {
    service.getPreferences(1).subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/notifications/preferences?userId=1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockPreference);
  });

  it('updatePreferences() should PUT user preferences', () => {
    service.updatePreferences(1, mockPreference).subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/notifications/preferences?userId=1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(mockPreference);
    req.flush(mockPreference);
  });

  it('publish() should POST notification', () => {
    service.publish(mockNotification).subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/notifications/publish`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockNotification);
    req.flush(mockNotification);
  });

  it('escalate() should POST to escalate with target and owner', () => {
    service.escalate(1, 'ADMIN', 'admin_user').subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/escalate'));
    expect(req.request.method).toBe('POST');
    req.flush(mockNotification);
  });

  it('resolveEscalation() should POST to resolve with note', () => {
    service.resolveEscalation(1, 'Resolved by admin').subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/resolve') && r.url.includes('note='));
    expect(req.request.method).toBe('POST');
    req.flush(mockNotification);
  });

  it('resolveEscalation() should POST to resolve without note', () => {
    service.resolveEscalation(1).subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/resolve') && !r.url.includes('note='));
    expect(req.request.method).toBe('POST');
    req.flush(mockNotification);
  });

  it('reassignEscalation() should POST to reassign', () => {
    service.reassignEscalation(1, 'CARE', 'care_user').subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/reassign'));
    expect(req.request.method).toBe('POST');
    req.flush(mockNotification);
  });
});
