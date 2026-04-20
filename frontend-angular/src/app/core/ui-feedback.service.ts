import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type UiToastKind = 'info' | 'warn' | 'error';

export type UiFeedbackMessage = {
  message: string;
  kind: UiToastKind;
};

@Injectable({ providedIn: 'root' })
export class UiFeedbackService {
  private readonly stream = new Subject<UiFeedbackMessage>();

  readonly messages$ = this.stream.asObservable();

  info(message: string): void {
    this.publish(message, 'info');
  }

  warn(message: string): void {
    this.publish(message, 'warn');
  }

  error(message: string): void {
    this.publish(message, 'error');
  }

  private publish(message: string, kind: UiToastKind): void {
    if (!message || !message.trim()) return;
    this.stream.next({ message: message.trim(), kind });
  }
}
