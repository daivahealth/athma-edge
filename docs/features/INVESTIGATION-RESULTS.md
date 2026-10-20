# Investigation Results

Read-only view of synced lab/radiology/other investigation results for a patient, shown as a new tab on the patient detail screen, positioned after Clinical Notes.

## Scope (Phase-1)

- Only the **LAB** category is functional. **RAD** and **OTHERS** tabs exist in the UI as placeholders ("Not available yet") and are not wired to any data source yet.
- Data is synced from the cloud HIS via n8n (future workflow, not yet implemented) directly into `bcp_patient_investigation_result`. This feature only implements the read path.
- Like all synced clinical data, investigation results are **read-only** — there is no create/update/delete endpoint or UI.

## Data model

Exactly one row per `(tenant_id, mrn, category)` in `bcp_patient_investigation_result` — see [DATA-MODEL.md](../architecture/DATA-MODEL.md#bcp_patient_investigation_result). The `result_data` JSONB column holds the entire investigation-result payload for that MRN + category (all dates, all services), not one row per date or per test. See [Investigation Results API](../api/INVESTIGATION-RESULTS-API.md) for the exact shape.

## JSON shape and hierarchy

The stored `resultData` has three parts:

- `dates`: every result date present in this record (one column per date in the UI).
- `services`: the ordered, hierarchical metadata tree — `serviceName`, optional `serviceCode`/`investigationCode`, `displayOrder`, and optional `childServices` (recursive, arbitrary depth — e.g. `CBC` → `DC` → `Neutrophils`).
- `data`: keyed by `serviceName`, mirrors the same hierarchy but carries the actual values. A node either has `childServices` (another level of the hierarchy) or `results` (a map of date → `{ value, unit, referenceRange, abnormalFlag, ... }`), never both.

The frontend merges `services` (for order and hierarchy) with `data` (for values) recursively — see `frontend/src/modules/investigation-results/merge.ts`. Investigation/service names, hierarchy depth, and display order are never hardcoded; whatever tree is present in the JSON is what renders.

## UI behavior

- Table: service/investigation names in the left column, dates as columns across the top.
- Services with `childServices` render as expandable/collapsible parent rows (collapsed state is local UI state, not persisted).
- Leaf services render their result directly: value, unit, and reference range.
- A result with `abnormalFlag` other than `N` is styled using the existing abnormal/alert styling (red text); normal results use standard text styling.
- A missing result for a given date renders as `—` without breaking the table layout.
- Only shown for synced (non-BCP-temporary) patients, consistent with the Vitals/Medications/Documents tabs.

## Future work

- RAD and OTHER category sync workflows and UI.
- n8n workflow to populate `bcp_patient_investigation_result` from the source HIS.
