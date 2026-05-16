# Athma Edge Documentation

Documentation entrypoint for the Athma Edge BCP (Business Continuity Plan) application.

## Navigation

### Architecture & Design
- [Architecture Overview](architecture/README.md)
- [Technical Architecture](architecture/TECHNICAL-ARCHITECTURE.md) — system design, components, data flow
- [Data Model](architecture/DATA-MODEL.md) — complete database schema reference (8 tables)

### Architecture Decision Records
- [ADR-0001: Technology Stack](ADR/ADR-0001-technology-stack.md)
- [ADR-0002: Read-Only Phase-1](ADR/ADR-0002-read-only-phase1.md)
- [ADR-0003: n8n Sync Strategy](ADR/ADR-0003-n8n-sync-strategy.md)
- [ADR-0004: External ID Strategy](ADR/ADR-0004-external-id-strategy.md)
- [ADR-0005: Soft Delete & Daily Rollover](ADR/ADR-0005-soft-delete-daily-rollover.md)

### API Contracts
- [API Overview](api/README.md) — auth patterns, base URL, role matrix
- [Auth API](api/AUTH-API.md) — login, me, logout
- [Patient API](api/PATIENT-API.md) — search, clinical profile
- [Document API](api/DOCUMENT-API.md) — PDF list, download
- [Admin API](api/ADMIN-API.md) — users, sync status, audit
- [Response Formats](api/API-RESPONSE-FORMATS.md) — standard envelopes and errors

### Features
- [Features Overview](features/README.md)
- [Patient Search](features/PATIENT-SEARCH.md) — search behavior, filters, OP sync rules
- [Clinical Profile](features/CLINICAL-PROFILE.md) — profile sections, data mapping
- [PDF Documents](features/PDF-DOCUMENTS.md) — document types, storage, download
- [Sync Status](features/SYNC-STATUS.md) — sync health dashboard
- [Daily Rollover](features/DAILY-ROLLOVER.md) — business date logic, soft status rules

### Development
- [Development Overview](development/README.md)
- [Developer Onboarding](development/DEVELOPER-ONBOARDING.md) — prerequisites, setup
- [Development Commands](development/DEVELOPMENT-COMMANDS.md) — CLI reference
- [Coding Patterns](development/CODING-PATTERNS.md) — NestJS and frontend conventions

### Deployment
- [Deployment Overview](deployment/README.md)
- [Docker Compose](deployment/DOCKER-COMPOSE.md) — service topology, volumes
- [Nginx Config](deployment/NGINX-CONFIG.md) — reverse proxy routing
- [n8n Workflows](deployment/N8N-WORKFLOWS.md) — sync workflow design

### Security
- [Security Overview](security/README.md)
- [Auth & RBAC](security/AUTH-AND-RBAC.md) — login flow, JWT, role matrix
- [Audit Logging](security/AUDIT-LOGGING.md) — event types, automatic logging

### Runbooks
- [Initial Setup](runbooks/INITIAL-SETUP.md) — first-time deployment
- [Sync Troubleshooting](runbooks/SYNC-TROUBLESHOOTING.md) — n8n failure diagnosis
- [Daily Operations](runbooks/DAILY-OPERATIONS.md) — rollover, monitoring

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for documentation writing standards.
