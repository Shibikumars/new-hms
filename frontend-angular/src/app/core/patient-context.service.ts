import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface PatientContext {
  id: number;
  name: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class PatientContextService {
  private activePatientSubject = new BehaviorSubject<PatientContext | null>(null);
  activePatient$ = this.activePatientSubject.asObservable();

  setPatient(patient: PatientContext | null): void {
    this.activePatientSubject.next(patient);
  }

  getActivePatient(): PatientContext | null {
    return this.activePatientSubject.value;
  }

  clear(): void {
    this.activePatientSubject.next(null);
  }
}
