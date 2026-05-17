# ADR-0002: Read-Only Phase-1

**Status:** Accepted
**Date:** 2026-05-16

## Context

During a cloud HIS outage, the hospital needs access to clinical data for patient safety. However, allowing local data entry (orders, medications, billing) without a reconciliation engine would create split-brain scenarios when the cloud HIS recovers. Building a reconciliation engine is a significant undertaking that would delay the initial BCP deployment.

## Decision

Phase-1 of Athma Edge is strictly **read-only for all clinical data**:

- No local order entry
- No local medication entry
- No local billing
- No edit buttons in the clinical UI
- No write endpoints for clinical tables in the API
- All clinical data is synced from the cloud HIS via n8n and served read-only

The only writable operations are:
- User management (create users, assign roles) — ADMIN only
- Audit logging (automatic, append-only)
- Manual audit entries via API (for n8n or external systems)

## Consequences

- Eliminates reconciliation complexity entirely
- Safe to use alongside cloud HIS when it recovers (no conflicting data)
- Clear scope boundary keeps Phase-1 deliverable small and focused
- Clinical staff can view patient data but must use alternative methods (paper, phone) for new orders during outage
- Phase-2 can add selective write capabilities with reconciliation if needed
