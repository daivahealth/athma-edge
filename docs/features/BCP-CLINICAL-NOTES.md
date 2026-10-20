# BCP Clinical Notes

Free-text clinical documentation created locally during BCP events. This is a local-write exception to the otherwise read-only synced clinical data.

## Purpose

During a cloud HIS outage, clinical staff need to document care activity — verbal orders, assessments, handover notes, incident reports, etc. BCP Clinical Notes provide append-only free-text documentation, written back into the HIS by the n8n reconciliation workflow when it recovers.

## Note Types

| Enum | Display Label | Description |
|------|--------------|-------------|
| ORDER | Order | Verbal/phone orders during downtime |
| MEDICATION | Medication | Medication-related notes |
| INVESTIGATION | Investigation / Diagnostics | Lab, imaging, or diagnostic orders/results |
| PROGRESS | Progress Note | Clinical observations and progress |
| ASSESSMENT | Assessment | Nursing/physician assessments |
| NURSING | Nursing Note | Nursing-specific care plans, observations |
| HANDOVER | Shift Handover | Shift handover documentation |
| INCIDENT | Incident Report | Incident or adverse event notes |
| COMMUNICATION | Communication | Family or interdisciplinary communication |
| OTHER | Other | Catch-all for uncategorized notes |

## Key Design Decisions

- **Append-only**: Notes cannot be edited or deleted after creation. This preserves an audit trail.
- **Free-text, not structured**: Notes are plain text, not structured orders. They document what was communicated or decided, not executable orders.
- **Available on all patients**: Both synced patients and BCP temporary patients can have clinical notes.
- **Author denormalized**: Author name and role are captured at creation time from the JWT and stored on the note record.
- **Max 5000 characters** per note.

## UI

### Clinical Notes List Page (`/clinical-notes`)
- Shows all patients with notes, grouped by patient
- Search by patient name or MRN
- Filter by note type
- Click a patient card to see all their notes

### Patient Notes Detail (`/clinical-notes/[mrn]`)
- All notes for a specific patient, newest first
- Filter by note type
- Add Note button opens create dialog

### Create Note Page (`/clinical-notes/new`)
- Step 1: Search and select a patient
- Step 2: Select note type + enter content
- On success: redirects to notes list

### Patient Profile Tab
- Clinical Notes tab appears on every patient profile (synced and temporary)
- Same note list + create dialog functionality

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/bcp/patients/:mrn/notes` | Create a note |
| GET | `/api/bcp/patients/:mrn/notes` | List notes for a patient |
| GET | `/api/bcp/clinical-notes` | List all notes across patients |

All endpoints require `DOCTOR`, `NURSE`, or `ADMIN` role.

## Audit

- `BCP_NOTE_CREATED` event logged automatically via the audit interceptor when a note is created.
