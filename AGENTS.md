# AGENTS.md - athma-edge

Operating contract for AI coding agents working in this repository.

This file is intentionally policy-heavy. It defines how agents should work, which documents are authoritative, when documentation updates are mandatory, and which engineering constraints must not be violated.

## Companion File Sync

- `AGENTS.md` and `CLAUDE.md` must stay materially aligned.
- Any update to one file must be reflected in the other in the same session.
- Do not change agent operating rules in only one of these files.

## What This Project Is

Athma Edge is a **Phase-1 Hospital BCP (Business Continuity Plan) Edge Application**. It provides local clinical continuity when the main cloud HIS/EMR is unreachable.

**It IS:**
- A local cache of active patient data, lean clinical profiles, and PDF documents synced from the cloud HIS
- A BCP clinical documentation tool — append-only clinical notes (orders, medications, assessments, handover, etc.) recorded as free text
- A temporary patient registration system — walk-in patients during outage get a BCP-prefixed MRN
- Synced from the cloud HIS via n8n workflows that upsert directly into PostgreSQL
- Deployed on a hospital edge box via Docker Compose

**It is NOT:**
- A disaster recovery (DR) system
- A full EMR/HIS replacement
- A system with structured order entry, medication prescribing, or billing — clinical notes are free-text documentation, not structured orders
- A real-time two-way sync — write-back to the HIS happens after recovery, through a separate n8n reconciliation workflow, not continuously

## Purpose

- Use this file as the top-level ruleset for agent behavior in `athma-edge`.
- Use the `docs/` tree as the detailed source of truth for architecture, APIs, workflows, runbooks, and developer guidance.
- Do not treat this file as the place to restate all architecture or feature detail already documented elsewhere.

## Documentation Hierarchy

- Root `AGENTS.md`: operating rules for agents.
- [docs/README.md](docs/README.md): documentation entrypoint and navigation.
- [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md): documentation writing standards and contribution guidance.
- [docs/architecture/](docs/architecture): system architecture, technical design, and data model.
- [docs/ADR/](docs/ADR): architecture decisions and decision history.
- [docs/api/](docs/api): API contracts, endpoint behavior, and integration references.
- [docs/features/](docs/features): feature behavior, workflows, and domain-specific implementation detail.
- [docs/development/](docs/development): engineering workflow, commands, and implementation guidance.
- [docs/deployment/](docs/deployment): Docker Compose, nginx, n8n workflow references.
- [docs/security/](docs/security): security, RBAC, and audit logging references.
- [docs/runbooks/](docs/runbooks): operational procedures, setup, and troubleshooting.

## Documentation First Policy

Agents must treat documentation updates as part of the implementation, not optional follow-up.

- Any change affecting architecture, API contracts, workflows, developer expectations, operational behavior, or security assumptions must update the appropriate docs in the same session.
- If a code change does not require a doc update, the agent should be able to justify that clearly.
- If code and docs already disagree, the agent must call it out explicitly and either reconcile them or stop and surface the mismatch.
- Agents must check existing documentation before creating new docs.
- Prefer updating an existing canonical doc over creating a new file.

## Documentation Routing Rules

When a change is made, update the correct documentation family.

- Architecture, data model, integration patterns, or system design changes:
  - `docs/ADR/`
  - `docs/architecture/`
- API shape, endpoint semantics, auth/header expectations, request/response changes:
  - `docs/api/`
- Feature behavior, workflows, search logic, sync rules:
  - `docs/features/`
- Developer setup, local workflow, commands, coding patterns:
  - `docs/development/`
- Docker Compose, nginx, n8n workflow changes:
  - `docs/deployment/`
- Auth, RBAC, audit logging changes:
  - `docs/security/`
- Operational procedures, setup, troubleshooting:
  - `docs/runbooks/`

## No Silent Drift

- Do not leave behavior-changing code without aligned documentation.
- Do not change an API, workflow, or architecture rule and leave older docs misleading.
- Do not cite docs as authoritative if the implementation now contradicts them.
- If a mismatch is too large to safely reconcile in the current task, stop and report it.

## No Documentation Sprawl

- Do not create one-off summary docs, completion reports, or fix-status docs by default.
- Do not create a new markdown file if an existing canonical doc can absorb the change.
- Do not duplicate the same content across `features`, `api`, and `deployment`.
- Use new docs only when the topic is genuinely new and does not already have a natural home.

## Repository Orientation

```text
athma-edge/
├── backend/
│   ├── prisma/             # Prisma schema, migrations, seed
│   └── src/                # NestJS single-service application
│       ├── common/         # Guards, decorators, filters, interceptors, middleware
│       ├── database/       # PrismaService and PrismaModule
│       └── modules/        # Feature modules (auth, user, patient, clinical-profile, clinical-note, document, sync-status, audit, health)
├── frontend/               # Next.js 14 App Router application
│   └── src/
│       ├── app/            # Route pages and layouts
│       ├── components/     # UI primitives, layout, feature components
│       ├── modules/        # Domain modules (auth, patients, clinical-notes, sync, admin)
│       ├── lib/            # API client, stores, utilities
│       ├── hooks/          # Shared React hooks
│       └── providers/      # React context providers
├── docs/                   # Canonical documentation tree
├── nginx/                  # Nginx reverse proxy config
├── n8n/                    # n8n workflow JSON exports
└── init-scripts/           # PostgreSQL initialization scripts
```

Key code locations:

- Backend NestJS source: `backend/src/`
- Prisma schema and migrations: `backend/prisma/`
- Frontend source: `frontend/src/`
- API client: `frontend/src/lib/api/client.ts`
- Auth store: `frontend/src/lib/stores/auth-store.ts`
- UI primitives: `frontend/src/components/ui/`

## Core Engineering Rules

- Explore before editing. Read the relevant code and the relevant docs first.
- Follow existing patterns unless there is a strong documented reason to change them.
- Prefer small, coherent changes over broad speculative refactors.
- Preserve multi-tenant safety, auth expectations, and auditability.
- Do not invent new abstractions if an existing service, hook, utility, or component already covers the use case.

## BCP-Specific Rules

These rules are unique to the BCP edge application and must not be violated.

- **Synced clinical data is read-only.** Do not add write endpoints or UI forms that modify synced clinical tables (vitals, medications, investigations, documents). These come from n8n sync only.
- **Two local-write exceptions exist:** BCP Clinical Notes (append-only, free-text) and BCP Temporary Patient Registration (walk-in patients with `BCP-` prefixed MRNs). Both are append-only — notes cannot be edited or deleted; temp patient demographics can be updated but not deleted.
- **No structured order entry, medication prescribing, or billing.** Clinical notes are free-text documentation written back to the HIS as documentation, never promoted to executable orders.
- **Always show sync freshness.** Every patient-facing view must display `last_synced_at`. If stale (>5 minutes), show a warning banner.
- **Always show BCP LOCAL MODE.** The UI must permanently display a non-dismissible banner indicating this is the BCP local system, not the primary HIS.
- **External IDs are VARCHAR, not UUID.** All IDs from the source HIS (patient_id, mrn, uhid, encounter_id, visit_number, consultant_id, tenant_id, source_system) must be VARCHAR. Do not generate UUIDs for these.
- **Soft delete only.** Never hard-delete patient/clinical records. Use `is_active`, `active_from`, `active_until`, `business_date` for lifecycle management.
- **No Kafka, no Kubernetes, no Elasticsearch, no Redis.** Keep the stack simple: NestJS + PostgreSQL + n8n + nginx + Docker Compose.

## Backend Rules

- Follow NestJS patterns already used in the repo (controller -> service -> repository via PrismaService).
- Keep tenant-aware filters intact on all domain queries (always filter by `tenant_id`).
- Use Prisma for all database access. Do not introduce raw SQL except in migrations or seed scripts.
- Document any change to:
  - endpoint behavior
  - DTO/schema shape
  - auth/header expectations
  - database migration impact

## Frontend Rules

- Use existing API client, query hooks, stores, and UI primitives before adding new ones.
- Keep branding and theme changes aligned with shared theme tokens.
- Do not hardcode API paths; use the centralized API client.
- Document any change to:
  - route behavior
  - search/filter workflows
  - user-facing feature behavior
  - API usage expectations

## Database & Security Rules

- Patient/clinical data isolation must remain intact (always scope by `tenant_id`).
- Schema changes must include:
  - impact awareness
  - affected modules
  - seed or migration implications
  - documentation updates in the correct doc family
- All user actions must be audit-logged (login, search, view, download, note creation, temp patient registration, logout).
- JWT auth is stateless. No token blacklist in Phase-1.
- bcrypt for password hashing (not argon2).

## Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Backend | NestJS | ^10 |
| ORM | Prisma | ^6 |
| Database | PostgreSQL | 16 |
| Frontend | Next.js (App Router) | 14 |
| UI | Radix UI + Tailwind CSS | Latest |
| State | Zustand + React Query v5 | Latest |
| Sync/ETL | n8n | Latest |
| Proxy | Nginx | Alpine |
| Deployment | Docker Compose | v2 |

## Development Workflow

Common local commands:

### Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
npm run build
npm run lint
```

### Docker
```bash
docker compose up -d
docker compose exec bcp-api npx prisma migrate deploy
docker compose exec bcp-api npx prisma db seed
docker compose logs -f bcp-api
```

## Dos

- Do inspect relevant docs before implementing.
- Do update the correct canonical docs in the same session when behavior changes.
- Do preserve existing tenant context patterns, auth guards, and audit logging.
- Do prefer existing shared utilities, API client, hooks, and components.
- Do mention any discovered code/doc mismatch in your final report.
- Do document migration, schema, or operational impact when relevant.
- Do always test that `last_synced_at` and BCP banner are visible after UI changes.

## Don'ts

- Don't duplicate architecture or feature detail already covered in `docs/`.
- Don't create summary/status/completion markdown files by default.
- Don't add write endpoints for synced clinical data (vitals, medications, investigations, documents). Only BCP Clinical Notes and Temp Patient Registration are writable.
- Don't bypass the audit interceptor for user-facing actions.
- Don't introduce Kafka, Redis, Elasticsearch, or Kubernetes.
- Don't use UUID for external IDs; use VARCHAR.
- Don't hard-delete patient or clinical records.
- Don't make auth, tenant-safety, or schema changes without aligned documentation.
- Don't leave code and docs in a contradictory state without explicitly surfacing it.

## Verification and Documentation Checklist

Before closing a task, the agent should verify:

- What behavior changed?
- Which existing docs were checked before implementation?
- Which canonical docs were updated?
- What was verified locally?
- Does any known code/doc mismatch remain?
- Is the BCP banner still visible?
- Is `last_synced_at` still displayed on patient views?

If the change affects architecture, APIs, workflows, or operations, the final response should mention the doc updates explicitly.

## Key References

- [docs/README.md](docs/README.md)
- [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)
- [docs/architecture/TECHNICAL-ARCHITECTURE.md](docs/architecture/TECHNICAL-ARCHITECTURE.md)
- [docs/architecture/DATA-MODEL.md](docs/architecture/DATA-MODEL.md)
- [docs/api/README.md](docs/api/README.md)
- [docs/security/AUTH-AND-RBAC.md](docs/security/AUTH-AND-RBAC.md)
- [docs/deployment/DOCKER-COMPOSE.md](docs/deployment/DOCKER-COMPOSE.md)
- [docs/development/DEVELOPER-ONBOARDING.md](docs/development/DEVELOPER-ONBOARDING.md)
