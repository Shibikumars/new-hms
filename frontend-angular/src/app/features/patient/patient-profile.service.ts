import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PatientProfile {
  id?: number;
  userId?: number;
  firstName: string;
  lastName: string;
  fullName?: string;
  dob?: string;
  age?: number;
  gender?: string;
  bloodGroup?: string;
  phone?: string;
  email?: string;
  address?: string;
  emergencyContact?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
}

@Injectable({ providedIn: 'root' })
export class PatientProfileService {
  constructor(private http: HttpClient) {}

  create(profile: PatientProfile): Observable<PatientProfile> {
    return this.http.post<PatientProfile>(`${environment.apiBaseUrl}/patients`, profile);
  }

  getById(patientId: number): Observable<PatientProfile> {
    return this.http.get<PatientProfile>(`${environment.apiBaseUrl}/patients/${patientId}`);
  }

  getAll(): Observable<PatientProfile[]> {
    return this.http.get<PatientProfile[]>(`${environment.apiBaseUrl}/patients`);
  }
}
