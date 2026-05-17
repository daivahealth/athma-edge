# ADR-0004: External ID Strategy

**Status:** Accepted
**Date:** 2026-05-16

## Context

Patient IDs, MRNs, UHIDs, encounter IDs, visit numbers, consultant IDs, tenant IDs, and source system identifiers all originate from the cloud HIS. These IDs may be UUIDs, integers, alphanumeric codes, or other formats depending on the source system. The BCP application must accept IDs from any source system without requiring format conversion.

## Decision

- All external IDs stored as **VARCHAR** (not PostgreSQL UUID type)
- Internal primary keys are **BIGSERIAL** (auto-increment integers)
- Unique constraints use composite keys of external IDs (e.g., `tenant_id + source_system + mrn + visit_number`)
- No UUID generation for external identifiers
- Specific VARCHAR lengths per field:
  - `tenant_id`, `source_system`, `patient_id`, `encounter_id`, `consultant_id`: VARCHAR(100)
  - `mrn`, `visit_number`, `role_code`: VARCHAR(50)
  - `uhid`: VARCHAR(50)

## Consequences

- Accepts any ID format from any source system without transformation
- Multiple source systems can coexist (differentiated by `source_system` field)
- No type-level UUID validation; format validation at application level if needed
- VARCHAR indexing is slightly less efficient than integer but acceptable for BCP scale (thousands, not millions of records)
- Composite unique constraints prevent duplicate syncs from the same source
