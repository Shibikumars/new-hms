import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DoctorProfile {
  id?: number;
  fullName: string;
  specialization: string;
  phone: string;
  email: string;
  qualifications?: string;
  yearsOfExperience?: number;
  subSpecialties?: string;
  consultationFee?: number;
  languagesSpoken?: string;
  profilePhotoUrl?: string;
  about?: string;
  rating?: number;
  userId?: number;
}

@Injectable({ providedIn: 'root' })
export class DoctorProfileService {
  constructor(private http: HttpClient) {}

  create(profile: DoctorProfile): Observable<DoctorProfile> {
    return this.http.post<DoctorProfile>(`${environment.apiBaseUrl}/doctors`, profile);
  }

  getById(doctorId: number): Observable<DoctorProfile> {
    return this.http.get<DoctorProfile>(`${environment.apiBaseUrl}/doctors/${doctorId}`);
  }

  update(doctorId: number, profile: DoctorProfile): Observable<DoctorProfile> {
    return this.http.put<DoctorProfile>(`${environment.apiBaseUrl}/doctors/${doctorId}`, profile);
  }

  getSpecialties(): Observable<string[]> {
    return this.http.get<string[]>(`${environment.apiBaseUrl}/doctors/specialties`);
  }
}
