import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PatientProfile, PatientProfileService } from './patient-profile.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-complete-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="profile-onboarding clinical-bg">
      <div class="card shadow-glass onboarding-card animate-fade-up">
        <div class="card-header-polished">
          <div class="icon-circle"><i class="ph ph-identification-card"></i></div>
          <div class="header-text">
            <h2>Clinical Onboarding</h2>
            <p>Establish your digital health identity to enable diagnostic features.</p>
          </div>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" class="onboarding-form">
          <div class="form-grid">
            <div class="form-group">
              <label>Legal First Name</label>
              <input type="text" formControlName="firstName" placeholder="e.g. John" />
            </div>
            <div class="form-group">
              <label>Legal Last Name</label>
              <input type="text" formControlName="lastName" placeholder="e.g. Doe" />
            </div>
            <div class="form-group">
              <label>Date of Birth</label>
              <input type="date" formControlName="dob" />
            </div>
            <div class="form-group">
              <label>Gender Identity</label>
              <select formControlName="gender">
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div class="form-group">
              <label>Contact Phone</label>
              <input type="tel" formControlName="phone" placeholder="+91 ..." />
            </div>
            <div class="form-group">
              <label>Blood Group</label>
              <select formControlName="bloodGroup">
                <option value="A_POSITIVE">A+</option>
                <option value="B_POSITIVE">B+</option>
                <option value="O_POSITIVE">O+</option>
                <option value="AB_POSITIVE">AB+</option>
                <option value="A_NEGATIVE">A-</option>
                <option value="B_NEGATIVE">B-</option>
                <option value="O_NEGATIVE">O-</option>
                <option value="AB_NEGATIVE">AB-</option>
              </select>
            </div>
            <div class="form-group full-width">
              <label>Emergency Contact (Name & Relationship)</label>
              <input type="text" formControlName="emergencyContact" placeholder="e.g. Jane Doe (Spouse)" />
            </div>
          </div>

          <div class="error-banner" *ngIf="errorMessage">
              <i class="ph ph-warning-circle"></i>
              {{ errorMessage }}
          </div>
          <div class="form-actions">
            <button type="submit" class="ph-btn primary xl-btn" [disabled]="form.invalid || loading">
              {{ loading ? 'Synchronizing...' : 'Finalize Health Profile' }}
              <i class="ph ph-arrow-right" *ngIf="!loading"></i>
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .clinical-bg { background: var(--bg); min-height: 90vh; }
    .profile-onboarding {
      display: grid;
      place-items: center;
      padding: 2rem;
    }
    .onboarding-card {
      width: 100%;
      max-width: 700px;
      padding: 3rem;
      border-radius: 24px;
    }
    .card-header-polished {
      display: flex;
      gap: 1.5rem;
      align-items: center;
      margin-bottom: 2.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--border);
    }
    .icon-circle {
      width: 64px;
      height: 64px;
      background: var(--primary-glow);
      color: var(--primary);
      border-radius: 16px;
      display: grid;
      place-items: center;
      font-size: 2rem;
    }
    .header-text h2 { font-size: 1.5rem; color: var(--text); font-weight: 800; }
    .header-text p { color: var(--text-muted); font-size: 0.95rem; margin-top: 0.25rem; }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .full-width { grid-column: span 2; }
    
    label { font-size: 0.85rem; font-weight: 700; color: var(--text-soft); margin-bottom: 0.5rem; display: block; }
    input, select { 
      width: 100%; padding: 0.85rem; border-radius: 12px; border: 1px solid var(--border-strong); 
      background: var(--surface-soft); font-weight: 600; color: var(--text);
    }
    input:focus, select:focus { outline: 2px solid var(--primary-glow); border-color: var(--primary); }

    .form-actions { margin-top: 2rem; }
    .xl-btn { width: 100%; padding: 1.25rem; font-size: 1.1rem; justify-content: center; }
    
    .error-banner { background: rgba(220, 38, 38, 0.1); border: 1px solid rgba(220, 38, 38, 0.3); color: #DC2626; padding: 0.85rem 1.25rem; border-radius: 12px; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.75rem; font-weight: 600; font-size: 0.9rem; }
    .animate-fade-up { animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class CompleteProfileComponent implements OnInit {
  loading = false;
  errorMessage = '';
  form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    dob: ['', Validators.required],
    gender: ['MALE', Validators.required],
    phone: ['', Validators.required],
    bloodGroup: ['O_POSITIVE', Validators.required],
    emergencyContact: ['']
  });

  constructor(
    private fb: FormBuilder,
    private patientService: PatientProfileService,
    private auth: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    const name = this.auth.getUsername() || '';
    if (name) this.form.patchValue({ firstName: name });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    const userId = Number(this.auth.getUserId());
    const payload: any = {
      ...this.form.value,
      userId,
      email: this.auth.getUsername() + '@hms.com' // Stub email
    };

    this.patientService.create(payload as PatientProfile).subscribe({
      next: () => {
        this.router.navigate(['/patient/portal']);
      },
      error: (err) => {
        this.loading = false;
        const msg = err?.error?.message || 'Profile save failed. Please try again.';
        this.errorMessage = msg;
      }
    });
  }
}
