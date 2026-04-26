import { TestBed } from '@angular/core/testing';
import { TelemetryService, ApiErrorTelemetry } from './telemetry.service';

describe('TelemetryService', () => {
  let service: TelemetryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TelemetryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('trackApiError should log error for 500 status', () => {
    spyOn(console, 'error');
    spyOn(window, 'dispatchEvent');

    const event: ApiErrorTelemetry = {
      url: '/api/test',
      method: 'GET',
      status: 500,
      message: 'Server error',
      durationMs: 100,
      timestamp: '2026-04-26T10:00:00Z'
    };

    service.trackApiError(event);

    expect(console.error).toHaveBeenCalledWith('[HMS][API-ERROR]', event);
    expect(window.dispatchEvent).toHaveBeenCalled();
  });

  it('trackApiError should log warn for 400 status', () => {
    spyOn(console, 'warn');
    spyOn(window, 'dispatchEvent');

    const event: ApiErrorTelemetry = {
      url: '/api/test',
      method: 'GET',
      status: 400,
      message: 'Bad request',
      durationMs: 50,
      timestamp: '2026-04-26T10:00:00Z'
    };

    service.trackApiError(event);

    expect(console.warn).toHaveBeenCalledWith('[HMS][API-ERROR]', event);
    expect(window.dispatchEvent).toHaveBeenCalled();
  });

  it('trackApiError should dispatch custom event', (done) => {
    const dispatchedEvents: CustomEvent<ApiErrorTelemetry>[] = [];

    const handler = (e: Event) => {
      dispatchedEvents.push(e as CustomEvent<ApiErrorTelemetry>);
      window.removeEventListener('hms-api-error', handler);
      
      expect(dispatchedEvents.length).toBe(1);
      expect(dispatchedEvents[0].detail).toEqual(event);
      done();
    };

    window.addEventListener('hms-api-error', handler);

    const event: ApiErrorTelemetry = {
      url: '/api/test',
      method: 'POST',
      status: 404,
      message: 'Not found',
      durationMs: 75,
      timestamp: '2026-04-26T10:00:00Z'
    };

    service.trackApiError(event);
  });
});
