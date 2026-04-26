# Testing Guide - HMS Frontend

## Quick Commands

### Run All Tests
```bash
cd frontend-angular
npm test
```

### Run Tests with Coverage
```bash
cd frontend-angular
npm test -- --code-coverage
```

### Run Tests in Watch Mode
```bash
cd frontend-angular
npm test -- --watch
```

### Run Specific Test File
```bash
cd frontend-angular
npm test -- --include="**/auth.service.spec.ts"
```

## Viewing Coverage Reports

After running tests with coverage, the report is generated in:
```
frontend-angular/coverage/healthcare-frontend/index.html
```

Open this file in a browser to view detailed coverage information.

## Current Coverage Status

- **Statements**: 89.02% (730/820)
- **Branches**: 76.8% (192/250)
- **Functions**: 85.18% (253/297)
- **Lines**: 88.98% (687/772)
- **Total Tests**: 359 (All Passing)

## Test Summary

### Core Services
- **AuthService**: Authentication token management, login/logout, role-based access
- **IdleService**: User idle detection, countdown timer, tracking state
- **PatientContextService**: Patient context management for PATIENT role
- **TelemetryService**: API error tracking and analytics
- **ToastService**: Toast notification management
- **UiFeedbackService**: User feedback (error/warn messages)
- **NotificationsSocketService**: WebSocket connection for real-time notifications
- **NotificationsBadgeSocketService**: Badge count synchronization via WebSocket

### Interceptors
- **apiErrorInterceptor**: HTTP error handling with user-friendly messages
  - Handles 400, 401, 403, 404, 409, 429, 500 errors
  - Extracts backend error messages
  - Suppresses feedback on 401 login errors
  - Tracks errors via telemetry

### Guards
- **authGuard**: Route protection based on authentication
- **roleGuard**: Role-based route access control

### Components
- **AppComponent**: Main shell, navigation, sidebar, profile menu, idle modal
- **LoginComponent**: Login form, validation, role-based navigation, OTP handling
- **RegisterComponent**: Registration form, role selection, validation
- **AutocompleteComponent**: Search with debounce, dropdown, item selection
- **ModalComponent**: Modal dialog with open/close/confirm events
- **StatusBadgeComponent**: Status display with type inference
- **FileUploadComponent**: Drag-and-drop file upload
- **CommandPaletteComponent**: Quick command search
- **DataTableComponent**: Data table with sorting/filtering
- **DatePickerComponent**: Date selection
- **TimePickerComponent**: Time selection
- **PaymentModalComponent**: Payment form
- **MRNDisplayComponent**: Medical record number display
- **NotFoundComponent**: 404 page

### API Services
- **BillingApiService**: Billing operations
- **DoctorProfileService**: Doctor profile management
- **LabApiService**: Lab results and requests
- **MedicalRecordsApiService**: Medical records CRUD
- **NotificationsApiService**: Notification management
- **PatientProfileService**: Patient profile management
- **PharmacyApiService**: Pharmacy operations
- **QueueApiService**: Queue management
- **RecordsApiService**: General records operations
- **ReportingApiService**: Analytics and reporting

## Test Setup

### Key Dependencies
- Jasmine/Karma for testing framework
- Angular TestBed for component testing
- HttpClientTestingModule for HTTP mocking
- RouterTestingModule for routing tests
- RxJS for observable testing

### Polyfills
Tests include polyfills for SockJS compatibility:
- `src/polyfills.ts` - Global and process polyfills
- Karma config includes window.global and window.process initialization

## Notes

- All tests use `afterEach` cleanup to prevent state leakage
- WebSocket services use simplified testing (actual WebSocket mocking is complex)
- Router navigation tests use spies to avoid actual navigation
- HTTP tests use HttpTestingController for request/response mocking
- Async tests use `fakeAsync`, `tick`, and `done` callbacks

## CI/CD Integration

For CI/CD pipelines, use:
```bash
cd frontend-angular
npm test -- --watch=false --browsers=ChromeHeadless --code-coverage
```

This ensures tests run in headless mode without watch, suitable for automated environments.
