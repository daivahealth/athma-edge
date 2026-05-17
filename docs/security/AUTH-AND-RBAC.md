# Authentication and RBAC

Authentication and role-based access control for the BCP application.

## Authentication Flow

1. User submits username + password to `POST /api/auth/login`
2. Server validates credentials against `bcp_user` table (bcrypt hash comparison)
3. Server loads user roles from `bcp_user_role` + `bcp_role` tables
4. Server issues JWT with payload: `{ sub, username, tenantId, roles[] }`
5. Client stores JWT and includes it as `Authorization: Bearer <token>` on all requests
6. Server validates JWT on every request via global `JwtAuthGuard`

## JWT Configuration

| Setting | Value | Notes |
|---------|-------|-------|
| Algorithm | HS256 | HMAC with secret |
| Expiry | 8 hours | Matches a clinical shift duration |
| Secret | JWT_SECRET env var | Must be changed from default in production |
| Refresh Token | None (Phase-1) | Stateless, no refresh flow |
| Token Blacklist | None (Phase-1) | Logout is client-side only |

## JWT Payload

```json
{
  "sub": 1,
  "username": "dr.smith",
  "tenantId": "hospital-001",
  "roles": ["DOCTOR"],
  "iat": 1747382400,
  "exp": 1747411200
}
```

## Password Security

- Hashing: bcrypt with 12 rounds
- No password complexity rules enforced in Phase-1 (recommended for production)
- Default admin password must be changed after initial setup

## Roles

| Role Code | Role Name | Description |
|-----------|-----------|-------------|
| DOCTOR | Doctor | Clinical staff with physician responsibilities |
| NURSE | Nurse | Clinical staff with nursing responsibilities |
| ADMIN | Administrator | System administrator with full access |

A user can have multiple roles (many-to-many via `bcp_user_role`).

## Access Matrix

| Endpoint Group | DOCTOR | NURSE | ADMIN |
|---------------|--------|-------|-------|
| POST /api/auth/login | Public | Public | Public |
| GET /api/auth/me | Yes | Yes | Yes |
| POST /api/auth/logout | Yes | Yes | Yes |
| GET /api/bcp/patients/search | Yes | Yes | Yes |
| GET /api/bcp/patients/:mrn/profile | Yes | Yes | Yes |
| GET /api/bcp/patients/:mrn/documents | Yes | Yes | Yes |
| GET /api/bcp/documents/:id/download | Yes | Yes | Yes |
| POST /api/users | No | No | Yes |
| GET /api/users | No | No | Yes |
| PATCH /api/users/:id | No | No | Yes |
| POST /api/users/:id/roles | No | No | Yes |
| GET /api/bcp/sync/status | No | No | Yes |
| GET /api/bcp/audit | No | No | Yes |
| POST /api/bcp/audit | No | No | Yes |
| GET /api/health | Public | Public | Public |

## Guard Implementation

- **JwtAuthGuard**: Global guard (APP_GUARD). Validates Bearer token on every request. Routes decorated with `@Public()` bypass authentication.
- **RolesGuard**: Global guard (APP_GUARD). Reads `@Roles()` decorator metadata. If no `@Roles()` decorator, any authenticated user is allowed. If roles specified, checks intersection with user's roles from JWT.
