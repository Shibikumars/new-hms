import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService, AuthResponse } from './auth.service';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  // A valid base64url-encoded JWT with known payload
  const mockPayload = { sub: 'john_doe', role: 'PATIENT', userId: 42, exp: 9999999999, iat: 1000000000 };
  const mockToken = buildMockJwt(mockPayload);

  const mockAuthResponse: AuthResponse = {
    token: mockToken,
    refreshToken: 'refresh_abc',
    role: 'PATIENT',
    expiresIn: 3600,
    otpRequired: false,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    // Clean storage before each test
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
    sessionStorage.clear();
  });

  // ── Registration ──────────────────────────────────────────────────────────

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('register() should POST to /auth/register', () => {
    const payload = { username: 'alice', password: 'secret', role: 'PATIENT' };
    service.register(payload).subscribe();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/auth/register`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({});
  });

  // ── Login + Session Storage ───────────────────────────────────────────────

  it('login() without rememberMe should store token in sessionStorage', () => {
    service.login({ username: 'john', password: 'pass', rememberMe: false }).subscribe();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/auth/login`);
    req.flush(mockAuthResponse);

    expect(sessionStorage.getItem('hms_jwt_token')).toBe(mockToken);
    expect(sessionStorage.getItem('hms_refresh_token')).toBe('refresh_abc');
    expect(localStorage.getItem('hms_jwt_token')).toBeNull();
  });

  it('login() with rememberMe should store token in localStorage', () => {
    service.login({ username: 'john', password: 'pass', rememberMe: true }).subscribe();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/auth/login`);
    req.flush(mockAuthResponse);

    expect(localStorage.getItem('hms_jwt_token')).toBe(mockToken);
    expect(sessionStorage.getItem('hms_jwt_token')).toBeNull();
  });

  // ── Token Retrieval ───────────────────────────────────────────────────────

  it('getToken() should return null when no token exists', () => {
    expect(service.getToken()).toBeNull();
  });

  it('getToken() should prefer sessionStorage over localStorage', () => {
    sessionStorage.setItem('hms_jwt_token', 'session_token');
    localStorage.setItem('hms_jwt_token', 'local_token');
    expect(service.getToken()).toBe('session_token');
  });

  it('getToken() falls back to localStorage when sessionStorage is empty', () => {
    localStorage.setItem('hms_jwt_token', 'local_token');
    expect(service.getToken()).toBe('local_token');
  });

  // ── JWT Payload Decode ────────────────────────────────────────────────────

  it('getTokenPayload() should return null when no token', () => {
    expect(service.getTokenPayload()).toBeNull();
  });

  it('getTokenPayload() should decode valid JWT payload correctly', () => {
    sessionStorage.setItem('hms_jwt_token', mockToken);
    const payload = service.getTokenPayload();
    expect(payload).toBeTruthy();
    expect(payload!.sub).toBe('john_doe');
    expect(payload!.role).toBe('PATIENT');
    expect(payload!.userId).toBe(42);
  });

  it('getTokenPayload() should return null for malformed token', () => {
    sessionStorage.setItem('hms_jwt_token', 'not.a.valid.jwt.at.all');
    expect(service.getTokenPayload()).toBeNull();
  });

  // ── Role / Username / UserId ──────────────────────────────────────────────

  it('getRole() should extract role from token', () => {
    sessionStorage.setItem('hms_jwt_token', mockToken);
    expect(service.getRole()).toBe('PATIENT');
  });

  it('getRole() should return null when no token', () => {
    expect(service.getRole()).toBeNull();
  });

  it('getUsername() should extract sub claim from token', () => {
    sessionStorage.setItem('hms_jwt_token', mockToken);
    expect(service.getUsername()).toBe('john_doe');
  });

  it('getUserId() should extract numeric userId from token', () => {
    sessionStorage.setItem('hms_jwt_token', mockToken);
    expect(service.getUserId()).toBe(42);
  });

  it('getUserId() should return null when no token', () => {
    expect(service.getUserId()).toBeNull();
  });

  // ── isAuthenticated ───────────────────────────────────────────────────────

  it('isAuthenticated() should return false when no token', () => {
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('isAuthenticated() should return true when token exists in sessionStorage', () => {
    sessionStorage.setItem('hms_jwt_token', 'any_token');
    expect(service.isAuthenticated()).toBeTrue();
  });

  // ── Logout ────────────────────────────────────────────────────────────────

  it('logout() should remove token from both storages', () => {
    sessionStorage.setItem('hms_jwt_token', 'a');
    localStorage.setItem('hms_jwt_token', 'b');
    sessionStorage.setItem('hms_refresh_token', 'c');
    localStorage.setItem('hms_refresh_token', 'd');

    service.logout();

    expect(sessionStorage.getItem('hms_jwt_token')).toBeNull();
    expect(localStorage.getItem('hms_jwt_token')).toBeNull();
    expect(sessionStorage.getItem('hms_refresh_token')).toBeNull();
    expect(localStorage.getItem('hms_refresh_token')).toBeNull();
  });

  // ── Refresh Token ─────────────────────────────────────────────────────────

  it('refresh() should POST with refreshToken from storage', () => {
    sessionStorage.setItem('hms_refresh_token', 'stored_refresh');
    service.refresh().subscribe();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/auth/refresh`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ refreshToken: 'stored_refresh' });
    req.flush(mockAuthResponse);
  });

  it('refresh() should throw when no refresh token available', () => {
    expect(() => service.refresh()).toThrowError('No refresh token available');
  });

  // ── Additional Methods ────────────────────────────────────────────────────

  it('getDebugUsers() should GET from auth/debug/users', () => {
    service.getDebugUsers().subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/auth/debug/users`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('adminVerifyUser() should POST to auth/admin/verify/:userId', () => {
    service.adminVerifyUser(123).subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/auth/admin/verify/123`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });
});

// ── Helper ────────────────────────────────────────────────────────────────────
function buildMockJwt(payload: object): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const body = btoa(JSON.stringify(payload))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${header}.${body}.mock_signature`;
}
