import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

export interface AutocompleteItem {
  id: any;
  label: string;
  subLabel?: string;
  data?: any;
}

@Component({
  selector: 'app-autocomplete',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="autocomplete-wrapper">
      <div class="input-wrapper">
        <i class="ph ph-magnifying-glass icon-prefix"></i>
        <input type="text"
               [(ngModel)]="query"
               (input)="onInput()"
               (focus)="onFocus()"
               (blur)="onBlur()"
               [placeholder]="placeholder"
               [disabled]="disabled"
               class="custom-input" />
        <i *ngIf="loading" class="ph ph-spinner-gap spinner icon-suffix"></i>
        <i *ngIf="!loading && query" class="ph ph-x clear-btn icon-suffix" (click)="clear()"></i>
      </div>

      <div class="dropdown-pane custom-scroll" *ngIf="showDropdown && ((results.length > 0 || suggestions.length > 0) || noResults)">
        <ul *ngIf="results.length > 0 || suggestions.length > 0; else emptyState">
          <!-- Handle AutocompleteItem results -->
          <li *ngFor="let item of results" (click)="selectItem(item)">
            <div class="item-label">{{ item.label }}</div>
            <div class="item-meta" *ngIf="item.subLabel">{{ item.subLabel }}</div>
          </li>
          <!-- Handle string suggestions -->
          <li *ngFor="let suggestion of suggestions" (click)="selectSuggestion(suggestion)">
            <div class="item-label">{{ suggestion }}</div>
          </li>
        </ul>
        <ng-template #emptyState>
          <div class="empty-state" *ngIf="query.length >= 2">No matching results found.</div>
          <div class="empty-state" *ngIf="query.length < 2">Type at least 2 characters to search...</div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .autocomplete-wrapper { position: relative; width: 100%; }
    .input-wrapper { position: relative; display: flex; align-items: center; width: 100%; }
    
    .icon-prefix { position: absolute; left: 0.8rem; color: var(--text-muted); font-size: 1.1rem; pointer-events: none; }
    .icon-suffix { position: absolute; right: 0.8rem; color: var(--text-muted); font-size: 1.1rem; }
    .clear-btn { cursor: pointer; transition: 0.2s; }
    .clear-btn:hover { color: var(--text); }
    .spinner { animation: spin 1s linear infinite; }

    .custom-input {
      width: 100%;
      padding: 0.7rem 2.4rem;
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-sm);
      background: var(--surface);
      color: var(--text);
      font-size: 0.95rem;
      transition: all 0.2s;
    }
    .custom-input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-glow); }
    .custom-input:disabled { background: var(--surface-strong); color: var(--text-muted); cursor: not-allowed; }

    .dropdown-pane {
      position: absolute; top: calc(100% + 4px); left: 0; width: 100%;
      background: var(--surface); border: 1px solid var(--border);
      border-radius: var(--radius-sm); box-shadow: var(--shadow-strong);
      z-index: 50; max-height: 250px; overflow-y: auto;
    }

    ul { list-style: none; margin: 0; padding: 0; }
    li {
      padding: 0.8rem 1rem; border-bottom: 1px solid var(--border);
      cursor: pointer; transition: 0.2s;
    }
    li:last-child { border-bottom: none; }
    li:hover { background: var(--surface-strong); }

    .item-label { font-weight: 600; color: var(--text); font-size: 0.9rem; }
    .item-meta { font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem; }

    .empty-state { padding: 1rem; color: var(--text-muted); font-size: 0.85rem; text-align: center; }

    @keyframes spin { 100% { transform: rotate(360deg); } }
  `]
})
export class AutocompleteComponent implements OnInit, OnDestroy, OnChanges {
  @Input() placeholder = 'Search...';
  @Input() results: AutocompleteItem[] = [];
  @Input() suggestions: string[] = []; // Add string suggestions input
  @Input() loading = false;
  @Input() disabled = false;
  
  @Output() search = new EventEmitter<string>();
  @Output() selected = new EventEmitter<any>(); // Changed to emit any type

  query = '';
  showDropdown = false;
  noResults = false;

  private searchSubject = new Subject<string>();
  private sub = new Subscription();

  ngOnInit() {
    this.sub.add(
      this.searchSubject.pipe(
        debounceTime(300),
        distinctUntilChanged()
      ).subscribe(val => {
        console.log('Search subscription triggered with:', val);
        if (val.length >= 2) {
          console.log('Emitting search event from subscription:', val);
          this.search.emit(val);
          // Don't immediately set noResults, wait for results to update
        } else {
          this.results = [];
          this.noResults = false;
          this.showDropdown = false;
        }
      })
    );
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['results'] || changes['suggestions']) {
      // Update noResults state when results or suggestions change
      const hasResults = this.results.length > 0 || this.suggestions.length > 0;
      this.noResults = this.query.length >= 2 && !hasResults && !this.loading;
      this.showDropdown = this.query.length >= 2 && !this.loading;
    }
    if (changes['loading']) {
      this.showDropdown = this.query.length >= 2 && !this.loading;
    }
  }

  onInput() {
    console.log('onInput called with query:', this.query);
    this.showDropdown = true;
    console.log('Emitting search event with:', this.query);
    this.searchSubject.next(this.query);
  }

  onFocus() {
    if (this.query.length >= 2) {
      this.showDropdown = true;
    }
  }

  onBlur() {
    // Delay hiding dropdown to allow click events to fire
    setTimeout(() => {
      this.showDropdown = false;
    }, 200);
  }

  clear() {
    this.query = '';
    this.results = [];
    this.noResults = false;
    this.showDropdown = false;
    this.search.emit('');
  }

  selectItem(item: AutocompleteItem) {
    this.query = item.label;
    this.showDropdown = false;
    this.selected.emit(item);
  }

  selectSuggestion(suggestion: string) {
    console.log('selectSuggestion called with:', suggestion);
    this.query = suggestion;
    this.showDropdown = false;
    console.log('Emitting selected event with:', suggestion);
    this.selected.emit(suggestion);
  }
}
