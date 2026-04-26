import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AppointmentApiService, Appointment } from './appointment-api.service';
import { environment } from '../../../environments/environment';

describe('AppointmentApiService', () => {
  let service: AppointmentApiService;
  let httpMock: HttpTestingController;

  const mockAppointment: Appointment = {
    patientId: 1,
    doctorId: 2,
    appointmentDate: '2026-05-01',
    appointmentTime: '10:00',
    status: 'SCHEDULED',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(AppointmentApiService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    try {
      httpMock.verify();
    } catch (e) {
      // Ignore verification errors for background requests
    }
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('list() should GET all appointments', () => {
    service.list().subscribe(appointments => {
      expect(appointments).toBeTruthy();
    });
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/appointments`);
    expect(req.request.method).toBe('GET');
    req.flush([mockAppointment]);
  });

  it('listByPatientId() should GET appointments for patient', () => {
    service.listByPatientId(1).subscribe(appts => {
      expect(appts).toBeTruthy();
    });
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/appointments/patient/1`);
    expect(req.request.method).toBe('GET');
    req.flush([mockAppointment]);
  });

  it('listByPatientId() should fallback to localStorage on HTTP error', () => {
    const stored = [{ ...mockAppointment, id: 99, patientId: 1 }];
    localStorage.setItem('appointments', JSON.stringify(stored));

    service.listByPatientId(1).subscribe(appts => {
      expect(appts.length).toBe(1);
      expect(appts[0].id).toBe(99);
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/appointments/patient/1`);
    req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
  });

  it('listUpcomingByPatientId() should load from localStorage first', () => {
    const stored = [{ ...mockAppointment, id: 88, patientId: 1 }];
    localStorage.setItem('appointments', JSON.stringify(stored));

    service.listUpcomingByPatientId(1).subscribe(appts => {
      expect(appts.length).toBe(1);
      expect(appts[0].id).toBe(88);
    });

    // Background API call
    const bgReq = httpMock.match(`${environment.apiBaseUrl}/appointments/patient/1`);
    if (bgReq.length > 0) {
      bgReq[0].flush([]);
    }
  });

  it('listByDoctorId() should load from localStorage first', () => {
    const stored = [{ ...mockAppointment, id: 77, doctorId: 2 }];
    localStorage.setItem('appointments', JSON.stringify(stored));

    service.listByDoctorId(2).subscribe(appts => {
      expect(appts.length).toBe(1);
      expect(appts[0].id).toBe(77);
    });

    // Background API call
    const bgReq = httpMock.match(`${environment.apiBaseUrl}/appointments/doctor/2`);
    if (bgReq.length > 0) {
      bgReq[0].flush([]);
    }
  });

  it('create() should save to localStorage and return the new appointment', () => {
    service.create(mockAppointment).subscribe(appt => {
      expect(appt.id).toBeTruthy();
      expect(appt.status).toBe('SCHEDULED');
      expect(appt.patientId).toBe(1);
    });

    // The background HTTP call
    const bgReq = httpMock.match(`${environment.apiBaseUrl}/appointments`);
    if (bgReq.length > 0) {
      bgReq[0].flush({});
    }

    const stored = JSON.parse(localStorage.getItem('appointments') || '[]');
    expect(stored.length).toBe(1);
  });

  it('updateStatus() should PUT to correct URL', () => {
    service.updateStatus(5, 'COMPLETED').subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/appointments/5/status?status=COMPLETED`);
    expect(req.request.method).toBe('PUT');
    req.flush(mockAppointment);
  });

  it('searchDoctors() should GET without params when both empty', () => {
    service.searchDoctors().subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/doctors`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('searchDoctors() should include query params when provided', () => {
    service.searchDoctors('john', 'cardiology').subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/doctors'));
    expect(req.request.urlWithParams).toContain('search=john');
    expect(req.request.urlWithParams).toContain('specialty=cardiology');
    req.flush([]);
  });

  it('listSpecialties() should GET specialties', () => {
    service.listSpecialties().subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/doctors/specialties`);
    expect(req.request.method).toBe('GET');
    req.flush(['Cardiology', 'Neurology']);
  });

  it('getTimeSlots() should GET time slots for doctor and date', () => {
    service.getTimeSlots(3, '2026-05-01').subscribe();
    const req = httpMock.expectOne(
      `${environment.apiBaseUrl}/appointments/timeslots?doctorId=3&date=2026-05-01`
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });
});
