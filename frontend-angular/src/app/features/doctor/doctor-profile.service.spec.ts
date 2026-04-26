import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DoctorProfileService, DoctorProfile } from './doctor-profile.service';
import { environment } from '../../../environments/environment';

describe('DoctorProfileService', () => {
  let service: DoctorProfileService;
  let httpMock: HttpTestingController;

  const mockProfile: DoctorProfile = {
    id: 1,
    fullName: 'Dr. John Doe',
    specialization: 'Cardiology',
    phone: '1234567890',
    email: 'john@example.com',
    qualifications: 'MBBS, MD',
    yearsOfExperience: 10,
    consultationFee: 500
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(DoctorProfileService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('create() should POST doctor profile', () => {
    service.create(mockProfile).subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/doctors`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockProfile);
    req.flush(mockProfile);
  });

  it('getById() should GET doctor by ID', () => {
    service.getById(1).subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/doctors/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockProfile);
  });

  it('update() should PUT doctor profile', () => {
    service.update(1, mockProfile).subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/doctors/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(mockProfile);
    req.flush(mockProfile);
  });

  it('getSpecialties() should GET specialties list', () => {
    service.getSpecialties().subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/doctors/specialties`);
    expect(req.request.method).toBe('GET');
    req.flush(['Cardiology', 'Neurology', 'Orthopedics']);
  });
});
