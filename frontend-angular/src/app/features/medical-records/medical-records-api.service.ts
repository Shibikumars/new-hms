import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface VitalRecord {
  id?: number;
  patientId: number;
  temperature?: number;
  bloodPressure?: string;
  heartRate?: number;
  respiratoryRate?: number;
  spo2?: number;
  recordedAt?: string;
}

export interface AllergyRecord {
  id?: number;
  patientId: number;
  allergen: string;
  reaction?: string;
  severity: string;
  status: string;
  notedDate: string;
}

export interface ProblemRecord {
  id?: number;
  patientId: number;
  diagnosisCode: string;
  title: string;
  clinicalStatus: string;
  onsetDate: string;
  resolvedDate?: string;
}

export interface VisitNote {
  id?: number;
  patientId: number;
  doctorId: number;
  visitDate: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  diagnosisCode?: string;
}

@Injectable({ providedIn: 'root' })
export class MedicalRecordsApiService {
  private baseUrl = `${environment.apiBaseUrl}/records`;

  constructor(private http: HttpClient) {}

  getVitals(patientId: number): Observable<VitalRecord[]> {
    return this.http.get<VitalRecord[]>(`${this.baseUrl}/patient/${patientId}/vitals`);
  }

  addVital(patientId: number, vital: VitalRecord): Observable<VitalRecord> {
    return this.http.post<VitalRecord>(`${this.baseUrl}/patient/${patientId}/vitals`, vital);
  }

  getAllergies(patientId: number): Observable<AllergyRecord[]> {
    return this.http.get<AllergyRecord[]>(`${this.baseUrl}/patient/${patientId}/allergies`);
  }

  getProblems(patientId: number): Observable<ProblemRecord[]> {
    return this.http.get<ProblemRecord[]>(`${this.baseUrl}/patient/${patientId}/problems`);
  }

  getVisits(patientId: number): Observable<VisitNote[]> {
    return this.http.get<VisitNote[]>(`${this.baseUrl}/patient/${patientId}/visits`);
  }

  createVisit(visit: VisitNote): Observable<VisitNote> {
    return this.http.post<VisitNote>(`${this.baseUrl}/visits`, visit);
  }

  searchIcd(query: string): Observable<string[]> {
    return this.http.get<any[]>(`${this.baseUrl}/icd/search?q=${encodeURIComponent(query)}`)
      .pipe(map(items => items.map(i => `${i.description} (${i.code})`)));
  }

  exportFhir(patientId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/fhir/${patientId}`);
  }

  downloadVisitPdf(visitId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/visits/${visitId}/pdf`, { responseType: 'blob' });
  }

  addAllergy(patientId: number, payload: AllergyRecord): Observable<AllergyRecord> {
    return this.http.post<AllergyRecord>(`${this.baseUrl}/patient/${patientId}/allergies`, payload);
  }
}
