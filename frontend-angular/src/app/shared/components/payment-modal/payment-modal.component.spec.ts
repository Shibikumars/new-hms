import { ComponentFixture, TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { PaymentModalComponent, PaymentResult } from './payment-modal.component';
import { FormsModule } from '@angular/forms';

describe('PaymentModalComponent', () => {
  let component: PaymentModalComponent;
  let fixture: ComponentFixture<PaymentModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentModalComponent, FormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentModalComponent);
    component = fixture.componentInstance;
    component.amount = 500;
    component.title = 'Test Service';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display amount', () => {
    const amount = fixture.nativeElement.querySelector('.amount');
    expect(amount.textContent).toContain('₹500');
  });

  it('should display title', () => {
    const title = fixture.nativeElement.querySelector('.summary-item span');
    expect(title.textContent).toBe('Test Service');
  });

  it('should switch to UPI_INPUT view on selectRuPay', () => {
    component.selectRuPay();
    expect(component.view).toBe('UPI_INPUT');
  });

  it('should emit LATER payment on selectLater', () => {
    spyOn(component.confirmed, 'emit');
    component.selectLater();
    expect(component.confirmed.emit).toHaveBeenCalledWith({ method: 'LATER' });
  });

  it('should emit cancelled on onCancel', () => {
    spyOn(component.cancelled, 'emit');
    component.onCancel();
    expect(component.cancelled.emit).toHaveBeenCalled();
  });

  it('should not emit cancelled when processing', () => {
    spyOn(component.cancelled, 'emit');
    component.processing = true;
    component.onCancel();
    expect(component.cancelled.emit).not.toHaveBeenCalled();
  });

  it('should not emit cancelled when in SUCCESS view', () => {
    spyOn(component.cancelled, 'emit');
    component.view = 'SUCCESS';
    component.onCancel();
    expect(component.cancelled.emit).not.toHaveBeenCalled();
  });

  it('should process payment and show success', fakeAsync(() => {
    component.upiId = 'test@upi';
    spyOn(component.confirmed, 'emit');
    component.processPay();
    expect(component.processing).toBeTrue();
    tick(2500);
    expect(component.processing).toBeFalse();
    expect(component.view).toBe('SUCCESS');
    tick(2000);
    expect(component.confirmed.emit).toHaveBeenCalledWith({ method: 'RUPAY', upiId: 'test@upi' });
    discardPeriodicTasks();
  }));

  it('should generate ref on init', () => {
    expect(component.ref).toBeTruthy();
    expect(component.ref.length).toBeGreaterThan(0);
  });

  it('should show UPI input view', () => {
    component.view = 'UPI_INPUT';
    fixture.detectChanges();
    const upiInput = fixture.nativeElement.querySelector('input[type="text"]');
    expect(upiInput).toBeTruthy();
  });

  it('should show success view', () => {
    component.view = 'SUCCESS';
    fixture.detectChanges();
    const successText = fixture.nativeElement.querySelector('.success-flow h4');
    expect(successText.textContent).toContain('Payment Successful');
  });

  it('should disable pay button when processing', () => {
    component.view = 'UPI_INPUT';
    component.processing = true;
    fixture.detectChanges();
    const payButton = fixture.nativeElement.querySelector('.pay-finish-btn');
    expect(payButton.disabled).toBeTrue();
  });

  it('should disable pay button when upiId is empty', () => {
    component.view = 'UPI_INPUT';
    component.upiId = '';
    fixture.detectChanges();
    const payButton = fixture.nativeElement.querySelector('.pay-finish-btn');
    expect(payButton.disabled).toBeTrue();
  });

  it('should enable pay button when upiId is set and not processing', () => {
    component.view = 'UPI_INPUT';
    component.upiId = 'test@upi';
    component.processing = false;
    fixture.detectChanges();
    const payButton = fixture.nativeElement.querySelector('.pay-finish-btn');
    expect(payButton.disabled).toBeFalse();
  });
});
