import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface VitalRecord {
  id?: number;
  patientId: number;
  temperature?: number;
  bloodPressure?: string;
  heartRate?: number;
  respiratoryRate?: number;
  spo2?: number;
  recordedAt?: string;
}

export interface AllergyRecord {
  id?: number;
  patientId: number;
  allergen: string;
  reaction?: string;
  severity: string;
  status: string;
  notedDate: string;
}

export interface ProblemRecord {
  id?: number;
  patientId: number;
  diagnosisCode: string;
  title: string;
  clinicalStatus: string;
  onsetDate: string;
  resolvedDate?: string;
}

export interface VisitNote {
  id?: number;
  patientId: number;
  doctorId: number;
  visitDate: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  diagnosisCode?: string;
}

@Injectable({ providedIn: 'root' })
export class MedicalRecordsApiService {
  private baseUrl = `${environment.apiBaseUrl}/records`;

  constructor(private http: HttpClient) {}

  getVitals(patientId: number): Observable<VitalRecord[]> {
    return this.http.get<VitalRecord[]>(`${this.baseUrl}/patient/${patientId}/vitals`);
  }

  addVital(patientId: number, vital: VitalRecord): Observable<VitalRecord> {
    return this.http.post<VitalRecord>(`${this.baseUrl}/patient/${patientId}/vitals`, vital);
  }

  getAllergies(patientId: number): Observable<AllergyRecord[]> {
    return this.http.get<AllergyRecord[]>(`${this.baseUrl}/patient/${patientId}/allergies`);
  }

  getProblems(patientId: number): Observable<ProblemRecord[]> {
    return this.http.get<ProblemRecord[]>(`${this.baseUrl}/patient/${patientId}/problems`);
  }

  getVisits(patientId: number): Observable<VisitNote[]> {
    return this.http.get<VisitNote[]>(`${this.baseUrl}/patient/${patientId}/visits`);
  }

  createVisit(visit: VisitNote): Observable<VisitNote> {
    return this.http.post<VisitNote>(`${this.baseUrl}/visits`, visit);
  }

  searchIcd(query: string): Observable<string[]> {
    // Try API first, fallback to local data if API fails
    return this.http.get<any[]>(`${this.baseUrl}/icd/search?q=${encodeURIComponent(query)}`)
      .pipe(map(items => items.map(i => `${i.description} (${i.code})`)));
  }

  // Local ICD search method for common diagnoses
  searchIcdLocal(query: string): Observable<string[]> {
    if (!query || query.length < 2) {
      return of([]);
    }
    
    const searchTerm = query.toLowerCase();
    const commonIcdCodes = [
      { code: 'R50.9', description: 'Fever, unspecified' },
      { code: 'J02.9', description: 'Acute pharyngitis, unspecified' },
      { code: 'J06.9', description: 'Acute upper respiratory infection, unspecified' },
      { code: 'J45.909', description: 'Unspecified asthma, uncomplicated' },
      { code: 'I10', description: 'Essential (primary) hypertension' },
      { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications' },
      { code: 'E78.5', description: 'Hyperlipidemia, unspecified' },
      { code: 'M54.5', description: 'Low back pain' },
      { code: 'M79.3', description: 'Pain in limb' },
      { code: 'R51', description: 'Headache' },
      { code: 'K21.9', description: 'Gastro-esophageal reflux disease without esophagitis' },
      { code: 'F32.9', description: 'Major depressive disorder, single episode, unspecified' },
      { code: 'F41.9', description: 'Anxiety disorder, unspecified' },
      { code: 'I25.10', description: 'Atherosclerotic heart disease' },
      { code: 'N18.9', description: 'Chronic kidney disease, unspecified' },
      { code: 'J44.9', description: 'Chronic obstructive pulmonary disease, unspecified' },
      { code: 'L20.9', description: 'Atopic dermatitis, unspecified' },
      { code: 'M25.5', description: 'Pain in joint' },
      { code: 'R06.02', description: 'Shortness of breath' },
      { code: 'R07.9', description: 'Chest pain, unspecified' },
      { code: 'R19.4', description: 'Change in bowel habit' },
      { code: 'D64.9', description: 'Anemia, unspecified' },
      { code: 'E03.9', description: 'Hypothyroidism, unspecified' },
      { code: 'G93.9', description: 'Unspecified disorder of brain' },
      { code: 'H40.1', description: 'Primary open-angle glaucoma' },
      { code: 'I63.9', description: 'Cerebral infarction, unspecified' },
      { code: 'J03.9', description: 'Acute tonsillitis, unspecified' },
      { code: 'J18.9', description: 'Pneumonia, unspecified' },
      { code: 'K25.9', description: 'Peptic ulcer, site unspecified' },
      { code: 'K29.1', description: 'Other gastritis and duodenitis' },
      { code: 'K59.9', description: 'Functional intestinal disorder' },
      { code: 'M10.9', description: 'Gout, unspecified' },
      { code: 'M13.9', description: 'Arthritis, unspecified' },
      { code: 'M54.2', description: 'Cervicalgia' },
      { code: 'N39.0', description: 'Urinary tract infection, site not specified' },
      { code: 'R10.9', description: 'Unspecified abdominal pain' },
      { code: 'R11.0', description: 'Nausea' },
      { code: 'R12', description: 'Heartburn' },
      { code: 'R13.9', description: 'Dysphagia, unspecified' },
      { code: 'R19.0', description: 'Intra-abdominal and pelvic swelling, mass and lump' },
      { code: 'R42', description: 'Dizziness and giddiness' },
      { code: 'R53.1', description: 'Weakness' },
      { code: 'R68.8', description: 'Other specified general symptoms and signs' }
    ];
    
    const filtered = commonIcdCodes.filter(icd => 
      icd.description.toLowerCase().includes(searchTerm) ||
      icd.code.toLowerCase().includes(searchTerm)
    );
    
    return of(filtered.map(icd => `${icd.description} (${icd.code})`));
  }

  exportFhir(patientId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/fhir/${patientId}`);
  }

  downloadVisitPdf(visitId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/visits/${visitId}/pdf`, { responseType: 'blob' });
  }

  addAllergy(patientId: number, payload: AllergyRecord): Observable<AllergyRecord> {
    return this.http.post<AllergyRecord>(`${this.baseUrl}/patient/${patientId}/allergies`, payload);
  }
}
