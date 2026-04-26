import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PatientProfileService, PatientProfile } from './patient-profile.service';
import { environment } from '../../../environments/environment';

describe('PatientProfileService', () => {
  let service: PatientProfileService;
  let httpMock: HttpTestingController;

  const mockProfile: PatientProfile = {
    id: 1,
    userId: 42,
    firstName: 'John',
    lastName: 'Doe',
    fullName: 'John Doe',
    dob: '1990-01-01',
    age: 34,
    gender: 'MALE',
    bloodGroup: 'O+',
    phone: '1234567890',
    email: 'john@example.com',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(PatientProfileService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('create() should POST patient profile', () => {
    service.create(mockProfile).subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/patients/profiles`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockProfile);
    req.flush(mockProfile);
  });

  it('getById() should GET patient by ID', () => {
    service.getById(1).subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/patients/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockProfile);
  });

  it('getByUserId() should GET patient by user ID', () => {
    service.getByUserId(42).subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/patients/by-user/42`);
    expect(req.request.method).toBe('GET');
    req.flush(mockProfile);
  });

  it('getAll() should GET all patients', () => {
    service.getAll().subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/patients`);
    expect(req.request.method).toBe('GET');
    req.flush([mockProfile]);
  });
});
