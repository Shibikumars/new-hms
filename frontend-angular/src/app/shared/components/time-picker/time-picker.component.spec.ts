import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TimePickerComponent } from './time-picker.component';
import { FormsModule } from '@angular/forms';

describe('TimePickerComponent', () => {
  let component: TimePickerComponent;
  let fixture: ComponentFixture<TimePickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimePickerComponent, FormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(TimePickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should write value via writeValue', () => {
    component.writeValue('10:30');
    expect(component.value).toBe('10:30');
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input');
    expect(input.value).toBe('10:30');
  });

  it('should write empty string when value is null', () => {
    component.writeValue(null as any);
    expect(component.value).toBe('');
  });

  it('should call onChange on input', () => {
    spyOn(component, 'onChange');
    const input = fixture.nativeElement.querySelector('input');
    input.value = '14:45';
    input.dispatchEvent(new Event('input'));
    expect(component.onChange).toHaveBeenCalledWith('14:45');
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
    component.onInput({ target: { value: '09:15' } } as any);
    expect(fn).toHaveBeenCalledWith('09:15');
  });

  it('should register onTouched callback', () => {
    const fn = jasmine.createSpy('onTouched');
    component.registerOnTouched(fn);
    component.onTouched();
    expect(fn).toHaveBeenCalled();
  });
});
