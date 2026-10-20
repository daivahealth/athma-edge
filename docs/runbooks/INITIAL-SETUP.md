# Initial Setup

First-time deployment checklist for the Athma Edge BCP application.

## Prerequisites

- Server sized for the hospital — see [Hardware Requirements](../deployment/DEPLOYMENT-GUIDE.md#hardware-requirements) for figures by bed count. 8 vCPU, 16 GB RAM and a 1 TB SSD is the floor, for a hospital under 200 beds
- Docker Engine 24+
- Docker Compose v2
- Network access from the edge server to the source HIS (for n8n sync) — see [Network](../deployment/DEPLOYMENT-GUIDE.md#network), the transport is not yet settled
- Network access from clinical workstations (for UI access)

## Deployment Steps

### 1. Prepare the Server

```bash
# Clone the repository
git clone <repo-url> /opt/athma-edge
cd /opt/athma-edge

# Create local storage directory for PDFs
mkdir -p local-bcp-storage/pdfs
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and set:

| Variable | Action |
|----------|--------|
| `POSTGRES_PASSWORD` | Set a strong password |
| `JWT_SECRET` | Set a random 32+ character string |
| `DEFAULT_TENANT_ID` | Set to your hospital's tenant ID |
| `ATHMA_CE_API_URL` | Set to your cloud HIS API URL |
| `ATHMA_CE_API_KEY` | Set to your HIS API key |
| `N8N_BASIC_AUTH_PASSWORD` | Set a strong password for n8n admin |

### 3. Start Services

```bash
docker compose up -d
```

Wait for postgres to be healthy:

```bash
docker compose ps
# postgres should show "healthy"
```

### 4. Initialize Database

```bash
# Run Prisma migrations
docker compose exec bcp-api npx prisma migrate deploy

# Seed roles and bootstrap admin user
docker compose exec bcp-api npx prisma db seed
```

### 5. Verify Services

```bash
# Health check
curl http://localhost/api/health

# Check all containers are running
docker compose ps
```

### 6. First Login

1. Open http://localhost in a browser
2. Login with username `admin`
3. Use the bootstrap password you explicitly set via `ADMIN_BOOTSTRAP_PASSWORD`, or the one-time generated password printed by the seed command
4. Change the admin password immediately

Important:

- There is no longer a hard-coded default admin password.
- Do not leave `JWT_SECRET`, `POSTGRES_PASSWORD`, or `N8N_BASIC_AUTH_PASSWORD` at placeholder values.
- API sessions are now stored in an HttpOnly cookie instead of browser localStorage.

### 7. Configure n8n Workflows

1. Open http://localhost:5678
2. Login with n8n credentials from `.env`
3. Import workflow templates from `n8n/workflows/`
4. Configure source HIS API credentials in n8n's credential store
5. Activate all 4 workflows
6. Verify sync status in the admin dashboard

### 8. Create Clinical Users

1. Login to BCP UI as admin
2. Navigate to User Management
3. Create user accounts for doctors and nurses
4. Assign appropriate roles (DOCTOR, NURSE)

## Post-Setup Verification

- [ ] All 5 Docker services running and healthy
- [ ] Admin can login to BCP UI
- [ ] Patient search page loads (may be empty until first sync)
- [ ] Sync status page shows all components
- [ ] n8n workflows are active and executing
- [ ] First sync completes successfully
- [ ] Clinical users can login and search patients
- [ ] PDF documents accessible after document sync runs
