import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  toasts$ = this.toastsSubject.asObservable();

  show(toast: Omit<Toast, 'id'>): void {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...toast, id };
    const current = this.toastsSubject.value;
    this.toastsSubject.next([...current, newToast]);

    if (toast.duration !== 0) {
      setTimeout(() => this.remove(id), toast.duration || 5000);
    }
  }

  remove(id: string): void {
    const current = this.toastsSubject.value;
    this.toastsSubject.next(current.filter(t => t.id !== id));
  }

  info(title: string, message: string): void {
    this.show({ title, message, type: 'info' });
  }

  success(title: string, message: string): void {
    this.show({ title, message, type: 'success' });
  }

  error(title: string, message: string): void {
    this.show({ title, message, type: 'error' });
  }

  warning(title: string, message: string): void {
    this.show({ title, message, type: 'warning' });
  }
}
