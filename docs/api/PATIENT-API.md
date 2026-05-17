# Patient API

Patient search and clinical profile endpoints.

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
      "lastSyncedAt": "2026-05-16T08:30:00Z"
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
