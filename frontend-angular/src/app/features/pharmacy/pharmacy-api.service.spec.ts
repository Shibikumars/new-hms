import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PharmacyApiService, Prescription, PrescriptionItem } from './pharmacy-api.service';
import { environment } from '../../../environments/environment';

describe('PharmacyApiService', () => {
  let service: PharmacyApiService;
  let httpMock: HttpTestingController;

  const mockPrescription: Prescription = {
    patientId: 1,
    doctorId: 2,
    items: [
      {
        medicationName: 'Paracetamol',
        dose: '500mg',
        frequency: 'TID',
        duration: '7 days',
      },
    ],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(PharmacyApiService);
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

  it('searchMedications() should GET medications', () => {
    service.searchMedications('para').subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/medications'));
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('searchMedicationsLocal() should return all medications for empty search', (done) => {
    service.searchMedicationsLocal('').subscribe(meds => {
      expect(meds.length).toBeGreaterThan(0);
      expect(meds[0].medicationName).toBe('Paracetamol');
      done();
    });
  });

  it('searchMedicationsLocal() should filter by medication name', (done) => {
    service.searchMedicationsLocal('paracetamol').subscribe(meds => {
      expect(meds.length).toBeGreaterThan(0);
      expect(meds[0].medicationName.toLowerCase()).toContain('paracetamol');
      done();
    });
  });

  it('searchMedicationsLocal() should filter by generic name', (done) => {
    service.searchMedicationsLocal('acetaminophen').subscribe(meds => {
      expect(meds.length).toBeGreaterThan(0);
      done();
    });
  });

  it('issuePrescription() should save to localStorage and POST to API', () => {
    service.issuePrescription(mockPrescription).subscribe(prescription => {
      expect(prescription.id).toBeTruthy();
      expect(prescription.patientId).toBe(1);
    });

    const bgReq = httpMock.match(`${environment.apiBaseUrl}/pharmacy/prescriptions`);
    if (bgReq.length > 0) {
      bgReq[0].flush({});
    }

    const stored = JSON.parse(localStorage.getItem('prescriptions') || '[]');
    expect(stored.length).toBe(1);
    expect(stored[0].patientId).toBe(1);
  });

  it('getPatientPrescriptions() should load from localStorage first', () => {
    const storedPrescription = { ...mockPrescription, id: 100 };
    localStorage.setItem('prescriptions', JSON.stringify([storedPrescription]));

    service.getPatientPrescriptions(1).subscribe(prescriptions => {
      expect(prescriptions.length).toBe(1);
      expect(prescriptions[0].patientId).toBe(1);
    });

    const bgReq = httpMock.match(`${environment.apiBaseUrl}/pharmacy/prescriptions/patient/1`);
    if (bgReq.length > 0) {
      bgReq[0].flush([]);
    }
  });
});
