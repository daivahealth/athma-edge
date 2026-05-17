# ADR-0001: Technology Stack

**Status:** Accepted
**Date:** 2026-05-16

## Context

Athma Edge is a Phase-1 Hospital BCP Edge Application — a local clinical continuity app deployed on a hospital edge server, used when the main cloud HIS/EMR is unreachable. It must be simple to deploy, operate, and maintain by a small team. The sibling project athma-ce uses NestJS + Prisma + Next.js 14, and we want consistency across the Athma product family.

## Decision

Adopt the following technology stack:

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Backend | NestJS ^10 | Same as athma-ce, mature TypeScript framework |
| ORM | Prisma ^6 | Same as athma-ce, type-safe database access |
| Database | PostgreSQL 16 | Proven, handles JSONB well, single-server deployment |
| Frontend | Next.js 14 (App Router) | Same as athma-ce, React-based SSR framework |
| UI | Radix UI + Tailwind CSS | Same as athma-ce, accessible primitives |
| State | Zustand + React Query v5 | Same as athma-ce, lightweight state management |
| Sync/ETL | n8n | Visual workflow builder, no-code sync management |
| Proxy | Nginx (Alpine) | Lightweight reverse proxy |
| Deployment | Docker Compose v2 | Single-server deployment, no orchestrator needed |

Explicitly **excluded**:
- **Kafka** — no event streaming needed; n8n cron-based sync is sufficient
- **Kubernetes** — single-server deployment; Docker Compose is adequate
- **Elasticsearch** — PostgreSQL indexes handle search at BCP scale
- **Redis** — no caching layer needed initially; can add later if performance requires it

Simplified from athma-ce:
- Single NestJS service (not a monorepo with multiple services)
- Single database (not multiple schema-isolated databases)
- No i18n (not needed for internal edge tool)
- No OpenTelemetry (simplified observability)

## Consequences

- Simple deployment: one `docker compose up -d` command starts everything
- Small team can maintain: familiar NestJS/Next.js patterns from athma-ce
- n8n provides visual workflow management accessible to non-developers
- No message queue means sync is pull-based on cron; acceptable for BCP scale
- No Redis means queries hit PostgreSQL directly; indexes must be well-designed
- Single-server deployment means no horizontal scaling; acceptable for single-hospital edge
