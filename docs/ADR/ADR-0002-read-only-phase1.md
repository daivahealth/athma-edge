# ADR-0002: Read-Only Phase-1 (with BCP Write Exceptions)

**Status:** Amended
**Date:** 2026-05-16 (amended 2026-05-20, 2026-10-20)

## Context

During a cloud HIS outage, the hospital needs access to clinical data for patient safety. However, allowing local data entry (structured orders, medications, billing) would create split-brain scenarios when the cloud HIS recovers. Keeping synced clinical data read-only avoids that class of conflict entirely, and keeping the local writes append-only keeps write-back tractable.

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
- Notes are free-text, not structured orders — they document what was communicated or decided, and are written back to the HIS as documentation after recovery
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
- When the HIS recovers, BCP notes and temp patient records are written back by a separate n8n reconciliation workflow (see below), with a manual exception list for what it cannot safely map
- The "read-only" label now applies specifically to synced clinical data, not to the entire application

## Amendment, 2026-10-20: reconciliation is automated

The original decision assumed reconciliation would be entirely human. It is not.

- Write-back to the HIS is performed by a **separate n8n reconciliation workflow**, run after stand-down and scoped to the outage window. It is not part of the BCP API and does not run during an outage.
- This depends on the HIS exposing write APIs. For Athma that workflow exists; an HIS without write APIs falls back to manual re-entry.
- The workflow is **not a merge engine**. Identity merges (a walk-in who turns out to already exist in the HIS), rejected records and ambiguous matches come back as a manual exception list.
- A note is never promoted to an executable order by the workflow. It is written back as documentation; the responsible clinician enters any real order.
- Nothing about the edge side changes: synced clinical data stays read-only, notes stay append-only, temp patients are still never deleted, and the edge keeps its records after write-back.

The API surface the workflow requires from the HIS is specified in the [HIS Reconciliation Contract](../api/HIS-RECONCILIATION-CONTRACT.md). The workflow skeleton is `n8n/workflows/05-bcp-reconciliation.json`, a template whose HIS-side writes are still placeholders. See [Business Continuity Plan](../runbooks/BUSINESS-CONTINUITY-PLAN.md) for when it runs and who owns its output.
