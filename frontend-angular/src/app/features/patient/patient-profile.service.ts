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
    // Store in localStorage for immediate functionality
    const existingPatients = JSON.parse(localStorage.getItem('patients') || '[]');
    const newPatient = {
      ...profile,
      id: Date.now(),
      fullName: `${profile.firstName} ${profile.lastName}`,
      createdAt: new Date().toISOString()
    };
    
    existingPatients.push(newPatient);
    localStorage.setItem('patients', JSON.stringify(existingPatients));
    
    console.log('Patient profile created successfully:', newPatient);
    return new Observable(observer => {
      observer.next(newPatient);
      observer.complete();
    });
  }

  getById(patientId: number): Observable<PatientProfile> {
    return this.http.get<PatientProfile>(`${environment.apiBaseUrl}/patients/${patientId}`);
  }

  getByUserId(userId: number): Observable<PatientProfile> {
    return this.http.get<PatientProfile>(`${environment.apiBaseUrl}/patients/by-user/${userId}`);
  }

  getAll(): Observable<PatientProfile[]> {
    return this.http.get<PatientProfile[]>(`${environment.apiBaseUrl}/patients`);
  }
}
