import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RecordsApiService, VisitNote, VitalRecord, AllergyRecord, ProblemRecord } from './records-api.service';
import { environment } from '../../../environments/environment';

describe('RecordsApiService', () => {
  let service: RecordsApiService;
  let httpMock: HttpTestingController;

  const mockVisit: VisitNote = {
    patientId: 1,
    doctorId: 2,
    visitDate: '2026-04-26',
    notes: 'Patient reports headache',
    diagnosisCode: 'R51',
  };

  const mockVital: VitalRecord = {
    patientId: 1,
    readingDate: '2026-04-26',
    bloodPressure: '120/80',
    heartRate: 72,
    spo2: 98,
  };

  const mockAllergy: AllergyRecord = {
    patientId: 1,
    allergen: 'Penicillin',
    reaction: 'Rash',
    severity: 'MILD',
  };

  const mockProblem: ProblemRecord = {
    patientId: 1,
    diagnosisCode: 'I10',
    title: 'Hypertension',
    clinicalStatus: 'ACTIVE',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(RecordsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getVisits() should GET patient visits', () => {
    service.getVisits(1).subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/records/patient/1/visits`);
    expect(req.request.method).toBe('GET');
    req.flush([mockVisit]);
  });

  it('createVisit() should POST visit note', () => {
    service.createVisit(mockVisit).subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/records/visits`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockVisit);
    req.flush(mockVisit);
  });

  it('getVitals() should GET patient vitals', () => {
    service.getVitals(1).subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/records/patient/1/vitals`);
    expect(req.request.method).toBe('GET');
    req.flush([mockVital]);
  });

  it('searchIcd() should GET ICD codes', () => {
    service.searchIcd('fever').subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/icd/search'));
    expect(req.request.method).toBe('GET');
    req.flush([{ code: 'R50.9', description: 'Fever' }]);
  });

  it('getAllergies() should GET patient allergies', () => {
    service.getAllergies(1).subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/records/patient/1/allergies`);
    expect(req.request.method).toBe('GET');
    req.flush([mockAllergy]);
  });

  it('addAllergy() should POST allergy record', () => {
    service.addAllergy(1, mockAllergy).subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/records/patient/1/allergies`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockAllergy);
    req.flush(mockAllergy);
  });

  it('getProblems() should GET patient problems', () => {
    service.getProblems(1).subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/records/patient/1/problems`);
    expect(req.request.method).toBe('GET');
    req.flush([mockProblem]);
  });

  it('addProblem() should POST problem record', () => {
    service.addProblem(1, mockProblem).subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/records/patient/1/problems`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockProblem);
    req.flush(mockProblem);
  });
});
