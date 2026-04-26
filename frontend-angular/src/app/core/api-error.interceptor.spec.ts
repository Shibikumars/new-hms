import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { apiErrorInterceptor } from './api-error.interceptor';
import { UiFeedbackService } from './ui-feedback.service';
import { TelemetryService } from './telemetry.service';

describe('apiErrorInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let feedbackSpy: jasmine.SpyObj<UiFeedbackService>;
  let telemetrySpy: jasmine.SpyObj<TelemetryService>;

  beforeEach(() => {
    feedbackSpy = jasmine.createSpyObj('UiFeedbackService', ['error', 'warn']);
    telemetrySpy = jasmine.createSpyObj('TelemetryService', ['trackApiError']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
        { provide: UiFeedbackService, useValue: feedbackSpy },
        { provide: TelemetryService, useValue: telemetrySpy },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
  });

  afterEach(() => {
    if (httpMock) {
      httpMock.verify();
    }
  });

  it('should call feedback.error on 500 error', () => {
    httpClient.get('/api/test').subscribe({
      error: () => {}
    });

    const req = httpMock.expectOne('/api/test');
    req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

    expect(feedbackSpy.error).toHaveBeenCalledWith('Server error occurred. Please retry shortly.');
    expect(telemetrySpy.trackApiError).toHaveBeenCalled();
  });

  it('should call feedback.warn on 429 error', () => {
    httpClient.get('/api/test').subscribe({
      error: () => {}
    });

    const req = httpMock.expectOne('/api/test');
    req.flush('Too many requests', { status: 429, statusText: 'Too Many Requests' });

    expect(feedbackSpy.warn).toHaveBeenCalledWith('Too many requests. Please wait and retry.');
    expect(telemetrySpy.trackApiError).toHaveBeenCalled();
  });

  it('should call feedback.warn on 403 error', () => {
    httpClient.get('/api/test').subscribe({
      error: () => {}
    });

    const req = httpMock.expectOne('/api/test');
    req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });

    expect(feedbackSpy.warn).toHaveBeenCalledWith('You do not have permission for this action.');
    expect(telemetrySpy.trackApiError).toHaveBeenCalled();
  });

  it('should NOT call feedback on 401 login error', () => {
    httpClient.post('/auth/login', {}).subscribe({
      error: () => {}
    });

    const req = httpMock.expectOne('/auth/login');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(feedbackSpy.error).not.toHaveBeenCalled();
    expect(feedbackSpy.warn).not.toHaveBeenCalled();
    expect(telemetrySpy.trackApiError).not.toHaveBeenCalled();
  });

  it('should call telemetry on 401 non-login error but not feedback', () => {
    httpClient.get('/api/test').subscribe({
      error: () => {}
    });

    const req = httpMock.expectOne('/api/test');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(feedbackSpy.warn).not.toHaveBeenCalled();
    expect(feedbackSpy.error).not.toHaveBeenCalled();
    expect(telemetrySpy.trackApiError).toHaveBeenCalled();
  });

  it('should handle network error (status 0)', () => {
    httpClient.get('/api/test').subscribe({
      error: () => {}
    });

    const req = httpMock.expectOne('/api/test');
    req.flush('Network error', { status: 0, statusText: 'Unknown Error' });

    expect(feedbackSpy.warn).toHaveBeenCalledWith('Network unavailable. Check connection and retry.');
    expect(telemetrySpy.trackApiError).toHaveBeenCalled();
  });

  it('should extract backend message from error object', () => {
    httpClient.get('/api/test').subscribe({
      error: () => {}
    });

    const req = httpMock.expectOne('/api/test');
    req.flush({ message: 'Custom backend error' }, { status: 400, statusText: 'Bad Request' });

    expect(feedbackSpy.warn).toHaveBeenCalledWith('Custom backend error');
  });

  it('should use default message when no backend message', () => {
    httpClient.get('/api/test').subscribe({
      error: () => {}
    });

    const req = httpMock.expectOne('/api/test');
    req.flush({ error: 'Some error' }, { status: 400, statusText: 'Bad Request' });

    expect(feedbackSpy.warn).toHaveBeenCalledWith('Request validation failed. Please review inputs.');
  });

  it('should handle 409 conflict error', () => {
    httpClient.get('/api/test').subscribe({
      error: () => {}
    });

    const req = httpMock.expectOne('/api/test');
    req.flush('Conflict', { status: 409, statusText: 'Conflict' });

    expect(feedbackSpy.warn).toHaveBeenCalledWith('Request conflicts with current system state.');
    expect(telemetrySpy.trackApiError).toHaveBeenCalled();
  });

  it('should handle 404 not found error', () => {
    httpClient.get('/api/test').subscribe({
      error: () => {}
    });

    const req = httpMock.expectOne('/api/test');
    req.flush('Not found', { status: 404, statusText: 'Not Found' });

    expect(feedbackSpy.warn).toHaveBeenCalledWith('Requested record was not found.');
    expect(telemetrySpy.trackApiError).toHaveBeenCalled();
  });

  it('should handle unexpected status code with default message', () => {
    httpClient.get('/api/test').subscribe({
      error: () => {}
    });

    const req = httpMock.expectOne('/api/test');
    req.flush({ error: 'Some error' }, { status: 418, statusText: "I'm a teapot" });

    expect(feedbackSpy.warn).toHaveBeenCalledWith('Unexpected API error occurred.');
    expect(telemetrySpy.trackApiError).toHaveBeenCalled();
  });

  it('should extract backend message from string payload', () => {
    httpClient.get('/api/test').subscribe({
      error: () => {}
    });

    const req = httpMock.expectOne('/api/test');
    req.flush('String error message', { status: 400, statusText: 'Bad Request' });

    expect(feedbackSpy.warn).toHaveBeenCalledWith('String error message');
  });
});
