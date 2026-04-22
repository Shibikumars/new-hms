import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Subscription, forkJoin } from 'rxjs';
import { Medication, PharmacyApiService, Prescription } from './pharmacy-api.service';
import { AllergyRecord, RecordsApiService } from '../records/records-api.service';
import { PatientContextService } from '../../core/patient-context.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-pharmacy',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="container overflow-hidden">
      <div class="hero">
        <div>
          <h2>E-Prescribing Suite</h2>
          <p class="subtitle">Digital Rx pad with real-time allergy cross-referencing and safety verification.</p>
        </div>
        <div class="pill">Clinical Pharmacology</div>
      </div>

      <div class="success" *ngIf="successMessage" role="status" aria-live="polite">{{ successMessage }}</div>

      <!-- Active Patient context -->
      <div class="ctx-banner" *ngIf="activePatient; else noPatient">
        <div class="ctx-info">
          <div class="avatar">{{ activePatient.name.charAt(0) }}</div>
          <div>
            <strong>{{ activePatient.name }}</strong>
            <div class="small">Chart #{{ activePatient.id }} · Clinical Session Active</div>
          </div>
        </div>
        <div class="ctx-allergies">
           <label>Documented Allergies:</label>
           <div class="allergy-chips">
              <span class="chip" *ngFor="let a of patientAllergies" [class.severe]="a.severity === 'SEVERE'">
                {{ a.allergen }}
              </span>
              <span class="muted small" *ngIf="patientAllergies.length === 0">No known allergies</span>
           </div>
        </div>
      </div>

      <ng-template #noPatient>
        <div class="warning-alert">
          <div class="icon">⚠️</div>
          <div>No patient context selected. Please select a patient from the clinical dashboard to manage therapy.</div>
        </div>
      </ng-template>

      <div class="workspace" *ngIf="activePatient">
        <!-- Sidebar: Med search & Safety Analysis -->
        <div class="sidebar">
          <section class="card med-search shadow-glass">
            <h3>Pharmacopeia Search</h3>
            <div class="search-wrap">
              <input type="text" [(ngModel)]="search" (input)="onSearch($event)" placeholder="Search medications..." />
            </div>
            
            <div class="search-results custom-scroll">
              <div class="loading-spinner" *ngIf="loadingMedications">Analyzing Catalog...</div>
              <ul class="med-list" *ngIf="!loadingMedications">
                <li *ngFor="let med of medications" (click)="selectMedication(med)">
                  <div class="med-name">{{ med.medicationName }}</div>
                  <div class="med-meta">{{ med.genericName }} · {{ med.strength }}</div>
                </li>
              </ul>
            </div>
          </section>

          <section class="card safety-check shadow-glass" [class.alert]="allergyWarning">
             <div class="safety-header">
               <h3>Clinical Safety Link</h3>
               <div class="status-dot" [class.active]="!allergyWarning"></div>
             </div>
             <div class="safety-content">
                <div *ngIf="!selectedMedication" class="muted small">Select a medication to perform real-time allergy cross-referencing.</div>
                <div *ngIf="selectedMedication && !allergyWarning" class="safe">
                   ✓ No matches found for <strong>{{ selectedMedication.medicationName }}</strong> against patient's allergy profile.
                </div>
                <div *ngIf="allergyWarning" class="danger">
                   <div class="danger-title">⚠️ ALLERGY INTERACTION</div>
                   <p>Warning: <strong>{{ selectedMedication?.medicationName }}</strong> may interact with documented allergy: <strong>{{ allergyWarning }}</strong>.</p>
                </div>
             </div>
          </section>
        </div>

        <!-- Main: The Rx Pad & History -->
        <div class="main-content">
          <section class="card rx-pad shadow-glass">
             <div class="pad-header">
                <h3>Digital Prescription Pad</h3>
                <span class="rx-symbol">℞</span>
             </div>
             
             <form [formGroup]="form" (ngSubmit)="issue()" class="pad-body">
                <div class="pad-row">
                   <div class="pad-field">
                      <label>Medication</label>
                      <input type="text" formControlName="medicationName" readonly />
                   </div>
                   <div class="pad-field flex-2">
                      <label>Sig (Dose & Frequency)</label>
                      <div class="split-input">
                         <input type="text" formControlName="dose" placeholder="500mg" />
                         <input type="text" formControlName="frequency" placeholder="BID (2x daily)" />
                      </div>
                   </div>
                </div>

                <div class="pad-row">
                   <div class="pad-field">
                      <label>Duration</label>
                      <input type="text" formControlName="duration" placeholder="7 days" />
                   </div>
                   <div class="pad-field">
                      <label>Route</label>
                      <select formControlName="route">
                         <option value="ORAL">Oral</option>
                         <option value="IV">Intravenous</option>
                         <option value="IM">Intramuscular</option>
                         <option value="TOPICAL">Topical</option>
                         <option value="INHALATION">Inhalation</option>
                      </select>
                   </div>
                </div>

                <div class="pad-field">
                   <label>Pharmacist Instructions</label>
                   <textarea formControlName="instructions" rows="2" placeholder="e.g. Take with food, avoid alcohol..."></textarea>
                </div>

                <div class="pad-footer">
                   <div class="doc-sig">
                      <div class="sig-line"></div>
                      <div class="sig-label">Digitally Signed by Dr. {{ doctorName }}</div>
                   </div>
                   <button type="submit" class="signature-btn" [disabled]="form.invalid || issuingPrescription || allergyWarning">
                      {{ issuingPrescription ? 'Issuing...' : 'Issue Prescription' }}
                   </button>
                </div>
             </form>
          </section>

          <section class="card history shadow-glass">
             <div class="history-header">
                <h3>Active Therapy & Prescription History</h3>
                <button class="refresh-btn" (click)="loadHistory()">Sync Records</button>
             </div>
             
             <div class="timeline custom-scroll">
                <div class="empty-state" *ngIf="history.length === 0 && !loadingHistory">No current medication orders.</div>
                <div class="loading-state" *ngIf="loadingHistory">Syncing clinical records...</div>
                
                <div class="timeline-item" *ngFor="let item of history">
                   <div class="time-meta">
                      <span class="date">{{ item.issuedDate }}</span>
                      <span class="badge" [class.active]="item.status === 'ACTIVE'">{{ item.status }}</span>
                   </div>
                   <div class="time-body">
                      <div class="med-info">
                         <strong>{{ item.medicationName }}</strong>
                         <span class="details">{{ item.dose }} · {{ item.frequency }} · {{ item.route }}</span>
                      </div>
                      <div class="inst" *ngIf="item.instructions"><em>Note: {{ item.instructions }}</em></div>
                   </div>
                </div>
             </div>
          </section>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .hero { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
    .subtitle { margin-top: 0.4rem; color: var(--text-soft); }
    .pill { border: 1px solid rgba(0, 212, 170, 0.4); color: var(--primary); background: rgba(0, 212, 170, 0.1); border-radius: 99px; padding: 0.3rem 0.8rem; font-size: 0.75rem; font-weight: 700; }

    .success { background: rgba(34, 197, 94, 0.1); color: #80e8a6; padding: 0.8rem; border-radius: 10px; border: 1px solid rgba(34, 197, 94, 0.3); margin-bottom: 1.5rem; }
    
    .ctx-banner { 
      display: flex; justify-content: space-between; align-items: center; 
      background: rgba(109, 124, 255, 0.1); border: 1px solid rgba(109, 124, 255, 0.3); 
      border-radius: 16px; padding: 1.2rem; margin-bottom: 2rem; backdrop-filter: blur(10px);
    }
    .ctx-info { display: flex; gap: 1rem; align-items: center; }
    .avatar { width: 42px; height: 42px; background: var(--primary); color: #000; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.2rem; }
    .ctx-allergies label { display: block; font-size: 0.7rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.4rem; }
    .allergy-chips { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .chip { font-size: 0.7rem; padding: 0.2rem 0.6rem; border-radius: 4px; background: rgba(255,255,255,0.05); border: 1px solid var(--border); }
    .chip.severe { background: rgba(255, 90, 114, 0.1); color: #ff9ca9; border-color: rgba(255, 90, 114, 0.3); }

    .warning-alert { display: flex; gap: 1rem; align-items: center; padding: 2rem; background: rgba(255, 90, 114, 0.05); border: 1px solid rgba(255, 90, 114, 0.2); border-radius: 16px; color: #ff9ca9; }

    .workspace { display: grid; grid-template-columns: 340px 1fr; gap: 1.5rem; }
    .shadow-glass { background: rgba(26, 39, 64, 0.6); backdrop-filter: blur(20px); border: 1px solid var(--border); border-radius: 16px; padding: 1.5rem; }
    .card h3 { font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1.2rem; }

    /* Sidebar */
    .search-wrap input { width: 100%; padding: 0.8rem; background: rgba(0,0,0,0.2); border: 1px solid var(--border); border-radius: 10px; color: #fff; margin-bottom: 1rem; }
    .search-results { max-height: 250px; overflow-y: auto; }
    .med-list { list-style: none; padding: 0; }
    .med-list li { padding: 0.8rem; border-bottom: 1px solid rgba(255,255,255,0.05); cursor: pointer; }
    .med-list li:hover { background: rgba(0, 212, 170, 0.1); }
    .med-name { font-weight: 700; font-size: 0.9rem; }
    .med-meta { font-size: 0.75rem; color: var(--text-soft); }

    .safety-check { margin-top: 1.5rem; border-left: 4px solid var(--primary); transition: 0.3s; }
    .safety-check.alert { border-color: #ff5a72; background: rgba(255, 90, 114, 0.05); }
    .safety-header { display: flex; justify-content: space-between; align-items: baseline; }
    .status-dot { width: 10px; height: 10px; border-radius: 50%; border: 2px solid var(--border); }
    .status-dot.active { background: #80e8a6; border-color: rgba(34, 197, 94, 0.4); box-shadow: 0 0 8px #80e8a6; }
    .safety-content { font-size: 0.85rem; margin-top: 0.5rem; line-height: 1.4; }
    .danger { color: #ff9ca9; }
    .danger-title { font-weight: 800; font-size: 0.75rem; margin-bottom: 0.4rem; }

    /* Rx Pad */
    .rx-pad { margin-bottom: 1.5rem; position: relative; }
    .pad-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); margin-bottom: 1.5rem; padding-bottom: 0.5rem; }
    .rx-symbol { font-size: 2rem; font-style: italic; color: var(--primary); font-family: serif; }
    .pad-body { display: grid; gap: 1.2rem; }
    .pad-row { display: grid; grid-template-columns: 1fr 1.5fr; gap: 1.5rem; }
    .pad-field { display: flex; flex-direction: column; gap: 0.5rem; }
    .pad-field label { font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; }
    .pad-field input, .pad-field select, .pad-field textarea { padding: 0.8rem; background: rgba(11, 18, 32, 0.6); border: 1px solid var(--border); border-radius: 8px; color: #fff; font-family: inherit; }
    .pad-field input[readonly] { background: transparent; border-style: dashed; }
    .split-input { display: flex; gap: 0.5rem; }
    .split-input input { flex: 1; }
    
    .pad-footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 1rem; padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.05); }
    .sig-line { width: 220px; height: 1px; background: var(--text-muted); margin-bottom: 0.5rem; }
    .sig-label { font-size: 0.7rem; font-style: italic; color: var(--text-soft); }
    .signature-btn { background: var(--primary); color: #000; border: none; padding: 1rem 2rem; border-radius: 12px; font-weight: 800; font-size: 1rem; cursor: pointer; transition: 0.2s; }
    .signature-btn:hover { transform: translateY(-2px); box-shadow: 0 5px 15px var(--primary); }
    .signature-btn:disabled { background: var(--border); color: var(--text-muted); transform: none; box-shadow: none; cursor: not-allowed; }

    /* History */
    .history-header { display: flex; justify-content: space-between; align-items: start; }
    .refresh-btn { font-size: 0.7rem; background: transparent; border: 1px solid var(--border); color: var(--text-soft); padding: 0.3rem 0.6rem; border-radius: 4px; cursor: pointer; }
    .timeline { max-height: 300px; overflow-y: auto; display: grid; gap: 1rem; padding-top: 1rem; }
    .timeline-item { padding: 1rem; background: rgba(0,0,0,0.2); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); display: flex; gap: 1.5rem; }
    .time-meta { min-width: 90px; display: flex; flex-direction: column; gap: 0.5rem; }
    .time-meta .date { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); }
    .badge { font-size: 0.6rem; padding: 0.1rem 0.4rem; border-radius: 4px; background: rgba(255,255,255,0.05); border: 1px solid var(--border); width: fit-content; }
    .badge.active { color: #80e8a6; border-color: rgba(34, 197, 94, 0.4); }
    .time-body { flex: 1; }
    .med-info strong { display: block; margin-bottom: 0.2rem; }
    .med-info .details { font-size: 0.85rem; color: var(--text-soft); }
    .inst { font-size: 0.75rem; color: var(--text-muted); margin-top: 0.5rem; }

    .custom-scroll::-webkit-scrollbar { width: 4px; }
    .custom-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }

    @media (max-width: 1000px) {
      .workspace { grid-template-columns: 1fr; }
    }
  `]
})
export class PharmacyComponent implements OnInit, OnDestroy {
  activePatient: any | null = null;
  doctorName = '';
  search = '';
  medications: Medication[] = [];
  history: Prescription[] = [];
  patientAllergies: AllergyRecord[] = [];
  selectedMedication: Medication | null = null;
  allergyWarning: string | null = null;
  
  loadingMedications = false;
  issuingPrescription = false;
  loadingHistory = false;
  successMessage = '';
  
  private sub = new Subscription();

  readonly form = this.fb.nonNullable.group({
    medicationName: ['', Validators.required],
    dose: ['', Validators.required],
    frequency: ['QD (Once daily)', Validators.required],
    duration: ['7 days', Validators.required],
    route: ['ORAL', Validators.required],
    instructions: ['']
  });

  constructor(
    private fb: FormBuilder,
    private pharmacyApi: PharmacyApiService,
    private recordsApi: RecordsApiService,
    private contextService: PatientContextService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.doctorName = this.auth.getUserName() || 'Physician';
    this.sub.add(this.contextService.activePatient$.subscribe(p => {
      this.activePatient = p;
      this.selectedMedication = null;
      this.allergyWarning = null;
      this.form.reset({ route: 'ORAL', frequency: 'QD (Once daily)', duration: '7 days' });
      
      if (p) {
        this.loadClinicalData(Number(p.id));
      } else {
        this.history = [];
        this.patientAllergies = [];
      }
    }));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  private loadClinicalData(patientId: number): void {
    this.loadingHistory = true;
    forkJoin({
      history: this.pharmacyApi.getPatientPrescriptions(patientId),
      allergies: this.recordsApi.getAllergies(patientId)
    }).subscribe({
      next: res => {
        this.history = res.history.sort((a,b) => (b.id || 0) - (a.id || 0));
        this.patientAllergies = res.allergies;
        this.loadingHistory = false;
      },
      error: () => this.loadingHistory = false
    });
  }

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    const q = target.value.trim();
    if (q.length < 2) {
      this.medications = [];
      return;
    }
    this.loadingMedications = true;
    this.pharmacyApi.searchMedications(q).subscribe({
      next: items => {
        this.medications = items;
        this.loadingMedications = false;
      },
      error: () => this.loadingMedications = false
    });
  }

  selectMedication(med: Medication): void {
    this.selectedMedication = med;
    this.form.patchValue({
      medicationName: med.medicationName,
      dose: med.strength || ''
    });
    this.medications = [];
    this.search = '';
    this.performSafetyCheck(med.medicationName);
  }

  private performSafetyCheck(medName: string): void {
    this.allergyWarning = null;
    const medication = medName.toLowerCase();
    
    // Safety Logic: Match medication name against documentation allergens
    const match = this.patientAllergies.find(a => 
      medication.includes(a.allergen.toLowerCase()) || 
      a.allergen.toLowerCase().includes(medication)
    );

    if (match) {
      this.allergyWarning = match.allergen;
    }
  }

  issue(): void {
    if (!this.activePatient || this.form.invalid || this.allergyWarning) return;

    const payload: Prescription = {
      patientId: Number(this.activePatient.id),
      doctorId: Number(this.auth.getUserId()) || 1,
      ...this.form.getRawValue(),
      status: 'ACTIVE'
    };

    this.issuingPrescription = true;
    this.successMessage = '';

    this.pharmacyApi.issuePrescription(payload).subscribe({
      next: () => {
        this.successMessage = `Prescription for ${payload.medicationName} issued successfully.`;
        this.issuingPrescription = false;
        this.selectedMedication = null;
        this.allergyWarning = null;
        this.form.reset({ route: 'ORAL', frequency: 'QD (Once daily)', duration: '7 days' });
        this.loadHistory();
      },
      error: () => this.issuingPrescription = false
    });
  }

  loadHistory(): void {
    if (!this.activePatient) return;
    this.loadingHistory = true;
    this.pharmacyApi.getPatientPrescriptions(Number(this.activePatient.id)).subscribe({
      next: items => {
        this.history = items.sort((a,b) => (b.id || 0) - (a.id || 0));
        this.loadingHistory = false;
      },
      error: () => this.loadingHistory = false
    });
  }
}
