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
