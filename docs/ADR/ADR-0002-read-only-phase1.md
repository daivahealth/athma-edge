# ADR-0002: Read-Only Phase-1 (with BCP Write Exceptions)

**Status:** Amended
**Date:** 2026-05-16 (amended 2026-05-20)

## Context

During a cloud HIS outage, the hospital needs access to clinical data for patient safety. However, allowing local data entry (structured orders, medications, billing) without a reconciliation engine would create split-brain scenarios when the cloud HIS recovers. Building a reconciliation engine is a significant undertaking that would delay the initial BCP deployment.

At the same time, clinical staff need to document care activity during the outage (verbal orders, assessments, handover notes) and register walk-in patients who don't exist in the synced data.

## Decision

Phase-1 of Athma Edge is **read-only for all synced clinical data**, with two controlled local-write exceptions:

### Read-Only (synced from HIS via n8n)
- Patient demographics and visit data (read-only, synced)
- Clinical profiles: vitals, medications, investigations (read-only, synced)
- PDF documents (read-only, synced)
- No structured order entry, medication prescribing, or billing

### Local-Write Exceptions

**1. BCP Clinical Notes** (append-only)
- Free-text clinical documentation with typed categories (Order, Medication, Investigation, Progress, Assessment, Nursing, Handover, Incident, Communication, Other)
- Notes are append-only — cannot be edited or deleted after creation
- Notes are free-text, not structured orders — they document what was communicated or decided, for manual reconciliation when the HIS recovers
- Available on all patients (synced and temporary)

**2. BCP Temporary Patient Registration**
- Walk-in patients who don't exist in the synced data get a local record with auto-generated MRN (`BCP-YYYYMMDD-NNN`)
- Demographics are editable (only for temp patients, identified by `sourceSystem: 'BCP_LOCAL'`)
- No delete — temp patients are permanent records
- Temp patients only have access to Demographics and Clinical Notes (no Vitals, Medications, Investigations, or Documents tabs)

### Other writable operations (unchanged)
- User management (create users, assign roles) — ADMIN only
- Audit logging (automatic, append-only)

## Consequences

- Synced clinical data remains safe from local modification — no reconciliation complexity for vitals, meds, investigations, or documents
- Clinical staff can document care activity during outages using clinical notes
- Walk-in patients can be registered and documented immediately
- Both local-write features are append-only (or update-only for temp demographics), minimizing reconciliation burden
- When HIS recovers, staff manually reconcile BCP notes and temp patient records — this is a human workflow, not an automated process
- The "read-only" label now applies specifically to synced clinical data, not to the entire application
