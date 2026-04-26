import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { LabApiService, LabOrder, LabReport } from './lab-api.service';
import { environment } from '../../../environments/environment';

describe('LabApiService', () => {
  let service: LabApiService;
  let httpMock: HttpTestingController;

  const mockOrder: LabOrder = {
    patientId: 1,
    doctorId: 2,
    testId: 1,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(LabApiService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getTestsCatalog() should GET lab tests', () => {
    service.getTestsCatalog().subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/lab/tests`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getTestsCatalogLocal() should return local common tests', (done) => {
    service.getTestsCatalogLocal().subscribe(tests => {
      expect(tests.length).toBeGreaterThan(0);
      expect(tests[0].testName).toBe('Complete Blood Count (CBC)');
      done();
    });
  });

  it('placeOrder() should save to localStorage and POST to API', () => {
    service.placeOrder(mockOrder).subscribe(order => {
      expect(order.id).toBeTruthy();
      expect(order.status).toBe('PENDING');
    });

    const bgReq = httpMock.match(`${environment.apiBaseUrl}/lab/orders`);
    if (bgReq.length > 0) {
      bgReq[0].flush({});
    }

    const stored = JSON.parse(localStorage.getItem('labOrders') || '[]');
    expect(stored.length).toBe(1);
    expect(stored[0].patientId).toBe(1);
  });

  it('getPatientResults() should load from localStorage first', () => {
    const storedOrder = { ...mockOrder, id: 100, status: 'COMPLETED' };
    localStorage.setItem('labOrders', JSON.stringify([storedOrder]));

    service.getPatientResults(1).subscribe(reports => {
      expect(reports.length).toBe(1);
      expect(reports[0].patientId).toBe(1);
    });

    const bgReq = httpMock.match(`${environment.apiBaseUrl}/lab/reports/patient/1`);
    if (bgReq.length > 0) {
      bgReq[0].flush([]);
    }
  });

  it('verifyReport() should POST to verify endpoint', () => {
    service.verifyReport(5).subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/lab/reports/5/verify`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('getReportArtifact() should GET report artifact', () => {
    service.getReportArtifact(5).subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/lab/reports/5/artifact`);
    expect(req.request.method).toBe('GET');
    req.flush({ reportId: 5, artifactUrl: 'http://example.com/report.pdf', generatedAt: '2026-04-26' });
  });
});
