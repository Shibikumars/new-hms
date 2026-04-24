import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { DoctorProfileService, DoctorProfile } from './doctor-profile.service';

@Component({
  selector: 'app-complete-doctor-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="profile-onboarding clinical-bg">
      <div class="card shadow-glass onboarding-card animate-fade-up">
        <div class="card-header-polished">
          <div class="icon-circle"><i class="ph ph-stethoscope"></i></div>
          <div class="header-text">
            <h2>Clinical Credentials</h2>
            <p>Set up your professional profile to start receiving patient consultations.</p>
          </div>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" class="onboarding-form">
          <div class="form-grid">
            <div class="form-group">
              <label>Full Professional Name</label>
              <input type="text" formControlName="fullName" placeholder="Dr. Jane Smith" />
            </div>
            <div class="form-group">
              <label>Primary Specialization</label>
              <input type="text" formControlName="specialization" placeholder="Cardiology, Pediatrics, etc." />
            </div>
            <div class="form-group">
              <label>Contact Phone</label>
              <input type="tel" formControlName="phone" placeholder="+91 ..." />
            </div>
            <div class="form-group">
              <label>Consultation Fee (₹)</label>
              <input type="number" formControlName="consultationFee" placeholder="500" />
            </div>
            <div class="form-group">
              <label>Years of Experience</label>
              <input type="number" formControlName="yearsOfExperience" placeholder="10" />
            </div>
            <div class="form-group">
              <label>Qualifications</label>
              <input type="text" formControlName="qualifications" placeholder="MBBS, MD, FRCP" />
            </div>
            <div class="form-group full-width">
              <label>Professional Bio / About</label>
              <textarea formControlName="about" rows="3" placeholder="Briefly describe your clinical focus..."></textarea>
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="ph-btn primary xl-btn" [disabled]="form.invalid || loading">
              {{ loading ? 'Publishing Profile...' : 'Activate Clinical Workspace' }}
              <i class="ph ph-check-circle" *ngIf="!loading"></i>
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .clinical-bg { background: var(--bg); min-height: 90vh; }
    .profile-onboarding { display: grid; place-items: center; padding: 2rem; }
    .onboarding-card { width: 100%; max-width: 750px; padding: 3rem; border-radius: 24px; }
    .card-header-polished { display: flex; gap: 1.5rem; align-items: center; margin-bottom: 2.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--border); }
    .icon-circle { width: 64px; height: 64px; background: var(--primary-glow); color: var(--primary); border-radius: 16px; display: grid; place-items: center; font-size: 2rem; }
    .header-text h2 { font-size: 1.5rem; color: var(--text); font-weight: 800; }
    .header-text p { color: var(--text-muted); font-size: 0.95rem; margin-top: 0.25rem; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem; }
    .full-width { grid-column: span 2; }
    label { font-size: 0.85rem; font-weight: 700; color: var(--text-soft); margin-bottom: 0.5rem; display: block; }
    input, select, textarea { width: 100%; padding: 0.85rem; border-radius: 12px; border: 1px solid var(--border-strong); background: var(--surface-soft); font-weight: 600; color: var(--text); }
    .form-actions { margin-top: 2rem; }
    .xl-btn { width: 100%; padding: 1.25rem; font-size: 1.1rem; justify-content: center; }
    .animate-fade-up { animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class CompleteDoctorProfileComponent implements OnInit {
  form: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private doctorService: DoctorProfileService,
    private router: Router
  ) {
    this.form = this.fb.group({
      fullName: ['', Validators.required],
      specialization: ['', Validators.required],
      phone: ['', Validators.required],
      consultationFee: [500, [Validators.required, Validators.min(0)]],
      yearsOfExperience: [5, Validators.required],
      qualifications: ['', Validators.required],
      about: ['']
    });
  }

  ngOnInit(): void {
    const username = this.auth.getUsername();
    if (username) {
      this.form.patchValue({ fullName: 'Dr. ' + username });
    }
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    
    // We use the auth userId as the doctor ID for consistency in this simplified architecture
    const userId = Number(this.auth.getUserId());
    const payload: DoctorProfile = {
      ...this.form.value,
      id: userId,
      email: this.auth.getUsername() + '@hms.com',
      rating: 4.8
    };

    this.doctorService.create(payload).subscribe({
      next: () => {
        this.router.navigate(['/doctor/dashboard']);
      },
      error: () => this.loading = false
    });
  }
}
