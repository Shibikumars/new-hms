import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Medication {
  id?: number;
  medicationName: string;
  genericName?: string;
  strength?: string;
  stockQuantity?: number;
}

export interface Prescription {
  id?: number;
  patientId: number;
  doctorId: number;
  medicationName: string;
  dose?: string;
  frequency?: string;
  duration?: string;
  route?: string;
  instructions?: string;
  issuedDate?: string;
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class PharmacyApiService {
  constructor(private http: HttpClient) {}

  searchMedications(search = ''): Observable<Medication[]> {
    return this.http.get<Medication[]>(`${environment.apiBaseUrl}/medications?search=${encodeURIComponent(search)}`);
  }

  issuePrescription(payload: Prescription): Observable<Prescription> {
    return this.http.post<Prescription>(`${environment.apiBaseUrl}/prescriptions`, payload);
  }

  getPatientPrescriptions(patientId: number): Observable<Prescription[]> {
    return this.http.get<Prescription[]>(`${environment.apiBaseUrl}/prescriptions/patient/${patientId}`);
  }
}
