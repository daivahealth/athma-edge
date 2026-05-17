# n8n Workflows

Sync workflow design for the Athma Edge BCP application. n8n is the sole mechanism for syncing data from the cloud HIS to the local edge database.

## Workflow Overview

| # | Workflow | Frequency | Target Table |
|---|---------|-----------|--------------|
| 1 | Active Patient Sync | 30-60 seconds | bcp_active_patient |
| 2 | Clinical Profile Sync | 1-2 minutes | bcp_patient_clinical_profile |
| 3 | PDF Document Sync | 5-10 minutes | bcp_patient_pdf_document |
| 4 | Sync Status Heartbeat | 1 minute | bcp_sync_status |

## Workflow 1: Active Patient Sync

**Trigger:** Cron (every 30-60 seconds)

**Steps:**
1. **HTTP Request** — GET active patients from source HIS API (paginated, filtered by active/modified since last sync cursor)
2. **Function** — Transform source data to `bcp_active_patient` schema. Set `is_active=true`, `last_seen_in_source_at=now()`, `last_synced_at=now()`, `business_date=today`
3. **Postgres** — Upsert into `bcp_active_patient` by `(tenant_id, source_system, mrn, visit_number)`
4. **Function** — Daily rollover: for records with `business_date < today` and `care_setting` in (OUTPATIENT, DAYCARE, EMERGENCY), set `is_active=false`, `active_until=now()`
5. **Postgres** — Execute rollover update
6. **Postgres** — Update `bcp_sync_status` with component=ACTIVE_PATIENT, status=SUCCESS/FAILED, records_processed, records_failed

**OP Filter Rule:** Only sync outpatient records where appointment/encounter status is: checked-in, registered, arrived, or active. Exclude cancelled, no-show, future, and old.

## Workflow 2: Clinical Profile Sync

**Trigger:** Cron (every 1-2 minutes)

**Steps:**
1. **Postgres** — Query active patient MRNs from `bcp_active_patient` where `is_active=true`
2. **HTTP Request** — For each MRN batch, GET lean clinical profile from source HIS API
3. **Function** — Transform to `bcp_patient_clinical_profile` schema, set `last_clinical_update_at`, `last_synced_at=now()`
4. **Postgres** — Upsert by `(tenant_id, source_system, mrn)`
5. **Postgres** — Update `bcp_sync_status` for CLINICAL_PROFILE

## Workflow 3: PDF Document Sync

**Trigger:** Cron (every 5-10 minutes)

**Steps:**
1. **Postgres** — Query active patient MRNs
2. **HTTP Request** — GET document metadata from source HIS API
3. **Function** — For each document, compute expected local path: `/local-bcp-storage/pdfs/{tenant_id}/{mrn}/{document_type}/filename.pdf`
4. **Postgres** — Check if document with same checksum already exists
5. **HTTP Request** — Download PDF binary (only if new or checksum changed)
6. **Write Binary File** — Save to local storage path
7. **Postgres** — Upsert metadata into `bcp_patient_pdf_document`
8. **Postgres** — Update `bcp_sync_status` for PDF_DOCUMENT

## Workflow 4: Sync Status Heartbeat

**Trigger:** Cron (every 1 minute)

**Steps:**
1. **Postgres** — Update `bcp_sync_status` set `last_attempt_at=now()` for all components
2. **Function** — Check if any component's `last_successful_sync_at` is stale
3. **Postgres** — Mark stale components as status=FAILED with error_message

## Configuration

n8n connects to the source HIS using credentials configured in n8n's credential store:
- Source HIS API URL: configured via environment variable `ATHMA_CE_API_URL`
- Source HIS API key: configured via environment variable `ATHMA_CE_API_KEY`
- PostgreSQL connection: uses `DATABASE_URL` from environment

## Workflow Templates

Exportable workflow JSON files are stored in `n8n/workflows/`. Import via n8n CLI or REST API:

```bash
# Import a workflow
docker compose exec n8n n8n import:workflow --input=/home/node/workflows/active-patient-sync.json
```
