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

  getMyNotifications(userId: number): Observable<NotificationItem[]> {
    return this.http.get<NotificationItem[]>(`${environment.apiBaseUrl}/notifications/me?userId=${userId}`);
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
}
