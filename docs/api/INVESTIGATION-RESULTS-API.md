# Investigation Results API

Fetches synced lab/radiology/other investigation-result data for a patient. Phase-1 only populates and serves the **LAB** category; RAD and OTHER are reserved for future sync workflows and currently return no data.

## GET /api/bcp/patients/:mrn/investigation-results

**Auth:** Required
**Roles:** DOCTOR, NURSE, ADMIN

### Path Parameters

| Param | Type | Description |
|-------|------|-------------|
| mrn | string | Medical Record Number |

### Query Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| category | string | No (default `LAB`) | One of `LAB`, `RAD`, `OTHER` |

### Response (200) — record found

```json
{
  "data": {
    "category": "LAB",
    "mrn": "17510001458370",
    "resultData": {
      "dates": ["2026-09-09T00:00:00"],
      "services": [
        {
          "serviceName": "CBC",
          "serviceCode": "SVC011232",
          "investigationCode": "INV000989",
          "displayOrder": 100,
          "childServices": [
            { "serviceName": "HB%", "displayOrder": 1 }
          ]
        }
      ],
      "data": {
        "CBC": {
          "serviceName": "CBC",
          "childServices": {
            "HB%": {
              "serviceName": "HB%",
              "results": {
                "2026-09-09T00:00:00": {
                  "date": "2026-09-09T00:00:00",
                  "result": {
                    "value": "11.4",
                    "unit": "g/dL",
                    "referenceRange": "12.0-15.0",
                    "abnormalFlag": "L"
                  }
                }
              }
            }
          }
        }
      }
    },
    "lastSyncedAt": "2026-09-09T13:46:02.218Z"
  }
}
```

The `resultData` object is the sync payload stored verbatim in `bcp_patient_investigation_result.result_data` — the backend does not flatten or transform the hierarchy. The frontend merges the `services` metadata (order, parent/child hierarchy) with `data` (actual values) to render the table.

### Response (200) — no record for this MRN + category

```json
{ "data": null }
```

This is a normal, non-error state (e.g. the category hasn't been synced yet for this patient) and must be handled gracefully by clients — not treated as a 404.

### Errors

| Status | Condition |
|--------|-----------|
| 401 | Not authenticated |
| 403 | Role not permitted |
