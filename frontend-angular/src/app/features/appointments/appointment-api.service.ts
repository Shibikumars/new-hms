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
  type?: string;
  chiefComplaint?: string;
  paymentStatus?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  feeAmount?: number;
}

export interface DoctorOption {
  id: number;
  fullName: string;
  specialization: string;
  availability: string;
  email?: string;
  phone?: string;
  qualifications?: string;
  yearsOfExperience?: number;
  subSpecialties?: string;
  consultationFee?: number;
  languagesSpoken?: string;
  profilePhotoUrl?: string;
  about?: string;
  rating?: number;
}

export interface TimeSlot {
  time: string;
  status: 'AVAILABLE' | 'BOOKED';
}

@Injectable({ providedIn: 'root' })
export class AppointmentApiService {
  constructor(private http: HttpClient) {}

  list(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${environment.apiBaseUrl}/appointments`);
  }

  listByPatientId(patientId: number): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${environment.apiBaseUrl}/appointments/patient/${patientId}`);
  }

  listUpcomingByPatientId(patientId: number): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${environment.apiBaseUrl}/appointments/patient/${patientId}?upcoming=true`);
  }

  searchDoctors(search = '', specialty = ''): Observable<DoctorOption[]> {
    const query = new URLSearchParams();
    if (search.trim()) query.set('search', search.trim());
    if (specialty.trim()) query.set('specialty', specialty.trim());
    const suffix = query.size > 0 ? `?${query.toString()}` : '';
    return this.http.get<DoctorOption[]>(`${environment.apiBaseUrl}/doctors${suffix}`);
  }

  listSpecialties(): Observable<string[]> {
    return this.http.get<string[]>(`${environment.apiBaseUrl}/doctors/specialties`);
  }

  getTimeSlots(doctorId: number, date: string): Observable<TimeSlot[]> {
    return this.http.get<TimeSlot[]>(`${environment.apiBaseUrl}/appointments/timeslots?doctorId=${doctorId}&date=${date}`);
  }

  create(payload: Appointment): Observable<Appointment> {
    return this.http.post<Appointment>(`${environment.apiBaseUrl}/appointments`, payload);
  }
}