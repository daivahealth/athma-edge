# Development Commands

CLI reference for all development tasks.

## Backend

```bash
cd backend

# Install dependencies
npm install

# Start dev server (watch mode)
npm run start:dev

# Build for production
npm run build

# Start production server
npm run start:prod

# Lint
npm run lint

# Run tests
npm run test
```

## Prisma

```bash
cd backend

# Generate Prisma client (after schema changes)
npx prisma generate

# Create a new migration
npx prisma migrate dev --name <migration-name>

# Apply migrations (production)
npx prisma migrate deploy

# Seed the database
npx prisma db seed

# Open Prisma Studio (visual DB browser)
npx prisma studio

# Reset database (destructive)
npx prisma migrate reset
```

## Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Lint
npm run lint
```

## Docker Compose

```bash
# Start all services
docker compose up -d

# Stop all services
docker compose down

# View logs
docker compose logs -f                  # All services
docker compose logs -f bcp-api          # Specific service
docker compose logs -f postgres

# Execute commands in containers
docker compose exec bcp-api npx prisma migrate deploy
docker compose exec bcp-api npx prisma db seed
docker compose exec postgres psql -U bcp_user -d bcp_db

# Rebuild after code changes
docker compose up -d --build bcp-api
docker compose up -d --build bcp-ui

# Full restart
docker compose down && docker compose up -d
```

## Database

```bash
# Connect to PostgreSQL directly
docker compose exec postgres psql -U bcp_user -d bcp_db

# Useful SQL queries
SELECT count(*) FROM bcp_active_patient WHERE is_active = true;
SELECT * FROM bcp_sync_status ORDER BY updated_at DESC;
SELECT * FROM bcp_audit_log ORDER BY event_timestamp DESC LIMIT 20;
```
