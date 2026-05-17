# Sync Status

Sync health dashboard for monitoring n8n workflow status. Admin-only feature.

## Components Tracked

| Component | n8n Workflow | Frequency |
|-----------|-------------|-----------|
| ACTIVE_PATIENT | Active Patient Sync | Every 30-60 seconds |
| CLINICAL_PROFILE | Clinical Profile Sync | Every 1-2 minutes |
| PDF_DOCUMENT | PDF Document Sync | Every 5-10 minutes |

## Status Values

| Status | Meaning |
|--------|---------|
| SUCCESS | Last sync completed without errors |
| FAILED | Last sync encountered errors |
| PARTIAL | Last sync completed but some records failed |
| RUNNING | Sync is currently in progress |

## Overall Health

Computed from individual component statuses:

| Overall | Condition |
|---------|-----------|
| HEALTHY | All components SUCCESS and last sync within acceptable threshold |
| DEGRADED | Any component FAILED or PARTIAL |
| STALE | Any component's last successful sync older than configured threshold |

## Dashboard UI

- One card per sync component showing:
  - Component name
  - Current status (color-coded badge)
  - Last successful sync time
  - Last attempt time
  - Records processed / failed
  - Error message (if FAILED)
- Overall health indicator at the top
- Auto-refreshes every 30 seconds via React Query `refetchInterval`

## Metrics Per Component

| Metric | Source Field |
|--------|-------------|
| Status | sync_status |
| Last Success | last_successful_sync_at |
| Last Attempt | last_attempt_at |
| Records Processed | records_processed |
| Records Failed | records_failed |
| Error | error_message |
| Cursor | sync_cursor |
