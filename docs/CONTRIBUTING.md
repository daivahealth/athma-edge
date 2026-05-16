# Contributing to Athma Edge Documentation

Standards for writing and maintaining documentation in this repository.

## Principles

1. **Documentation is part of the implementation.** Code changes that affect behavior must update the relevant docs in the same session.
2. **One source of truth.** Each concept lives in exactly one doc. Cross-reference, don't duplicate.
3. **Update, don't create.** Prefer updating an existing canonical doc over creating a new file.
4. **No sprawl.** Don't create completion reports, status summaries, or one-off docs.

## File Naming

- Use UPPER-KEBAB-CASE for doc files: `TECHNICAL-ARCHITECTURE.md`, `AUTH-API.md`
- ADRs use sequential numbering: `ADR-0001-topic-name.md`
- READMEs serve as index/navigation for their directory

## Document Structure

Every doc should have:
1. A top-level `# Title` heading
2. A one-line description of what this doc covers
3. Content organized with `##` and `###` headings
4. No trailing whitespace or empty sections

## ADR Format

```markdown
# ADR-NNNN: Title

**Status:** Accepted | Superseded | Deprecated
**Date:** YYYY-MM-DD
**Context:** Why this decision was needed
**Decision:** What was decided
**Consequences:** What follows from this decision
```

## API Contract Format

```markdown
# Endpoint Group

## POST /api/path

**Auth:** Required | Public
**Roles:** DOCTOR, NURSE, ADMIN

### Request
- Body / Query params with types

### Response
- Success response shape
- Error cases

### Notes
- Any behavioral notes
```

## Routing Rules

When you change something, update the correct doc family:

| Change Type | Doc Location |
|------------|-------------|
| Architecture, data model | `docs/architecture/`, `docs/ADR/` |
| API endpoints, request/response | `docs/api/` |
| Feature behavior, workflows | `docs/features/` |
| Dev setup, commands, patterns | `docs/development/` |
| Docker, nginx, n8n | `docs/deployment/` |
| Auth, RBAC, audit | `docs/security/` |
| Ops procedures, troubleshooting | `docs/runbooks/` |
