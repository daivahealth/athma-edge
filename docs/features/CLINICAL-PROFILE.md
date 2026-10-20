# Clinical Profile

Lean clinical continuity profile displayed per patient. This is NOT a full EMR chart — just enough data for clinical handover during a BCP event.

## Page Layout

### Header
- Patient name, MRN, UHID
- Care setting badge (INPATIENT/OUTPATIENT/DAYCARE/EMERGENCY)
- Ward/Bed (if applicable)
- Consultant name
- Last synced timestamp with freshness indicator
- Stale data warning banner (if last_synced_at > 5 minutes)

### Body Sections (tabs or accordion)

| Section | Source Field | Type | Description |
|---------|-------------|------|-------------|
| Allergies | allergies | TEXT | Known allergies |
| Blood Group | blood_group | VARCHAR(20) | Blood group |
| Primary Diagnosis | primary_diagnosis | TEXT | Current primary diagnosis |
| High-Risk Flags | high_risk_flags | TEXT | Fall risk, DVT, isolation, etc. |
| Latest Vitals | latest_vitals | JSONB | Array of timestamped snapshots: BP, pulse, temp, SpO2, RR |
| Active Medications | active_medications | JSONB | Array of {name, dose, drugForm, route, frequency, mode, startDate, endDate}, rendered as one card per medication |
| Pending Service Orders | pending_investigations | JSONB | Array of {test_name, ordered_at, status} |
| Critical Results | critical_results | TEXT | Abnormal/critical lab or imaging results |
| Handover Notes | handover_notes | TEXT | Free-text clinical handover notes |
| Intake Output Chart | intake_output_chart | JSONB | Nested per-day intake/output volumes by route and timestamp, rendered as a table in its own tab |

### JSONB Field Structures

**latest_vitals:**

Array of one or more snapshots, newest first. Each snapshot's keys (other than `recordedAt`) are rendered dynamically as table rows — no parameter names are hardcoded in the UI.

```json
[
  {
    "recordedAt": "2026-05-16T08:00:00Z",
    "bp": "120/80 mmHg",
    "pulse": "72 bpm",
    "temp": "37.2C",
    "spo2": "98%",
    "rr": "16/min"
  },
  {
    "recordedAt": "2026-05-16T07:00:00Z",
    "bp": "122/82 mmHg",
    "pulse": "75 bpm",
    "temp": "37.4C",
    "spo2": "97%",
    "rr": "17/min"
  }
]
```

The Vitals tab renders these as a table with parameters as rows and each snapshot's `recordedAt` as a column, newest-first (left to right). A legacy single flat object (pre-array sync payloads) is still accepted and rendered as a single column for backward compatibility.

**active_medications:**
```json
[
  {
    "name": "FUROSEMIDE+SPIRONOLACTONE-TABLET-20MG+50MG-FRUSELAC-",
    "dose": "20MG+50MG",
    "drugForm": "TABLET",
    "route": "Orally",
    "frequency": "Once Daily",
    "mode": "Routine",
    "startDate": "2026-10-09",
    "endDate": "2026-10-13"
  }
]
```

All fields are optional; the Medications tab shows one card per entry with `drugForm` and `mode` as badges and the remaining fields (dose, route, frequency, startDate, endDate) as labeled details.

**pending_investigations:**
```json
[
  {"testName": "CBC", "orderedAt": "2026-05-16T06:00:00Z", "status": "PENDING"},
  {"testName": "CT Abdomen", "orderedAt": "2026-05-16T07:00:00Z", "status": "SCHEDULED"}
]
```

**intake_output_chart:**

Nested object with top-level `intake` and `output` keys. Each contains named groups (e.g. `NG/OG`, `Urine`) with a `data` map of ISO timestamp (`YYYY-MM-DDTHH:mm`) -> `{value}`, a `total` entry for the running total, and an optional `record` map breaking the group down by individual item (e.g. `Water`) with the same per-timestamp/`total` shape plus a `latestId`. Each section also has a `Total Intake` / `Total Output` entry with its own `data` map. Scalar summary fields (e.g. `colloidIntakeTotal`, `enteralFeedIntakeTotal`) may also appear under `intake` and are not rendered in the table.

```json
{
  "intake": {
    "NG/OG": {
      "data": { "total": { "value": 150.0 }, "2026-10-12T10:00": { "value": 100.0 } },
      "record": { "Water": { "total": { "value": 150.0 }, "2026-10-12T10:00": { "latestId": 4490784, "value": 100.0 } } }
    },
    "Total Intake": { "data": { "total": { "value": 150.0 }, "2026-10-12T10:00": { "value": 100.0 } } }
  },
  "output": {
    "Urine": {
      "data": { "total": { "value": 110.0 }, "2026-10-12T15:00": { "value": 110.0 } },
      "record": { "Urine": { "total": { "value": 110.0 }, "2026-10-12T15:00": { "latestId": 4490787, "value": 110.0 } } }
    },
    "Total Output": { "data": { "total": { "value": 110.0 }, "2026-10-12T15:00": { "value": 110.0 } } }
  }
}
```

The Intake Output Chart tab groups rows by section (Intake/Output) then by named group then by individual record item, with one column per timestamp for the selected day (navigable via prev/next arrows) and a highlighted "Run Total" column from each `total` entry. The header shows the day's summed Intake, Output, and Balance (Intake − Output). This is synced, read-only data — same as Vitals, Medications, and Investigations.

### PDF Documents Section

List of available PDF documents at the bottom of the profile page with download buttons. See [PDF Documents](PDF-DOCUMENTS.md).

## BCP Temporary Patients

Temporary patients (registered locally during BCP, `sourceSystem: 'BCP_LOCAL'`) have a reduced profile:

- **Demographics card** with an **Edit** button (only for temp patients)
- **Only Clinical Notes tab** visible — Vitals, Medications, Investigations, Documents, Investigation Results, and Intake Output Chart tabs are hidden
- **"BCP Temporary" badge** displayed next to patient name
- **No stale data warning** or sync timestamps (data is local, not synced)

See [BCP Temporary Patients](BCP-TEMPORARY-PATIENTS.md) for full details.

## Constraints

- Synced clinical sections (vitals, medications, investigations, documents, investigation results, intake output chart) are **read-only** — no edit buttons
- Synced data comes from n8n sync, not from user input
- BCP Clinical Notes tab is available on all patients (synced and temporary) and is a local-write feature
- If clinical profile has not been synced yet, show "Clinical profile not yet synced" placeholder
- Null/empty fields should show "Not available" rather than blank space
