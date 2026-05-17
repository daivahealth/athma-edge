# ADR-0003: n8n Sync Strategy

**Status:** Accepted
**Date:** 2026-05-16

## Context

Active patient data, clinical profiles, and PDF documents must be synced from the cloud HIS to the local edge database. Options considered:

1. **Custom sync engine** — purpose-built service with change detection and incremental sync
2. **Kafka-based streaming** — real-time event streaming from source HIS
3. **n8n workflow-based sync** — visual workflows with cron triggers upserting into PostgreSQL

## Decision

Use n8n workflows that directly upsert into PostgreSQL. No separate sync engine, no Kafka.

Four workflows:

| Workflow | Frequency | Logic |
|----------|-----------|-------|
| Active Patient Sync | 30-60s | Pull active patients from source HIS, upsert by (tenant_id, source_system, mrn, visit_number), apply OP filter, handle daily rollover |
| Clinical Profile Sync | 1-2min | Pull lean clinical summary for active patients, upsert by MRN |
| PDF Document Sync | 5-10min | Pull document list, download new PDFs to local storage, upsert metadata using checksum dedup |
| Sync Status Heartbeat | 1min | Update bcp_sync_status with last_attempt_at |

Each workflow updates `bcp_sync_status` with: sync_status (SUCCESS/FAILED/PARTIAL/RUNNING), records_processed, records_failed, error_message, last_attempt_at, last_successful_sync_at.

## Consequences

- Visual workflow management accessible to non-developers
- Easy to modify sync logic without code deployment
- No additional infrastructure (no Kafka broker, no custom service)
- n8n is single-threaded per workflow execution; high-volume sync may need workflow optimization
- Sync is pull-based on cron; there is a data freshness lag (30s-10min depending on component)
- Sync status tracked in dedicated table for monitoring
