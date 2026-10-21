# Technical Architecture

System design for the Athma Edge BCP application.

## Overview

Athma Edge is a local clinical continuity application deployed on a hospital edge server. It provides access to active patient data, lean clinical profiles, and PDF documents when the main cloud HIS/EMR is unreachable. Staff can also create clinical notes and register walk-in patients locally during the outage.

## System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                     Hospital Edge Server                         │
│                                                                  │
│  ┌────────────────────┐          ┌──────────┐                 │
│  │  BCP API  :80      │          │   n8n    │                 │
│  │  /api/*  + the SPA │          │  :5678   │                 │
│  └──────────┬─────────┘          └──────────┘                 │
│       │                               │                │        │
│       │                               ▼                ▼        │
│       │                         ┌──────────┐                    │
│       │                         │PostgreSQL│                    │
│       │                         │  :5432   │                    │
│       │                         └──────────┘                    │
│       │                                                         │
│       ▼                                                         │
│  ┌──────────────────────┐                                      │
│  │ /local-bcp-storage/  │                                      │
│  │   pdfs/              │                                      │
│  └──────────────────────┘                                      │
└─────────────────────────────────────────────────────────────────┘
        ▲
        │ n8n pulls data
        ▼
┌──────────────────┐
│  Cloud HIS/EMR   │
│  (Source System)  │
└──────────────────┘
```

## Component Responsibilities

### Reverse proxy — none
There is no proxy in the stack. The API answers `/api/*` and serves the SPA on the same port, so a request never crosses a process boundary before reaching the application. HTTP only.

A hospital that needs TLS, a shared hostname or its own network policy puts a proxy in front of the stack — that is the hospital's infrastructure, not the application's. See [Reverse Proxy](../deployment/REVERSE-PROXY.md).

n8n is reachable directly on port 5678 (admin only).

### BCP UI (React + Vite, served by the API)
- A single-page application. **There is no UI server process** — the API serves the built bundle from `public/` inside its image
- Any non-`/api/` GET falls back to `index.html`, so client-side routes resolve
- Hashed assets under `/assets/` are cached for a year; `index.html` is never cached
- React Router: `/login` is public, every other route sits under `MainLayout`, which runs the auth guard
- Radix UI + Tailwind CSS for components
- Zustand for auth state, React Query for server state
- Displays persistent BCP LOCAL MODE banner
- Shows sync freshness on all patient views
- Synced clinical data is read-only; BCP Clinical Notes and Temp Patient Registration are local-write exceptions

### BCP API (NestJS)
- Single NestJS service (not a monorepo)
- Global prefix: `/api`
- JWT authentication with role-based guards
- Prisma ORM for PostgreSQL access
- Automatic audit logging via interceptor
- Serves PDF files from local storage
- Does NOT write synced clinical data (n8n handles sync); writes BCP Clinical Notes and Temp Patient records locally

### PostgreSQL 16
- Single database: `bcp_db`
- 9 tables (see [Data Model](DATA-MODEL.md))
- n8n writes (upserts from source HIS)
- BCP API reads (serves to frontend)
- Separate `n8n_db` for n8n internal state

### n8n (Sync/ETL)
- Runs 4 workflows on cron schedules
- Pulls data from the source HIS database over Postgres
- Upserts directly into PostgreSQL via Postgres nodes
- Downloads PDF files to local storage
- Updates sync status after each run
- No Kafka, no message queue — direct upsert

### Local Storage
- PDF documents stored at `/local-bcp-storage/pdfs/{tenant_id}/{mrn}/{document_type}/`
- Shared volume between n8n (writes) and BCP API (reads/serves)
- Filesystem-based initially; MinIO optional for later phases

## Data Flow

### Sync Flow (n8n → PostgreSQL)
1. n8n cron triggers workflow
2. Postgres node reads from the **source HIS database** — the workflows query the HIS directly, they do not call an HIS HTTP API
3. Function node transforms data to BCP schema
4. Postgres node upserts into target table
5. Postgres node updates `bcp_sync_status`

The source-HIS queries in workflows 01–03 are still `TODO` placeholders; the BCP-side upserts are real.

### Read Flow (User → UI → API → PostgreSQL)
1. User logs in via BCP UI → JWT issued
2. User searches patients → API queries `bcp_active_patient`
3. User views profile → API queries `bcp_patient_clinical_profile` + `bcp_patient_pdf_document`
4. User downloads PDF → API streams file from local storage
5. All actions audit-logged to `bcp_audit_log`

### Local Write Flow (BCP Clinical Notes + Temp Patients)
1. User creates a clinical note → API inserts into `bcp_clinical_note` (append-only, no edits/deletes)
2. User registers a walk-in patient → API inserts into `bcp_active_patient` with `source_system = 'BCP_LOCAL'` and auto-generated `BCP-YYYYMMDD-NNN` MRN
3. User edits temp patient demographics → API updates the `bcp_active_patient` record (only for `BCP_LOCAL` patients)
4. All local-write actions are audit-logged (`BCP_NOTE_CREATED`, `TEMP_PATIENT_CREATED`, `TEMP_PATIENT_UPDATED`)

## Care Settings

| Setting | Sync Behavior | Rollover |
|---------|--------------|----------|
| INPATIENT | All active admissions | Active until discharge |
| OUTPATIENT | Today's checked-in/registered/arrived/active only | Marked inactive at daily rollover |
| DAYCARE | All active daycare encounters | Marked inactive at daily rollover |
| EMERGENCY | All active ER encounters | Marked inactive at daily rollover |

## Multi-Tenancy

- Every table includes `tenant_id VARCHAR(100)`
- Every API query filters by `tenant_id`
- Tenant ID comes from JWT claims or `DEFAULT_TENANT_ID` env var
- No RLS (Row-Level Security); scoping is at the application query level
- Designed for single-tenant edge deployment but schema supports multi-tenant

## Constraints

- No Kafka, Kubernetes, Elasticsearch, or Redis
- Synced clinical data is read-only; local writes limited to BCP Clinical Notes (append-only) and Temp Patient Registration
- No structured order entry, medication prescribing, or billing
- Write-back to the HIS is out-of-band: a separate n8n reconciliation workflow run after recovery, never during an outage, with a manual exception list for what it cannot map
- All external IDs are VARCHAR (not UUID)
- Soft delete only (no hard deletes for patient/clinical records)
