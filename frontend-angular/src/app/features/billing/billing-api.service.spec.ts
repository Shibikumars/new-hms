import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BillingApiService } from './billing-api.service';
import { environment } from '../../../environments/environment';

describe('BillingApiService', () => {
  let service: BillingApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(BillingApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getInvoicesByPatient() should GET invoices for a patient', () => {
    service.getInvoicesByPatient(10).subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/invoices/patient/10`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('createInvoice() should POST invoice payload', () => {
    const payload = { patientId: 5, totalAmount: 2500 };
    service.createInvoice(payload).subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/invoices`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ id: 1, ...payload });
  });

  it('payInvoice() should POST payment details for an invoice', () => {
    const details = { paymentMethod: 'UPI', paymentReference: 'REF123' };
    service.payInvoice(7, details).subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/invoices/7/pay`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(details);
    req.flush(null);
  });

  it('createRazorpayOrder() should POST amount to Razorpay endpoint', () => {
    service.createRazorpayOrder(5000).subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/payments/razorpay/order`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ amount: 5000 });
    req.flush({ id: 'order_abc', amount: 5000, currency: 'INR' });
  });

  it('verifyRazorpayPayment() should POST verification payload', () => {
    const verifyPayload = { razorpay_order_id: 'o1', razorpay_payment_id: 'p1', razorpay_signature: 'sig' };
    service.verifyRazorpayPayment(verifyPayload).subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/payments/razorpay/verify`);
    expect(req.request.method).toBe('POST');
    req.flush(null);
  });
});
