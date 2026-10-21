# Optional reverse proxy

**Athma Edge does not need a reverse proxy.** The `bcp-api` service serves the
SPA and the API on one origin, and `docker compose up -d` publishes it on port
80. Nothing in this directory is part of the stack.

Put a proxy in front only if the hospital needs something the application does
not do:

- **TLS.** The application speaks HTTP only. Certificate handling, renewal and
  redirection belong to the hospital's own infrastructure, which already has a
  way of doing it.
- **A shared hostname**, where Athma Edge lives under a path alongside other
  services.
- **Network policy** the hospital applies uniformly — IP allow-lists, client
  certificates, request logging to a central collector.

`example.conf` is a working starting point for nginx, kept for reference. It is
not mounted, not built and not tested by CI; treat it as a sample to adapt.

If you do front the application, set `FRONTEND_ORIGIN` to the externally
visible origin so CORS and cookie behaviour stay correct, and keep
`X-Forwarded-For` intact — the audit log records the client IP from it.
