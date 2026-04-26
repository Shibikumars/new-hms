import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DatePickerComponent } from './date-picker.component';
import { FormsModule } from '@angular/forms';

describe('DatePickerComponent', () => {
  let component: DatePickerComponent;
  let fixture: ComponentFixture<DatePickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatePickerComponent, FormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(DatePickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set minDate input', () => {
    component.minDate = '2026-01-01';
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input');
    expect(input.min).toBe('2026-01-01');
  });

  it('should set maxDate input', () => {
    component.maxDate = '2026-12-31';
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input');
    expect(input.max).toBe('2026-12-31');
  });

  it('should write value via writeValue', () => {
    component.writeValue('2026-04-26');
    expect(component.value).toBe('2026-04-26');
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input');
    expect(input.value).toBe('2026-04-26');
  });

  it('should write empty string when value is null', () => {
    component.writeValue(null as any);
    expect(component.value).toBe('');
  });

  it('should call onChange on input', () => {
    spyOn(component, 'onChange');
    const input = fixture.nativeElement.querySelector('input');
    input.value = '2026-04-26';
    input.dispatchEvent(new Event('input'));
    expect(component.onChange).toHaveBeenCalledWith('2026-04-26');
  });

  it('should call onTouched on blur', () => {
    spyOn(component, 'onTouched');
    const input = fixture.nativeElement.querySelector('input');
    input.dispatchEvent(new Event('blur'));
    expect(component.onTouched).toHaveBeenCalled();
  });

  it('should set disabled state via setDisabledState', () => {
    component.setDisabledState(true);
    expect(component.disabled).toBeTrue();
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input');
    expect(input.disabled).toBeTrue();
  });

  it('should register onChange callback', () => {
    const fn = jasmine.createSpy('onChange');
    component.registerOnChange(fn);
    component.onInput({ target: { value: '2026-04-26' } } as any);
    expect(fn).toHaveBeenCalledWith('2026-04-26');
  });

  it('should register onTouched callback', () => {
    const fn = jasmine.createSpy('onTouched');
    component.registerOnTouched(fn);
    component.onTouched();
    expect(fn).toHaveBeenCalled();
  });
});
