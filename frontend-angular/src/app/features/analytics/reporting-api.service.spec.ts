import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ReportingApiService, DashboardSummary } from './reporting-api.service';
import { environment } from '../../../environments/environment';

describe('ReportingApiService', () => {
  let service: ReportingApiService;
  let httpMock: HttpTestingController;

  const mockSummary: DashboardSummary = {
    totalPatients: 1000,
    todayAppointments: 50,
    activeDoctors: 20,
    todayRevenue: 25000,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(ReportingApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getSummary() should GET dashboard summary', () => {
    service.getSummary().subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/reporting/dashboard/summary`);
    expect(req.request.method).toBe('GET');
    req.flush(mockSummary);
  });

  it('getDepartmentLoad() should GET department load', () => {
    service.getDepartmentLoad().subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/reporting/departments/load`);
    expect(req.request.method).toBe('GET');
    req.flush({ cardiology: 15, neurology: 10 });
  });

  it('getAppointmentsVolume() should GET appointments volume with default range', () => {
    service.getAppointmentsVolume().subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/appointments/volume') && r.url.includes('range=30d'));
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('getAppointmentsVolume() should GET appointments volume with custom range', () => {
    service.getAppointmentsVolume('7d').subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/appointments/volume') && r.url.includes('range=7d'));
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('getRevenue() should GET revenue with default groupBy', () => {
    service.getRevenue().subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/revenue') && r.url.includes('groupBy=department'));
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('getRevenue() should GET revenue with custom groupBy', () => {
    service.getRevenue('doctor').subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/revenue') && r.url.includes('groupBy=doctor'));
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('getDoctorsPerformance() should GET doctors performance', () => {
    service.getDoctorsPerformance().subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/reporting/doctors/performance`);
    expect(req.request.method).toBe('GET');
    req.flush([{ doctorId: 1, appointments: 50, rating: 4.5 }]);
  });

  it('downloadPrescriptionPdf() should GET PDF blob', () => {
    service.downloadPrescriptionPdf(5).subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/reporting/prescriptions/5/pdf`);
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob());
  });

  it('downloadDischargeSummaryPdf() should GET PDF blob', () => {
    service.downloadDischargeSummaryPdf(10).subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/reporting/discharge-summary/10/pdf`);
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob());
  });
});
