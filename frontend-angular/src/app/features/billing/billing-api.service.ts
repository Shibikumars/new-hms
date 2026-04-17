import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Invoice {
  id?: number;
  patientId: number;
  invoiceNumber?: string;
  invoiceDate?: string;
  totalAmount?: number;
  status?: string;
  claimStatus?: string;
  sourceSummary?: string;
}

@Injectable({ providedIn: 'root' })
export class BillingApiService {
  constructor(private http: HttpClient) {}

  getInvoicesByPatient(patientId: number): Observable<Invoice[]> {
    return this.http.get<Invoice[]>(`${environment.apiBaseUrl}/invoices/patient/${patientId}`);
  }

  createInvoice(payload: Invoice): Observable<Invoice> {
    return this.http.post<Invoice>(`${environment.apiBaseUrl}/invoices`, payload);
  }

  payInvoice(invoiceId: number): Observable<Invoice> {
    return this.http.post<Invoice>(`${environment.apiBaseUrl}/invoices/${invoiceId}/pay`, {});
  }
}
