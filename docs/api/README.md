# API Overview

REST API documentation for Athma Edge BCP application.

## Base URL

```
/api
```

All endpoints are prefixed with `/api`. When running locally, the full URL is `http://localhost:3100/api` (direct) or `http://localhost/api` (via nginx).

## Authentication

All endpoints require JWT Bearer authentication unless marked as **Public**.

```
Authorization: Bearer <access_token>
```

Obtain a token via `POST /api/auth/login`.

## Role-Based Access Matrix

| Endpoint Group | DOCTOR | NURSE | ADMIN |
|---------------|--------|-------|-------|
| Auth (login, me, logout) | Yes | Yes | Yes |
| Patient Search | Yes | Yes | Yes |
| Clinical Profile | Yes | Yes | Yes |
| PDF View/Download | Yes | Yes | Yes |
| BCP Clinical Notes | Yes | Yes | Yes |
| Investigation Results | Yes | Yes | Yes |
| Temp Patient Registration | Yes | Yes | Yes |
| User Management | No | No | Yes |
| Sync Status | No | No | Yes |
| Audit Logs | No | No | Yes |

## Endpoint Index

- [Auth API](AUTH-API.md) — login, current user, logout
- [Patient API](PATIENT-API.md) — search, clinical profile, temp patient registration
- [Clinical Notes API](CLINICAL-NOTES-API.md) — create and list BCP clinical notes
- [Investigation Results API](INVESTIGATION-RESULTS-API.md) — fetch synced LAB investigation results by MRN
- [Document API](DOCUMENT-API.md) — PDF list, download
- [Admin API](ADMIN-API.md) — users, sync status, audit
- [Response Formats](API-RESPONSE-FORMATS.md) — standard envelopes and errors
- [HIS Reconciliation Contract](HIS-RECONCILIATION-CONTRACT.md) — outbound: what the source HIS must expose for write-back after a BCP event
