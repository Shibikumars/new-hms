import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MedicalRecordsApiService, VitalRecord, AllergyRecord, ProblemRecord, VisitNote } from './medical-records-api.service';
import { environment } from '../../../environments/environment';

describe('MedicalRecordsApiService', () => {
  let service: MedicalRecordsApiService;
  let httpMock: HttpTestingController;

  const mockVital: VitalRecord = {
    patientId: 1,
    temperature: 98.6,
    bloodPressure: '120/80',
    heartRate: 72,
  };

  const mockAllergy: AllergyRecord = {
    patientId: 1,
    allergen: 'Penicillin',
    reaction: 'Rash',
    severity: 'MILD',
    status: 'ACTIVE',
    notedDate: '2026-04-26',
  };

  const mockProblem: ProblemRecord = {
    patientId: 1,
    diagnosisCode: 'I10',
    title: 'Hypertension',
    clinicalStatus: 'ACTIVE',
    onsetDate: '2026-01-01',
  };

  const mockVisit: VisitNote = {
    patientId: 1,
    doctorId: 2,
    visitDate: '2026-04-26',
    subjective: 'Patient reports headache',
    objective: 'BP 130/85',
    assessment: 'Mild hypertension',
    plan: 'Continue medication',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(MedicalRecordsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getVitals() should GET patient vitals', () => {
    service.getVitals(1).subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/records/patient/1/vitals`);
    expect(req.request.method).toBe('GET');
    req.flush([mockVital]);
  });

  it('addVital() should POST vital record', () => {
    service.addVital(1, mockVital).subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/records/patient/1/vitals`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockVital);
    req.flush(mockVital);
  });

  it('getAllergies() should GET patient allergies', () => {
    service.getAllergies(1).subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/records/patient/1/allergies`);
    expect(req.request.method).toBe('GET');
    req.flush([mockAllergy]);
  });

  it('getProblems() should GET patient problems', () => {
    service.getProblems(1).subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/records/patient/1/problems`);
    expect(req.request.method).toBe('GET');
    req.flush([mockProblem]);
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

  it('searchIcd() should GET ICD codes', () => {
    service.searchIcd('fever').subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/icd/search'));
    expect(req.request.method).toBe('GET');
    req.flush([{ code: 'R50.9', description: 'Fever' }]);
  });

  it('searchIcdLocal() should return local ICD codes', (done) => {
    service.searchIcdLocal('fever').subscribe(results => {
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toContain('Fever');
      done();
    });
  });

  it('searchIcdLocal() should return empty for short query', (done) => {
    service.searchIcdLocal('f').subscribe(results => {
      expect(results.length).toBe(0);
      done();
    });
  });

  it('exportFhir() should GET FHIR export', () => {
    service.exportFhir(1).subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/records/fhir/1`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('downloadVisitPdf() should GET PDF blob', () => {
    service.downloadVisitPdf(5).subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/records/visits/5/pdf`);
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob());
  });

  it('addAllergy() should POST allergy record', () => {
    service.addAllergy(1, mockAllergy).subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/records/patient/1/allergies`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockAllergy);
    req.flush(mockAllergy);
  });
});
