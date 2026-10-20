# Clinical Notes API

BCP Clinical Notes endpoints for creating and listing free-text clinical documentation.

## Endpoints

### Create Clinical Note

```
POST /api/bcp/patients/:mrn/notes
```

**Access:** DOCTOR, NURSE, ADMIN

**Request Body:**
```json
{
  "noteType": "PROGRESS",
  "content": "Patient reports improvement in pain levels. Vitals stable."
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| noteType | enum | Yes | ORDER, MEDICATION, INVESTIGATION, PROGRESS, ASSESSMENT, NURSING, HANDOVER, INCIDENT, COMMUNICATION, OTHER |
| content | string | Yes | 1-5000 characters |

**Response:** `201 Created`
```json
{
  "data": {
    "id": 1,
    "tenantId": "DEFAULT",
    "mrn": "MRN-10001",
    "noteType": "PROGRESS",
    "content": "Patient reports improvement in pain levels. Vitals stable.",
    "authorUsername": "dr.smith",
    "authorFullName": "Dr. Smith",
    "authorRole": "DOCTOR",
    "source": "BCP",
    "recordedAt": "2026-05-20T10:30:00.000Z",
    "createdAt": "2026-05-20T10:30:00.000Z"
  }
}
```

Author information is automatically captured from the JWT. The `authorFullName` is looked up from `bcp_user` at creation time. `source` is always `"BCP"` for notes created through this app, and `recordedAt` stores the timestamp the note was recorded (equal to `createdAt` at creation time).

### List Notes for Patient

```
GET /api/bcp/patients/:mrn/notes?noteType=&page=&limit=
```

**Access:** DOCTOR, NURSE, ADMIN

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| noteType | enum | — | Filter by note type |
| source | string | — | Filter by note source, e.g. `BCP` |
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |

**Response:** `200 OK` with paginated list, ordered by `recordedAt DESC`.

### List All Notes (across patients)

```
GET /api/bcp/clinical-notes?q=&noteType=&page=&limit=
```

**Access:** DOCTOR, NURSE, ADMIN

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| q | string | — | Search by patient name or MRN |
| noteType | enum | — | Filter by note type |
| source | string | — | Filter by note source, e.g. `BCP` |
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |

**Response:** `200 OK` with paginated list. Each note includes patient demographics (name, age, gender, ward, bed) for display in the cross-patient list view.

## Notes

- Notes are **append-only** — no PUT, PATCH, or DELETE endpoints exist.
- The `BCP_NOTE_CREATED` audit event is logged automatically for each creation.
