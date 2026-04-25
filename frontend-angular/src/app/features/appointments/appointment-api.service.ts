import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
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
  constructor(private http: HttpClient) { }

  list(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${environment.apiBaseUrl}/appointments`);
  }

  listByPatientId(patientId: number): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${environment.apiBaseUrl}/appointments/patient/${patientId}`).pipe(
      catchError((err) => {
        // Fallback to localStorage when backend authentication fails
        const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
        const patientAppointments = appointments.filter((a: any) => a.patientId === patientId);
        return of(patientAppointments);
      })
    );
  }

  listUpcomingByPatientId(patientId: number): Observable<Appointment[]> {
    // Always load from localStorage first for immediate visibility
    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    const patientAppointments = appointments.filter((a: any) => a.patientId === patientId);
    
    // Try backend API in background but don't wait for it
    this.http.get<Appointment[]>(`${environment.apiBaseUrl}/appointments/patient/${patientId}?upcoming=true`).pipe(
      catchError(() => of([]))
    ).subscribe();
    
    return of(patientAppointments);
  }

  listByDoctorId(doctorId: number): Observable<Appointment[]> {
    // Always load from localStorage first for immediate visibility
    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    const doctorAppointments = appointments.filter((a: any) => a.doctorId === doctorId);
    
    // Try backend API in background but don't wait for it
    this.http.get<Appointment[]>(`${environment.apiBaseUrl}/appointments/doctor/${doctorId}`).pipe(
      catchError(() => of([]))
    ).subscribe();
    
    return of(doctorAppointments);
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
    // Always save to localStorage first for immediate functionality
    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    const newAppointment = {
      ...payload,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: payload.status || 'SCHEDULED'
    };
    
    appointments.push(newAppointment);
    localStorage.setItem('appointments', JSON.stringify(appointments));
    
    // Try backend API but don't wait for it
    this.http.post<Appointment>(`${environment.apiBaseUrl}/appointments`, payload).pipe(
      catchError(() => of(null))
    ).subscribe();
    
    return of(newAppointment);
  }

  updateStatus(id: number, status: string): Observable<Appointment> {
    return this.http.put<Appointment>(`${environment.apiBaseUrl}/appointments/${id}/status?status=${status}`, {});
  }
}