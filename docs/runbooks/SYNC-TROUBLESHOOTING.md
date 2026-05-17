# Sync Troubleshooting

Diagnosing and resolving n8n sync failures.

## Quick Diagnosis

### 1. Check Sync Status

```bash
curl -H "Authorization: Bearer <admin-token>" http://localhost/api/bcp/sync/status
```

Or check the Sync Status page in the admin UI.

### 2. Check n8n Workflow Executions

Open http://localhost:5678 and navigate to Executions. Look for failed executions with error details.

### 3. Check Service Health

```bash
docker compose ps
docker compose logs -f n8n --tail=50
docker compose logs -f bcp-api --tail=50
```

## Common Issues

### Source HIS API Unreachable

**Symptom:** All sync components show FAILED, error message mentions connection timeout or ECONNREFUSED.

**Resolution:**
1. Verify source HIS API is accessible from the edge server: `curl -v <ATHMA_CE_API_URL>/health`
2. Check firewall rules between edge server and cloud HIS
3. Verify `ATHMA_CE_API_URL` and `ATHMA_CE_API_KEY` in n8n credentials
4. If HIS is genuinely down, sync will resume automatically when it recovers

### PostgreSQL Connection Failed

**Symptom:** n8n workflows fail with PostgreSQL connection errors.

**Resolution:**
1. Check postgres is running: `docker compose ps postgres`
2. Check postgres logs: `docker compose logs postgres`
3. Verify DATABASE_URL is correct in n8n environment
4. Check disk space: `df -h` (PostgreSQL may fail if disk is full)

### Sync Running but No Data Appearing

**Symptom:** Sync status shows SUCCESS but patient search returns empty.

**Resolution:**
1. Check records_processed count in sync status (should be > 0)
2. Verify the source HIS API returns data: test the API endpoint manually
3. Check the n8n Function node transformation logic for mapping errors
4. Verify tenant_id matches between sync config and API queries

### PDF Downloads Failing

**Symptom:** PDF_DOCUMENT sync shows PARTIAL or documents show in list but download fails.

**Resolution:**
1. Check local storage directory exists and is writable: `ls -la /local-bcp-storage/pdfs/`
2. Check disk space
3. Verify the PDF URL from source HIS is accessible
4. Check n8n execution logs for specific file download errors

### Stale Data (No Recent Sync)

**Symptom:** Sync status shows last sync was hours ago.

**Resolution:**
1. Check n8n is running: `docker compose ps n8n`
2. Check if workflows are activated in n8n UI
3. Check if cron triggers are configured correctly
4. Restart n8n: `docker compose restart n8n`

## Recovery Steps

After resolving the underlying issue:

1. n8n workflows with cron triggers will automatically resume on next cron tick
2. Verify sync status returns to SUCCESS
3. Check patient data freshness in the UI (Last Synced At timestamps)
4. Review audit logs for any gap period
