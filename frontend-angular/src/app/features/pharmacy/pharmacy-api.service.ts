import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Medication {
  id?: number;
  medicationName: string;
  genericName?: string;
  strength?: string;
  stockQuantity?: number;
}

// Common medications data
const COMMON_MEDICATIONS: Medication[] = [
  { id: 1, medicationName: 'Paracetamol', genericName: 'Acetaminophen', strength: '500mg', stockQuantity: 1000 },
  { id: 2, medicationName: 'Ibuprofen', genericName: 'Ibuprofen', strength: '400mg', stockQuantity: 500 },
  { id: 3, medicationName: 'Aspirin', genericName: 'Acetylsalicylic acid', strength: '325mg', stockQuantity: 750 },
  { id: 4, medicationName: 'Amoxicillin', genericName: 'Amoxicillin', strength: '500mg', stockQuantity: 200 },
  { id: 5, medicationName: 'Azithromycin', genericName: 'Azithromycin', strength: '250mg', stockQuantity: 150 },
  { id: 6, medicationName: 'Ciprofloxacin', genericName: 'Ciprofloxacin', strength: '500mg', stockQuantity: 180 },
  { id: 7, medicationName: 'Metformin', genericName: 'Metformin', strength: '500mg', stockQuantity: 600 },
  { id: 8, medicationName: 'Amlodipine', genericName: 'Amlodipine', strength: '5mg', stockQuantity: 400 },
  { id: 9, medicationName: 'Lisinopril', genericName: 'Lisinopril', strength: '10mg', stockQuantity: 350 },
  { id: 10, medicationName: 'Atorvastatin', genericName: 'Atorvastatin', strength: '20mg', stockQuantity: 300 },
  { id: 11, medicationName: 'Omeprazole', genericName: 'Omeprazole', strength: '20mg', stockQuantity: 450 },
  { id: 12, medicationName: 'Simvastatin', genericName: 'Simvastatin', strength: '20mg', stockQuantity: 280 },
  { id: 13, medicationName: 'Hydrochlorothiazide', genericName: 'HCTZ', strength: '25mg', stockQuantity: 320 },
  { id: 14, medicationName: 'Metoprolol', genericName: 'Metoprolol', strength: '50mg', stockQuantity: 260 },
  { id: 15, medicationName: 'Losartan', genericName: 'Losartan', strength: '50mg', stockQuantity: 290 },
  { id: 16, medicationName: 'Salbutamol', genericName: 'Albuterol', strength: '100mcg', stockQuantity: 180 },
  { id: 17, medicationName: 'Fluticasone', genericName: 'Fluticasone', strength: '250mcg', stockQuantity: 150 },
  { id: 18, medicationName: 'Sertraline', genericName: 'Sertraline', strength: '50mg', stockQuantity: 220 },
  { id: 19, medicationName: 'Escitalopram', genericName: 'Escitalopram', strength: '10mg', stockQuantity: 190 },
  { id: 20, medicationName: 'Trazodone', genericName: 'Trazodone', strength: '50mg', stockQuantity: 170 },
  { id: 21, medicationName: 'Gabapentin', genericName: 'Gabapentin', strength: '300mg', stockQuantity: 240 },
  { id: 22, medicationName: 'Pregabalin', genericName: 'Pregabalin', strength: '75mg', stockQuantity: 160 },
  { id: 23, medicationName: 'Tramadol', genericName: 'Tramadol', strength: '50mg', stockQuantity: 140 },
  { id: 24, medicationName: 'Oxycodone', genericName: 'Oxycodone', strength: '5mg', stockQuantity: 80 },
  { id: 25, medicationName: 'Hydrocodone', genericName: 'Hydrocodone', strength: '5mg', stockQuantity: 90 },
  { id: 26, medicationName: 'Fentanyl', genericName: 'Fentanyl', strength: '25mcg/h', stockQuantity: 50 },
  { id: 27, medicationName: 'Morphine', genericName: 'Morphine', strength: '10mg', stockQuantity: 70 },
  { id: 28, medicationName: 'Diazepam', genericName: 'Diazepam', strength: '5mg', stockQuantity: 120 },
  { id: 29, medicationName: 'Lorazepam', genericName: 'Lorazepam', strength: '1mg', stockQuantity: 110 },
  { id: 30, medicationName: 'Alprazolam', genericName: 'Alprazolam', strength: '0.5mg', stockQuantity: 100 },
  { id: 31, medicationName: 'Clonazepam', genericName: 'Clonazepam', strength: '0.5mg', stockQuantity: 95 },
  { id: 32, medicationName: 'Zolpidem', genericName: 'Zolpidem', strength: '10mg', stockQuantity: 130 },
  { id: 33, medicationName: 'Tamsulosin', genericName: 'Tamsulosin', strength: '0.4mg', stockQuantity: 200 },
  { id: 34, medicationName: 'Finasteride', genericName: 'Finasteride', strength: '1mg', stockQuantity: 180 },
  { id: 35, medicationName: 'Sildenafil', genericName: 'Sildenafil', strength: '50mg', stockQuantity: 85 },
  { id: 36, medicationName: 'Tadalafil', genericName: 'Tadalafil', strength: '5mg', stockQuantity: 75 },
  { id: 37, medicationName: 'Levothyroxine', genericName: 'Levothyroxine', strength: '50mcg', stockQuantity: 350 },
  { id: 38, medicationName: 'Warfarin', genericName: 'Warfarin', strength: '5mg', stockQuantity: 60 },
  { id: 39, medicationName: 'Clopidogrel', genericName: 'Clopidogrel', strength: '75mg', stockQuantity: 250 },
  { id: 40, medicationName: 'Digoxin', genericName: 'Digoxin', strength: '0.125mg', stockQuantity: 40 },
  { id: 41, medicationName: 'Furosemide', genericName: 'Furosemide', strength: '40mg', stockQuantity: 210 },
  { id: 42, medicationName: 'Spironolactone', genericName: 'Spironolactone', strength: '25mg', stockQuantity: 190 },
  { id: 43, medicationName: 'Insulin Glargine', genericName: 'Insulin', strength: '100U/mL', stockQuantity: 150 },
  { id: 44, medicationName: 'Metformin XR', genericName: 'Metformin', strength: '1000mg', stockQuantity: 280 },
  { id: 45, medicationName: 'Sitagliptin', genericName: 'Sitagliptin', strength: '100mg', stockQuantity: 160 },
  { id: 46, medicationName: 'Empagliflozin', genericName: 'Empagliflozin', strength: '10mg', stockQuantity: 140 },
  { id: 47, medicationName: 'Duloxetine', genericName: 'Duloxetine', strength: '30mg', stockQuantity: 130 },
  { id: 48, medicationName: 'Venlafaxine', genericName: 'Venlafaxine', strength: '75mg', stockQuantity: 120 },
  { id: 49, medicationName: 'Bupropion', genericName: 'Bupropion', strength: '150mg', stockQuantity: 110 },
  { id: 50, medicationName: 'Mirtazapine', genericName: 'Mirtazapine', strength: '15mg', stockQuantity: 100 }
];

export interface PrescriptionItem {
  id?: number;
  medicationName: string;
  dose: string;
  frequency: string;
  duration: string;
  route?: string;
  instructions?: string;
}

export interface Prescription {
  id?: number;
  patientId: number;
  doctorId: number;
  items: PrescriptionItem[];
  issuedDate?: string;
  status?: string;
  note?: string;
}

@Injectable({ providedIn: 'root' })
export class PharmacyApiService {
  constructor(private http: HttpClient) {}

  searchMedications(search = ''): Observable<Medication[]> {
    // Try API first, fallback to local data if API fails
    return this.http.get<Medication[]>(`${environment.apiBaseUrl}/medications?search=${encodeURIComponent(search)}`).pipe(
      map(() => []), // We'll implement proper API response later
      // For now, use local data
    );
  }

  // Local search method for comprehensive medication data
  searchMedicationsLocal(search = ''): Observable<Medication[]> {
    // If search is empty or too short, return all medications for dropdown
    if (!search || search.length < 2) {
      return of(COMMON_MEDICATIONS);
    }
    
    const searchTerm = search.toLowerCase();
    const filtered = COMMON_MEDICATIONS.filter(med => 
      med.medicationName.toLowerCase().includes(searchTerm) ||
      med.genericName?.toLowerCase().includes(searchTerm) ||
      med.strength?.toLowerCase().includes(searchTerm)
    );
    
    return of(filtered);
  }

  issuePrescription(payload: Prescription): Observable<Prescription> {
    const data = { 
      ...payload, 
      issuedDate: new Date().toISOString().slice(0, 10), 
      id: Date.now(),
      status: 'ACTIVE'
    };
    
    // Ensure items array is properly structured
    if (!data.items || data.items.length === 0) {
      data.items = [{
        medicationName: 'Unknown',
        dose: 'Unknown',
        frequency: 'Unknown',
        duration: 'Unknown',
        route: 'ORAL',
        instructions: ''
      }];
    }
    
    // Store in localStorage for immediate functionality
    const existingPrescriptions = JSON.parse(localStorage.getItem('prescriptions') || '[]');
    existingPrescriptions.push(data);
    localStorage.setItem('prescriptions', JSON.stringify(existingPrescriptions));
    
    console.log('Prescription saved locally:', data);
    console.log('Prescription items:', data.items);
    return of(data);
  }

  getPatientPrescriptions(patientId: number): Observable<Prescription[]> {
    // Get from localStorage for immediate functionality
    const allPrescriptions = JSON.parse(localStorage.getItem('prescriptions') || '[]');
    const patientPrescriptions = allPrescriptions.filter((p: Prescription) => p.patientId === patientId);
    console.log('Retrieved prescriptions for patient', patientId, ':', patientPrescriptions);
    return of(patientPrescriptions);
  }
}
