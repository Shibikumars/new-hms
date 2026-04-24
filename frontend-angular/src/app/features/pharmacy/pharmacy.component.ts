import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Subscription, forkJoin } from 'rxjs';
import { Medication, PharmacyApiService, Prescription } from './pharmacy-api.service';
import { AllergyRecord, MedicalRecordsApiService } from '../medical-records/medical-records-api.service';
import { PatientContextService } from '../../core/patient-context.service';
import { AuthService } from '../../core/auth.service';
import { AutocompleteComponent } from '../../shared/components/autocomplete/autocomplete.component';
import { DataTableComponent, ColumnConfig } from '../../shared/components/data-table/data-table.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-pharmacy',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, AutocompleteComponent, DataTableComponent, StatusBadgeComponent],
  template: `
    <div class="container clinical-bg">
      <header class="ph-header">
        <div class="header-left">
          <h1 class="page-title">E-Prescribing Suite</h1>
          <p class="page-subtitle">Pharmacological management with real-time safety verification and therapy tracking.</p>
        </div>
        <div class="header-right">
          <div class="safety-score">
             <i class="ph ph-shield-check"></i>
             <span>Safety Check: <strong>ENABLED</strong></span>
          </div>
        </div>
      </header>

      <div class="alert success" *ngIf="successMessage">
        <i class="ph ph-check-circle"></i> {{ successMessage }}
      </div>

      <div class="context-banner" [class.no-patient]="!activePatient">
        <div class="banner-content" *ngIf="activePatient">
          <div class="patient-brief">
            <div class="avatar">{{ activePatient.name.charAt(0) }}</div>
            <div class="p-meta">
              <strong>Patient: {{ activePatient.name }}</strong>
              <span>Chart #{{ activePatient.id }} · Verified ID</span>
            </div>
          </div>
          <div class="allergies-list">
             <label>Contraindicated Allergies</label>
             <div class="chips">
                <span class="chip" *ngFor="let a of patientAllergies" [class.severe]="a.severity === 'SEVERE'">
                  {{ a.allergen }}
                </span>
                <span class="muted small" *ngIf="patientAllergies.length === 0">NKA (No Known Allergies)</span>
             </div>
          </div>
        </div>
        <div class="banner-empty" *ngIf="!activePatient">
          <i class="ph ph-warning-diamond"></i>
          <span>Patient context must be established before issuing therapeutic orders.</span>
        </div>
      </div>

      <div class="ph-workspace" *ngIf="activePatient">
        <!-- Pad Side: Drafting the Rx -->
        <div class="rx-column">
          <section class="card pad-card">
            <div class="pad-hdr">
              <div class="hdr-main">
                <i class="ph ph-scroll"></i>
                <h3>New therapeutic Order</h3>
              </div>
              <span class="rx-brand">℞ DigitalPad v2.0</span>
            </div>

            <form [formGroup]="form" (ngSubmit)="issue()" class="pad-form">
              <div class="form-row">
                <div class="form-group flex-2">
                  <label>Search Pharmacopeia</label>
                  <app-autocomplete 
                    [suggestions]="medSuggestions"
                    placeholder="Search medication name..."
                    (onQuery)="searchMeds($event)"
                    (onSelect)="selectMed($event)">
                  </app-autocomplete>
                </div>
                <div class="form-group">
                  <label>Selected Drug</label>
                  <input type="text" formControlName="medicationName" readonly class="locked-input" placeholder="Select drug..." />
                </div>
              </div>

              <div class="safety-drawer" *ngIf="selectedMedication" [class.warning]="allergyWarning">
                <div class="sd-icon">
                  <i [class]="allergyWarning ? 'ph ph-warning-octagon' : 'ph ph-check-circle'"></i>
                </div>
                <div class="sd-content">
                  <strong>Clinical Safety Analysis</strong>
                  <p *ngIf="!allergyWarning">No known interactions found between {{ selectedMedication.medicationName }} and active allergy profile.</p>
                  <p *ngIf="allergyWarning" class="alert-text">FATAL: Patient has documented allergy to {{ allergyWarning }}. Proceed with extreme caution.</p>
                </div>
              </div>

              <div class="form-row mt-4">
                <div class="form-group">
                  <label>Dose</label>
                  <input type="text" formControlName="dose" placeholder="e.g. 500mg" />
                </div>
                <div class="form-group">
                  <label>Frequency</label>
                  <input type="text" formControlName="frequency" placeholder="e.g. BID" />
                </div>
                <div class="form-group">
                  <label>Duration</label>
                  <input type="text" formControlName="duration" placeholder="e.g. 7 Days" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Administration Route</label>
                  <select formControlName="route">
                    <option value="ORAL">Oral</option>
                    <option value="IV">Intravenous</option>
                    <option value="IM">Intramuscular</option>
                    <option value="TOPICAL">Topical</option>
                    <option value="INHALATION">Inhalation</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label>Instructions for Pharmacy</label>
                <textarea formControlName="instructions" rows="2" placeholder="Specific titration or administration notes..."></textarea>
              </div>

              <div class="pad-footer">
                <div class="audit-trail">
                  <span>Digitally Authorized by</span>
                  <strong>Dr. {{ doctorName }}</strong>
                </div>
                <button type="submit" class="ph-btn primary xl" [disabled]="form.invalid || issuingPrescription || (allergyWarning !== null)">
                  <i class="ph ph-signature"></i> {{ issuingPrescription ? 'Authorizing...' : 'Issue Prescription' }}
                </button>
              </div>
            </form>
          </section>
        </div>

        <!-- History Side: Timeline of Therapy -->
        <aside class="history-column">
          <div class="card history-card">
            <div class="pane-header">
              <h3>Active Therapy</h3>
              <button class="ph-btn sm" (click)="loadHistory()"><i class="ph ph-arrows-clockwise"></i> Refresh</button>
            </div>
            
            <div class="med-history-list">
              <div class="med-item" *ngFor="let p of history">
                <div class="med-hdr">
                  <strong>Rx #{{ p.id }} · {{ p.issuedDate }}</strong>
                  <app-status-badge [status]="p.status || 'ACTIVE'"></app-status-badge>
                </div>
                <div class="med-items-sublist">
                   <div class="sub-item" *ngFor="let item of p.items">
                      <div class="sub-hdr">
                         <strong>{{ item.medicationName }}</strong>
                         <span>{{ item.dose }} · {{ item.frequency }}</span>
                      </div>
                      <div class="med-note" *ngIf="item.instructions">
                         <i class="ph ph-note"></i> {{ item.instructions }}
                      </div>
                   </div>
                </div>
              </div>
            </div>

            <div class="empty-state" *ngIf="history.length === 0">
              <i class="ph ph-prescription"></i>
              <p>No active therapeutic orders found.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  `,
  styles: [`
    .clinical-bg { padding: 2rem; background: var(--bg); min-height: 100vh; }
    .ph-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
    .page-title { font-size: 1.75rem; color: var(--primary); font-weight: 800; }
    .page-subtitle { color: var(--text-muted); font-size: 0.95rem; margin-top: 0.25rem; }

    .safety-score { background: #fff; border: 1px solid var(--border); padding: 0.5rem 1rem; border-radius: 999px; display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: var(--accent); font-weight: 800; box-shadow: var(--shadow-soft); }

    .context-banner { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 2rem; box-shadow: var(--shadow-soft); display: flex; align-items: center; justify-content: space-between; border-left: 6px solid var(--primary); }
    .context-banner.no-patient { border-left-color: var(--warning); background: rgba(217, 119, 6, 0.05); }
    .banner-content { display: flex; justify-content: space-between; align-items: center; width: 100%; }
    .patient-brief { display: flex; gap: 1rem; align-items: center; }
    .avatar { width: 44px; height: 44px; background: var(--primary); color: #fff; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.2rem; }
    .p-meta strong { display: block; font-size: 1rem; color: var(--text); }
    .p-meta span { font-size: 0.75rem; color: var(--text-muted); font-weight: 700; }
    
    .allergies-list { text-align: right; }
    .allergies-list label { display: block; font-size: 0.65rem; text-transform: uppercase; color: var(--text-muted); font-weight: 800; margin-bottom: 0.4rem; }
    .chips { display: flex; gap: 0.5rem; justify-content: flex-end; flex-wrap: wrap; }
    .chip { font-size: 0.7rem; font-weight: 800; padding: 0.2rem 0.6rem; border-radius: 4px; background: var(--surface-soft); color: var(--text-soft); }
    .chip.severe { background: rgba(220, 38, 38, 0.1); color: var(--danger); }
    .banner-empty { display: flex; align-items: center; gap: 1rem; color: var(--warning); font-weight: 700; }

    .ph-workspace { display: grid; grid-template-columns: 1fr 340px; gap: 2rem; }
    .card { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 2rem; box-shadow: var(--shadow-soft); }
    
    .pad-card { border-top: 8px solid var(--primary); }
    .pad-hdr { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .hdr-main { display: flex; align-items: center; gap: 0.75rem; }
    .hdr-main i { font-size: 1.50rem; color: var(--primary); }
    .hdr-main h3 { font-size: 1.1rem; font-weight: 800; color: var(--text); margin-bottom: 0; }
    .rx-brand { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 0.75rem; color: var(--text-muted); }

    .pad-form { display: grid; gap: 1.5rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .form-group { display: grid; gap: 0.5rem; }
    .flex-2 { grid-column: span 1; }
    .form-group label { font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; }
    .form-group input, .form-group select, .form-group textarea { background: var(--bg); border: 1px solid var(--border); border-radius: 8px; padding: 0.8rem; font-family: inherit; font-size: 0.95rem; transition: 0.2s; }
    .form-group input:focus { border-color: var(--primary); outline: none; }
    .locked-input { background: var(--surface-soft); border-style: dashed; font-weight: 700; color: var(--primary); }

    .safety-drawer { background: rgba(13, 126, 106, 0.05); border: 1px solid rgba(13, 126, 106, 0.2); border-radius: 12px; padding: 1.25rem; display: flex; gap: 1rem; align-items: flex-start; }
    .safety-drawer.warning { background: rgba(220, 38, 38, 0.1); border-color: rgba(220, 38, 38, 0.2); }
    .sd-icon i { font-size: 1.5rem; color: var(--accent); }
    .safety-drawer.warning .sd-icon i { color: var(--danger); }
    .sd-content strong { display: block; font-size: 0.85rem; color: var(--text); font-weight: 800; margin-bottom: 0.25rem; }
    .sd-content p { font-size: 0.85rem; color: var(--text-soft); line-height: 1.5; font-weight: 600; margin: 0; }
    .alert-text { color: var(--danger) !important; font-weight: 800 !important; }

    .pad-footer { margin-top: 1rem; padding-top: 2rem; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: flex-end; }
    .audit-trail { display: flex; flex-direction: column; gap: 0.25rem; }
    .audit-trail span { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; }
    .audit-trail strong { font-size: 1rem; color: var(--text); font-style: italic; }

    .ph-btn { background: var(--surface); border: 1px solid var(--border); padding: 0.6rem 1.25rem; border-radius: 999px; color: var(--text-soft); font-weight: 700; font-size: 0.85rem; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; transition: 0.2s; justify-content: center; }
    .ph-btn:hover { border-color: var(--primary); color: var(--primary); transform: translateY(-1px); }
    .ph-btn.primary { background: var(--primary); color: #fff; border-color: var(--primary); }
    .ph-btn.xl { padding: 1rem 3rem; font-size: 1rem; }
    .ph-btn.sm { padding: 0.4rem 0.8rem; font-size: 0.75rem; }

    .history-column { display: flex; flex-direction: column; }
    .history-card { height: 100%; min-height: 600px; }
    .med-history-list { display: grid; gap: 1rem; margin-top: 1.5rem; }
    .med-item { background: var(--surface-soft); padding: 1.25rem; border-radius: 12px; border: 1px solid var(--border); }
    .med-hdr { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; }
    .med-hdr strong { font-size: 0.95rem; color: var(--text); }
    .med-body { display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-soft); font-weight: 600; }
    .med-note { margin-top: 0.75rem; font-size: 0.75rem; color: var(--text-muted); font-style: italic; display: flex; gap: 0.4rem; align-items: center; background: #fff; padding: 0.5rem; border-radius: 6px; }

    .alert.success { background: rgba(13, 126, 106, 0.1); color: var(--accent); border: 1px solid rgba(13, 126, 106, 0.2); padding: 1rem; border-radius: 12px; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.75rem; font-weight: 700; }
    .empty-state { text-align: center; padding: 4rem 1rem; color: var(--text-muted); }
    .empty-state i { font-size: 3rem; opacity: 0.3; margin-bottom: 1rem; }

    @media (max-width: 1200px) { .ph-workspace { grid-template-columns: 1fr; } .history-column { order: -1; } .form-row { grid-template-columns: 1fr; } }
  `]
})
export class PharmacyComponent implements OnInit, OnDestroy {
  activePatient: any | null = null;
  doctorName = '';
  medications: Medication[] = [];
  history: Prescription[] = [];
  patientAllergies: AllergyRecord[] = [];
  selectedMedication: Medication | null = null;
  allergyWarning: string | null = null;
  medSuggestions: string[] = [];

  issuingPrescription = false;
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
    private medicalApi: MedicalRecordsApiService,
    private contextService: PatientContextService,
    private auth: AuthService
  ) { }

  ngOnInit(): void {
    this.doctorName = this.auth.getUsername() || 'Physician';
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
    forkJoin({
      history: this.pharmacyApi.getPatientPrescriptions(patientId),
      allergies: this.medicalApi.getAllergies(patientId)
    }).subscribe({
      next: res => {
        this.history = res.history.sort((a, b) => (b.id || 0) - (a.id || 0));
        this.patientAllergies = res.allergies;
      }
    });
  }

  searchMeds(q: string): void {
    if (q.length < 2) {
      this.medSuggestions = [];
      return;
    }
    this.pharmacyApi.searchMedications(q).subscribe({
      next: items => {
        this.medications = items;
        this.medSuggestions = items.map(m => m.medicationName);
      }
    });
  }

  selectMed(name: string): void {
    const med = this.medications.find(m => m.medicationName === name);
    if (med) {
      this.selectedMedication = med;
      this.form.patchValue({
        medicationName: med.medicationName,
        dose: med.strength || ''
      });
      this.performSafetyCheck(med.medicationName);
    }
  }

  private performSafetyCheck(medName: string): void {
    this.allergyWarning = null;
    const medication = medName.toLowerCase();
    const match = this.patientAllergies.find(a =>
      medication.includes(a.allergen.toLowerCase()) ||
      a.allergen.toLowerCase().includes(medication)
    );
    if (match) this.allergyWarning = match.allergen;
  }

  issue(): void {
    if (!this.activePatient || this.form.invalid || this.allergyWarning) return;

    const formVal = this.form.getRawValue();
    const payload: Prescription = {
      patientId: Number(this.activePatient.id),
      doctorId: Number(this.auth.getUserId()) || 1,
      items: [{
        medicationName: formVal.medicationName,
        dose: formVal.dose,
        frequency: formVal.frequency,
        duration: formVal.duration,
        route: formVal.route,
        instructions: formVal.instructions
      }],
      status: 'ACTIVE'
    };

    this.issuingPrescription = true;
    this.pharmacyApi.issuePrescription(payload).subscribe({
      next: () => {
        this.successMessage = `Therapeutic order for ${formVal.medicationName} authorized successfully.`;
        this.issuingPrescription = false;
        this.selectedMedication = null;
        this.allergyWarning = null;
        this.form.reset({ route: 'ORAL', frequency: 'QD (Once daily)', duration: '7 days' });
        this.loadHistory();
        setTimeout(() => this.successMessage = '', 5000);
      },
      error: () => this.issuingPrescription = false
    });
  }

  loadHistory(): void {
    if (!this.activePatient) return;
    this.pharmacyApi.getPatientPrescriptions(Number(this.activePatient.id)).subscribe({
      next: items => {
        this.history = items.sort((a, b) => (b.id || 0) - (a.id || 0));
      }
    });
  }
}

