# Technical Architecture

System design for the Athma Edge BCP application.

## Overview

Athma Edge is a local clinical continuity application deployed on a hospital edge server. It provides read-only access to active patient data, lean clinical profiles, and PDF documents when the main cloud HIS/EMR is unreachable.

## System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                     Hospital Edge Server                         │
│                                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐ │
│  │  Nginx   │───▶│  BCP UI  │    │  BCP API │    │   n8n    │ │
│  │  :80     │───▶│  :3000   │    │  :3100   │    │  :5678   │ │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘ │
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

### Nginx (Reverse Proxy)
- Routes `/api/*` requests to BCP API (NestJS)
- Routes all other requests to BCP UI (Next.js)
- Serves on port 80 (443 with TLS if configured)
- n8n accessible directly on port 5678 (admin only)

### BCP UI (Next.js 14)
- App Router with route groups: `(auth)` for login, `(main)` for authenticated pages
- Radix UI + Tailwind CSS for components
- Zustand for auth state, React Query for server state
- Displays persistent BCP LOCAL MODE banner
- Shows sync freshness on all patient views
- Read-only: no clinical data editing in Phase-1

### BCP API (NestJS)
- Single NestJS service (not a monorepo)
- Global prefix: `/api`
- JWT authentication with role-based guards
- Prisma ORM for PostgreSQL access
- Automatic audit logging via interceptor
- Serves PDF files from local storage
- Does NOT write clinical data (n8n handles sync)

### PostgreSQL 16
- Single database: `bcp_db`
- 8 tables (see [Data Model](DATA-MODEL.md))
- n8n writes (upserts from source HIS)
- BCP API reads (serves to frontend)
- Separate `n8n_db` for n8n internal state

### n8n (Sync/ETL)
- Runs 4 workflows on cron schedules
- Pulls data from source HIS API
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
2. HTTP Request node pulls data from source HIS API
3. Function node transforms data to BCP schema
4. Postgres node upserts into target table
5. Postgres node updates `bcp_sync_status`

### Read Flow (User → UI → API → PostgreSQL)
1. User logs in via BCP UI → JWT issued
2. User searches patients → API queries `bcp_active_patient`
3. User views profile → API queries `bcp_patient_clinical_profile` + `bcp_patient_pdf_document`
4. User downloads PDF → API streams file from local storage
5. All actions audit-logged to `bcp_audit_log`

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
- No local clinical data entry (Phase-1)
- No billing, no reconciliation
- All external IDs are VARCHAR (not UUID)
- Soft delete only (no hard deletes for patient/clinical records)
