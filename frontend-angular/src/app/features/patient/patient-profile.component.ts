import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth.service';
import { PatientProfile, PatientProfileService } from './patient-profile.service';

@Component({
  selector: 'app-patient-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <div class="hero">
        <div>
          <h2>My Profile</h2>
          <p class="subtitle">Your identity, contact and insurance profile.</p>
        </div>
        <div class="pill">Patient Identity</div>
      </div>

      <div class="loading-text" *ngIf="loading">Loading profile…</div>

      <div class="card-grid" *ngIf="!loading && profile">
        <section class="card">
          <h3>Basic</h3>
          <div class="row"><span>Name</span><strong>{{ profile.fullName || (profile.firstName + ' ' + profile.lastName) }}</strong></div>
          <div class="row"><span>Patient ID</span><strong>#{{ profile.id }}</strong></div>
          <div class="row"><span>Age / Gender</span><strong>{{ profile.age || '—' }} / {{ profile.gender || '—' }}</strong></div>
          <div class="row"><span>Blood Group</span><strong>{{ profile.bloodGroup || '—' }}</strong></div>
        </section>

        <section class="card">
          <h3>Contact</h3>
          <div class="row"><span>Phone</span><strong>{{ profile.phone || '—' }}</strong></div>
          <div class="row"><span>Email</span><strong>{{ profile.email || '—' }}</strong></div>
          <div class="row"><span>Address</span><strong>{{ profile.address || '—' }}</strong></div>
          <div class="row"><span>Emergency</span><strong>{{ profile.emergencyContact || '—' }}</strong></div>
        </section>

        <section class="card">
          <h3>Insurance</h3>
          <div class="row"><span>Provider</span><strong>{{ profile.insuranceProvider || '—' }}</strong></div>
          <div class="row"><span>Policy Number</span><strong>{{ profile.insurancePolicyNumber || '—' }}</strong></div>
        </section>
      </div>

      <section class="card fallback" *ngIf="!loading && !profile">
        <h3>Account Profile</h3>
        <div class="row"><span>Account ID</span><strong>#{{ authUserId || 'N/A' }}</strong></div>
        <div class="row"><span>Username</span><strong>{{ username || 'N/A' }}</strong></div>
        <div class="row"><span>Status</span><strong>{{ profileLoadFailed ? 'Profile setup pending' : 'Basic account active' }}</strong></div>
        <div class="loading-text">Your account is active. Clinical profile details will appear once patient-service profile sync completes.</div>
      </section>
    </div>
  `,
  styles: [`
    .hero { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; }
    .subtitle { margin-top: 0.45rem; color: var(--text-soft); }
    .pill { border: 1px solid rgba(0,212,170,0.45); color: var(--primary); background: rgba(0,212,170,0.12); border-radius: 999px; padding: 0.35rem 0.75rem; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 700; white-space: nowrap; }
    .card-grid { margin-top: 1rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.75rem; }
    .card { border: 1px solid var(--border); border-radius: 12px; padding: 0.85rem; background: linear-gradient(180deg, rgba(26,39,64,0.65), rgba(15,23,38,0.95)); }
    .card h3 { margin-bottom: 0.65rem; }
    .row { display: flex; justify-content: space-between; gap: 0.8rem; margin-bottom: 0.45rem; }
    .row span { color: var(--text-muted); font-size: 0.82rem; }
    .row strong { color: var(--text); text-align: right; }
    .fallback { margin-top: 1rem; }
    @media (max-width: 760px) { .hero { flex-direction: column; } .row { flex-direction: column; } .row strong { text-align: left; } }
  `]
})
export class PatientProfileComponent implements OnInit {
  profile: PatientProfile | null = null;
  loading = false;
  authUserId: number | null = null;
  username: string | null = null;
  profileLoadFailed = false;

  constructor(
    private authService: AuthService,
    private profileService: PatientProfileService
  ) {}

  ngOnInit(): void {
    this.authUserId = this.authService.getUserId();
    this.username = this.authService.getUsername();

    const patientId = this.authUserId;
    if (!patientId || patientId < 1) {
      this.profile = null;
      this.profileLoadFailed = true;
      return;
    }

    this.loading = true;
    this.profileLoadFailed = false;

    this.profileService.getById(patientId).subscribe({
      next: data => {
        this.profile = data;
        this.loading = false;
      },
      error: () => {
        this.profile = null;
        this.profileLoadFailed = true;
        this.loading = false;
      }
    });
  }
}
