# Deployment Guide — Windows & Linux

Step-by-step instructions for deploying Athma Edge on a hospital edge server running Windows or Linux.

## Hardware Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 2 cores | 4 cores |
| RAM | 4 GB | 8 GB |
| Storage | 50 GB | 100 GB+ (depends on PDF volume) |
| Network | LAN access to clinical workstations | + access to source HIS API for n8n sync |

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

### Create Clinical Users

1. Navigate to **User Management** (admin only)
2. Create accounts for doctors and nurses
3. Assign roles: DOCTOR, NURSE, or ADMIN

### Configure n8n Sync Workflows

1. Open `http://<server-ip>:5678` (n8n is bound to localhost — access from the server itself, or set up SSH tunneling)
2. Login with n8n credentials from `.env`
3. Import workflow templates from `n8n/workflows/`
4. Configure source HIS API credentials
5. Activate all 4 workflows
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
# Stop the conflicting service, or change the nginx port in docker-compose.yml
```

**Windows:**
```powershell
netstat -ano | findstr :80
# Stop IIS: iisreset /stop
# Or change the nginx port in docker-compose.yml
```

To use a different port, edit `docker-compose.yml`:
```yaml
nginx:
  ports:
    - '8080:80'   # Access via http://<server-ip>:8080
```

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
