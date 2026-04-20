import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface NotificationItem {
  id?: number;
  userId: number;
  title: string;
  message: string;
  type?: string;
  read?: boolean;
  createdAt?: string;
  escalated?: boolean;
  escalationTarget?: string;
  escalationOwner?: string;
  escalationStatus?: string;
  escalatedAt?: string;
  resolvedBy?: string;
  resolvedNote?: string;
  resolvedAt?: string;
}

export interface NotificationPreference {
  id?: number;
  userId?: number;
  emailAppointmentConfirmation: boolean;
  smsReminder24h: boolean;
  pushLabResults: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificationsApiService {
  constructor(private http: HttpClient) {}

  getMyNotifications(userId: number, filters?: { escalatedOnly?: boolean; resolvedOnly?: boolean }): Observable<NotificationItem[]> {
    const escalatedOnly = filters?.escalatedOnly ? '&escalatedOnly=true' : '';
    const resolvedOnly = filters?.resolvedOnly ? '&resolvedOnly=true' : '';
    return this.http.get<NotificationItem[]>(`${environment.apiBaseUrl}/notifications/me?userId=${userId}${escalatedOnly}${resolvedOnly}`);
  }

  markRead(id: number): Observable<NotificationItem> {
    return this.http.put<NotificationItem>(`${environment.apiBaseUrl}/notifications/${id}/read`, {});
  }

  getPreferences(userId: number): Observable<NotificationPreference> {
    return this.http.get<NotificationPreference>(`${environment.apiBaseUrl}/notifications/preferences?userId=${userId}`);
  }

  updatePreferences(userId: number, payload: NotificationPreference): Observable<NotificationPreference> {
    return this.http.put<NotificationPreference>(`${environment.apiBaseUrl}/notifications/preferences?userId=${userId}`, payload);
  }

  publish(payload: NotificationItem): Observable<NotificationItem> {
    return this.http.post<NotificationItem>(`${environment.apiBaseUrl}/notifications/publish`, payload);
  }

  escalate(id: number, target: 'ADMIN' | 'CARE', owner: string): Observable<NotificationItem> {
    return this.http.post<NotificationItem>(
      `${environment.apiBaseUrl}/notifications/${id}/escalate?target=${target}&owner=${encodeURIComponent(owner)}`,
      {}
    );
  }

  resolveEscalation(id: number, note?: string): Observable<NotificationItem> {
    const noteQuery = note ? `?note=${encodeURIComponent(note)}` : '';
    return this.http.post<NotificationItem>(`${environment.apiBaseUrl}/notifications/${id}/resolve${noteQuery}`, {});
  }

  reassignEscalation(id: number, target: 'ADMIN' | 'CARE', owner: string): Observable<NotificationItem> {
    return this.http.post<NotificationItem>(
      `${environment.apiBaseUrl}/notifications/${id}/reassign?target=${target}&owner=${encodeURIComponent(owner)}`,
      {}
    );
  }
}
