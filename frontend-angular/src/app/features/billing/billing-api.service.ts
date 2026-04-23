import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Invoice {
  id?: number;
  patientId: number;
  invoiceNumber?: string;
  invoiceDate?: string;
  baseAmount?: number;
  taxAmount?: number;
  taxRate?: number;
  totalAmount: number;
  hospitalGstin?: string;
  status?: string;
  claimStatus?: string;
  sourceSummary?: string;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
}

@Injectable({ providedIn: 'root' })
export class BillingApiService {
  constructor(private http: HttpClient) {}

  getInvoicesByPatient(patientId: number): Observable<Invoice[]> {
    return this.http.get<Invoice[]>(`${environment.apiBaseUrl}/payments/patient/${patientId}`);
  }

  createInvoice(payload: { patientId: number; totalAmount: number }): Observable<Invoice> {
    return this.http.post<Invoice>(`${environment.apiBaseUrl}/invoices`, payload);
  }

  payInvoice(invoiceId: number, paymentDetails: { paymentMethod: string; paymentReference: string }): Observable<void> {
    return this.http.post<void>(`${environment.apiBaseUrl}/payments/invoice/${invoiceId}/pay`, paymentDetails);
  }

  createRazorpayOrder(amount: number): Observable<RazorpayOrder> {
    return this.http.post<RazorpayOrder>(`${environment.apiBaseUrl}/payments/razorpay/order`, { amount });
  }

  verifyRazorpayPayment(payload: any): Observable<void> {
    return this.http.post<void>(`${environment.apiBaseUrl}/payments/razorpay/verify`, payload);
  }
}
