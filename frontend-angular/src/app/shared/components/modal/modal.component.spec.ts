import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalComponent } from './modal.component';

describe('ModalComponent', () => {
  let component: ModalComponent;
  let fixture: ComponentFixture<ModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not render when isOpen is false', () => {
    component.isOpen = false;
    fixture.detectChanges();
    const backdrop = fixture.nativeElement.querySelector('.modal-backdrop');
    expect(backdrop).toBeFalsy();
  });

  it('should render when isOpen is true', () => {
    component.isOpen = true;
    fixture.detectChanges();
    const backdrop = fixture.nativeElement.querySelector('.modal-backdrop');
    expect(backdrop).toBeTruthy();
  });

  it('should display title', () => {
    component.isOpen = true;
    component.title = 'Test Modal';
    fixture.detectChanges();
    const title = fixture.nativeElement.querySelector('.modal-title');
    expect(title.textContent).toBe('Test Modal');
  });

  it('should emit closed event when closeModal called', (done) => {
    component.isOpen = true;
    component.closed.subscribe(() => {
      expect(component.isOpen).toBeFalse();
      done();
    });
    component.closeModal();
  });

  it('should emit confirmed event when onConfirm called', (done) => {
    component.confirmed.subscribe(() => {
      done();
    });
    component.onConfirm();
  });

  it('should not emit confirmed when confirmDisabled is true', (done) => {
    component.confirmDisabled = true;
    let emitted = false;
    component.confirmed.subscribe(() => {
      emitted = true;
    });
    component.onConfirm();
    setTimeout(() => {
      expect(emitted).toBeFalse();
      done();
    }, 100);
  });

  it('should show footer when showFooter is true', () => {
    component.isOpen = true;
    component.showFooter = true;
    fixture.detectChanges();
    const footer = fixture.nativeElement.querySelector('.modal-footer');
    expect(footer).toBeTruthy();
  });

  it('should not show footer when showFooter is false', () => {
    component.isOpen = true;
    component.showFooter = false;
    fixture.detectChanges();
    const footer = fixture.nativeElement.querySelector('.modal-footer');
    expect(footer).toBeFalsy();
  });

  it('should display custom cancel text', () => {
    component.isOpen = true;
    component.cancelText = 'Close';
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('.btn-cancel');
    expect(button.textContent).toBe('Close');
  });

  it('should display custom confirm text', () => {
    component.isOpen = true;
    component.confirmText = 'Submit';
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('.btn-confirm');
    expect(button.textContent.trim()).toBe('Submit');
  });

  it('should disable confirm button when confirmDisabled is true', () => {
    component.isOpen = true;
    component.confirmDisabled = true;
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('.btn-confirm');
    expect(button.disabled).toBeTrue();
  });

  it('should close on backdrop click when closeOnBackdrop is true', () => {
    component.isOpen = true;
    component.closeOnBackdrop = true;
    spyOn(component, 'closeModal');
    fixture.detectChanges();
    
    const backdrop = fixture.nativeElement.querySelector('.modal-backdrop');
    backdrop.click();
    
    expect(component.closeModal).toHaveBeenCalled();
  });

  it('should not close on backdrop click when closeOnBackdrop is false', () => {
    component.isOpen = true;
    component.closeOnBackdrop = false;
    spyOn(component, 'closeModal');
    fixture.detectChanges();
    
    const backdrop = fixture.nativeElement.querySelector('.modal-backdrop');
    backdrop.click();
    
    expect(component.closeModal).not.toHaveBeenCalled();
  });

  it('should stop propagation on modal container click', () => {
    component.isOpen = true;
    spyOn(component, 'closeModal');
    fixture.detectChanges();
    
    const container = fixture.nativeElement.querySelector('.modal-container');
    const event = new MouseEvent('click');
    spyOn(event, 'stopPropagation');
    
    container.dispatchEvent(event);
    
    expect(event.stopPropagation).toHaveBeenCalled();
  });
});
