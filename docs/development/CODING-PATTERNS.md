# Coding Patterns

Architecture conventions used in the Athma Edge codebase.

## Backend (NestJS)

### Module Structure

Each feature module follows: Controller -> Service -> PrismaService

```
modules/
  patient/
    patient.module.ts       # Module definition
    patient.controller.ts   # HTTP routes
    patient.service.ts      # Business logic
    dto/
      search-patient.dto.ts # Request validation
```

### Global Guards (APP_GUARD)

Applied in `app.module.ts`, every endpoint is authenticated by default:

- **JwtAuthGuard**: validates Bearer token, attaches user to request. Skip with `@Public()`.
- **RolesGuard**: reads `@Roles()` metadata, checks user roles. No decorator means any authenticated user.

### Decorators

- `@Public()` — marks endpoint as no-auth-required
- `@Roles('ADMIN')` — restricts to specific roles
- Both are custom decorators using `SetMetadata()`

### Audit Interceptor

Global `AuditInterceptor` maps route patterns to audit event types:

| Route Pattern | Event |
|--------------|-------|
| POST /api/auth/login (success) | LOGIN_SUCCESS |
| POST /api/auth/login (failure) | LOGIN_FAILED |
| GET /api/bcp/patients/search | PATIENT_SEARCHED |
| GET /api/bcp/patients/:mrn/profile | PATIENT_VIEWED |
| GET /api/bcp/documents/:id/download | PDF_VIEWED |
| POST /api/auth/logout | LOGOUT |

### Tenant Scoping

Every database query must include `tenant_id` in the WHERE clause. The middleware extracts tenant from JWT or `DEFAULT_TENANT_ID` env.

### Validation

Global `ValidationPipe` with `transform: true, whitelist: true, forbidNonWhitelisted: true`. DTOs use `class-validator` decorators.

### Error Handling

Global `GlobalExceptionFilter` catches all exceptions and returns structured error responses (see [API Response Formats](../api/API-RESPONSE-FORMATS.md)).

## Frontend (React + Vite)

### Route Layout

Routes are declared in one place, `src/router.tsx`, rather than inferred from the
filesystem. `MainLayout` wraps every authenticated route and runs the auth guard,
so a new page is protected by where it is registered, not by what it remembers to call.

```
src/
  main.tsx         # React root: QueryProvider + RouterProvider
  router.tsx       # Every route, in one file
  pages/
    login.tsx      # Public
    patients/      # index.tsx, detail.tsx  (/patients, /patients/:mrn)
    clinical-notes/# index.tsx, new.tsx, detail.tsx
    admin/         # sync.tsx, users.tsx, audit.tsx  (role-guarded)
  components/layout/main-layout.tsx   # Sidebar + BCP banner + auth guard + <Outlet/>
```

Adding a route means adding a file under `pages/` and a line in `router.tsx`.
Put it in the `MainLayout` children array unless it is genuinely public.

### Component Organization

- `components/ui/` — Radix UI primitives wrapped with CVA + `cn()` utility
- `components/layout/` — App shell components (sidebar, topbar, BCP banner)
- `components/patients/` — Patient-specific components
- `components/admin/` — Admin page components

### Module Pattern

```
modules/
  patients/
    types/patient.ts       # TypeScript interfaces
    services/patient-service.ts  # Axios API calls
    hooks/use-patient-search.ts  # React Query hooks
```

### State Management

- **Auth**: Zustand store with `persist` middleware (localStorage)
- **Server state**: React Query v5 with query key factories
- **Forms**: React Hook Form + Zod schemas

### API Client

Single Axios instance at `lib/api/client.ts`:
- Request interceptor: attaches Bearer token from auth store
- Response interceptor: on 401, clears session, redirects to /login
- Base URL: `/api` (same origin in production, Vite dev-server proxy in dev)
