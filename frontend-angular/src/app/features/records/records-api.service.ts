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

export interface AllergyRecord {
  id?: number;
  patientId: number;
  allergen: string;
  reaction?: string;
  severity?: string;
  status?: string;
  notedDate?: string;
}

export interface ProblemRecord {
  id?: number;
  patientId: number;
  diagnosisCode: string;
  title: string;
  clinicalStatus?: string;
  onsetDate?: string;
  resolvedDate?: string;
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

  getAllergies(patientId: number): Observable<AllergyRecord[]> {
    return this.http.get<AllergyRecord[]>(`${environment.apiBaseUrl}/records/patient/${patientId}/allergies`);
  }

  addAllergy(patientId: number, payload: AllergyRecord): Observable<AllergyRecord> {
    return this.http.post<AllergyRecord>(`${environment.apiBaseUrl}/records/patient/${patientId}/allergies`, payload);
  }

  getProblems(patientId: number): Observable<ProblemRecord[]> {
    return this.http.get<ProblemRecord[]>(`${environment.apiBaseUrl}/records/patient/${patientId}/problems`);
  }

  addProblem(patientId: number, payload: ProblemRecord): Observable<ProblemRecord> {
    return this.http.post<ProblemRecord>(`${environment.apiBaseUrl}/records/patient/${patientId}/problems`, payload);
  }
}
