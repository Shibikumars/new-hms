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

export interface PrescriptionItem {
  id?: number;
  medicationName: string;
  dose: string;
  frequency: string;
  duration: string;
  route?: string;
  instructions?: string;
}

export interface Prescription {
  id?: number;
  patientId: number;
  doctorId: number;
  items: PrescriptionItem[];
  issuedDate?: string;
  status?: string;
  note?: string;
}

@Injectable({ providedIn: 'root' })
export class PharmacyApiService {
  constructor(private http: HttpClient) {}

  searchMedications(search = ''): Observable<Medication[]> {
    return this.http.get<Medication[]>(`${environment.apiBaseUrl}/medications?search=${encodeURIComponent(search)}`);
  }

  issuePrescription(payload: Prescription): Observable<Prescription> {
    const data = { ...payload, issuedDate: new Date().toISOString().slice(0, 10) };
    return this.http.post<Prescription>(`${environment.apiBaseUrl}/prescriptions`, data);
  }

  getPatientPrescriptions(patientId: number): Observable<Prescription[]> {
    return this.http.get<Prescription[]>(`${environment.apiBaseUrl}/prescriptions/patient/${patientId}`);
  }
}
