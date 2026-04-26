import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MRNDisplayComponent } from './mrn-display.component';

describe('MRNDisplayComponent', () => {
  let component: MRNDisplayComponent;
  let fixture: ComponentFixture<MRNDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MRNDisplayComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MRNDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display MRN when provided', () => {
    component.mrn = 'MRN123456';
    fixture.detectChanges();
    const element = fixture.nativeElement.querySelector('.value');
    expect(element.textContent).toBe('MRN123456');
  });

  it('should display UNASSIGNED when MRN not provided', () => {
    component.mrn = undefined;
    fixture.detectChanges();
    const element = fixture.nativeElement.querySelector('.value');
    expect(element.textContent).toBe('UNASSIGNED');
  });

  it('should apply small size class', () => {
    component.size = 'small';
    fixture.detectChanges();
    const element = fixture.nativeElement.querySelector('.mrn-box');
    expect(element.classList).toContain('small');
  });

  it('should apply large size class', () => {
    component.size = 'large';
    fixture.detectChanges();
    const element = fixture.nativeElement.querySelector('.mrn-box');
    expect(element.classList).toContain('large');
  });

  it('should show copy button when copyable and MRN provided', () => {
    component.mrn = 'MRN123456';
    component.copyable = true;
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('.copy-btn');
    expect(button).toBeTruthy();
  });

  it('should not show copy button when copyable is false', () => {
    component.mrn = 'MRN123456';
    component.copyable = false;
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('.copy-btn');
    expect(button).toBeFalsy();
  });

  it('should not show copy button when MRN is empty', () => {
    component.mrn = undefined;
    component.copyable = true;
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('.copy-btn');
    expect(button).toBeFalsy();
  });

  it('should copy to clipboard when copy button clicked', () => {
    component.mrn = 'MRN123456';
    spyOn(navigator.clipboard, 'writeText');
    fixture.detectChanges();
    
    const button = fixture.nativeElement.querySelector('.copy-btn');
    button.click();
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('MRN123456');
  });

  it('should stop event propagation on copy', () => {
    component.mrn = 'MRN123456';
    spyOn(navigator.clipboard, 'writeText');
    fixture.detectChanges();
    
    const event = new MouseEvent('click');
    spyOn(event, 'stopPropagation');
    
    component.copyToClipboard(event);
    
    expect(event.stopPropagation).toHaveBeenCalled();
  });
});
