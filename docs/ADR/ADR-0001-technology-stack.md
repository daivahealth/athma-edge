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
| Frontend | React 18 + Vite (React Router) | SPA served by the API as static files — see the 2026-10-21 amendments |
| UI | Radix UI + Tailwind CSS | Same as athma-ce, accessible primitives |
| State | Zustand + React Query v5 | Same as athma-ce, lightweight state management |
| Sync/ETL | n8n | Visual workflow builder, no-code sync management |
| Proxy | None in the stack | Optional, and the hospital's own — see the second 2026-10-21 amendment |
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
- Small team can maintain: familiar NestJS patterns from athma-ce
- n8n provides visual workflow management accessible to non-developers
- No message queue means sync is pull-based on cron; acceptable for BCP scale
- No Redis means queries hit PostgreSQL directly; indexes must be well-designed
- Single-server deployment means no horizontal scaling; acceptable for single-hospital edge

## Amendment, 2026-10-21: frontend moved from Next.js to Vite

Next.js was chosen for consistency with athma-ce, which was a sound reason. **This amendment accepts losing that consistency**, because the app never used the part of Next.js that justified it.

What the audit found before the change: all 10 pages were `'use client'`, there was no middleware, no route handlers, no server actions, no `next/headers` or `next/server`, and no `generateMetadata` beyond a static title. The only server-side behaviour was a `rewrites()` rule proxying `/api/*`, which nginx already does in production. It was a client-side React SPA being served by a Node process.

The deciding argument is the deployment, not the code. The edge server exists to keep working when other things fail, and a Next.js standalone server is a second Node runtime, a fifth container and a restart-on-boot dependency — all to hand out a bundle nginx can serve from disk. Removing it takes the stack from five containers to four.

The migration was cheap for the same reason it was worth doing: with no server components to unwind, it was a router swap and an import rewrite.

| | Before | After |
|---|--------|-------|
| Framework | Next.js 15 (App Router) | React 18 + Vite 5 + React Router 6 |
| Served by | Node process in the `bcp-ui` container | nginx, as static files |
| Containers | 5 | 4 |
| Fonts | `next/font` (self-hosted at build) | `@fontsource/inter` (self-hosted) — **both avoid a runtime call to Google Fonts, which an air-gapped edge box could not make** |

Unchanged: React, Radix UI, Tailwind, Zustand, React Query, axios, and the backend in full.

**The cost:** athma-ce remains on Next.js, so the two frontends no longer share a framework. A developer moving between them meets two routing models. That was judged acceptable given the deployment benefit and how little Next.js was actually being used here, but it is a real cost and should be revisited if the product family standardises again.

## Second amendment, 2026-10-21: no reverse proxy in the stack

The first amendment left nginx serving the SPA. It is now gone too, and the API serves the bundle itself. **Three containers: postgres, bcp-api, n8n.**

The reasoning is not the one that removed Next.js. nginx was cheap — 10 MB resident, no second language runtime — and it did real work: static serving, `/api` routing, cache headers, security headers, and a place to terminate TLS. On resource grounds alone it earned its keep.

The argument that carried is about **where a responsibility belongs**. TLS is the one thing nginx did that the application cannot: certificates, renewal and redirection. A hospital already has infrastructure and a process for that, and duplicating it inside the stack means another certificate to expire unnoticed on a box nobody logs into between outages. Once TLS moves out, the rest of nginx's job is work the application can do directly on one origin — and a request no longer crosses a process boundary before reaching the code that answers it.

So the deployment contract is now explicit: **Athma Edge speaks HTTP on one port and does nothing else.** A hospital that wants TLS, a shared hostname or uniform network policy puts its own proxy in front, which it was likely to do regardless. `nginx/example.conf` is a starting point; it is not part of the stack.

### What moved into the application

| Previously nginx | Now |
|---|---|
| Static SPA + `try_files` fallback | Express static + a non-`/api/` GET fallback to `index.html` |
| `/assets/` immutable 1y, `index.html` no-store | Same, set in `main.ts` |
| `X-Frame-Options: DENY`, `Permissions-Policy` | helmet, with `frameguard: deny` and an explicit `Permissions-Policy` — helmet's defaults were weaker |
| `X-Powered-By` suppression | helmet |
| TLS termination | **Out of scope. The hospital's proxy.** |

### The cost

- **No TLS without extra infrastructure.** On a flat hospital LAN that may be accepted; it is now a deliberate decision rather than a default, and it has to be made per deployment.
- Static files are served by Node rather than nginx. At the peak this box is sized for — a whole hospital loading the bundle at once — that shares an event loop with API handling. Hashed assets are cached for a year, so it is a first-load cost, but it is a real one.
- If the application process is down, nothing answers at all. Previously nginx could still return a page.
