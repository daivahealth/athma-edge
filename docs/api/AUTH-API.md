# Auth API

Authentication endpoints for the BCP application.

## POST /api/auth/login

**Auth:** Public (no token required)

### Request

```json
{
  "username": "string (required)",
  "password": "string (required)"
}
```

### Response (200)

```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "username": "admin",
      "fullName": "System Administrator",
      "tenantId": "hospital-001",
      "roles": ["ADMIN"]
    }
  }
}
```

### Errors

| Status | Condition |
|--------|-----------|
| 401 | Invalid username or password |
| 422 | Missing required fields |

### Notes

- Audit event `LOGIN_SUCCESS` or `LOGIN_FAILED` is automatically logged
- JWT payload: `{ sub: userId, username, tenantId, roles[] }`
- Token expires after 8 hours

---

## GET /api/auth/me

**Auth:** Required
**Roles:** Any authenticated user

### Response (200)

```json
{
  "data": {
    "id": 1,
    "username": "admin",
    "fullName": "System Administrator",
    "email": "admin@hospital.local",
    "tenantId": "hospital-001",
    "roles": ["ADMIN"],
    "isActive": true,
    "lastLoginAt": "2026-05-16T08:00:00Z"
  }
}
```

---

## POST /api/auth/logout

**Auth:** Required
**Roles:** Any authenticated user

### Response (200)

```json
{
  "data": {
    "message": "Logged out successfully"
  }
}
```

### Notes

- Audit event `LOGOUT` is logged
- JWT is stateless; logout does not invalidate the token server-side in Phase-1
- Client must discard the token
