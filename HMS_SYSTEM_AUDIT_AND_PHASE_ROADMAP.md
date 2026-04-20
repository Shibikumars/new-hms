# HMS System Audit and Roadmap

## Scope
This audit reviews the current repository structure and implementation maturity across:
- Gateway and security layer
- All backend microservices
- Frontend Angular application
- Local infrastructure and bootstrap assets

The focus is on runtime error hotspots, missing hospital-management capabilities, risk concentration, and phased completion strategy.

---

## 1) Repository Inventory Snapshot

### Top-level modules
- `api-gateway`
- `auth-service`
- `patient-service`
- `doctor-service`
- `appointment-service`
- `lab-service`
- `medical-records-service`
- `pharmacy-service`
- `billing-service`
- `notification-service`
- `reporting-service`
- `frontend-angular`
- infra assets (`docker-compose.yml`, `infra/mysql/init`)

### Service test coverage signal (file-count level)
- `api-gateway`: main=8, test=4
- `auth-service`: main=22, test=15
- `patient-service`: main=16, test=9
- `doctor-service`: main=16, test=9
- `appointment-service`: main=27, test=10
- `lab-service`: main=22, test=9
- `medical-records-service`: main=8, test=0
- `pharmacy-service`: main=8, test=0
- `billing-service`: main=7, test=0
- `notification-service`: main=12, test=0
- `reporting-service`: main=7, test=0

### Frontend feature modules
`admin`, `analytics`, `appointments`, `auth`, `billing`, `doctor`, `lab`, `notifications`, `patient`, `pharmacy`, `records`

---

## 2) Cross-Cutting Findings

## Strengths
1. **Clear microservice split** by HMS domain.
2. **Gateway-level JWT role checks** exist and are improving.
3. **Frontend route guards** and role guards are implemented.
4. **Notification center** has advanced UX (SLA cards, escalation timeline, filters).
5. **Containerized local stack** exists for full-system startup.

## Critical Gaps
1. **Authorization model duplication**
   - Policy is split across gateway and service controllers.
   - Risk of policy drift and inconsistent behavior.

2. **Ownership enforcement incomplete system-wide**
   - Notifications improved; other domains still depend on URL IDs without strict actor ownership checks.

3. **Uneven test coverage**
   - 0 tests in `billing`, `notification`, `reporting`, `medical-records`, `pharmacy`.

4. **Exception handling inconsistency**
   - Several services still rely on generic `orElseThrow()` and implicit 500 pathways.

5. **Domain realism gaps**
   - Reporting includes static/demo values.
   - Interaction checker is placeholder-like.
   - PDF/reporting export flows are mock-level in parts.

6. **Operational hardening missing**
   - No resilience policy standard (timeouts/retries/circuit breakers) at service boundaries.
   - No centralized audit/event stream for compliance workflows.

---

## 3) Module-by-Module Audit

## `api-gateway`
### Reviewed files
- `src/main/java/com/hms/gateway/security/JwtFilter.java`
- `src/main/resources/application.yml`
- `src/test/java/com/hms/gateway/security/JwtFilterTest.java`

### Findings
- Role matrix is explicit and readable.
- Headers forwarded (`X-User-Role`, `X-Username`, `X-User-Id`) support downstream ownership checks.
- PATIENT escalation action denial now aligned with governance intent.
- New tests added for escalation endpoint access matrix (doctor allow, patient deny).

### Risks / Missing
- Hardcoded signing secret in source (`SECRET`) is a security risk.
- Path-matching approach is brittle for long-term growth (string starts/ends).
- Missing policy versioning or policy-as-code abstraction.

### Recommendation
- Externalize JWT secret and key rotation support.
- Replace manual string policy with rule map/policy service and test table-driven cases.

---

## `auth-service`
### Reviewed files
- `controller/AuthController.java`
- `service/AuthService.java`

### Findings
- Login, register, refresh present.
- JWT includes role and userId claims.

### Risks / Missing
- Refresh token store is in-memory map; no persistence/rotation strategy.
- Generic runtime exceptions for auth failures.
- No explicit account lockout, failed-attempt threshold, or session revocation API.

### Recommendation
- Persist refresh sessions with expiry and revocation state.
- Add brute-force controls and audit trail for auth events.

---

## `patient-service`
### Reviewed files
- `controller/PatientController.java`
- `service/PatientService.java`

### Findings
- Basic CRUD implemented.
- 404 handling present in controller for `GET /patients/{id}`.

### Risks / Missing
- No explicit soft-delete/archive model.
- No patient onboarding/profile-completion orchestration.
- No strict ownership checks (depends on gateway role broad GET access).

### Recommendation
- Add patient identity linkage to auth user id and ownership guard at service level.
- Add profile completion states and onboarding hooks.

---

## `doctor-service`
### Reviewed files
- `controller/DoctorController.java`

### Findings
- Search by specialty and basic CRUD available.

### Risks / Missing
- No scheduling constraints entity (availability templates, leave blocks, clinic shifts).
- No capacity or concurrency controls for provider schedules.

### Recommendation
- Introduce doctor schedule domain model and enforce slot generation from schedules.

---

## `appointment-service`
### Reviewed files
- `controller/AppointmentController.java`
- `service/AppointmentService.java`

### Findings
- Good domain flow: validates patient/doctor existence and slot collision.
- Upcoming-by-patient endpoint exists.

### Risks / Missing
- Availability parsing from free text is fragile.
- No transactional lock for race-safe slot booking at DB level.
- No cancellation reason/no-show tracking.

### Recommendation
- Move to normalized slot inventory table + optimistic/pessimistic locking.
- Add appointment lifecycle states and audit metadata.

---

## `lab-service`
### Reviewed files
- `controller/LabController.java`
- `service/LabService.java`

### Findings
- Orders, result entry, trend endpoints present.
- Notification integration for result-ready event.

### Risks / Missing
- PDF endpoint returns placeholder payload (not real artifact flow).
- No verification/approval stage for lab results.
- No reference ranges by age/sex for clinical interpretation.

### Recommendation
- Add report artifact service and signed report generation.
- Add two-step result workflow (entered -> verified).

---

## `medical-records-service`
### Reviewed files
- `controller/MedicalRecordsController.java`
- `service/MedicalRecordsService.java`

### Findings
- Visit notes and vitals persisted.
- ICD search exists.

### Risks / Missing
- ICD source is static in code.
- No longitudinal problem list, allergies, procedures, or medication history linkage.
- No tests in module.

### Recommendation
- Externalize coding dictionaries and add clinical record aggregate model.
- Add unit/integration tests for records workflows.

---

## `pharmacy-service`
### Reviewed files
- `controller/PharmacyController.java`
- `service/PharmacyService.java`

### Findings
- Medication search and prescription issue flows exist.

### Risks / Missing
- Drug interaction endpoint currently returns static response.
- No dispensing inventory decrement model.
- No refill policy/authorization trail.
- No tests in module.

### Recommendation
- Implement real interaction engine integration and inventory events.
- Add dispense/refill entities and pharmacist approval states.

---

## `billing-service`
### Reviewed files
- `controller/BillingController.java`
- `service/BillingService.java`

### Findings
- Invoice create, fetch, pay, claim status endpoints available.
- Uses records client for source summary enrichment.

### Risks / Missing
- Patient ownership checks are not enforced in service.
- Payment endpoint lacks transaction id/payment method provenance.
- Claim status is simplistic and not insurer-workflow aware.
- No tests in module.

### Recommendation
- Add ledger-grade payment transaction model.
- Add payer claim lifecycle states and rejection reasons.
- Add ownership checks and tests.

---

## `notification-service`
### Reviewed files
- `entity/NotificationItem.java`
- `controller/NotificationController.java`
- `service/NotificationService.java`
- `service/EscalationAutomationScheduler.java`
- `resources/application.yml`

### Findings
- Advanced escalation lifecycle now exists (`ACTIVE/RESOLVED`, owner, notes).
- Ownership checks for PATIENT requests implemented.
- Scheduled SLA automation present.

### Risks / Missing
- No dedicated escalation history table (state-overwrite model only).
- No tests in module despite complex workflow logic.
- Broadcast/eventing reliability strategy not formalized (retry/dead-letter).

### Recommendation
- Add immutable escalation event log table.
- Add notification/escalation unit + integration tests.
- Add event delivery and idempotency strategy.

---

## `reporting-service`
### Reviewed files
- `controller/ReportingController.java`
- `service/ReportingService.java`

### Findings
- Endpoint coverage is broad for dashboard use-cases.

### Risks / Missing
- Several values are static or mock-like (`activeDoctors`, hardcoded metrics, simplified revenue).
- No tests in module.
- No async data prep/caching pipeline.

### Recommendation
- Introduce materialized reporting tables or scheduled aggregations.
- Remove hardcoded KPIs and source from domain services.

---

## `frontend-angular`
### Reviewed files
- Core: `app.routes.ts`, guards, `auth.service.ts`, `app.component.ts`
- Features: patient, billing, notifications, analytics and related API services

### Findings
- Premium-style UX is significantly improved.
- Role-based route segregation in place.
- Notification UX is feature-rich and close to production-grade triage.

### Risks / Missing
- Tight coupling to backend query patterns; weak fallback in some non-notification modules.
- No visible E2E test layer.
- Error presentation consistency varies between components.

### Recommendation
- Add global typed API error strategy (interceptor + domain error mappers).
- Add Cypress/Playwright smoke tests for critical journeys.

---

## 4) Error and Missing-Implementation Hotspot List

1. **Security Secrets in code**
   - `api-gateway/JwtFilter.java` hardcoded secret.

2. **In-memory refresh token sessions**
   - `auth-service/AuthService.java` volatile refresh lifecycle.

3. **Mock/placeholder behavior**
   - `lab-service` PDF endpoint placeholder.
   - `pharmacy-service` interaction checker static response.
   - `reporting-service` static KPI sections.

4. **Test vacuum in high-risk modules**
   - `billing-service`, `notification-service`, `reporting-service`, `medical-records-service`, `pharmacy-service`.

5. **Ownership policy consistency risk**
   - Improved in notification flow but not uniformly enforced across all patient-scoped reads/writes.

---

## 5) Recommended Completion Phases

Estimated remaining structured roadmap: **12 phases**.

### Phase 29 - Security hardening baseline
- Externalize JWT secret, key rotation strategy.
- Persist refresh token sessions with revocation.

### Phase 30 - Policy consistency layer
- Centralize authorization rule matrix.
- Add table-driven policy tests in gateway and service-level ownership tests.

### Phase 31 - Appointment concurrency safety
- Slot inventory model + race-safe booking transaction semantics.

### Phase 32 - Billing transaction integrity
- Payment transaction entity, method metadata, reconciliation states.

### Phase 33 - Real claim workflow
- Claim lifecycle states (submitted, pending, rejected, settled) + reasons.

### Phase 34 - Pharmacy clinical safety
- Real interaction checks, dispense inventory, refill governance.

### Phase 35 - Records clinical depth
- Allergies, problem list, procedures, meds timeline, ICD externalized source.

### Phase 36 - Lab report quality
- Verification stage and real PDF/report artifact management.

### Phase 37 - Notification reliability
- Immutable escalation event log + retry/idempotency strategy.

### Phase 38 - Reporting accuracy
- Replace static metrics with aggregated factual pipelines.

### Phase 39 - Frontend reliability and observability
- Unified API error mapping, toast policy, telemetry hooks.

### Phase 40 - Quality gates and release readiness
- Service test completion, contract tests, E2E smoke suite, deployment runbooks.

---

## 6) Priority Matrix

## Highest priority (execute first)
1. Security secret externalization + token governance
2. Authorization/ownership consistency
3. Billing/payment integrity + appointment booking concurrency

## Medium priority
1. Notification reliability/event log
2. Lab/report artifact maturity
3. Pharmacy interaction and inventory realism

## Foundational but can follow
1. Reporting depth
2. UX refinements after backend invariants are stable

---

## 7) Conclusion

The HMS codebase is in a **strong transitional state**: architecture and user experience are broad and ambitious, with substantial feature velocity in notifications and role-based flows. The current gap is not feature absence alone; it is **production-grade consistency** across security policy, ownership enforcement, transaction integrity, and test rigor.

If the roadmap above is executed in order, the project can move from “functional multi-module prototype” to “operationally safe and clinically credible platform.”

Immediate execution recommendation: start with **Phases 29–31** before adding new end-user features.
