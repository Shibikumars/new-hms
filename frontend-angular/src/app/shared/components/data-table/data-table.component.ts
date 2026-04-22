import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ColumnDef {
  key: string;
  label: string;
  type?: string;
  cellTemplate?: string;
  sortable?: boolean;
}

export type ColumnConfig = ColumnDef;

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="table-container shadow-sm border border-slate-200 rounded-lg overflow-hidden bg-white">
      <table class="w-full text-left text-sm">
        <thead class="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
          <tr>
            <th *ngFor="let col of columns" class="px-4 py-3">{{ col.label }}</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let row of data" class="border-b border-slate-100 hover:bg-slate-50 transition-colors" (click)="onRowClick(row)">
            <td *ngFor="let col of columns" class="px-4 py-3 text-slate-700">
              <ng-container [ngSwitch]="col.type || col.cellTemplate">
                <!-- Badge Render -->
                <span *ngSwitchCase="'badge'" 
                      class="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-semibold"
                      [class.bg-emerald-100]="row[col.key] === 'ACTIVE' || row[col.key] === 'COMPLETED'"
                      [class.text-emerald-700]="row[col.key] === 'ACTIVE' || row[col.key] === 'COMPLETED'"
                      [class.bg-red-100]="row[col.key] === 'CANCELLED' || row[col.key] === 'FAILED'"
                      [class.text-red-700]="row[col.key] === 'CANCELLED' || row[col.key] === 'FAILED'">
                  {{ row[col.key] }}
                </span>
                
                <!-- Action Render -->
                <button *ngSwitchCase="'action'" 
                        class="text-primary hover:text-primary-strong font-medium text-xs flex items-center gap-1"
                        (click)="onActionClick($event, row)">
                  View Details <i class="ph ph-arrow-right"></i>
                </button>

                <!-- Default Text Render -->
                <span *ngSwitchDefault>{{ row[col.key] }}</span>
              </ng-container>
            </td>
          </tr>
          <tr *ngIf="data.length === 0">
            <td [attr.colspan]="columns.length" class="px-4 py-8 text-center text-slate-500 italic">
              No records found.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .table-container { min-width: 100%; box-shadow: var(--shadow-soft); border-color: var(--border); }
    th { text-transform: uppercase; letter-spacing: 0.05em; font-size: 0.7rem; font-weight: 800; color: var(--text-muted); }
    tr { transition: background 0.1s; }
    td { font-size: 0.85rem; font-weight: 500; }
  `]
})
export class DataTableComponent {
  @Input() columns: ColumnDef[] = [];
  @Input() data: any[] = [];
  @Output() rowClick = new EventEmitter<any>();
  @Output() actionClick = new EventEmitter<any>();

  onRowClick(row: any) {
    this.rowClick.emit(row);
  }

  onActionClick(event: Event, row: any) {
    event.stopPropagation();
    this.actionClick.emit(row);
  }
}
