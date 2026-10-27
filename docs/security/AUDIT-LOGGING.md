# Audit Logging

All user activity in the BCP application is logged to the `bcp_audit_log` table.

## Event Types

| Event Type | Trigger | Logged Data |
|-----------|---------|-------------|
| LOGIN_SUCCESS | Successful login | username, ip_address |
| LOGIN_FAILED | Failed login attempt | username (attempted), ip_address |
| PATIENT_SEARCHED | Patient search executed | username, search query (in additional_data) |
| PATIENT_VIEWED | Clinical profile viewed | username, mrn, encounter_id |
| PDF_VIEWED | PDF document downloaded | username, mrn, document_id |
| BCP_NOTE_CREATED | Clinical note created | username, mrn, noteType (in additional_data) |
| TEMP_PATIENT_CREATED | Temp patient registered | username, mrn |
| TEMP_PATIENT_UPDATED | Temp patient demographics edited | username, mrn |
| LOGOUT | User logout | username |

## Automatic Logging

The `AuditInterceptor` (NestJS global interceptor) automatically logs events based on route patterns:

| Route Pattern | Success Event | Failure Event |
|--------------|---------------|---------------|
| POST /api/auth/login | LOGIN_SUCCESS | LOGIN_FAILED |
| GET /api/bcp/patients/search | PATIENT_SEARCHED | — |
| GET /api/bcp/patients/:mrn/profile | PATIENT_VIEWED | — |
| GET /api/bcp/documents/:id/download | PDF_VIEWED | — |
| GET /api/bcp/patients/:mrn/clinical-summary/pdf | PDF_VIEWED | — |
| POST /api/bcp/patients/:mrn/notes | BCP_NOTE_CREATED | — |
| POST /api/bcp/patients/register-temp | TEMP_PATIENT_CREATED | — |
| PATCH /api/bcp/patients/:mrn/demographics | TEMP_PATIENT_UPDATED | — |
| POST /api/auth/logout | LOGOUT | — |

The interceptor uses RxJS `tap()` for success logging and `catchError()` for failure logging (login failures).

## Audit Entry Fields

| Field | Source | Description |
|-------|--------|-------------|
| tenant_id | JWT / middleware | Tenant context |
| event_type | Route mapping | One of the 6 event types |
| username | JWT payload | User who performed the action |
| user_role | JWT payload | User's role at time of action |
| ip_address | Request headers | Client IP (X-Forwarded-For or remote address) |
| patient_id | Route params | Patient context (if applicable) |
| mrn | Route params | MRN context (if applicable) |
| encounter_id | Query/body | Encounter context (if applicable) |
| event_timestamp | Server time | When the event occurred |
| additional_data | Varies | JSONB with extra context (search query, document ID, etc.) |

## Data Retention

- Audit logs are **append-only** and never deleted
- No automatic archival in Phase-1
- Queryable via `GET /api/bcp/audit` (ADMIN only) with filters on event_type, username, date range

## Manual Audit Entries

External systems (e.g., n8n workflows) can create audit entries via `POST /api/bcp/audit` (ADMIN role required).
