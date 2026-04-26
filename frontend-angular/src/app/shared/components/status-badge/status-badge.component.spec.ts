import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatusBadgeComponent } from './status-badge.component';

describe('StatusBadgeComponent', () => {
  let component: StatusBadgeComponent;
  let fixture: ComponentFixture<StatusBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusBadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StatusBadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display status text when no text input provided', () => {
    component.status = 'active';
    fixture.detectChanges();
    const element = fixture.nativeElement.querySelector('.badge');
    expect(element.textContent).toContain('active');
  });

  it('should display custom text when text input provided', () => {
    component.status = 'active';
    component.text = 'Custom Text';
    fixture.detectChanges();
    const element = fixture.nativeElement.querySelector('.badge');
    expect(element.textContent).toContain('Custom Text');
  });

  it('should use type input for status class', () => {
    component.type = 'success';
    fixture.detectChanges();
    const element = fixture.nativeElement.querySelector('.badge');
    expect(element.classList).toContain('status-success');
  });

  it('should infer success type from status', () => {
    component.status = 'completed';
    component.type = undefined as any;
    fixture.detectChanges();
    const element = fixture.nativeElement.querySelector('.badge');
    expect(component.statusClass).toBe('status-success');
  });

  it('should infer error type from status', () => {
    component.status = 'failed';
    component.type = undefined as any;
    fixture.detectChanges();
    expect(component.statusClass).toBe('status-error');
  });

  it('should infer warning type from status', () => {
    component.status = 'pending';
    component.type = undefined as any;
    fixture.detectChanges();
    expect(component.statusClass).toBe('status-warning');
  });

  it('should infer info type from status', () => {
    component.status = 'processing';
    component.type = undefined as any;
    fixture.detectChanges();
    expect(component.statusClass).toBe('status-info');
  });

  it('should default to neutral type for unknown status', () => {
    component.status = 'unknown';
    fixture.detectChanges();
    expect(component.statusClass).toBe('status-neutral');
  });

  it('should display icon when provided', () => {
    component.status = 'active';
    component.icon = 'ph-check';
    fixture.detectChanges();
    const element = fixture.nativeElement.querySelector('.badge i');
    expect(element).toBeTruthy();
    expect(element.classList).toContain('ph-check');
  });

  it('should not display icon when not provided', () => {
    component.status = 'active';
    fixture.detectChanges();
    const element = fixture.nativeElement.querySelector('.badge i');
    expect(element).toBeFalsy();
  });
});
