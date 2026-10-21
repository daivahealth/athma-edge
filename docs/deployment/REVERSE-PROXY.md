# Reverse Proxy (optional)

**Athma Edge does not use a reverse proxy.** The `bcp-api` service serves the
SPA and the API on one origin, published on port 80 by `docker compose up -d`.

## When to add one

Only when the hospital needs something the application deliberately does not do:

| Need | Why it belongs to the hospital |
|------|-------------------------------|
| **TLS** | The application speaks HTTP. Certificates, renewal and redirection are already solved by hospital infrastructure, and duplicating that inside the stack means another thing to expire unnoticed |
| **Shared hostname** | Serving Athma Edge under a path beside other services |
| **Uniform network policy** | IP allow-lists, client certificates, central request logging |

## What the application already handles

Do not reimplement these in the proxy; it only has to pass requests through.

- Routing `/api/*` versus client-side routes, including the `index.html` fallback
- Cache headers — hashed assets immutable for a year, `index.html` never cached
- Security headers — `X-Frame-Options: DENY`, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy`, and `X-Powered-By` suppression
- Login rate limiting

## If you do front it

- Set `FRONTEND_ORIGIN` to the externally visible origin, so CORS and cookie
  behaviour stay correct
- Preserve `X-Forwarded-For` — **the audit log records the client IP from it**,
  and that log is the record of who reached patient data during an outage
- Preserve `X-Forwarded-Proto`, so the session cookie is marked secure over TLS
- `HTTP_PORT` in `.env` changes which host port the stack publishes, if you do
  not want it on 80

`nginx/example.conf` is a working starting point. It is not mounted, not built
and not tested; adapt it.

---

# Adding TLS

Athma Edge speaks HTTP. To serve it over HTTPS, put a proxy in front and
terminate TLS there. The application needs no code change; it needs three
settings and a certificate.

## 1. Get a certificate

Pick the one that matches the box, not the one that is easiest to type.

| Source | Use when | Watch out for |
|--------|----------|---------------|
| **Hospital internal CA** | The usual answer. Clinical workstations already trust it | Issue for the hostname staff will type, and include it in whatever renewal process the CA already has |
| **Public CA (Let's Encrypt)** | The edge server has a public DNS name and outbound internet | **Usually neither is true.** An edge box is normally LAN-only, and ACME validation will fail. Do not plan on this without checking |
| **Self-signed** | A pilot or a lab | Every browser shows a warning. Staff learn to click through certificate warnings, which is a bad habit to teach in a clinical setting. Treat as temporary |

Use a hostname, not an IP — certificates for IP addresses are awkward and
staff should be typing a name anyway. Make sure it resolves on the hospital
network.

## 2. Move the application off port 80

The proxy needs 80 and 443. In `.env`:

```
HTTP_PORT=3100
```

Then `docker compose up -d`. The application is now on `127.0.0.1:3100` and
only the proxy is exposed.

## 3. Tell the application its public origin

Still in `.env`:

```
FRONTEND_ORIGIN=https://athma-edge.hospital.local
```

This drives CORS. Get it wrong and login fails in a way that looks like a
server error.

## 4. Configure the proxy

`nginx/example.conf` is a starting point: TLS on 443, a redirect from 80, and
a single `location /` passing everything through. Adapt the `server_name`,
the certificate paths and the upstream address.

**The proxy only has to forward requests.** Do not reimplement routing, the
`index.html` fallback, or cache headers — the application does those, and a
second copy will drift.

Three headers matter:

```nginx
proxy_set_header X-Forwarded-Proto $scheme;      # session cookie Secure flag
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;   # audit log client IP
proxy_set_header Host $host;
```

`X-Forwarded-Proto` is the one people forget. The session cookie is marked
`Secure` when the request arrived over HTTPS, and the application reads that
from this header — `trust proxy` is already set. Omit it and the session
cookie is sent without the `Secure` flag on an HTTPS site.

`X-Forwarded-For` is how the audit log records who connected from where. That
log is the record of who reached patient data during an outage; drop the
header and every entry shows the proxy's address.

## 5. Verify

```bash
# Certificate and chain
openssl s_client -connect athma-edge.hospital.local:443 -servername athma-edge.hospital.local </dev/null 2>/dev/null | openssl x509 -noout -dates -subject

# The app answers over TLS
curl -sI https://athma-edge.hospital.local/api/health

# The session cookie is Secure — this is the one that silently regresses
curl -si -X POST https://athma-edge.hospital.local/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"<user>","password":"<password>"}' | grep -i set-cookie
```

The `Set-Cookie` line must contain **`Secure`** and **`HttpOnly`**. If `Secure`
is missing, `X-Forwarded-Proto` is not reaching the application.

Then log in from a clinical workstation and confirm no certificate warning —
on the workstation, not on the server.

## 6. Plan the renewal before you finish

This is where edge deployments fail. The box is unattended between outages,
nobody logs into it for months, and an expired certificate turns the
continuity system into a browser warning on the day it is needed.

- [ ] Renewal is owned by whoever owns the hospital's other certificates, not by this project
- [ ] The expiry date is in the same calendar or monitoring as every other certificate
- [ ] Reloading the proxy after renewal is automated, or written into the runbook
- [ ] Certificate expiry is checked in the quarterly BCP drill, alongside the unattended reboot test

## If you would rather not run TLS

On a closed hospital LAN, plain HTTP between workstations and an in-building
edge server may be an acceptable risk — it is the same network the HIS traffic
crosses. Make it a recorded decision rather than an oversight: note it in the
[Business Continuity Plan](../runbooks/BUSINESS-CONTINUITY-PLAN.md) risk
table, with whoever accepted it.

