# Document API

PDF document listing and download endpoints.

## GET /api/bcp/patients/:mrn/documents

**Auth:** Required
**Roles:** DOCTOR, NURSE, ADMIN

### Path Parameters

| Param | Type | Description |
|-------|------|-------------|
| mrn | string | Medical Record Number |

### Query Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| documentType | string | No | Filter by document type |
| activeOnly | boolean | No (default true) | Filter by is_active |

### Response (200)

```json
{
  "data": [
    {
      "id": 1,
      "documentType": "LAB_REPORT",
      "documentName": "CBC Report - 2026-05-16",
      "mimeType": "application/pdf",
      "documentDatetime": "2026-05-16T07:00:00Z",
      "fileSize": 45678,
      "isActive": true,
      "lastSyncedAt": "2026-05-16T08:20:00Z"
    }
  ]
}
```

### Document Types

| Code | Description |
|------|-------------|
| CLINICAL_SUMMARY | Clinical summary document |
| LAB_REPORT | Laboratory report |
| RADIOLOGY_REPORT | Radiology/imaging report |
| MAR | Medication Administration Record |
| NURSING_NOTE | Nursing notes |
| DISCHARGE_SUMMARY | Discharge summary |
| CONSENT | Consent forms |
| OTHER | Other documents |

---

## GET /api/bcp/documents/:documentId/download

**Auth:** Required
**Roles:** DOCTOR, NURSE, ADMIN

### Path Parameters

| Param | Type | Description |
|-------|------|-------------|
| documentId | number | Document ID |

### Response (200)

Binary PDF file stream with headers:

```
Content-Type: application/pdf
Content-Disposition: attachment; filename="document_name.pdf"
```

### Errors

| Status | Condition |
|--------|-----------|
| 404 | Document not found or file missing from storage |
| 403 | Document belongs to different tenant |

### Notes

- Audit event `PDF_VIEWED` is logged with document ID and MRN
- File is streamed from local storage path
- Storage path pattern: `/local-bcp-storage/pdfs/{tenant_id}/{mrn}/{document_type}/filename.pdf`
