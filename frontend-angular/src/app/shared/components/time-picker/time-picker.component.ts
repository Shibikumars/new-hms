import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-time-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TimePickerComponent),
      multi: true
    }
  ],
  template: `
    <div class="input-wrapper">
      <i class="ph ph-clock icon-prefix"></i>
      <input type="time"
             [value]="value"
             (input)="onInput($event)"
             (blur)="onTouched()"
             [disabled]="disabled"
             class="custom-input" />
    </div>
  `,
  styles: [`
    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
    }
    .icon-prefix {
      position: absolute;
      left: 0.8rem;
      color: var(--text-muted);
      font-size: 1.1rem;
      pointer-events: none;
    }
    .custom-input {
      width: 100%;
      padding: 0.7rem 0.9rem 0.7rem 2.4rem;
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-sm);
      background: var(--surface);
      color: var(--text);
      font-size: 0.95rem;
      transition: all 0.2s;
    }
    .custom-input:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px var(--primary-glow);
    }
    .custom-input:disabled {
      background: var(--surface-strong);
      color: var(--text-muted);
      cursor: not-allowed;
    }
    ::-webkit-calendar-picker-indicator {
      cursor: pointer;
      opacity: 0.6;
      transition: 0.2s;
    }
    ::-webkit-calendar-picker-indicator:hover { opacity: 1; }
  `]
})
export class TimePickerComponent implements ControlValueAccessor {
  value: string = '';
  disabled = false;

  onChange = (val: string) => {};
  onTouched = () => {};

  onInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.value = val;
    this.onChange(val);
  }

  writeValue(val: string): void {
    this.value = val || '';
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
