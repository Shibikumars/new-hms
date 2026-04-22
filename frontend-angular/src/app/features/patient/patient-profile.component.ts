import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth.service';
import { PatientProfile, PatientProfileService } from './patient-profile.service';
import { FileUploadComponent } from '../../shared/components/file-upload/file-upload.component';

@Component({
  selector: 'app-patient-profile',
  standalone: true,
  imports: [CommonModule, FileUploadComponent],
  template: `
    <div class="container clinical-bg">
      <header class="profile-header">
        <div class="profile-title-row">
          <h1 class="page-title">Personal Identity</h1>
          <p class="page-subtitle">Manage your clinical profile, contact details, and insurance alignment.</p>
        </div>
        <div class="header-actions">
           <button class="ph-btn primary"><i class="ph ph-note-pencil"></i> Edit Profile</button>
        </div>
      </header>

      <div class="profile-layout">
        <!-- Profile Identity Column -->
        <aside class="identity-card">
          <div class="identity-top">
            <div class="avatar-wrapper">
              <span class="avatar-txt" *ngIf="!profile?.firstName">{{ username?.charAt(0) || 'U' }}</span>
              <img *ngIf="profile?.firstName" [src]="'https://api.dicebear.com/7.x/avataaars/svg?seed=' + profile.id" alt="Avatar" />
              <div class="status-indicator online"></div>
            </div>
            <h2 class="patient-name">{{ profile?.firstName }} {{ profile?.lastName }}</h2>
            <div class="mrn-badge">MRN: #{{ profile?.id || 'PENDING' }}</div>
          </div>
          
          <div class="identity-nav">
            <app-file-upload 
              label="Update Photo" 
              (onFiles)="onPhotoUpload($event)">
            </app-file-upload>
          </div>

          <div class="identity-meta">
            <div class="meta-item">
              <i class="ph ph-cake"></i>
              <span>Born: {{ profile?.age || '28' }} yrs</span>
            </div>
            <div class="meta-item">
              <i class="ph ph-gender-intersex"></i>
              <span>Gender: {{ profile?.gender || 'Not set' }}</span>
            </div>
            <div class="meta-item">
              <i class="ph ph-drop"></i>
              <span>Blood: {{ profile?.bloodGroup || 'O+' }}</span>
            </div>
          </div>
        </aside>

        <!-- Profile Details Column -->
        <div class="details-column">
          <div class="card detail-section">
            <div class="section-header">
              <h3><i class="ph ph-phone-call"></i> Contact Information</h3>
            </div>
            <div class="info-grid">
              <div class="info-item">
                <label>Primary Phone</label>
                <strong>{{ profile?.phone || 'Not available' }}</strong>
              </div>
              <div class="info-item">
                <label>Email Address</label>
                <strong>{{ profile?.email || 'Not available' }}</strong>
              </div>
              <div class="info-item full">
                <label>Registered Address</label>
                <strong>{{ profile?.address || 'No residential address on file' }}</strong>
              </div>
            </div>
          </div>

          <div class="card detail-section">
            <div class="section-header">
              <h3><i class="ph ph-shield-check"></i> Healthcare & Insurance</h3>
            </div>
            <div class="info-grid">
              <div class="info-item">
                <label>Insurance Provider</label>
                <strong>{{ profile?.insuranceProvider || 'Direct Pay' }}</strong>
              </div>
              <div class="info-item">
                <label>Policy Number</label>
                <strong>{{ profile?.insurancePolicyNumber || 'N/A' }}</strong>
              </div>
              <div class="info-item">
                <label>Emergency Contact</label>
                <strong>{{ profile?.emergencyContact || 'Not informed' }}</strong>
              </div>
            </div>
          </div>

          <div class="card detail-section settings-card">
            <div class="section-header">
              <h3><i class="ph ph-gear"></i> Account Settings</h3>
            </div>
            <div class="settings-row">
              <div class="setting-text">
                <strong>Two-Factor Authentication</strong>
                <p>Enhance security for your medical records.</p>
              </div>
              <button class="ph-btn sm secondary">Enable</button>
            </div>
            <div class="divider"></div>
            <div class="settings-row">
              <div class="setting-text">
                <strong>GDPR Data Portability</strong>
                <p>Download all your clinical session data.</p>
              </div>
              <button class="ph-btn sm secondary"><i class="ph ph-download"></i> FHIR Export</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .clinical-bg { padding: 2rem; background: var(--bg); min-height: 100vh; }
    .profile-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2.5rem; }
    .page-title { font-size: 1.75rem; color: var(--primary); font-weight: 800; }
    .page-subtitle { color: var(--text-muted); font-size: 0.95rem; margin-top: 0.25rem; }
    
    .ph-btn { background: var(--surface); border: 1px solid var(--border); padding: 0.6rem 1.25rem; border-radius: 999px; color: var(--text-soft); font-weight: 700; font-size: 0.85rem; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; transition: 0.2s; }
    .ph-btn:hover { border-color: var(--primary); color: var(--primary); transform: translateY(-1px); }
    .ph-btn.primary { background: var(--primary); color: #fff; border-color: var(--primary); }
    .ph-btn.secondary { background: var(--surface-soft); }
    .ph-btn.sm { padding: 0.4rem 0.8rem; font-size: 0.75rem; }

    .profile-layout { display: grid; grid-template-columns: 320px 1fr; gap: 2rem; }

    /* Identity Card */
    .identity-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 2rem; box-shadow: var(--shadow-soft); text-align: center; height: fit-content; }
    .identity-top { margin-bottom: 1.5rem; }
    .avatar-wrapper { width: 120px; height: 120px; border-radius: 30px; background: var(--primary); margin: 0 auto 1.5rem; display: flex; align-items: center; justify-content: center; font-size: 3rem; font-weight: 800; color: #fff; position: relative; overflow: hidden; box-shadow: 0 10px 20px rgba(26, 60, 110, 0.2); }
    .avatar-wrapper img { width: 100%; height: 100%; object-fit: cover; }
    .status-indicator { position: absolute; bottom: 8px; right: 8px; width: 14px; height: 14px; border-radius: 50%; border: 3px solid #fff; }
    .status-indicator.online { background: var(--accent); }
    .patient-name { font-size: 1.25rem; color: var(--text); font-weight: 800; margin-bottom: 0.5rem; }
    .mrn-badge { display: inline-block; padding: 0.25rem 0.75rem; background: rgba(26, 60, 110, 0.05); color: var(--primary); border-radius: 999px; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.05em; font-family: 'Syne', sans-serif; }
    
    .identity-nav { margin: 1.5rem 0; }
    .identity-meta { border-top: 1px solid var(--border); padding-top: 1.5rem; display: grid; gap: 1rem; text-align: left; }
    .meta-item { display: flex; align-items: center; gap: 0.75rem; font-size: 0.85rem; color: var(--text-soft); font-weight: 600; }
    .meta-item i { font-size: 1.1rem; color: var(--primary); opacity: 0.6; }

    /* Details Column */
    .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 2rem; box-shadow: var(--shadow-soft); margin-bottom: 1.5rem; }
    .section-header { margin-bottom: 1.5rem; border-bottom: 1px solid var(--border); padding-bottom: 0.75rem; }
    .section-header h3 { font-size: 1rem; font-weight: 700; color: var(--text); display: flex; align-items: center; gap: 0.75rem; }
    .section-header i { font-size: 1.25rem; color: var(--primary); }

    .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; }
    .info-item { display: flex; flex-direction: column; gap: 0.25rem; }
    .info-item.full { grid-column: span 2; }
    .info-item label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em; }
    .info-item strong { font-size: 0.95rem; color: var(--text); }

    .settings-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
    .setting-text strong { display: block; font-size: 0.9rem; color: var(--text); margin-bottom: 0.15rem; }
    .setting-text p { font-size: 0.75rem; color: var(--text-muted); }
    .divider { height: 1px; background: var(--border); margin: 1.25rem 0; }

    @media (max-width: 1024px) { .profile-layout { grid-template-columns: 1fr; } .identity-card { position: relative; top: 0; } .info-grid { grid-template-columns: 1fr; } .info-item.full { grid-column: span 1; } }
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

  onPhotoUpload(files: File[]) {
    console.log('Mock uploading profile photos:', files);
  }
}

