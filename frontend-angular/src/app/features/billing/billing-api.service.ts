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
  paymentMethod?: string;
  paymentReference?: string;
  paidAt?: string;
  claimDecisionReason?: string;
  claimDecidedBy?: string;
  claimDecidedAt?: string;
  claimRejectionCode?: string;
  claimRejectionCategory?: string;
  claimResubmissionCount?: number;
}

export interface PayInvoiceRequest {
  paymentMethod?: string;
  paymentReference?: string;
}

export interface ClaimTransitionRequest {
  action: 'SUBMIT' | 'APPROVE' | 'REJECT' | 'RESUBMIT' | 'SETTLE';
  reason?: string;
  decidedBy?: string;
  rejectionCode?: string;
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

  payInvoice(invoiceId: number, payload?: PayInvoiceRequest): Observable<Invoice> {
    return this.http.post<Invoice>(`${environment.apiBaseUrl}/invoices/${invoiceId}/pay`, payload ?? {});
  }

  transitionClaim(invoiceId: number, payload: ClaimTransitionRequest): Observable<Invoice> {
    return this.http.post<Invoice>(`${environment.apiBaseUrl}/invoices/${invoiceId}/claims/transition`, payload);
  }

  getClaimRejectionTaxonomy(): Observable<Record<string, string>> {
    return this.http.get<Record<string, string>>(`${environment.apiBaseUrl}/invoices/claims/rejection-taxonomy`);
  }
}
