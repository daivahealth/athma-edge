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

# Start dev server (Vite on :3000, proxies /api to localhost:3100)
npm run dev

# Typecheck, then build static files into dist/
npm run build

# Serve the built dist/ locally, to check it as nginx will
npm run preview

# Typecheck only
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
docker compose up -d --build nginx   # rebuilds the SPA and the proxy

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

## Agent Security Assessment Goal

Preserved documentation-only `/goal` prompt for repository-wide VAPT/security remediation runs. This prompt is stored here as project documentation and is not itself an instruction to execute automatically.

```text
/goal

Project: athma-edge

Objective:
Perform a complete VAPT/security assessment of this repository, fix all identified issues, validate the fixes, and push the corrected code to GitHub.

Execution Requirements:
- Work autonomously and continue until the security scan results are clean.
- Do not stop after only reporting issues.
- Fix issues iteratively, re-test, and continue until resolved.
- Preserve all existing business functionality.

Git Workflow:
- Pull latest code from main.
- Create and work on branch:
  security/vapt-fixes
- Commit changes in logical commits using:
  security: fix <short description>
- Push branch to GitHub.
- Create a PR if branch protection exists.

Security/VAPT Scope:
Run and review all applicable scans and checks including:

1. Dependency & Package Security
- npm audit / pnpm audit / yarn audit
- outdated vulnerable dependencies
- GitHub security alerts if accessible
- lockfile inconsistencies

2. Secret & Credential Scanning
- API keys
- tokens
- passwords
- certificates
- .env exposure
- AWS/Azure/GCP credentials
- SSH/private keys

3. Application Security Review
- SQL injection
- NoSQL injection
- command injection
- SSRF
- XSS
- CSRF
- path traversal
- insecure deserialization
- insecure file upload/download
- open redirects
- insecure JWT/session handling
- broken authentication
- broken authorization
- IDOR vulnerabilities
- privilege escalation
- insecure direct object access
- missing tenant isolation
- weak password handling
- insecure cryptography
- missing rate limiting
- insecure logging
- PHI/PII exposure risks
- hardcoded configs/secrets
- unsafe debug endpoints

4. Backend/API Security
- insecure CORS configuration
- missing security headers
- unsafe HTTP methods
- validation gaps
- DTO/schema validation gaps
- improper exception leakage
- verbose stack traces
- authentication bypass risks

5. Infrastructure & DevOps Security
- Dockerfile hardening
- container vulnerabilities
- exposed ports/services
- unsafe compose configs
- insecure nginx configs
- unsafe environment variable usage
- privilege escalation risks
- CI/CD secret exposure

6. Database Security
- unsafe raw SQL
- missing parameterization
- excessive DB permissions
- missing indexes causing DoS risks
- unsafe migration scripts

7. Healthcare/Data Privacy Review
- identify possible PHI leakage risks
- ensure sensitive data is not logged
- verify audit/security-sensitive operations
- validate tenant isolation where applicable

Fixing Rules:
- Fix all HIGH and CRITICAL vulnerabilities completely.
- Fix MEDIUM vulnerabilities wherever practical.
- Do not suppress warnings unless absolutely necessary.
- Do not introduce breaking changes.
- Refactor insecure implementations if required.
- Add validation and sanitization where missing.
- Add/update automated tests where possible.

Validation Cycle:
After fixes:
- install dependencies
- run lint
- run tests
- run build
- rerun all security scans
- confirm vulnerabilities are resolved

Continue the scan → fix → validate cycle until:
- no CRITICAL issues remain
- no HIGH issues remain
- remaining MEDIUM/LOW findings are documented

GitHub Issue Rules:
- Do NOT create public GitHub issues for exploitable security vulnerabilities.
- Only create GitHub issues for:
  - non-sensitive technical debt
  - dependency upgrade tracking
  - deferred low-risk items

Final Deliverables:
Provide:
1. Security findings summary
2. Fixes implemented
3. Remaining risks
4. Commands/tools executed
5. Files modified
6. Branch name
7. Commit hashes
8. PR link if created
9. Final validation results confirming:
   - build passed
   - tests passed
   - security scans passed
```
