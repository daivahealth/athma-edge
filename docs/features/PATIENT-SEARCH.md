# Patient Search

Search behavior for active patients in the BCP application.

## Endpoint

`GET /api/bcp/patients/search`

## Filters

| Filter | Field(s) Searched | Match Type |
|--------|------------------|------------|
| q (text) | mrn, uhid, patient_name, mobile_number | Case-insensitive contains |
| careSetting | care_setting | Exact match enum |
| ward | ward_name | Exact match |
| consultant | consultant_name | Contains |
| businessDate | business_date | Exact date match (default: today) |
| activeOnly | is_active | Boolean (default: true) |

## Result Columns

| Column | Source Field |
|--------|-------------|
| MRN | mrn |
| UHID | uhid |
| Patient Name | patient_name |
| Age/Gender | age, gender |
| Care Setting | care_setting |
| Ward/Bed | ward_name, bed_number |
| Consultant | consultant_name |
| Last Synced At | last_synced_at |

## Outpatient Sync Rule

For OUTPATIENT patients, only the following are synced by n8n:

**Included:**
- Today's checked-in patients
- Today's registered patients
- Today's arrived patients
- Today's active encounter patients

**Excluded:**
- Cancelled appointments
- No-show appointments
- Future appointments
- Past/old appointments

This filtering happens at the n8n sync level, not at the API query level. The BCP database only contains OP patients that passed this filter.

## UI Behavior

- Search form at the top of the patient list page
- Results displayed in a table below the form
- Clicking a row navigates to `/patients/[mrn]` (clinical profile page)
- Last Synced At column shows relative time with color coding:
  - Green: < 2 minutes
  - Yellow: 2-5 minutes
  - Red: > 5 minutes
- Default filter: activeOnly=true, businessDate=today
