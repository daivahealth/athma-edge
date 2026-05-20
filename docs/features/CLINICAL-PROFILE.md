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
| Latest Vitals | latest_vitals | JSONB | BP, pulse, temp, SpO2, RR |
| Active Medications | active_medications | JSONB | Array of {name, dose, route, frequency} |
| Pending Investigations | pending_investigations | JSONB | Array of {test_name, ordered_at, status} |
| Critical Results | critical_results | TEXT | Abnormal/critical lab or imaging results |
| Handover Notes | handover_notes | TEXT | Free-text clinical handover notes |

### JSONB Field Structures

**latest_vitals:**
```json
{
  "bp": "120/80",
  "pulse": 72,
  "temp": 37.2,
  "spo2": 98,
  "rr": 16,
  "recordedAt": "2026-05-16T08:00:00Z"
}
```

**active_medications:**
```json
[
  {"name": "Ceftriaxone", "dose": "1g", "route": "IV", "frequency": "BD"},
  {"name": "Paracetamol", "dose": "500mg", "route": "PO", "frequency": "TDS PRN"}
]
```

**pending_investigations:**
```json
[
  {"testName": "CBC", "orderedAt": "2026-05-16T06:00:00Z", "status": "PENDING"},
  {"testName": "CT Abdomen", "orderedAt": "2026-05-16T07:00:00Z", "status": "SCHEDULED"}
]
```

### PDF Documents Section

List of available PDF documents at the bottom of the profile page with download buttons. See [PDF Documents](PDF-DOCUMENTS.md).

## BCP Temporary Patients

Temporary patients (registered locally during BCP, `sourceSystem: 'BCP_LOCAL'`) have a reduced profile:

- **Demographics card** with an **Edit** button (only for temp patients)
- **Only Clinical Notes tab** visible — Vitals, Medications, Investigations, and Documents tabs are hidden
- **"BCP Temporary" badge** displayed next to patient name
- **No stale data warning** or sync timestamps (data is local, not synced)

See [BCP Temporary Patients](BCP-TEMPORARY-PATIENTS.md) for full details.

## Constraints

- Synced clinical sections (vitals, medications, investigations, documents) are **read-only** — no edit buttons
- Synced data comes from n8n sync, not from user input
- BCP Clinical Notes tab is available on all patients (synced and temporary) and is a local-write feature
- If clinical profile has not been synced yet, show "Clinical profile not yet synced" placeholder
- Null/empty fields should show "Not available" rather than blank space
