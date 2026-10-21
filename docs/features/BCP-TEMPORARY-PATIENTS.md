# BCP Temporary Patients

Walk-in patient registration during BCP events. This is a local-write exception to the otherwise read-only synced clinical data.

## Purpose

During a cloud HIS outage, new patients may arrive at the hospital who don't exist in the synced data. BCP Temporary Patients allows staff to register these walk-in patients locally so they can immediately begin documenting care via Clinical Notes.

## How It Works

### Registration
- Staff clicks "Add Patient" on the Patient Search page
- Fills in demographics: name (required), gender, DOB, age, mobile, care setting (required, defaults to Outpatient), ward, bed, consultant
- On submit, the system auto-generates a unique MRN in format `BCP-YYYYMMDD-NNN` (e.g., `BCP-20260520-001`)
- Staff is redirected to the new patient's profile page

### MRN Generation
- Format: `BCP-YYYYMMDD-NNN` where NNN is a zero-padded sequence number per day
- Application counts existing `BCP_LOCAL` patients for today's date prefix, then assigns the next number
- Unique constraint on the database prevents collisions; the API retries up to 3 times on collision (Prisma P2002 error)

### Data Model
- Reuses the existing `bcp_active_patient` table with `source_system = 'BCP_LOCAL'`
- No new table needed — temp patients appear in search results alongside synced patients
- `visit_number` is set to `'BCP-1'`
- `business_date` is set to today's date
- `is_active` defaults to true

### Profile Page
Temp patients have a reduced profile compared to synced patients:

| Feature | Synced Patient | Temp Patient |
|---------|---------------|--------------|
| Demographics | Read-only | Editable (Edit button) |
| Vitals tab | Visible | Hidden |
| Medications tab | Visible | Hidden |
| Investigations tab | Visible | Hidden |
| Documents tab | Visible | Hidden |
| Clinical Notes tab | Visible | Visible |
| Stale data warning | Shown if >5min | Hidden |
| Sync timestamps | Shown | Hidden |
| "BCP Temporary" badge | Not shown | Shown (orange) |
| "TEMP" badge in search | Not shown | Shown next to MRN, solid orange |

### Edit Demographics
- Only available for temp patients (`sourceSystem === 'BCP_LOCAL'`)
- Opens a dialog pre-populated with current values
- All fields except patient name are optional
- Uses `PATCH /api/bcp/patients/:mrn/demographics`

## Constraints

- **No delete**: Temp patients cannot be deleted. This preserves the audit trail.
- **No synced data**: Temp patients have no clinical profile, vitals, medications, investigations, or documents — only demographics and clinical notes.
- **Demographics only editable for temp patients**: Synced patient demographics are read-only.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/bcp/patients/register-temp` | Register a new temp patient |
| PATCH | `/api/bcp/patients/:mrn/demographics` | Update temp patient demographics |

All endpoints require `DOCTOR`, `NURSE`, or `ADMIN` role.

## Audit

- `TEMP_PATIENT_CREATED` event logged when a temp patient is registered.
- `TEMP_PATIENT_UPDATED` event logged when temp patient demographics are edited.
