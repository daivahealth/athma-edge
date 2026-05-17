# ADR-0005: Soft Delete and Daily Rollover

**Status:** Accepted
**Date:** 2026-05-16

## Context

Outpatient, daycare, and emergency records are relevant only for their business day. Inpatient records remain relevant until discharge. Records must never be hard-deleted to maintain audit trail and support investigation of past encounters. The system needs a clear mechanism to distinguish current from historical data.

## Decision

Use soft status fields on patient records:

| Field | Type | Purpose |
|-------|------|---------|
| `is_active` | BOOLEAN | Current active status (default true) |
| `active_from` | TIMESTAMP | When the record became active |
| `active_until` | TIMESTAMP | When the record was deactivated |
| `business_date` | DATE | The business day this record belongs to |

Daily rollover rules (triggered by n8n Active Patient Sync workflow):

| Care Setting | Rollover Behavior |
|-------------|-------------------|
| OUTPATIENT | Marked `is_active=false`, `active_until=rollover_time` at daily rollover |
| DAYCARE | Marked `is_active=false`, `active_until=rollover_time` at daily rollover |
| EMERGENCY | Marked `is_active=false`, `active_until=rollover_time` at daily rollover |
| INPATIENT | Remains `is_active=true` until `discharge_datetime` is set by source HIS |

**Never hard-delete** any patient or clinical records.

## Consequences

- Full audit trail preserved for all historical encounters
- Historical data queryable by `business_date` range
- Default search filters by `is_active=true` (current data)
- Storage grows over time; archival strategy needed for long-running deployments
- Rollover is handled by n8n workflow, not by the NestJS application
- If n8n rollover fails, stale records remain active until next successful run
