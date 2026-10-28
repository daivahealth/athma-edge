# Patient API

Patient search, clinical profile, and temporary patient registration endpoints.

## GET /api/bcp/patients/search

**Auth:** Required
**Roles:** DOCTOR, NURSE, ADMIN

### Query Parameters

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| q | string | No | | Text search on MRN, UHID, patient_name, mobile_number |
| careSetting | string | No | | Filter: INPATIENT, OUTPATIENT, DAYCARE, EMERGENCY |
| ward | string | No | | Filter by ward_name |
| consultant | string | No | | Filter by consultant_name |
| businessDate | date | No | today | Filter by business_date (YYYY-MM-DD) |
| activeOnly | boolean | No | true | Filter by is_active=true |
| page | number | No | 1 | Page number |
| limit | number | No | 50 | Results per page |

### Response (200)

```json
{
  "data": [
    {
      "id": 1,
      "mrn": "MRN001",
      "uhid": "UHID001",
      "patientName": "John Doe",
      "age": "45Y",
      "gender": "Male",
      "careSetting": "INPATIENT",
      "wardName": "Ward A",
      "bedNumber": "A-101",
      "consultantName": "Dr. Smith",
      "lastSyncedAt": "2026-05-16T08:30:00Z",
      "sourceSystem": "HIS"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 125
  }
}
```

### Notes

- Text search (`q`) uses case-insensitive contains matching
- Audit event `PATIENT_SEARCHED` is logged with the search query
- Results sorted by patient_name ascending by default
- `sourceSystem` field distinguishes synced patients (e.g., `"HIS"`) from locally registered temp patients (`"BCP_LOCAL"`)

---

## GET /api/bcp/patients/:mrn/profile

**Auth:** Required
**Roles:** DOCTOR, NURSE, ADMIN

### Path Parameters

| Param | Type | Description |
|-------|------|-------------|
| mrn | string | Medical Record Number |

### Response (200)

```json
{
  "data": {
    "patient": {
      "mrn": "MRN001",
      "uhid": "UHID001",
      "patientName": "John Doe",
      "dateOfBirth": "1981-03-15",
      "age": "45Y",
      "gender": "Male",
      "mobileNumber": "+971501234567",
      "careSetting": "INPATIENT",
      "wardName": "Ward A",
      "bedNumber": "A-101",
      "consultantName": "Dr. Smith",
      "admissionDatetime": "2026-05-14T10:00:00Z",
      "isMlc": false,
      "lastSyncedAt": "2026-05-16T08:30:00Z"
    },
    "clinicalProfile": {
      "allergies": "Penicillin, Sulfa drugs",
      "bloodGroup": "O+",
      "primaryDiagnosis": "Acute appendicitis",
      "highRiskFlags": "Fall risk, DVT prophylaxis",
      "latestVitals": {
        "bp": "120/80",
        "pulse": 72,
        "temp": 37.2,
        "spo2": 98,
        "rr": 16
      },
      "activeMedications": [
        {"name": "Ceftriaxone", "dose": "1g", "route": "IV", "frequency": "BD"}
      ],
      "pendingInvestigations": [
        {"testName": "CBC", "orderedAt": "2026-05-16T06:00:00Z", "status": "PENDING"}
      ],
      "criticalResults": "Potassium 5.8 mEq/L",
      "handoverNotes": "Monitor K+ levels, repeat in 4 hours",
      "lastClinicalUpdateAt": "2026-05-16T08:00:00Z",
      "lastSyncedAt": "2026-05-16T08:30:00Z"
    },
    "documents": [
      {
        "id": 1,
        "documentType": "LAB_REPORT",
        "documentName": "CBC Report - 2026-05-16",
        "documentDatetime": "2026-05-16T07:00:00Z",
        "fileSize": 45678,
        "lastSyncedAt": "2026-05-16T08:20:00Z"
      }
    ]
  }
}
```

### Errors

| Status | Condition |
|--------|-----------|
| 404 | Patient with given MRN not found |

### Notes

- Audit event `PATIENT_VIEWED` is logged with the MRN
- If `clinicalProfile` is null, the profile has not been synced yet
- `documents` array may be empty if no PDFs have been synced
- For temp patients (`sourceSystem: 'BCP_LOCAL'`), `clinicalProfile` is null and `documents` is empty

---

## GET /api/bcp/patients/:mrn/clinical-summary/pdf

Generates and downloads a printable 24-hour clinical summary PDF, built from the latest `bcp_patient_clinical_summary` row synced for the patient.

**Auth:** Required
**Roles:** DOCTOR, NURSE, ADMIN

### Path Parameters

| Param | Type | Description |
|-------|------|-------------|
| mrn | string | Medical Record Number |

### Response (200)

Binary PDF file stream with headers:
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="<mrn>-24h-clinical-summary.pdf"`

### Errors

| Status | Condition |
|--------|-----------|
| 404 | No clinical summary synced for the given MRN |
| 400 | The HIS verification webhook returned a body other than `{ "statusCode": "200" }` |
| 502 | The HIS verification webhook is unreachable or `N8N_CLINICAL_SUMMARY_WEBHOOK_URL` is misconfigured |

### Notes

- Before rendering, the API calls the n8n webhook configured in `N8N_CLINICAL_SUMMARY_WEBHOOK_URL` as `<url>?mrn=<mrn>&encounterNumber=<encounterId>`, re-validating the encounter against the HIS. A JSON body of `{ "statusCode": "200" }` allows the print; any other value blocks it with a 400. If the webhook URL is not configured, verification is skipped (logged as a warning) so the feature degrades gracefully in environments without it set up yet.
- The PDF is generated on-demand from the `clinical_summary` JSONB payload (progress/nursing note summaries, allergies, vitals, lab results, intake/output, pending investigations, active medications) plus the row's own demographic/encounter columns
- Audit event `PDF_VIEWED` is logged with the MRN (same event type used for synced PDF document downloads)
- Not available for BCP temporary patients, since clinical summaries are only produced by the HIS sync pipeline

---

## POST /api/bcp/patients/register-temp

Register a new temporary (walk-in) patient during BCP.

**Auth:** Required
**Roles:** DOCTOR, NURSE, ADMIN

### Request Body

```json
{
  "patientName": "Jane Doe",
  "gender": "Female",
  "age": "32Y",
  "careSetting": "EMERGENCY",
  "wardName": "Ground Floor",
  "bedNumber": "101"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| patientName | string | Yes | Max 255 characters |
| gender | string | No | Male, Female, Other |
| dateOfBirth | string | No | ISO date (YYYY-MM-DD) |
| age | string | No | Max 20 characters (e.g., "34Y", "6M") |
| mobileNumber | string | No | Max 30 characters |
| careSetting | enum | Yes | INPATIENT, OUTPATIENT, DAYCARE, EMERGENCY |
| wardName | string | No | |
| bedNumber | string | No | |
| consultantName | string | No | |

### Response (201 Created)

```json
{
  "data": {
    "id": 11,
    "mrn": "BCP-20260520-001",
    "patientName": "Jane Doe",
    "gender": "Female",
    "age": "32Y",
    "careSetting": "EMERGENCY",
    "sourceSystem": "BCP_LOCAL",
    "isActive": true
  }
}
```

### Notes

- MRN is auto-generated in format `BCP-YYYYMMDD-NNN`
- `sourceSystem` is set to `BCP_LOCAL`
- Audit event `TEMP_PATIENT_CREATED` is logged
- Retries up to 3 times on MRN collision

---

## PATCH /api/bcp/patients/:mrn/demographics

Update demographics for a BCP temporary patient.

**Auth:** Required
**Roles:** DOCTOR, NURSE, ADMIN

### Path Parameters

| Param | Type | Description |
|-------|------|-------------|
| mrn | string | The BCP-prefixed MRN of the temp patient |

### Request Body

All fields are optional. Only provided fields are updated.

```json
{
  "patientName": "Jane M. Doe",
  "wardName": "ICU",
  "bedNumber": "ICU-03"
}
```

### Response (200 OK)

Returns the updated patient record.

### Errors

| Status | Condition |
|--------|-----------|
| 404 | No BCP_LOCAL patient found with this MRN |

### Notes

- Only works for patients with `sourceSystem = 'BCP_LOCAL'`
- Synced patient demographics cannot be edited via this endpoint
- Audit event `TEMP_PATIENT_UPDATED` is logged
