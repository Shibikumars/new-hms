import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { TelemetryService } from './telemetry.service';
import { UiFeedbackService } from './ui-feedback.service';

export const apiErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const feedback = inject(UiFeedbackService);
  const telemetry = inject(TelemetryService);
  const startedAt = performance.now();

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        const message = mapApiErrorMessage(error);
        if (error.status >= 500) {
          feedback.error(message);
        } else if (error.status === 429) {
          feedback.warn(message);
        } else if (error.status !== 401) {
          feedback.warn(message);
        }

        telemetry.trackApiError({
          url: req.url,
          method: req.method,
          status: error.status,
          message,
          durationMs: Math.max(0, Math.round(performance.now() - startedAt)),
          timestamp: new Date().toISOString()
        });
      }

      return throwError(() => error);
    })
  );
};

function mapApiErrorMessage(error: HttpErrorResponse): string {
  if (error.status === 0) return 'Network unavailable. Check connection and retry.';
  if (error.status === 400) return 'Request validation failed. Please review inputs.';
  if (error.status === 401) return 'Your session expired. Please sign in again.';
  if (error.status === 403) return 'You do not have permission for this action.';
  if (error.status === 404) return 'Requested record was not found.';
  if (error.status === 409) return 'Request conflicts with current system state.';
  if (error.status === 429) return 'Too many requests. Please wait and retry.';
  if (error.status >= 500) return 'Server error occurred. Please retry shortly.';

  const backendMessage = typeof error.error === 'string' ? error.error : '';
  return backendMessage || 'Unexpected API error occurred.';
}
