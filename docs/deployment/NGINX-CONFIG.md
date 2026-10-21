# Nginx Configuration

Reverse proxy routing rules for the Athma Edge deployment.

## Routing

| Path | Upstream | Notes |
|------|----------|-------|
| `/api/*` | bcp-api:3100 | NestJS API backend |
| `/*` | — | the built SPA, served from disk (catch-all, falls back to `index.html`) |

n8n runs on port 5678 and is accessed directly (not proxied through nginx). Only admins should have network access to port 5678.

## Key Settings

- `client_max_body_size 50m` — for PDF uploads via n8n
- Standard proxy headers: `Host`, `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`
- Hashed assets under `/assets/` are cached for a year; `index.html` is never cached, so a deploy cannot leave browsers asking for asset filenames that no longer exist

## Config Location

```
nginx/default.conf
```

Mounted read-only into the nginx container at `/etc/nginx/conf.d/default.conf`.

## TLS

Not configured by default. For production, add SSL certificates and update the nginx config to listen on 443 with TLS termination.
