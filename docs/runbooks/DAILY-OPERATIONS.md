# Daily Operations

Routine operational procedures for the Athma Edge BCP application.

## Morning Check

1. **Verify sync health**: Open admin dashboard → Sync Status. All components should show HEALTHY/SUCCESS.
2. **Check patient census**: Run a patient search with today's date. Count should approximately match expected hospital census.
3. **Verify rollover**: Yesterday's OP/DAYCARE/ER patients should be marked inactive. Search with `activeOnly=false` and yesterday's `businessDate` to confirm.

## Monitoring

### What to Watch

| Indicator | Check | Action if Abnormal |
|-----------|-------|-------------------|
| Sync Status | All components SUCCESS | See [Sync Troubleshooting](SYNC-TROUBLESHOOTING.md) |
| Last Synced At | Within expected frequency | Check n8n is running |
| Patient Count | Matches expected census | Check source HIS API |
| Disk Usage | `df -h` on edge server | Archive old PDFs if needed |
| Container Health | `docker compose ps` | Restart failed containers |

### Stale Data Warnings

The UI shows warnings when data is stale (>5 minutes since last sync). If persistent:
1. Check n8n workflow execution status
2. Check network connectivity to source HIS
3. Check PostgreSQL health

## Daily Rollover

Rollover is automatic, triggered by the n8n Active Patient Sync workflow:

- **OUTPATIENT** records from previous day → `is_active=false`
- **DAYCARE** records from previous day → `is_active=false`
- **EMERGENCY** records from previous day → `is_active=false`
- **INPATIENT** records → remain active until discharge

Verify rollover completed by checking that yesterday's OP/DAYCARE/ER patients no longer appear in the default active search.

## After Cloud HIS Recovery

When the main cloud HIS comes back online:

1. Verify n8n sync resumes automatically (check sync status dashboard)
2. Confirm data freshness returns to normal (<2 minute latency)
3. Run the n8n reconciliation workflow, scoped to the outage window, to write BCP Clinical Notes and BCP Temporary Patients back into the primary HIS
4. Work the exception list it returns by hand — identity merges, rejected records and ambiguous matches (see [Business Continuity Plan](BUSINESS-CONTINUITY-PLAN.md))
5. Clinical staff can resume using the primary HIS
6. BCP system continues to sync as a backup (no action needed to "turn it off")

## Maintenance Tasks

### Weekly
- Review audit logs for unusual activity
- Check disk usage on edge server
- Verify backup of PostgreSQL data (if configured)

### Monthly
- Review n8n workflow execution history for patterns of failures
- Update n8n and Docker images if security patches are available
- Review and rotate JWT_SECRET if security policy requires it
