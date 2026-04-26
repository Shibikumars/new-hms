import { TestBed } from '@angular/core/testing';
import { PatientContextService, PatientContext } from './patient-context.service';

describe('PatientContextService', () => {
  let service: PatientContextService;

  const mockPatient: PatientContext = {
    id: 1,
    name: 'John Doe',
    role: 'PATIENT',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PatientContextService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('activePatient$ should emit null initially', (done) => {
    service.activePatient$.subscribe(patient => {
      expect(patient).toBeNull();
      done();
    });
  });

  it('setPatient() should update activePatient$', (done) => {
    service.setPatient(mockPatient);
    service.activePatient$.subscribe(patient => {
      if (patient !== null) {
        expect(patient).toEqual(mockPatient);
        done();
      }
    });
  });

  it('getActivePatient() should return null before any patient is set', () => {
    expect(service.getActivePatient()).toBeNull();
  });

  it('getActivePatient() should return current patient after setPatient()', () => {
    service.setPatient(mockPatient);
    expect(service.getActivePatient()).toEqual(mockPatient);
  });

  it('clear() should reset patient to null', () => {
    service.setPatient(mockPatient);
    service.clear();
    expect(service.getActivePatient()).toBeNull();
  });

  it('setPatient(null) should clear the context', (done) => {
    service.setPatient(mockPatient);
    service.setPatient(null);
    service.activePatient$.subscribe(patient => {
      expect(patient).toBeNull();
      done();
    });
  });
});
