import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LabTest {
  id?: number;
  testName: string;
  description?: string;
  price?: number;
}

export interface LabOrder {
  id?: number;
  patientId: number;
  doctorId: number;
  testId: number;
  testName?: string;
  orderDate?: string;
  status?: string;
}

export interface LabReport {
  id?: number;
  labOrderId: number;
  testId: number;
  doctorId: number;
  patientId: number;
  result: string;
  status?: string;
  reportDate?: string;
}

@Injectable({ providedIn: 'root' })
export class LabApiService {
  constructor(private http: HttpClient) {}

  getTestsCatalog(): Observable<LabTest[]> {
    return this.http.get<LabTest[]>(`${environment.apiBaseUrl}/labs/tests-catalog`);
  }

  placeOrder(payload: LabOrder): Observable<LabOrder> {
    return this.http.post<LabOrder>(`${environment.apiBaseUrl}/labs/orders`, payload);
  }

  enterResults(orderId: number, result: string): Observable<LabReport> {
    return this.http.put<LabReport>(`${environment.apiBaseUrl}/labs/orders/${orderId}/results`, { result, status: 'READY' });
  }

  getPatientResults(patientId: number): Observable<LabReport[]> {
    return this.http.get<LabReport[]>(`${environment.apiBaseUrl}/lab-results/patient/${patientId}`);
  }

  getTrend(patientId: number, test: string): Observable<LabReport[]> {
    return this.http.get<LabReport[]>(`${environment.apiBaseUrl}/lab-results/patient/${patientId}/trend?test=${encodeURIComponent(test)}`);
  }
}
