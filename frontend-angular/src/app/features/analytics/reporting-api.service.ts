import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DashboardSummary {
  totalPatients: number;
  todayAppointments: number;
  activeDoctors: number;
  todayRevenue: number;
}

@Injectable({ providedIn: 'root' })
export class ReportingApiService {
  constructor(private http: HttpClient) {}

  getSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${environment.apiBaseUrl}/reporting/dashboard/summary`);
  }

  getDepartmentLoad(): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>(`${environment.apiBaseUrl}/reporting/departments/load`);
  }

  getAppointmentsVolume(range = '30d'): Observable<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(`${environment.apiBaseUrl}/reporting/appointments/volume?range=${range}`);
  }

  getRevenue(groupBy = 'department'): Observable<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(`${environment.apiBaseUrl}/reporting/revenue?groupBy=${groupBy}`);
  }

  getDoctorsPerformance(): Observable<Array<Record<string, unknown>>> {
    return this.http.get<Array<Record<string, unknown>>>(`${environment.apiBaseUrl}/reporting/doctors/performance`);
  }

  downloadPrescriptionPdf(id: number): Observable<Blob> {
    return this.http.get(`${environment.apiBaseUrl}/reporting/prescriptions/${id}/pdf`, { responseType: 'blob' });
  }

  downloadDischargeSummaryPdf(appointmentId: number): Observable<Blob> {
    return this.http.get(`${environment.apiBaseUrl}/reporting/discharge-summary/${appointmentId}/pdf`, { responseType: 'blob' });
  }
}
