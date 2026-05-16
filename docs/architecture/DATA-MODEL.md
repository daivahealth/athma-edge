# Data Model

Complete database schema reference for Athma Edge. All tables live in a single PostgreSQL database (`bcp_db`).

## Design Principles

- External IDs are VARCHAR (not UUID) — they come from source HIS systems
- Soft delete via `is_active`, `active_from`, `active_until`, `business_date`
- Every table includes `tenant_id` for multi-tenant scoping
- JSONB for semi-structured clinical data (vitals, medications, investigations)
- BIGSERIAL for internal primary keys

## Tables

### bcp_active_patient

Active patient census and patient search table.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | BIGSERIAL | NO | auto | PK |
| tenant_id | VARCHAR(100) | NO | | |
| source_system | VARCHAR(100) | NO | | |
| patient_id | VARCHAR(100) | YES | | External patient ID |
| mrn | VARCHAR(50) | NO | | Medical Record Number |
| uhid | VARCHAR(50) | YES | | Unique Health ID |
| encounter_id | VARCHAR(100) | YES | | |
| visit_number | VARCHAR(50) | YES | | |
| patient_name | VARCHAR(255) | NO | | |
| date_of_birth | DATE | YES | | |
| age | VARCHAR(20) | YES | | Stored as string (e.g., "45Y", "3M") |
| gender | VARCHAR(20) | YES | | |
| mobile_number | VARCHAR(30) | YES | | |
| care_setting | VARCHAR(30) | NO | | INPATIENT, OUTPATIENT, DAYCARE, EMERGENCY |
| encounter_status | VARCHAR(50) | YES | | |
| appointment_status | VARCHAR(50) | YES | | |
| business_date | DATE | NO | | |
| unit_name | VARCHAR(100) | YES | | |
| ward_name | VARCHAR(100) | YES | | |
| bed_number | VARCHAR(50) | YES | | |
| consultant_id | VARCHAR(100) | YES | | |
| consultant_name | VARCHAR(255) | YES | | |
| admission_datetime | TIMESTAMP | YES | | |
| visit_start_datetime | TIMESTAMP | YES | | |
| discharge_datetime | TIMESTAMP | YES | | |
| is_mlc | BOOLEAN | NO | false | Medico-Legal Case flag |
| is_active | BOOLEAN | NO | true | |
| active_from | TIMESTAMP | YES | | |
| active_until | TIMESTAMP | YES | | |
| last_seen_in_source_at | TIMESTAMP | YES | | Last time seen in source HIS |
| last_synced_at | TIMESTAMP | NO | | Last sync timestamp |
| created_at | TIMESTAMP | NO | now() | |
| updated_at | TIMESTAMP | NO | now() | |

**Constraints:**
- CHECK: `care_setting` IN ('INPATIENT', 'OUTPATIENT', 'DAYCARE', 'EMERGENCY')
- UNIQUE: `(tenant_id, source_system, mrn, visit_number)`

**Indexes:**
- `bcp_active_patient(mrn)`
- `bcp_active_patient(uhid)`
- `bcp_active_patient(patient_name)`
- `bcp_active_patient(care_setting)`
- `bcp_active_patient(business_date)`
- `bcp_active_patient(is_active)`
- `bcp_active_patient(ward_name, bed_number)`
- `bcp_active_patient(tenant_id, source_system, mrn, visit_number)` — unique index

---

### bcp_patient_clinical_profile

Lean clinical continuity profile per patient. Not a full EMR — just enough for clinical handover.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | BIGSERIAL | NO | auto | PK |
| tenant_id | VARCHAR(100) | NO | | |
| source_system | VARCHAR(100) | NO | | |
| patient_id | VARCHAR(100) | YES | | |
| mrn | VARCHAR(50) | NO | | |
| uhid | VARCHAR(50) | YES | | |
| encounter_id | VARCHAR(100) | YES | | |
| visit_number | VARCHAR(50) | YES | | |
| allergies | TEXT | YES | | |
| blood_group | VARCHAR(20) | YES | | |
| primary_diagnosis | TEXT | YES | | |
| high_risk_flags | TEXT | YES | | |
| latest_vitals | JSONB | YES | | |
| active_medications | JSONB | YES | | |
| pending_investigations | JSONB | YES | | |
| critical_results | TEXT | YES | | |
| handover_notes | TEXT | YES | | |
| last_clinical_update_at | TIMESTAMP | YES | | |
| last_synced_at | TIMESTAMP | NO | | |
| created_at | TIMESTAMP | NO | now() | |
| updated_at | TIMESTAMP | NO | now() | |

**Indexes:**
- `bcp_patient_clinical_profile(mrn)`
- `bcp_patient_clinical_profile(encounter_id)`

---

### bcp_patient_pdf_document

Metadata for locally stored PDF documents. Binary content is on the filesystem, not in PostgreSQL.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | BIGSERIAL | NO | auto | PK |
| tenant_id | VARCHAR(100) | NO | | |
| source_system | VARCHAR(100) | NO | | |
| patient_id | VARCHAR(100) | YES | | |
| mrn | VARCHAR(50) | NO | | |
| uhid | VARCHAR(50) | YES | | |
| encounter_id | VARCHAR(100) | YES | | |
| visit_number | VARCHAR(50) | YES | | |
| document_type | VARCHAR(100) | NO | | See enum below |
| document_name | VARCHAR(255) | YES | | |
| file_path | TEXT | NO | | Path on local filesystem |
| mime_type | VARCHAR(100) | NO | application/pdf | |
| document_datetime | TIMESTAMP | YES | | |
| file_size | BIGINT | YES | | Bytes |
| checksum | VARCHAR(255) | YES | | SHA-256 for dedup |
| is_active | BOOLEAN | NO | true | |
| last_synced_at | TIMESTAMP | NO | | |
| created_at | TIMESTAMP | NO | now() | |

**Document types:** CLINICAL_SUMMARY, LAB_REPORT, RADIOLOGY_REPORT, MAR, NURSING_NOTE, DISCHARGE_SUMMARY, CONSENT, OTHER

**Indexes:**
- `bcp_patient_pdf_document(mrn)`
- `bcp_patient_pdf_document(document_type)`

---

### bcp_sync_status

Tracks n8n sync health per component.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | BIGSERIAL | NO | auto | PK |
| tenant_id | VARCHAR(100) | YES | | |
| source_system | VARCHAR(100) | YES | | |
| sync_component | VARCHAR(100) | NO | | See enum below |
| sync_status | VARCHAR(30) | NO | | See enum below |
| last_successful_sync_at | TIMESTAMP | YES | | |
| last_attempt_at | TIMESTAMP | YES | | |
| records_processed | BIGINT | NO | 0 | |
| records_failed | BIGINT | NO | 0 | |
| sync_cursor | VARCHAR(255) | YES | | Bookmark for incremental sync |
| error_message | TEXT | YES | | |
| created_at | TIMESTAMP | NO | now() | |
| updated_at | TIMESTAMP | NO | now() | |

**sync_component values:** ACTIVE_PATIENT, CLINICAL_PROFILE, PDF_DOCUMENT

**sync_status values:** SUCCESS, FAILED, PARTIAL, RUNNING

**Indexes:**
- `bcp_sync_status(sync_component)`

---

### bcp_audit_log

Immutable audit trail for all user activity.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | BIGSERIAL | NO | auto | PK |
| tenant_id | VARCHAR(100) | NO | | |
| source_system | VARCHAR(100) | YES | | |
| event_type | VARCHAR(100) | NO | | See enum below |
| patient_id | VARCHAR(100) | YES | | |
| mrn | VARCHAR(50) | YES | | |
| encounter_id | VARCHAR(100) | YES | | |
| username | VARCHAR(255) | YES | | |
| user_role | VARCHAR(100) | YES | | |
| device_id | VARCHAR(255) | YES | | |
| ip_address | VARCHAR(100) | YES | | |
| event_timestamp | TIMESTAMP | NO | now() | |
| additional_data | JSONB | YES | | |

**event_type values:** LOGIN_SUCCESS, LOGIN_FAILED, PATIENT_SEARCHED, PATIENT_VIEWED, PDF_VIEWED, LOGOUT

**Indexes:**
- `bcp_audit_log(event_type)`
- `bcp_audit_log(event_timestamp)`

---

### bcp_user

Local login users for the BCP application.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | BIGSERIAL | NO | auto | PK |
| tenant_id | VARCHAR(100) | NO | | |
| username | VARCHAR(100) | NO | | |
| password_hash | TEXT | NO | | bcrypt hash |
| full_name | VARCHAR(255) | YES | | |
| email | VARCHAR(255) | YES | | |
| mobile_number | VARCHAR(30) | YES | | |
| is_active | BOOLEAN | NO | true | |
| last_login_at | TIMESTAMP | YES | | |
| created_at | TIMESTAMP | NO | now() | |
| updated_at | TIMESTAMP | NO | now() | |

**Constraints:**
- UNIQUE: `(tenant_id, username)`

**Indexes:**
- `bcp_user(tenant_id, username)` — unique index

---

### bcp_role

Role master table.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | BIGSERIAL | NO | auto | PK |
| tenant_id | VARCHAR(100) | NO | | |
| role_code | VARCHAR(50) | NO | | DOCTOR, NURSE, ADMIN |
| role_name | VARCHAR(100) | NO | | |
| is_active | BOOLEAN | NO | true | |
| created_at | TIMESTAMP | NO | now() | |
| updated_at | TIMESTAMP | NO | now() | |

**Constraints:**
- UNIQUE: `(tenant_id, role_code)`

**Indexes:**
- `bcp_role(tenant_id, role_code)` — unique index

**Seed data:** DOCTOR, NURSE, ADMIN

---

### bcp_user_role

User-role mapping (many-to-many).

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | BIGSERIAL | NO | auto | PK |
| tenant_id | VARCHAR(100) | NO | | |
| user_id | BIGINT | NO | | FK → bcp_user(id) |
| role_id | BIGINT | NO | | FK → bcp_role(id) |
| created_at | TIMESTAMP | NO | now() | |

**Constraints:**
- FK: `user_id` REFERENCES `bcp_user(id)`
- FK: `role_id` REFERENCES `bcp_role(id)`
- UNIQUE: `(tenant_id, user_id, role_id)`

## Entity Relationships

```
bcp_user ──1:N──▶ bcp_user_role ◀──N:1── bcp_role

bcp_active_patient ──(mrn)──▶ bcp_patient_clinical_profile
bcp_active_patient ──(mrn)──▶ bcp_patient_pdf_document
```

Clinical tables are joined by `mrn` (not FK) because they are independently synced by different n8n workflows.
