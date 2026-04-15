import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Appointment {
  id?: number;
  patientId: number;
  doctorId: number;
  appointmentDate: string;
  appointmentTime: string;
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class AppointmentApiService {
  constructor(private http: HttpClient) {}

  list(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${environment.apiBaseUrl}/appointments`);
  }

  create(payload: Appointment): Observable<Appointment> {
    return this.http.post<Appointment>(`${environment.apiBaseUrl}/appointments`, payload);
  }
}
