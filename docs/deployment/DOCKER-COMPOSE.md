# Docker Compose

Service topology for the Athma Edge BCP application.

## Services

| Service | Image | Internal Port | Exposed Port | Purpose |
|---------|-------|--------------|-------------|---------|
| postgres | postgres:16-alpine | 5432 | 127.0.0.1:5432 | Database |
| bcp-api | Build from ./backend | 3100 | — | NestJS API |
| n8n | n8nio/n8n:latest | 5678 | 127.0.0.1:5678 | Sync/ETL workflows |
| nginx | nginx:alpine | 80 | 80 | Reverse proxy |

## Network

All services on `bcp-network` (bridge driver).

## Volumes

| Volume | Type | Purpose |
|--------|------|---------|
| postgres_data | Named | PostgreSQL data persistence |
| n8n_data | Named | n8n workflow and credential storage |
| ./local-bcp-storage/pdfs/ | Bind mount | PDF document storage (shared by bcp-api and n8n) |
| ./init-scripts/ | Bind mount | PostgreSQL initialization scripts |
| ./nginx/default.conf | Bind mount | Nginx configuration |

## Dependencies

```
postgres (healthcheck) ← bcp-api ← nginx (also serves the SPA)
postgres ← n8n
```

## Init Scripts

Mounted to `/docker-entrypoint-initdb.d/` on the postgres container:

1. `001-create-databases.sql` — creates `bcp_db` and `n8n_db`

## Health Checks

- **postgres**: `pg_isready -U bcp_user -d bcp_db` every 10s
- **bcp-api**: depends on postgres health
- **nginx**: depends on bcp-api. Built from `nginx/Dockerfile`, which compiles the frontend and bakes `dist/` into the image — there is no separate UI container

## Environment Variables

See `.env.example` at the project root. Key variables:

- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- `DATABASE_URL` (for Prisma in bcp-api)
- `JWT_SECRET`, `JWT_EXPIRY`, `FRONTEND_ORIGIN`, `ADMIN_BOOTSTRAP_PASSWORD`
- `PDF_STORAGE_PATH`
- `N8N_BASIC_AUTH_USER`, `N8N_BASIC_AUTH_PASSWORD`
- `TZ` — site timezone, defaults to `Asia/Kolkata`. Drives the n8n container clock and
  `GENERIC_TIMEZONE`, which is what n8n cron/schedule triggers are evaluated against.
  See [N8N-WORKFLOWS.md](N8N-WORKFLOWS.md) — leaving it unset makes every scheduled
  sync fire at the wrong local time with no error in the logs.

Security notes:

- The production compose file requires explicit secret values instead of shipping usable defaults.
- Postgres and n8n admin are bound to localhost to reduce external exposure.
- API sessions are cookie-based (`bcp_session`) and require `FRONTEND_ORIGIN` to be set correctly for browser access.
