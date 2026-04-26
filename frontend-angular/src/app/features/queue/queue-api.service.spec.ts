import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { QueueApiService, QueueToken, DoctorQueueStatus } from './queue-api.service';
import { environment } from '../../../environments/environment';

describe('QueueApiService', () => {
  let service: QueueApiService;
  let httpMock: HttpTestingController;

  const mockToken: QueueToken = {
    id: 1,
    appointmentId: 100,
    patientId: 1,
    doctorId: 2,
    tokenNumber: 5,
    status: 'WAITING',
    checkInTime: '2026-04-26T10:00:00Z',
    estimatedWaitMinutes: 15,
  };

  const mockStatus: DoctorQueueStatus = {
    currentlyCalling: 4,
    waitingCount: 10,
    nextInLine: 5,
    estimatedAverageWait: 12,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(QueueApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('checkIn() should POST to check-in endpoint', () => {
    service.checkIn(100).subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/queue/check-in/100`);
    expect(req.request.method).toBe('POST');
    req.flush(mockToken);
  });

  it('getDoctorStatus() should GET doctor queue status', () => {
    service.getDoctorStatus(2).subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/queue/doctor/2/status`);
    expect(req.request.method).toBe('GET');
    req.flush(mockStatus);
  });

  it('getPatientToken() should GET patient token', () => {
    service.getPatientToken(1).subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/queue/patient/1/token`);
    expect(req.request.method).toBe('GET');
    req.flush(mockToken);
  });

  it('getDisplayQueue() should GET display queue', () => {
    service.getDisplayQueue().subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/queue/display`);
    expect(req.request.method).toBe('GET');
    req.flush([mockToken]);
  });
});
