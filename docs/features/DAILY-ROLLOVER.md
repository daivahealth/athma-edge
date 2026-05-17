# Daily Rollover

Business date management and daily record lifecycle rules.

## Soft Status Fields

Every patient record carries lifecycle metadata:

| Field | Type | Purpose |
|-------|------|---------|
| is_active | BOOLEAN | Whether the record represents a currently active patient |
| active_from | TIMESTAMP | When the record was activated |
| active_until | TIMESTAMP | When the record was deactivated (null if still active) |
| business_date | DATE | The business day this record belongs to |

## Rollover Rules by Care Setting

| Care Setting | Rollover Behavior |
|-------------|-------------------|
| INPATIENT | Stays active until `discharge_datetime` is set by source HIS |
| OUTPATIENT | Marked inactive at daily rollover |
| DAYCARE | Marked inactive at daily rollover |
| EMERGENCY | Marked inactive at daily rollover |

## Rollover Process

Triggered by the n8n Active Patient Sync workflow at daily boundary:

1. For records with `business_date < today` and `care_setting` in (OUTPATIENT, DAYCARE, EMERGENCY):
   - Set `is_active = false`
   - Set `active_until = rollover_timestamp`
2. INPATIENT records are NOT affected by rollover
3. New records synced with today's `business_date` get `is_active = true`
4. **Never hard-delete** any records

## Query Implications

- Default patient search filters by `is_active = true`
- Historical data accessible by setting `activeOnly = false` and filtering by `business_date`
- Reporting can query across all business dates regardless of `is_active` status

## Edge Cases

- If n8n rollover fails, stale records remain active until the next successful run
- If a patient has encounters across multiple care settings on the same day, each encounter is a separate record
- Readmission on the same day creates a new record (different visit_number)
