import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface QueueToken {
  id?: number;
  appointmentId: number;
  patientId: number;
  doctorId: number;
  tokenNumber: number;
  status: string; // WAITING, IN_CONSULTATION, COMPLETED, SKIPPED
  checkInTime: string;
  estimatedWaitMinutes: number;
}

export interface DoctorQueueStatus {
  currentlyCalling: number | string;
  waitingCount: number;
  nextInLine: number | string;
  estimatedAverageWait: number;
}

@Injectable({ providedIn: 'root' })
export class QueueApiService {
  constructor(private http: HttpClient) {}

  checkIn(appointmentId: number): Observable<QueueToken> {
    return this.http.post<QueueToken>(`${environment.apiBaseUrl}/queue/check-in/${appointmentId}`, {});
  }

  getDoctorStatus(doctorId: number): Observable<DoctorQueueStatus> {
    return this.http.get<DoctorQueueStatus>(`${environment.apiBaseUrl}/queue/doctor/${doctorId}/status`);
  }

  getPatientToken(patientId: number): Observable<QueueToken> {
    return this.http.get<QueueToken>(`${environment.apiBaseUrl}/queue/patient/${patientId}/token`);
  }

  getDisplayQueue(): Observable<QueueToken[]> {
    return this.http.get<QueueToken[]>(`${environment.apiBaseUrl}/queue/display`);
  }
}
