# Admin API

User management, sync status, and audit log endpoints. All endpoints require ADMIN role.

## User Management

### POST /api/users

**Auth:** Required
**Roles:** ADMIN

Create a new user.

#### Request

```json
{
  "username": "dr.smith",
  "password": "SecurePass123!",
  "fullName": "Dr. Sarah Smith",
  "email": "sarah.smith@hospital.local",
  "mobileNumber": "+971501234567"
}
```

#### Response (201)

```json
{
  "data": {
    "id": 2,
    "username": "dr.smith",
    "fullName": "Dr. Sarah Smith",
    "email": "sarah.smith@hospital.local",
    "isActive": true,
    "roles": [],
    "createdAt": "2026-05-16T09:00:00Z"
  }
}
```

---

### GET /api/users

**Auth:** Required
**Roles:** ADMIN

List all users for the tenant.

#### Response (200)

```json
{
  "data": [
    {
      "id": 1,
      "username": "admin",
      "fullName": "System Administrator",
      "email": "admin@hospital.local",
      "isActive": true,
      "roles": [{"id": 3, "roleCode": "ADMIN", "roleName": "Administrator"}],
      "lastLoginAt": "2026-05-16T08:00:00Z"
    }
  ]
}
```

---

### PATCH /api/users/:id

**Auth:** Required
**Roles:** ADMIN

Update user fields.

#### Request

```json
{
  "fullName": "Dr. Sarah J. Smith",
  "isActive": false
}
```

#### Response (200)

Returns updated user object.

---

### POST /api/users/:id/roles

**Auth:** Required
**Roles:** ADMIN

Assign roles to a user.

#### Request

```json
{
  "roleIds": [1, 2]
}
```

#### Response (200)

Returns user with updated roles.

---

## Sync Status

### GET /api/bcp/sync/status

**Auth:** Required
**Roles:** ADMIN

Get sync health for all components.

#### Response (200)

```json
{
  "data": {
    "overall": "HEALTHY",
    "components": [
      {
        "syncComponent": "ACTIVE_PATIENT",
        "syncStatus": "SUCCESS",
        "lastSuccessfulSyncAt": "2026-05-16T08:30:00Z",
        "lastAttemptAt": "2026-05-16T08:30:00Z",
        "recordsProcessed": 150,
        "recordsFailed": 0,
        "errorMessage": null
      },
      {
        "syncComponent": "CLINICAL_PROFILE",
        "syncStatus": "SUCCESS",
        "lastSuccessfulSyncAt": "2026-05-16T08:29:00Z",
        "lastAttemptAt": "2026-05-16T08:29:00Z",
        "recordsProcessed": 148,
        "recordsFailed": 2,
        "errorMessage": null
      },
      {
        "syncComponent": "PDF_DOCUMENT",
        "syncStatus": "SUCCESS",
        "lastSuccessfulSyncAt": "2026-05-16T08:25:00Z",
        "lastAttemptAt": "2026-05-16T08:25:00Z",
        "recordsProcessed": 42,
        "recordsFailed": 0,
        "errorMessage": null
      }
    ]
  }
}
```

Overall health logic:
- **HEALTHY**: all components SUCCESS and last sync within threshold
- **DEGRADED**: any component FAILED or PARTIAL
- **STALE**: any component last sync older than configured threshold

---

## Audit Log

### GET /api/bcp/audit

**Auth:** Required
**Roles:** ADMIN

Query audit log entries.

#### Query Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| eventType | string | No | Filter by event type |
| username | string | No | Filter by username |
| mrn | string | No | Filter by patient MRN |
| dateFrom | datetime | No | Start of date range |
| dateTo | datetime | No | End of date range |
| page | number | No (default 1) | Page number |
| limit | number | No (default 50) | Results per page |

#### Response (200)

```json
{
  "data": [
    {
      "id": 1,
      "eventType": "LOGIN_SUCCESS",
      "username": "admin",
      "userRole": "ADMIN",
      "ipAddress": "192.168.1.100",
      "eventTimestamp": "2026-05-16T08:00:00Z",
      "mrn": null,
      "additionalData": null
    }
  ],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 234
  }
}
```

---

### POST /api/bcp/audit

**Auth:** Required
**Roles:** ADMIN

Create a manual audit entry (for n8n or external systems).

#### Request

```json
{
  "eventType": "PATIENT_SEARCHED",
  "username": "n8n-sync",
  "additionalData": {
    "workflowName": "Active Patient Sync",
    "recordsProcessed": 150
  }
}
```

#### Response (201)

Returns created audit entry.
