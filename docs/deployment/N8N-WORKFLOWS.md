# n8n Workflows

Sync workflow design for the Athma Edge BCP application. n8n is the sole mechanism for syncing data from the cloud HIS to the local edge database.

## Workflow Overview

| # | Workflow | Frequency | Target Table |
|---|---------|-----------|--------------|
| 1 | Active Patient Sync | 30-60 seconds | bcp_active_patient |
| 2 | Clinical Profile Sync | 1-2 minutes | bcp_patient_clinical_profile |
| 3 | PDF Document Sync | 5-10 minutes | bcp_patient_pdf_document |
| 4 | Daily Rollover | Daily, 00:00 | bcp_active_patient |
| 5 | BCP Reconciliation (write-back) | Manual, after stand-down | Source HIS (outbound) |

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

## Workflow 4: Daily Rollover

**Export:** `04-daily-rollover.json`

**Trigger:** Cron (`0 0 * * *`)

**Steps:**
1. **Postgres** — Mark OUTPATIENT, DAYCARE and EMERGENCY records from previous business dates as `is_active = false`, setting `active_until`
2. **Postgres** — Roll `business_date` forward for still-active INPATIENT records

INPATIENT records are never deactivated here; they stay active until the source HIS records a discharge. See [Daily Rollover](../features/DAILY-ROLLOVER.md).

> A **Sync Status Heartbeat** workflow was previously described in this position — a 1-minute job that stamped `last_attempt_at` and flipped stale components to FAILED. No such workflow has ever been exported to `n8n/workflows/`. Nothing currently marks a component stale when its sync stops running: `bcp_sync_status` only advances when a sync succeeds, so a dead workflow leaves the last success timestamp frozen rather than raising FAILED. The UI's staleness check is what surfaces it.

## Workflow 5: BCP Reconciliation (write-back)

The only outbound workflow. Everything else pulls from the HIS; this one pushes to it.

| Property | Value |
|----------|-------|
| Trigger | Manual, run by the BCP coordinator after stand-down |
| Scope | The outage window — start and end timestamps are inputs, not defaults |
| Reads | `bcp_clinical_note`, `bcp_active_patient` where `source_system = 'BCP_LOCAL'` |
| Writes | Source HIS, via its write APIs |
| Output | Records written, records rejected, records needing a human decision |

Rules:

- Never runs on a cron. A write-back during an outage would push into an HIS that is still down or still recovering.
- Run once per outage window. An unscoped re-run risks duplicating notes already written back.
- Notes are written back as documentation only — never promoted to executable orders.
- Identity merges are out of scope. A walk-in who already exists in the HIS is returned as an exception for Medical Records to merge by hand.
- The edge records are not modified or deleted by the run. Notes stay append-only and temp patients are never deleted.

The HIS-side API surface this workflow depends on, and what it does when a capability is missing, is specified in the [HIS Reconciliation Contract](../api/HIS-RECONCILIATION-CONTRACT.md).

The export is `n8n/workflows/05-bcp-reconciliation.json`. Like workflows 01–03 it is a **template**: the BCP-side reads are real, the HIS-side writes are `TODO` placeholders pending the [Athma-specific mapping](../api/HIS-RECONCILIATION-CONTRACT.md#athma-specific-mapping).

It is deliberately safe to import before that work is done:

- `dryRun` defaults to **true**
- the readiness guard throws unless a real HIS check is implemented, so an unimplemented workflow cannot write
- an absent or inverted outage window throws rather than defaulting to "everything"

## Timezone (required for cron/schedule triggers)

Schedule Trigger nodes evaluate cron expressions in n8n's **instance timezone**, set by
`GENERIC_TIMEZONE`. If it is unset, n8n falls back to `America/New_York` — every cron then
fires at the wrong local wall-clock time (a `0 5 * * *` trigger runs mid-afternoon IST).
This failure mode is silent: the workflow executes successfully, so container logs show no
errors, only an unexpected execution time.

`docker-compose.yml` sets both variables on the `n8n` service:

```yaml
GENERIC_TIMEZONE: ${TZ:-Asia/Kolkata}   # cron/schedule evaluation
TZ: ${TZ:-Asia/Kolkata}                 # container clock, log timestamps
```

Override per site with `TZ` in `.env`. After changing it, recreate the container so
registered triggers are rebuilt — a plain restart is not enough:

```bash
docker compose up -d --force-recreate n8n
```

Verify, then confirm the workflow's next scheduled run in the n8n UI:

```bash
docker compose exec n8n date
```

Individual workflows can override the instance default in **Workflow settings → Timezone**.
A workflow saved before this fix may have an explicit stale timezone recorded — check
there if a trigger still fires at the wrong time after recreating the container.

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
