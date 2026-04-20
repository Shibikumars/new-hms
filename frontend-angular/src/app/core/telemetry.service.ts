import { Injectable } from '@angular/core';

export type ApiErrorTelemetry = {
  url: string;
  method: string;
  status: number;
  message: string;
  durationMs: number;
  timestamp: string;
};

@Injectable({ providedIn: 'root' })
export class TelemetryService {
  trackApiError(event: ApiErrorTelemetry): void {
    if (event.status >= 500) {
      console.error('[HMS][API-ERROR]', event);
    } else {
      console.warn('[HMS][API-ERROR]', event);
    }
    window.dispatchEvent(new CustomEvent<ApiErrorTelemetry>('hms-api-error', { detail: event }));
  }
}
