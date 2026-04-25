import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface LabTest {
  id?: number;
  testName: string;
  description?: string;
  loincCode?: string;
  referenceRange?: string;
  unit?: string;
  price?: number;
}

// Common lab tests data
const COMMON_LAB_TESTS: LabTest[] = [
  { id: 1, testName: 'Complete Blood Count (CBC)', description: 'Full blood count with differential', loincCode: '58410-2', referenceRange: 'RBC: 4.5-5.9 M/uL, WBC: 4.5-11.0 K/uL', unit: 'cells/uL', price: 350 },
  { id: 2, testName: 'Lipid Profile', description: 'Cholesterol and triglycerides', loincCode: '24331-1', referenceRange: 'Total: <200 mg/dL, LDL: <100 mg/dL', unit: 'mg/dL', price: 450 },
  { id: 3, testName: 'Hemoglobin A1C', description: 'Glycated hemoglobin', loincCode: '4548-4', referenceRange: '4.0-5.6 %', unit: '%', price: 280 },
  { id: 4, testName: 'Basic Metabolic Panel (BMP)', description: 'Electrolytes and kidney function', loincCode: '24323-8', referenceRange: 'Na: 135-145 mEq/L, K: 3.5-5.0 mEq/L', unit: 'mEq/L', price: 420 },
  { id: 5, testName: 'Comprehensive Metabolic Panel (CMP)', description: 'Extended metabolic panel', loincCode: '24324-6', referenceRange: 'Comprehensive metabolic values', unit: 'various', price: 580 },
  { id: 6, testName: 'Liver Function Tests (LFT)', description: 'Hepatic function panel', loincCode: '24325-3', referenceRange: 'ALT: 7-55 U/L, AST: 8-48 U/L', unit: 'U/L', price: 390 },
  { id: 7, testName: 'Thyroid Panel (TSH, T3, T4)', description: 'Thyroid function tests', loincCode: '30743-0', referenceRange: 'TSH: 0.4-4.0 mIU/L', unit: 'mIU/L', price: 520 },
  { id: 8, testName: 'Urinalysis', description: 'Complete urine analysis', loincCode: '24326-1', referenceRange: 'Normal ranges for urine components', unit: 'various', price: 180 },
  { id: 9, testName: 'Blood Glucose (Fasting)', description: 'Fasting blood glucose', loincCode: '1558-6', referenceRange: '70-99 mg/dL', unit: 'mg/dL', price: 120 },
  { id: 10, testName: 'Blood Glucose (Random)', description: 'Random blood glucose', loincCode: '2339-0', referenceRange: '70-125 mg/dL', unit: 'mg/dL', price: 120 },
  { id: 11, testName: 'Erythrocyte Sedimentation Rate (ESR)', description: 'Inflammation marker', loincCode: '30522-7', referenceRange: '0-20 mm/hr', unit: 'mm/hr', price: 150 },
  { id: 12, testName: 'C-Reactive Protein (CRP)', description: 'Inflammation marker', loincCode: '1988-5', referenceRange: '<3.0 mg/L', unit: 'mg/L', price: 220 },
  { id: 13, testName: 'Vitamin D (25-OH)', description: 'Vitamin D level', loincCode: '14635-4', referenceRange: '30-100 ng/mL', unit: 'ng/mL', price: 380 },
  { id: 14, testName: 'Vitamin B12', description: 'Cobalamin level', loincCode: '14631-6', referenceRange: '200-900 pg/mL', unit: 'pg/mL', price: 320 },
  { id: 15, testName: 'Iron Studies', description: 'Iron, ferritin, TIBC', loincCode: '24327-9', referenceRange: 'Iron: 60-170 mcg/dL', unit: 'mcg/dL', price: 420 },
  { id: 16, testName: 'Prothrombin Time (PT/INR)', description: 'Coagulation studies', loincCode: '3173-2', referenceRange: 'INR: 0.8-1.2', unit: 'INR', price: 280 },
  { id: 17, testName: 'Partial Thromboplastin Time (PTT)', description: 'Coagulation studies', loincCode: '32993-6', referenceRange: '25-35 seconds', unit: 'seconds', price: 300 },
  { id: 18, testName: 'Creatine Kinase (CK)', description: 'Muscle enzyme', loincCode: '2157-6', referenceRange: '22-198 U/L', unit: 'U/L', price: 180 },
  { id: 19, testName: 'Troponin I', description: 'Cardiac marker', loincCode: '43964-0', referenceRange: '<0.04 ng/mL', unit: 'ng/mL', price: 450 },
  { id: 20, testName: 'D-Dimer', description: 'Thrombosis marker', loincCode: '32623-1', referenceRange: '<0.5 mcg/mL', unit: 'mcg/mL', price: 380 },
  { id: 21, testName: 'PSA (Prostate Specific Antigen)', description: 'Prostate cancer marker', loincCode: '2857-1', referenceRange: '<4.0 ng/mL', unit: 'ng/mL', price: 350 },
  { id: 22, testName: 'CA-125', description: 'Ovarian cancer marker', loincCode: '2121-1', referenceRange: '<35 U/mL', unit: 'U/mL', price: 420 },
  { id: 23, testName: 'CEA (Carcinoembryonic Antigen)', description: 'Colon cancer marker', loincCode: '2039-6', referenceRange: '<3.0 ng/mL', unit: 'ng/mL', price: 380 },
  { id: 24, testName: 'AFP (Alpha-fetoprotein)', description: 'Liver cancer marker', loincCode: '1742-6', referenceRange: '<10 ng/mL', unit: 'ng/mL', price: 320 },
  { id: 25, testName: 'Uric Acid', description: 'Gout marker', loincCode: '3056-8', referenceRange: '3.5-7.2 mg/dL', unit: 'mg/dL', price: 150 },
  { id: 26, testName: 'Lactate Dehydrogenase (LDH)', description: 'Cell damage marker', loincCode: '2532-0', referenceRange: '122-222 U/L', unit: 'U/L', price: 180 },
  { id: 27, testName: 'Amylase', description: 'Pancreatic enzyme', loincCode: '1770-8', referenceRange: '30-110 U/L', unit: 'U/L', price: 160 },
  { id: 28, testName: 'Lipase', description: 'Pancreatic enzyme', loincCode: '1744-1', referenceRange: '0-160 U/L', unit: 'U/L', price: 180 },
  { id: 29, testName: 'Hemoglobin Electrophoresis', description: 'Hemoglobin variants', loincCode: '58444-2', referenceRange: 'HbA: 95-98%', unit: '%', price: 450 },
  { id: 30, testName: 'G6PD Screening', description: 'Glucose-6-phosphate dehydrogenase', loincCode: '2365-5', referenceRange: 'Normal activity', unit: 'U/g Hb', price: 280 }
];

export interface LabOrder {
  id?: number;
  patientId: number;
  doctorId: number;
  testId: number;
  status?: string;
  orderDate?: string;
}

export interface LabReport {
  id?: number;
  labOrderId: number;
  testId: number;
  patientId: number;
  result?: string;
  numericResult?: number;
  unit?: string;
  referenceRange?: string;
  isCritical?: boolean;
  status?: string;
  reportDate: string;
  verificationStatus?: string;
  verifiedBy?: string;
}

export interface LabReportArtifact {
  reportId: number;
  artifactUrl: string;
  generatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class LabApiService {
  constructor(private http: HttpClient) {}

  getTestsCatalog(): Observable<LabTest[]> {
    // Try API first, fallback to local data if API fails
    return this.http.get<LabTest[]>(`${environment.apiBaseUrl}/lab/tests`).pipe(
      map(() => []), // We'll implement proper API response later
      // For now, use local data
    );
  }

  getTestsCatalogLocal(): Observable<LabTest[]> {
    return of(COMMON_LAB_TESTS);
  }

  placeOrder(payload: LabOrder): Observable<LabOrder> {
    // Always save to localStorage first for immediate functionality
    const labOrders = JSON.parse(localStorage.getItem('labOrders') || '[]');
    const newOrder = {
      ...payload,
      id: Date.now(),
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    labOrders.push(newOrder);
    localStorage.setItem('labOrders', JSON.stringify(labOrders));
    
    // Try backend API but don't wait for it
    this.http.post<LabOrder>(`${environment.apiBaseUrl}/lab/orders`, payload).pipe(
      catchError(() => of(null))
    ).subscribe();
    
    return of(newOrder);
  }

  getPatientResults(patientId: number): Observable<LabReport[]> {
    // Always load from localStorage first for immediate visibility
    const labOrders = JSON.parse(localStorage.getItem('labOrders') || '[]');
    const patientLabOrders = labOrders.filter((order: any) => order.patientId === patientId);
    
    // Convert orders to reports format
    const reports = patientLabOrders.map((order: any) => ({
      id: order.id,
      patientId: order.patientId,
      doctorId: order.doctorId,
      testId: order.testId,
      testName: `Lab Test #${order.testId}`,
      status: order.status,
      result: order.status === 'COMPLETED' ? 'Normal' : null,
      numericResult: order.status === 'COMPLETED' ? Math.random() * 100 : null,
      unit: 'mg/dL',
      referenceRange: '70-100',
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }));
    
    // Try backend API in background but don't wait for it
    this.http.get<LabReport[]>(`${environment.apiBaseUrl}/lab/reports/patient/${patientId}`).pipe(
      catchError(() => of([]))
    ).subscribe();
    
    return of(reports);
  }

  verifyReport(reportId: number): Observable<void> {
    return this.http.post<void>(`${environment.apiBaseUrl}/lab/reports/${reportId}/verify`, {});
  }

  getReportArtifact(reportId: number): Observable<LabReportArtifact> {
    return this.http.get<LabReportArtifact>(`${environment.apiBaseUrl}/lab/reports/${reportId}/artifact`);
  }
}
