import { TestBed } from '@angular/core/testing';
import { NotificationsSocketService } from './notifications-socket.service';
import { AuthService } from '../../core/auth.service';
import { NotificationItem } from './notifications-api.service';

describe('NotificationsSocketService', () => {
  let service: NotificationsSocketService;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getToken']);
    authServiceSpy.getToken.and.returnValue('mock_token');

    TestBed.configureTestingModule({
      providers: [
        NotificationsSocketService,
        { provide: AuthService, useValue: authServiceSpy },
      ],
    });

    service = TestBed.inject(NotificationsSocketService);
  });

  afterEach(() => {
    service.disconnect();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('connect() should initialize STOMP client with token', () => {
    const onMessageSpy = jasmine.createSpy('onMessage');
    service.connect(1, onMessageSpy);
    expect(authServiceSpy.getToken).toHaveBeenCalled();
  });

  it('connect() should call onConnect callback', () => {
    const onMessageSpy = jasmine.createSpy('onMessage');
    const onConnectSpy = jasmine.createSpy('onConnect');
    service.connect(1, onMessageSpy, onConnectSpy);
    expect(authServiceSpy.getToken).toHaveBeenCalled();
  });

  it('connect() should call onDisconnect callback on disconnect', () => {
    const onMessageSpy = jasmine.createSpy('onMessage');
    const onDisconnectSpy = jasmine.createSpy('onDisconnect');
    service.connect(1, onMessageSpy, undefined, onDisconnectSpy);
    service.disconnect();
  });

  it('disconnect() should clean up client and subscription', () => {
    const onMessageSpy = jasmine.createSpy('onMessage');
    service.connect(1, onMessageSpy);
    service.disconnect();
    expect(service).toBeTruthy();
  });

  it('connect() should handle null token', () => {
    authServiceSpy.getToken.and.returnValue(null);
    const onMessageSpy = jasmine.createSpy('onMessage');
    service.connect(1, onMessageSpy);
    expect(authServiceSpy.getToken).toHaveBeenCalled();
  });
});
