import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DataTableComponent, ColumnDef } from './data-table.component';

describe('DataTableComponent', () => {
  let component: DataTableComponent;
  let fixture: ComponentFixture<DataTableComponent>;

  const mockColumns: ColumnDef[] = [
    { key: 'name', label: 'Name' },
    { key: 'status', label: 'Status', type: 'badge' },
    { key: 'action', label: 'Action', type: 'action' },
  ];

  const mockData = [
    { name: 'John Doe', status: 'ACTIVE' },
    { name: 'Jane Smith', status: 'CANCELLED' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DataTableComponent);
    component = fixture.componentInstance;
    component.columns = mockColumns;
    component.data = mockData;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render columns', () => {
    const headers = fixture.nativeElement.querySelectorAll('th');
    expect(headers.length).toBe(3);
    expect(headers[0].textContent).toContain('Name');
    expect(headers[1].textContent).toContain('Status');
    expect(headers[2].textContent).toContain('Action');
  });

  it('should render data rows', () => {
    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
  });

  it('should emit rowClick on row click', () => {
    spyOn(component.rowClick, 'emit');
    const firstRow = fixture.nativeElement.querySelector('tbody tr');
    firstRow.click();
    expect(component.rowClick.emit).toHaveBeenCalledWith(mockData[0]);
  });

  it('should emit actionClick on action button click', () => {
    spyOn(component.actionClick, 'emit');
    const actionButton = fixture.nativeElement.querySelector('button');
    const event = new Event('click');
    spyOn(event, 'stopPropagation');
    actionButton.dispatchEvent(event);
    expect(event.stopPropagation).toHaveBeenCalled();
    expect(component.actionClick.emit).toHaveBeenCalledWith(mockData[0]);
  });

  it('should show empty state when no data', () => {
    component.data = [];
    fixture.detectChanges();
    const emptyRow = fixture.nativeElement.querySelector('tbody tr td');
    expect(emptyRow.textContent).toContain('No records found');
  });

  it('should render badge type column', () => {
    fixture.detectChanges();
    const badges = fixture.nativeElement.querySelectorAll('.bg-emerald-100');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('should render action type column', () => {
    fixture.detectChanges();
    const actionButtons = fixture.nativeElement.querySelectorAll('button');
    expect(actionButtons.length).toBeGreaterThan(0);
  });
});
