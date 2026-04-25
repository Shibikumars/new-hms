import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AuthResponse {
  token: string;
  refreshToken: string;
  role: string;
  expiresIn: number;
  otpRequired: boolean;
}

type JwtPayload = {
  sub?: string;
  role?: string;
  userId?: number;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'hms_jwt_token';
  private readonly refreshTokenKey = 'hms_refresh_token';

  constructor(private http: HttpClient) {}

  register(payload: { username: string; password: string; role: string }): Observable<unknown> {
    // Check if username already exists
    const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const existingUser = existingUsers.find((u: any) => u.username === payload.username);
    
    if (existingUser) {
      throw new Error('Username already exists');
    }
    
    // Create new user
    const newUser = {
      id: Date.now(),
      username: payload.username,
      password: payload.password, // In production, this should be hashed
      role: payload.role,
      createdAt: new Date().toISOString(),
      isActive: true
    };
    
    existingUsers.push(newUser);
    localStorage.setItem('users', JSON.stringify(existingUsers));
    
    console.log('User registered successfully:', newUser);
    return new Observable(observer => {
      observer.next({ userId: newUser.id, username: newUser.username, role: newUser.role });
      observer.complete();
    });
  }

  login(payload: { username: string; password: string; rememberMe: boolean }): Observable<AuthResponse> {
    return new Observable(observer => {
      // Check if user exists and credentials are correct
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find((u: any) => u.username === payload.username && u.password === payload.password);
      
      if (!user) {
        observer.error(new Error('Invalid username or password'));
        return;
      }
      
      if (!user.isActive) {
        observer.error(new Error('Account is deactivated'));
        return;
      }
      
      // Create mock JWT token
      const token = this.createMockToken(user);
      const refreshToken = this.createMockToken(user);
      
      const response: AuthResponse = {
        token,
        refreshToken,
        role: user.role,
        expiresIn: 3600,
        otpRequired: false
      };
      
      this.storeSession(response, payload.rememberMe);
      console.log('User logged in successfully:', user);
      
      observer.next(response);
      observer.complete();
    });
  }

  refresh(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    return this.http.post<AuthResponse>(`${environment.apiBaseUrl}/auth/refresh`, { refreshToken }).pipe(
      tap(response => this.storeSession(response, this.isPersistentSession()))
    );
  }

  private storeSession(response: AuthResponse, rememberMe: boolean): void {
    if (rememberMe) {
      localStorage.setItem(this.tokenKey, response.token);
      localStorage.setItem(this.refreshTokenKey, response.refreshToken);
      sessionStorage.removeItem(this.tokenKey);
      sessionStorage.removeItem(this.refreshTokenKey);
      return;
    }

    sessionStorage.setItem(this.tokenKey, response.token);
    sessionStorage.setItem(this.refreshTokenKey, response.refreshToken);
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
  }

  getToken(): string | null {
    return sessionStorage.getItem(this.tokenKey) ?? localStorage.getItem(this.tokenKey);
  }

  getRefreshToken(): string | null {
    return sessionStorage.getItem(this.refreshTokenKey) ?? localStorage.getItem(this.refreshTokenKey);
  }

  private isPersistentSession(): boolean {
    return localStorage.getItem(this.refreshTokenKey) !== null;
  }

  /** Best-effort JWT payload decode (no signature verification; UI convenience only). */
  getTokenPayload(): JwtPayload | null {
    const token = this.getToken();
    if (!token) return null;

    const parts = token.split('.');
    if (parts.length !== 3) return null;

    try {
      const json = this.base64UrlDecode(parts[1]);
      return JSON.parse(json) as JwtPayload;
    } catch {
      return null;
    }
  }

  getRole(): string | null {
    const payload = this.getTokenPayload();
    return (payload?.role as string | undefined) ?? null;
  }

  getUsername(): string | null {
    const payload = this.getTokenPayload();
    return (payload?.sub as string | undefined) ?? null;
  }

  getUserId(): number | null {
    const payload = this.getTokenPayload();
    const raw = payload?.userId;
    if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) {
      return raw;
    }
    if (typeof raw === 'string') {
      const parsed = Number(raw);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
    return null;
  }

  private base64UrlDecode(input: string): string {
    // Convert from base64url to base64
    let base64 = input.replace(/-/g, '+').replace(/_/g, '/');
    // Pad with '=' to length multiple of 4
    while (base64.length % 4 !== 0) base64 += '=';
    return atob(base64);
  }

  private createMockToken(user: any): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      sub: user.username,
      role: user.role,
      userId: user.id,
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
      iat: Math.floor(Date.now() / 1000)
    }));
    const signature = btoa('mock-signature');
    return `${header}.${payload}.${signature}`;
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    sessionStorage.removeItem(this.refreshTokenKey);
  }

  isAuthenticated(): boolean {
    return Boolean(this.getToken());
  }

  getDebugUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiBaseUrl}/auth/debug/users`);
  }

  adminVerifyUser(userId: number): Observable<any> {
    return this.http.post(`${environment.apiBaseUrl}/auth/admin/verify/${userId}`, {});
  }
}