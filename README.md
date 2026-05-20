# Athma Edge — Hospital BCP Application

Local clinical continuity layer for hospitals. When the main cloud HIS/EMR becomes unreachable, clinical staff use Athma Edge to access active patient data, record clinical notes, and register walk-in patients.

## What This IS

- Local cache of active patient data synced from the source HIS
- BCP Clinical Notes — append-only clinical documentation during outages (orders, medications, assessments, handover notes, etc.)
- BCP Temporary Patient Registration — walk-in patients who don't exist in the synced data
- Business Continuity Plan (BCP) tool for network outages
- Synced from source HIS via n8n workflows
- Deployed on a hospital edge box via Docker Compose

## What This is NOT

- Not a Disaster Recovery system
- Not a full EMR/HIS replacement
- No structured order entry, medication prescribing, or billing — clinical notes are free-text documentation only
- Not a reconciliation engine — local notes and temp patients are for manual reconciliation when the HIS recovers
- Not designed for internet-facing deployment

## Architecture

```
┌─────────────┐     n8n sync      ┌──────────────┐
│  Source HIS  │ ──────────────>   │  PostgreSQL   │
│  (Cloud)     │    (30s-10min)    │  (Local Edge) │
└─────────────┘                    └──────┬───────┘
                                          │
                              ┌───────────┼───────────┐
                              │     NestJS API        │
                              │     (Port 3100)       │
                              └───────────┬───────────┘
                                          │
                              ┌───────────┼───────────┐
                              │    Next.js Frontend   │
                              │     (Port 3000)       │
                              └───────────┬───────────┘
                                          │
                              ┌───────────┼───────────┐
                              │       Nginx           │
                              │     (Port 80)         │
                              └───────────────────────┘
```

**Services**: PostgreSQL 16, NestJS API, Next.js 14 UI, n8n (sync/ETL), Nginx (reverse proxy)

## Prerequisites

- Docker and Docker Compose v2
- (For local dev without Docker) Node.js 20+, PostgreSQL 16

## Quick Start

```bash
# 1. Clone and configure
cp .env.example .env
# Edit .env with your settings (especially JWT_SECRET)

# 2. Start all services
docker compose up -d

# 3. Run database migrations
docker compose exec bcp-api npx prisma migrate deploy

# 4. Seed default data (roles + admin user)
docker compose exec bcp-api npx prisma db seed

# 5. Access the application
# UI:  http://localhost
# API: http://localhost/api/health
# n8n: http://localhost:5678
```

## Default Credentials

| Service | Username | Password |
|---------|----------|----------|
| BCP App | admin | BcpAdmin@2024 |
| n8n | admin | n8nAdmin@2024 |

**Change these immediately in production.**

## Roles

| Role | Access |
|------|--------|
| DOCTOR | Patient search, clinical profiles, PDF documents, clinical notes, temp patient registration |
| NURSE | Patient search, clinical profiles, PDF documents, clinical notes, temp patient registration |
| ADMIN | All of above + user management, sync status, audit log |

## Care Settings

| Setting | Rollover Rule |
|---------|---------------|
| INPATIENT | Stays active until discharge |
| OUTPATIENT | Marked inactive at midnight (daily rollover) |
| DAYCARE | Marked inactive at midnight |
| EMERGENCY | Marked inactive at midnight |

## Sync Frequencies

| Workflow | Interval | Description |
|----------|----------|-------------|
| Active Patient | 60s | Upserts patient demographics and visit data |
| Clinical Profile | 2 min | Syncs vitals, meds, investigations for active patients |
| PDF Documents | 10 min | Downloads new/changed PDFs with checksum dedup |
| Daily Rollover | Midnight | OP/DC/ER soft-deactivation, IP date rollover |

## n8n Workflow Import

1. Open n8n at http://localhost:5678
2. Go to Workflows > Import from File
3. Import each JSON from `n8n/workflows/`
4. Configure database credentials for your source HIS and the BCP database
5. Activate the workflows

## Development (Without Docker)

```bash
# Backend
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run start:dev

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

Backend runs on http://localhost:3100, frontend on http://localhost:3000.

## Project Structure

```
athma-edge/
├── CLAUDE.md / AGENTS.md    # AI agent operating contracts
├── docs/                     # Full documentation tree
├── backend/                  # NestJS API + Prisma
├── frontend/                 # Next.js 14 UI
├── nginx/                    # Reverse proxy config
├── n8n/workflows/            # Sync workflow templates
├── init-scripts/             # PostgreSQL init scripts
└── docker-compose.yml        # Service orchestration
```

See [docs/README.md](docs/README.md) for complete documentation navigation.
