import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OverlayModule } from '@angular/cdk/overlay';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PatientProfileService } from '../../../features/patient/patient-profile.service';
import { AppointmentApiService } from '../../../features/appointments/appointment-api.service';
import { RecordsApiService } from '../../../features/records/records-api.service';

interface CommandResult {
  type: 'PATIENT' | 'DOCTOR' | 'APPOINTMENT' | 'ACTION';
  id?: any;
  title: string;
  subtitle?: string;
  route?: string;
  icon: string;
}

@Component({
  selector: 'app-command-palette',
  standalone: true,
  imports: [CommonModule, FormsModule, OverlayModule],
  template: `
    <ng-template cdkConnectedOverlay
                 [cdkConnectedOverlayOpen]="isOpen"
                 [cdkConnectedOverlayHasBackdrop]="true"
                 (backdropClick)="close()"
                 [cdkConnectedOverlayPositionStrategy]="positionStrategy">
      
      <div class="palette-container custom-scroll">
        <div class="search-box">
          <i class="ph ph-command icon-cmd"></i>
          <input type="text" 
                 [(ngModel)]="query" 
                 (input)="onSearch()" 
                 placeholder="Search patients, doctors, or commands... (Alt+K)"
                 #searchInput />
          <div class="esc-hint">ESC to close</div>
        </div>

        <div class="results-area" *ngIf="results.length > 0 || loading">
          <div class="loading-bar" *ngIf="loading">
            <div class="bar-progress"></div>
          </div>

          <div class="result-group" *ngFor="let group of groupedResults | keyvalue">
            <div class="group-title">{{ group.key }}</div>
            <div class="result-item" 
                 *ngFor="let item of group.value" 
                 (click)="execute(item)">
              <div class="item-icon">
                <i [class]="'ph ' + item.icon"></i>
              </div>
              <div class="item-info">
                <div class="item-title">{{ item.title }}</div>
                <div class="item-subtitle" *ngIf="item.subtitle">{{ item.subtitle }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="empty-state" *ngIf="query && !loading && results.length === 0">
          No results found for "{{ query }}"
        </div>

        <div class="palette-footer">
          <div class="shortcut-tips">
            <span><kbd>↑↓</kbd> Navigate</span>
            <span><kbd>Enter</kbd> Select</span>
          </div>
        </div>
      </div>
    </ng-template>
  `,
  styles: [`
    .palette-container {
      width: 600px;
      max-height: 450px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-strong);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      margin-top: 15vh;
    }

    .search-box {
      display: flex;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--border);
      gap: 1rem;
    }
    .icon-cmd { font-size: 1.25rem; color: var(--primary); }
    .search-box input {
      flex: 1;
      border: none;
      background: transparent;
      color: var(--text);
      font-size: 1.1rem;
      padding: 0;
      box-shadow: none;
    }
    .search-box input:focus { outline: none; }
    .esc-hint { font-size: 0.7rem; color: var(--text-muted); background: var(--surface-strong); padding: 0.2rem 0.4rem; border-radius: 4px; }

    .results-area { overflow-y: auto; flex: 1; }
    .loading-bar { height: 2px; background: rgba(26, 60, 110, 0.1); position: relative; }
    .bar-progress { height: 100%; background: var(--primary); width: 40%; animation: slide 1s infinite linear; }

    .result-group { padding: 0.5rem 0; }
    .group-title { padding: 0.5rem 1.5rem; font-size: 0.7rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
    
    .result-item {
      padding: 0.75rem 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .result-item:hover { background: var(--surface-soft); }
    .item-icon { width: 32px; height: 32px; border-radius: 8px; background: var(--surface-strong); display: flex; align-items: center; justify-content: center; color: var(--primary); }
    .item-title { font-weight: 600; color: var(--text); font-size: 0.95rem; }
    .item-subtitle { font-size: 0.8rem; color: var(--text-muted); }

    .empty-state { padding: 3rem; text-align: center; color: var(--text-muted); font-style: italic; }
    .palette-footer { padding: 0.75rem 1.5rem; background: var(--surface-soft); border-top: 1px solid var(--border); }
    .shortcut-tips { display: flex; gap: 1.5rem; font-size: 0.75rem; color: var(--text-muted); }
    kbd { background: var(--surface-strong); border: 1px solid var(--border); border-radius: 3px; padding: 0.1rem 0.3rem; font-family: sans-serif; box-shadow: 0 1px 0 rgba(0,0,0,0.1); }

    @keyframes slide { from { left: -40%; } to { left: 100%; } }
  `]
})
export class CommandPaletteComponent implements OnInit, OnDestroy {
  isOpen = false;
  query = '';
  loading = false;
  results: CommandResult[] = [];
  
  private searchSubject = new Subject<string>();
  private sub = new Subscription();

  constructor(
    private router: Router,
    private patientService: PatientProfileService,
    private recordService: RecordsApiService,
    private appointmentService: AppointmentApiService
  ) {}

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux) or Alt+K as a fallback
    if ((event.metaKey || event.ctrlKey || event.altKey) && event.key === 'k') {
      event.preventDefault();
      this.toggle();
    }
    if (event.key === 'Escape' && this.isOpen) {
      this.close();
    }
  }

  ngOnInit() {
    this.sub.add(
      this.searchSubject.pipe(
        debounceTime(300),
        distinctUntilChanged()
      ).subscribe(() => this.performSearch())
    );
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  toggle() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.query = '';
      this.results = [];
    }
  }

  close() {
    this.isOpen = false;
  }

  onSearch() {
    this.searchSubject.next(this.query);
  }

  private performSearch() {
    if (!this.query || this.query.length < 2) {
      this.results = [];
      return;
    }

    this.loading = true;
    // Mock integrated search across services
    // In a real app, you might have a dedicated search service
    this.results = [
      { type: 'ACTION', title: 'New Appointment', route: '/appointments', icon: 'ph-calendar-plus' },
      { type: 'ACTION', title: 'Register New Patient', route: '/patient/register', icon: 'ph-user-plus' }
    ];

    // Placeholder for actual API integration
    // this.patientService.searchPatients(this.query).subscribe(patients => ...)
    
    this.loading = false;
  }

  get groupedResults() {
    return this.results.reduce((acc, obj) => {
      const key = obj.type;
      if (!acc[key]) acc[key] = [];
      acc[key].push(obj);
      return acc;
    }, {} as { [key: string]: CommandResult[] });
  }

  execute(item: CommandResult) {
    if (item.route) {
      this.router.navigate([item.route]);
    }
    this.close();
  }

  positionStrategy: any; // Ideally configured in overlay settings
}
