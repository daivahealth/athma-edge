# Developer Onboarding

Getting started with the Athma Edge BCP application.

## Prerequisites

- Node.js 20+
- Docker and Docker Compose v2
- Git
- A code editor (VS Code recommended)

## Quick Start with Docker

```bash
# Clone the repo
git clone <repo-url> athma-edge
cd athma-edge

# Configure environment
cp .env.example .env
# Edit .env if needed (defaults work for local dev)

# Start all services
docker compose up -d

# Run database migrations
docker compose exec bcp-api npx prisma migrate deploy

# Seed initial data (roles + admin user)
docker compose exec bcp-api npx prisma db seed

# Verify
curl http://localhost/api/health
```

## Local Development (without Docker for API/UI)

Start infrastructure only:

```bash
docker compose up -d postgres n8n
```

### Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

Backend runs at http://localhost:3100

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at http://localhost:3000

## Default Login

| Field | Value |
|-------|-------|
| Username | admin |
| Password | Whatever you set as `ADMIN_BOOTSTRAP_PASSWORD` before seeding, or the one-time random password the seed prints |
| Role | ADMIN |

There is no default password. The seed shows a generated one once and does not keep it; if you lose it, re-seed a fresh database.

Change the admin password after first login.

## Service URLs (Local Development)

| Service | URL |
|---------|-----|
| BCP UI | http://localhost:3000 |
| BCP API | http://localhost:3100/api |
| BCP API | http://localhost/api |
| n8n | http://localhost:5678 |
| Prisma Studio | Run `npx prisma studio` in backend/ |

## Project Structure Overview

```
athma-edge/
├── backend/          # NestJS API (single service)
│   ├── prisma/       # Schema, migrations, seed
│   └── src/          # Application source
├── frontend/         # React + Vite SPA
│   └── src/          # Application source
├── docs/             # Documentation
├── nginx/            # Sample config for an optional external proxy
├── n8n/              # Workflow templates
└── init-scripts/     # PostgreSQL init
```

See [Coding Patterns](CODING-PATTERNS.md) for architecture conventions.
