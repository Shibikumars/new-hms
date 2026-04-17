import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface VisitNote {
  id?: number;
  patientId: number;
  doctorId: number;
  visitDate: string;
  notes: string;
  diagnosisCode?: string;
}

export interface VitalRecord {
  id?: number;
  patientId: number;
  readingDate: string;
  bloodPressure?: string;
  heartRate?: number;
  spo2?: number;
  weight?: number;
}

@Injectable({ providedIn: 'root' })
export class RecordsApiService {
  constructor(private http: HttpClient) {}

  getVisits(patientId: number): Observable<VisitNote[]> {
    return this.http.get<VisitNote[]>(`${environment.apiBaseUrl}/records/patient/${patientId}/visits`);
  }

  createVisit(payload: VisitNote): Observable<VisitNote> {
    return this.http.post<VisitNote>(`${environment.apiBaseUrl}/records/visits`, payload);
  }

  getVitals(patientId: number): Observable<VitalRecord[]> {
    return this.http.get<VitalRecord[]>(`${environment.apiBaseUrl}/records/patient/${patientId}/vitals`);
  }

  searchIcd(term: string): Observable<string[]> {
    return this.http.get<string[]>(`${environment.apiBaseUrl}/records/icd10?search=${encodeURIComponent(term)}`);
  }
}
