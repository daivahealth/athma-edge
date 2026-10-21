# Deployment Guide — Windows & Linux

Step-by-step instructions for deploying Athma Edge on a hospital edge server running Windows or Linux.

## Hardware Requirements

**Size for the outage, not for the quiet day.** On a normal day the edge server does almost nothing — it syncs in the background and a handful of people look at it. During a BCP event it carries the clinical read load of the entire hospital, the load the HIS normally handles. That hour is what the box must survive, so every figure below is a peak-load figure.

All three containers (PostgreSQL, the API — which also serves the SPA — and n8n) share one host, and `docker-compose.yml` sets no per-container resource limits, so they compete for whatever the box has.

### By hospital size

| Hospital | Beds | Active patient records on a typical day | Peak concurrent users | vCPU | RAM | Storage |
|----------|------|------------------------------------------|----------------------|------|-----|---------|
| Small | < 200 | ~600 | 20–40 | 8 | 16 GB | 1 TB SSD / flash |
| Medium | 200–500 | ~1,500 | 40–90 | 16 | 32 GB | 1 TB SSD / flash |
| Large | 500–1,000+ | 3,000+ | 120+ | 16 | 64 GB | 1 TB SSD / flash |

A Docker-capable host, physically sited in the hospital. **Storage must be SSD or flash, never spinning disk** — PostgreSQL and PDF serving are both random-read workloads, and they are hit hardest at exactly the moment the hospital is relying on them.

1 TB across all three tiers is deliberate: it keeps procurement simple, and with no PDF retention policy in place (below) the smaller sites catch up with the larger ones eventually anyway.

### Operating system

**Linux is preferred.** Windows is supported and fully documented below. The hardware figures are the same either way.

| | Linux | Windows |
|---|---|---|
| Versions | Ubuntu 22.04 LTS, Debian 12, or an RHEL-family equivalent | Windows Server 2019/2022, or Windows 10/11 Pro |
| Runtime | Docker Engine 24+ with Compose v2 | Docker Desktop 4.25+ with the WSL 2 backend |
| Starts without anyone logged in | Yes, via systemd | **Not by default** — see below |
| Effective RAM | As provisioned | WSL 2 takes its own share; add headroom or cap it in `.wslconfig` |

**The deciding reason is unattended restart.** A Linux host brings the whole stack back on boot through systemd, with nobody logged in. Docker Desktop on Windows starts at *user sign-in* — so a server that reboots overnight stays down until someone signs in, and nobody finds out until the HIS fails and staff turn to a system that is not running. Being there unattended is the one thing a continuity system cannot get wrong.

Linux also avoids the WSL 2 layer between the containers and the disk, and the Docker Desktop licensing question.

Choose Windows when the hospital's IT can only support Windows — a legitimate reason — and then handle these two things:

- **Docker Desktop auto-start is tied to user sign-in.** If the server reboots overnight and nobody logs in, Athma Edge does not come back up, and nobody finds out until the HIS fails. Run Docker Desktop as a service, or configure the host to log in automatically and lock, or set a scheduled task at startup. Whichever you pick, **test it: reboot the server and confirm the stack returns with no one signed in.**
- **Docker Desktop licensing.** It requires a paid subscription for commercial use in larger organisations. Most hospitals meet that threshold. Confirm before standardising on it, or use Linux.

### What actually drives each figure

| Resource | Driven by | Not driven by |
|----------|-----------|---------------|
| CPU and RAM | Peak concurrent clinicians reading, which tracks staff on shift | Bed count directly, or database size |
| Storage | **Synced PDFs**, which dominate everything else | Patient or note records, which are negligible by comparison |

Rough per-record sizes, for your own estimate:

| Data | Size | Behaviour |
|------|------|-----------|
| Patient record | ~1 KB | Upserted in place; does not grow with time |
| Clinical profile | 5–20 KB | Upserted in place; does not grow with time |
| BCP clinical note | ≤ 5 KB | Created during outages only |
| Audit log row | ~0.5 KB | **Append-only, never deleted** — grows continuously |
| Synced PDF | 100 KB – 2 MB, average ~250 KB | **Accumulates** — the dominant cost |

Forecasting when 1 TB runs out:

```
new PDFs per day x average PDF size x 365  =  growth per year
```

**Worked example, 400 beds:** roughly 1,000 new documents a day at ~250 KB is 250 MB/day, about 90 GB a year. Against 1 TB that is comfortable for several years — but it is a straight line with nothing bending it down, so the question is when, not whether. A 1,000-bed site at ~600 MB/day reaches 1 TB in about four years.

Measure your own rate after the first month rather than trusting this figure: `du -sh` on the PDF volume, twice, a week apart.

### Two things that make storage grow without bound

Both are gaps, not settings. Plan around them until they are addressed.

- **There is no PDF retention or archival policy.** Documents are synced for active patients and are never removed when those patients go inactive. Disk use only ever rises. [Daily Operations](../runbooks/DAILY-OPERATIONS.md) says to "archive old PDFs if needed", but nothing defines when, what to, or who does it.
- **The audit log is append-only with no archival.** Every login, search, profile view and download is a row kept forever. At 100 active users this is single-digit GB a year — small beside the PDFs, but it never stops.

Watch `df -h` as part of the daily check, and set an alert at 70% rather than discovering it during an event. 1 TB buys years, not permanence.

### Network

| Requirement | Why |
|-------------|-----|
| LAN reachability from every clinical workstation | Clinicians reach the edge server over the hospital network; it does not depend on the internet |
| Connectivity from the edge server to the source HIS (Athma CE) | n8n syncs from the HIS. **Open which transport**: the workflow templates use Postgres nodes against the HIS database, while the runbooks describe an HTTP API (`ATHMA_CE_API_URL`). Neither is configured yet — open the ports for whichever is chosen |
| The edge server must stay reachable when the HIS link is down | This is the whole point. Do not place it behind the same link, router or firewall path whose failure causes the outage |

That last row is a siting decision, not a spec. An edge server that shares a single point of failure with the HIS connection is not a continuity system.

## Prerequisites

| Prerequisite | Windows | Linux |
|-------------|---------|-------|
| Docker Engine | Docker Desktop 4.25+ | Docker Engine 24+ |
| Docker Compose | Included with Docker Desktop | Docker Compose v2 (included with Docker Engine) |
| Git | Git for Windows | git package |
| Text editor | Notepad++ or VS Code | nano, vim, or VS Code |

---

## Linux Deployment

### 1. Install Docker

**Ubuntu / Debian:**

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sudo sh

# Add your user to the docker group (avoids needing sudo)
sudo usermod -aG docker $USER

# Log out and back in, then verify
docker --version
docker compose version
```

**RHEL / CentOS / Rocky:**

```bash
sudo dnf install -y dnf-plugins-core
sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
```

### 2. Clone and Configure

```bash
# Clone to /opt (or your preferred location)
sudo mkdir -p /opt/athma-edge
sudo chown $USER:$USER /opt/athma-edge
git clone <repo-url> /opt/athma-edge
cd /opt/athma-edge

# Create PDF storage directory
mkdir -p local-bcp-storage/pdfs

# Copy and edit environment file
cp .env.example .env
nano .env
```

Set the following in `.env` (replace all `REPLACE_*` values):

| Variable | What to set |
|----------|------------|
| `POSTGRES_PASSWORD` | Strong random password (16+ chars) |
| `JWT_SECRET` | Random string, at least 32 characters |
| `DEFAULT_TENANT_ID` | Your hospital's tenant identifier |
| `N8N_PASSWORD` | Strong password for n8n admin UI |
| `ADMIN_BOOTSTRAP_PASSWORD` | Initial admin password (optional — if omitted, seed prints a one-time random password) |
| `FRONTEND_ORIGIN` | URL users will access (e.g., `http://192.168.1.100` or `http://bcp.hospital.local`) |

Generate strong passwords:

```bash
# Generate a random 32-char string for JWT_SECRET
openssl rand -base64 32

# Generate a random 20-char password
openssl rand -base64 20
```

### 3. Start Services

```bash
cd /opt/athma-edge
docker compose up -d
```

Watch the build progress (first time takes 3-5 minutes):

```bash
docker compose logs -f
# Press Ctrl+C to stop following logs
```

Wait for postgres to be healthy:

```bash
docker compose ps
# postgres should show "healthy" in the STATUS column
```

### 4. Initialize Database

```bash
# Run migrations
docker compose exec bcp-api npx prisma migrate deploy

# Seed roles and admin user
docker compose exec bcp-api npx prisma db seed
```

If you did not set `ADMIN_BOOTSTRAP_PASSWORD`, the seed command will print a one-time password. **Save it immediately.**

### 5. Verify

```bash
# Health check
curl http://localhost/api/health

# All containers should be running
docker compose ps
```

Open `http://<server-ip>` in a browser from a clinical workstation.

### 6. Enable Auto-Start on Boot

```bash
# Docker is typically enabled by default, but verify:
sudo systemctl enable docker

# Docker Compose services will restart automatically (restart: unless-stopped)
```

### 7. Firewall (if applicable)

```bash
# Allow HTTP access from LAN
sudo ufw allow 80/tcp

# Keep n8n and postgres on localhost only (they're already bound to 127.0.0.1 in docker-compose.yml)
```

---

## Windows Deployment

### 1. Install Docker Desktop

1. Download Docker Desktop from https://docs.docker.com/desktop/install/windows-install/
2. Run the installer — enable **WSL 2** backend when prompted
3. Restart the computer when prompted
4. Launch Docker Desktop and wait for it to start (system tray icon turns green)
5. Open PowerShell and verify:

```powershell
docker --version
docker compose version
```

If WSL 2 is not installed, Docker Desktop will prompt you. Follow the instructions to install the WSL 2 kernel update from Microsoft.

### 2. Install Git

Download and install Git for Windows from https://git-scm.com/download/win. Use default settings.

### 3. Clone and Configure

Open PowerShell (or Git Bash):

```powershell
# Clone the repository
cd C:\
git clone <repo-url> athma-edge
cd C:\athma-edge

# Create PDF storage directory
mkdir -p local-bcp-storage\pdfs

# Copy environment file
copy .env.example .env
```

Open `.env` in Notepad or VS Code and set the same variables as listed in the Linux section above.

Generate strong passwords in PowerShell:

```powershell
# Generate a random 32-char string for JWT_SECRET
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])

# Or use Git Bash:
openssl rand -base64 32
```

### 4. Start Services

```powershell
cd C:\athma-edge
docker compose up -d
```

First build takes 3-5 minutes. Monitor progress:

```powershell
docker compose logs -f
# Press Ctrl+C to stop following
```

Wait for postgres to report healthy:

```powershell
docker compose ps
```

### 5. Initialize Database

```powershell
docker compose exec bcp-api npx prisma migrate deploy
docker compose exec bcp-api npx prisma db seed
```

Save the admin password printed by the seed command if you did not set `ADMIN_BOOTSTRAP_PASSWORD`.

### 6. Verify

```powershell
# Health check
curl http://localhost/api/health

# Or open in browser:
start http://localhost/api/health
```

Open `http://localhost` in a browser to access the BCP UI.

### 7. Enable Auto-Start on Boot

1. Open Docker Desktop **Settings** > **General**
2. Enable **Start Docker Desktop when you sign in**
3. Docker Compose services will restart automatically (configured with `restart: unless-stopped`)

> **This is not sufficient on its own.** "When you sign in" means exactly that: after an unattended reboot, with no one logged in, Docker Desktop does not start and neither does Athma Edge. For a continuity system that is the failure that matters — the box is down and nobody knows until the HIS goes out.
>
> Pick one and verify it: run Docker Desktop as a Windows service, enable automatic sign-in for a dedicated local account with a locked screen, or create a Task Scheduler task triggered **At startup** rather than at logon.
>
> **Then test it properly: reboot the server, do not log in, and confirm from another machine that the Athma Edge URL answers.** Add this to the quarterly drill.

### 8. Firewall

Windows Defender Firewall may block external access. To allow LAN access:

1. Open **Windows Defender Firewall** > **Advanced Settings**
2. Create a new **Inbound Rule**:
   - Type: Port
   - Protocol: TCP
   - Port: 80
   - Action: Allow
   - Profile: Domain, Private (not Public)
   - Name: "Athma Edge BCP"

---

## Post-Deployment Steps (Both Platforms)

### First Login

1. Open `http://<server-ip>` from a clinical workstation
2. Login with username `admin` and the bootstrap password
3. Change the admin password immediately via User Management

### Serve it over HTTPS (optional)

Athma Edge speaks HTTP. If the hospital wants TLS, put a proxy in front and
terminate it there — see [Adding TLS](REVERSE-PROXY.md#adding-tls) for the
certificate choice, the three settings involved, how to verify the session
cookie is actually marked `Secure`, and why renewal needs an owner before
you finish.

### Create Clinical Users

1. Navigate to **User Management** (admin only)
2. Create accounts for doctors and nurses
3. Assign roles: DOCTOR, NURSE, or ADMIN

### Configure n8n Sync Workflows

1. Open `http://<server-ip>:5678` (n8n is bound to localhost — access from the server itself, or set up SSH tunneling)
2. Login with n8n credentials from `.env`
3. Import workflow templates from `n8n/workflows/`
4. Configure the source HIS credentials in n8n (database or API — see the note under Network above)
5. Activate workflows 01-04. Leave 05 (reconciliation) inactive — it is run manually after stand-down
6. Verify sync on the admin **Sync Status** page

### Verification Checklist

- [ ] All 5 Docker containers running (`docker compose ps`)
- [ ] `http://<server-ip>/api/health` returns 200
- [ ] Admin can login to BCP UI
- [ ] BCP LOCAL MODE banner visible
- [ ] Patient search page loads
- [ ] Clinical users can login and search patients
- [ ] BCP Clinical Notes can be created
- [ ] Walk-in patients can be registered via "Add Patient"
- [ ] n8n workflows active and syncing
- [ ] Sync status dashboard shows recent sync times

---

## Updating Athma Edge

When a new version is released:

```bash
cd /opt/athma-edge    # Linux
cd C:\athma-edge      # Windows

# Pull latest code
git pull origin main

# Rebuild and restart
docker compose down
docker compose up -d --build

# Run any new migrations
docker compose exec bcp-api npx prisma migrate deploy
```

---

## Troubleshooting

### Containers fail to start

```bash
# Check logs for the failing service
docker compose logs bcp-api
docker compose logs postgres
```

Common issues:
- **postgres**: `POSTGRES_PASSWORD must be set` — edit `.env` and set a password
- **bcp-api**: `JWT_SECRET must be set` — edit `.env` and set a JWT secret
- **bcp-api**: Database connection refused — wait for postgres to be healthy first

### Port 80 already in use

Another service (IIS on Windows, Apache on Linux) may be using port 80.

**Linux:**
```bash
sudo lsof -i :80
```

**Windows:**
```powershell
netstat -ano | findstr :80
# Stop IIS: iisreset /stop
```

Either stop the conflicting service, or move Athma Edge to another port — no
file edit needed, set `HTTP_PORT` in `.env`:

```
HTTP_PORT=8080      # then reach it at http://<server-ip>:8080
```

Then `docker compose up -d`. If you change this, set `FRONTEND_ORIGIN` to match.

### WSL 2 issues on Windows

If Docker Desktop shows WSL 2 errors:

1. Open PowerShell as Administrator
2. Run `wsl --update`
3. Restart Docker Desktop

### n8n not accessible remotely

n8n is bound to `127.0.0.1:5678` for security. To access from another machine, use SSH tunneling:

```bash
ssh -L 5678:localhost:5678 user@edge-server
# Then open http://localhost:5678 on your local machine
```

### Database reset (development only)

```bash
docker compose down -v    # WARNING: destroys all data
docker compose up -d
docker compose exec bcp-api npx prisma migrate deploy
docker compose exec bcp-api npx prisma db seed
```
