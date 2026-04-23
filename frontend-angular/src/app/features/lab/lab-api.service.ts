import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LabTest {
  id?: number;
  testName: string;
  description?: string;
  loincCode?: string;
  referenceRange?: string;
  unit?: string;
  price?: number;
}

export interface LabOrder {
  id?: number;
  patientId: number;
  doctorId: number;
  testId: number;
  status?: string;
  orderDate?: string;
}

export interface LabReport {
  id?: number;
  labOrderId: number;
  testId: number;
  patientId: number;
  result?: string;
  numericResult?: number;
  unit?: string;
  referenceRange?: string;
  isCritical?: boolean;
  status?: string;
  reportDate: string;
  verificationStatus?: string;
  verifiedBy?: string;
}

export interface LabReportArtifact {
  reportId: number;
  artifactUrl: string;
  generatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class LabApiService {
  constructor(private http: HttpClient) {}

  getTestsCatalog(): Observable<LabTest[]> {
    return this.http.get<LabTest[]>(`${environment.apiBaseUrl}/lab/tests`);
  }

  placeOrder(payload: LabOrder): Observable<LabOrder> {
    return this.http.post<LabOrder>(`${environment.apiBaseUrl}/lab/orders`, payload);
  }

  getPatientResults(patientId: number): Observable<LabReport[]> {
    return this.http.get<LabReport[]>(`${environment.apiBaseUrl}/lab/reports/patient/${patientId}`);
  }

  verifyReport(reportId: number): Observable<void> {
    return this.http.post<void>(`${environment.apiBaseUrl}/lab/reports/${reportId}/verify`, {});
  }

  getReportArtifact(reportId: number): Observable<LabReportArtifact> {
    return this.http.get<LabReportArtifact>(`${environment.apiBaseUrl}/lab/reports/${reportId}/artifact`);
  }
}
