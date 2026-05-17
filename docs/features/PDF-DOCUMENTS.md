# PDF Documents

Document storage and retrieval for the BCP application.

## Document Types

| Code | Description |
|------|-------------|
| CLINICAL_SUMMARY | Clinical summary document |
| LAB_REPORT | Laboratory report |
| RADIOLOGY_REPORT | Radiology/imaging report |
| MAR | Medication Administration Record |
| NURSING_NOTE | Nursing notes |
| DISCHARGE_SUMMARY | Discharge summary |
| CONSENT | Consent forms |
| OTHER | Other document types |

## Storage

PDF files are stored on the local filesystem (not in PostgreSQL):

```
/local-bcp-storage/pdfs/{tenant_id}/{mrn}/{document_type}/filename.pdf
```

The `bcp_patient_pdf_document` table stores metadata only:
- `file_path`: full path to the PDF file
- `checksum`: SHA-256 hash for deduplication
- `file_size`: file size in bytes
- `mime_type`: always `application/pdf`

## Sync Flow

1. n8n PDF Document Sync workflow runs every 5-10 minutes
2. Pulls document list from source HIS API
3. For each new/updated document:
   - Computes SHA-256 checksum
   - Skips download if checksum matches existing file
   - Downloads PDF binary to local storage path
   - Upserts metadata into `bcp_patient_pdf_document`
4. Updates `bcp_sync_status` for PDF_DOCUMENT component

## Download Flow

1. User clicks download on a document in the UI
2. Frontend calls `GET /api/bcp/documents/:documentId/download`
3. API validates JWT auth and tenant access
4. API streams file from local storage via `StreamableFile`
5. Browser receives PDF with `Content-Disposition: attachment`
6. Audit event `PDF_VIEWED` is logged

## Future: MinIO

In later phases, local filesystem storage may be replaced with MinIO object storage. The `file_path` field would then contain an S3-compatible object key instead of a filesystem path. The API download endpoint would proxy from MinIO instead of reading from disk.
