# HIS Reconciliation Contract

The minimum API surface a source HIS/EMR must expose for Athma Edge to write BCP data back after a continuity event, and the rules the reconciliation workflow follows when using it.

This is an **outbound** contract: Athma Edge is the client, the HIS is the server. It is the mirror of the inbound sync described in [n8n Workflows](../deployment/N8N-WORKFLOWS.md), and it is consumed by Workflow 5 (BCP Reconciliation).

> **Status:** proposed. Written as the target contract for any HIS deployment. It has not yet been validated against the Athma HIS implementation — see the Athma-specific mapping section at the end.

## Scope

Reconciliation writes back exactly two things, because those are the only two things Athma Edge creates locally:

| Local record | Written back as |
|-------------|-----------------|
| BCP Clinical Note (append-only free text, typed) | A clinical note / documentation entry on the patient's encounter |
| BCP Temporary Patient (`source_system = 'BCP_LOCAL'`, `BCP-YYYYMMDD-NNN` MRN) | A registered patient, plus an encounter to hang notes on |

Nothing else is written. Synced clinical data was never modified locally, so there is nothing to push back for vitals, medications, investigations or documents.

## Required capabilities

An HIS that provides all seven can be reconciled automatically. An HIS missing any of them falls back as described in [Degraded modes](#degraded-modes).

| # | Capability | Purpose |
|---|-----------|---------|
| 1 | Patient match | Decide whether a BCP temporary patient is a new registration or an existing patient |
| 2 | Patient create | Register a genuine walk-in and obtain the HIS MRN |
| 3 | Encounter lookup | Find the encounter a note belongs to |
| 4 | Encounter create | Create an encounter for a newly registered walk-in |
| 5 | Clinical note create | The core write — must accept backdated timestamps and an external author |
| 6 | Read-back by external reference | Verify a write landed, and make re-runs safe |
| 7 | Health / readiness | Refuse to run against a half-recovered HIS |

### 1. Patient match

```
GET /patients/search?mrn=&uhid=&mobile=&name=&dob=
→ 200 { matches: [ { mrn, uhid, name, dob, gender, confidence } ] }
```

Must support lookup by more than MRN, because a walk-in registered during an outage has no HIS MRN. Where the HIS can express match confidence, it should; the workflow treats anything below certainty as a human decision, never an automatic merge.

### 2. Patient create

```
POST /patients
  { name, gender, dob, age, mobile, externalRef, sourceSystem }
→ 201 { mrn, uhid }
```

`externalRef` carries the BCP MRN (`BCP-YYYYMMDD-NNN`). The response MRN is what the workflow records in the BCP-to-HIS mapping. A repeat call with the same `externalRef` must return the original patient, not a second one.

### 3. Encounter lookup

```
GET /patients/{mrn}/encounters?activeOn=<ISO date>
→ 200 { encounters: [ { encounterId, visitNumber, careSetting, admittedAt, dischargedAt } ] }
```

The workflow needs to attach each note to the encounter that was open when the note was written, which may not be the encounter open now.

### 4. Encounter create

```
POST /patients/{mrn}/encounters
  { careSetting, startedAt, ward, bed, consultant, externalRef, sourceSystem }
→ 201 { encounterId, visitNumber }
```

Needed only for patients created at step 2. Must accept a backdated `startedAt`.

### 5. Clinical note create

The one endpoint that cannot be worked around.

```
POST /encounters/{encounterId}/notes
  {
    noteType,            // mapped from the BCP note type
    content,             // free text, up to 5000 characters
    authoredAt,          // ISO 8601, BACKDATED to when the note was written
    author: { name, role, externalUserId },
    sourceSystem: "ATHMA_EDGE_BCP",
    externalRef          // the BCP note id
  }
→ 201 { noteId }
```

Three requirements are non-negotiable, because without them the write-back destroys the provenance that made the note worth keeping:

- **Backdated `authoredAt`.** An HIS that stamps server time turns a shift's documentation into a block of notes all written at the moment of reconciliation. If the HIS cannot backdate, it must at minimum store the true time in a field that is visible in the chart.
- **External author identity.** The note was written by a named clinician on the edge, not by the reconciliation service account. The clinician's name and role are captured on the BCP note and must survive.
- **A source marker.** BCP-origin notes must be identifiable in the HIS afterwards, for clinical review and for audit.

Note types are a mapping concern, not a contract requirement — the HIS's own vocabulary is used, and anything unmapped goes to the HIS's general/other note type with the BCP type named in the text.

### 6. Read-back by external reference

```
GET /notes?externalRef=<bcp note id>
GET /patients?externalRef=<bcp mrn>
→ 200 { … } | 404
```

Serves two jobs: confirming a write actually landed, and letting a re-run skip what is already there. An HIS without this cannot be re-run safely after a partial failure.

### 7. Health / readiness

```
GET /health
→ 200 { status, writesAccepted: true|false }
```

`writesAccepted` matters more than liveness. An HIS that is up but still replaying its own recovery queue should report `false`, and the workflow should wait rather than write into it.

## Cross-cutting requirements

### Idempotency

Every write accepts a client-supplied idempotency key and returns the original resource on a repeat, rather than creating a duplicate. Without this, one re-run duplicates clinical documentation in a live chart.

The workflow supplies the BCP record's own id as both `externalRef` and idempotency key, so the key is stable across runs and across operators.

### Error semantics

The workflow must be able to tell three cases apart, because each routes differently:

| Class | Examples | Workflow behaviour |
|-------|----------|-------------------|
| Retryable | 429, 502, 503, 504, timeout | Back off and retry within the run |
| Terminal, automatable | 409 duplicate with the existing resource returned | Treat as already written, record the mapping |
| Terminal, human | 400 validation, 404 encounter gone, ambiguous match | Exception list, never retried, never dropped |

An HIS that returns a bare 500 for all failures forces everything into the exception list.

### Authentication

A dedicated service account with write scope on patients, encounters and notes, and nothing else. The token lifetime must exceed a full reconciliation run, or the workflow must be able to refresh mid-run. The account is distinct from any clinician account so its writes are attributable in the HIS audit log.

### Rate and batch behaviour

The HIS should state its rate limit and whether it accepts batched writes. A continuity event that ran for hours can produce thousands of notes; a workflow that discovers the limit by being throttled mid-run leaves a partial write-back.

## Explicitly out of scope

The HIS does **not** need to expose any of the following for reconciliation, and the workflow will never call them:

- Order entry or order status
- Medication prescribing or administration recording
- Results entry
- Billing, scheduling or discharge
- Patient merge or identity resolution — merges are always a human decision in the HIS's own interface
- Delete or update of anything Athma Edge previously wrote

## Degraded modes

What to do when an HIS cannot provide a capability. The plan stays usable; more work moves to people.

| Missing capability | Consequence | Fallback |
|-------------------|-------------|----------|
| Patient match (1) | Cannot tell a new walk-in from an existing patient | Every temporary patient goes to the exception list for manual lookup |
| Patient create (2) | Walk-ins cannot be registered automatically | Registration stays manual; notes for those patients wait on it |
| Encounter lookup (4) or create (5) | Notes have nothing to attach to | Notes written against the patient rather than an encounter, if the HIS allows it; otherwise manual |
| Backdated `authoredAt` | Timestamps collapse to the reconciliation time | True time prefixed into the note text in a fixed format, and the loss stated in the post-event review |
| External author | All notes attributed to the service account | Author name and role prefixed into the note text |
| Read-back (6) | Re-runs are unsafe | Single-run-only policy, and any partial failure becomes wholly manual |
| Idempotency | Re-runs duplicate records | As above — the run is never repeated, and a failed run is finished by hand |
| **Clinical note create (5)** | **Nothing can be written back** | **Reconciliation is entirely manual. The automated path does not apply to this HIS.** |

## Reconciliation guidelines

Rules the workflow follows regardless of which HIS it is pointed at.

1. **Never during an outage.** The workflow runs only after stand-down has been declared and the HIS reports `writesAccepted`.
2. **Always scoped.** Start and end timestamps of the outage window are explicit inputs, never defaults. An unscoped run is the main way to duplicate a chart.
3. **Run once per window.** Re-runs happen only where read-back and idempotency are both available.
4. **Documentation, never orders.** A BCP note is written back as a note. The workflow never creates an order, a prescription or an administration record from one, whatever the note's type says.
5. **Identity decisions are human.** The workflow registers clearly-new patients and escalates everything else.
6. **Verify, don't assume.** A record counts as reconciled when it has been read back from the HIS, not when the write returned 201.
7. **Nothing is dropped silently.** Every record in the window ends the run in exactly one of three states: written and verified, already present, or on the exception list.
8. **The edge is not modified.** The workflow writes to the HIS and to its own run record. It does not edit, delete or flag the BCP notes and temporary patients it read — they stay append-only on the edge permanently.
9. **Both sides are audited.** The run record names the operator, the window, the counts and every exception; the HIS sees the service account's own writes in its audit log.
10. **The run record is a deliverable.** It is what the reconciliation sign-off is given against.

## Athma-specific mapping

To be completed against the Athma HIS implementation, and the reason [this is still marked proposed](#his-reconciliation-contract):

- [ ] Which Athma endpoints satisfy capabilities 1–7, with their real paths and payloads
- [ ] Whether Athma accepts a backdated `authoredAt` and an external author identity
- [ ] Athma's idempotency mechanism, if it differs from `externalRef`
- [ ] The BCP note type to Athma note type mapping
- [ ] Athma's rate limit and batch support
- [ ] Which degraded modes, if any, apply

## Related

- [n8n Workflows](../deployment/N8N-WORKFLOWS.md) — Workflow 5, the reconciliation workflow itself
- [Business Continuity Plan](../runbooks/BUSINESS-CONTINUITY-PLAN.md) — when reconciliation runs and who owns its output
- [ADR-0002](../ADR/ADR-0002-read-only-phase1.md) — why only notes and temporary patients are written back
- [BCP Clinical Notes](../features/BCP-CLINICAL-NOTES.md) — the note record being written back
- [BCP Temporary Patients](../features/BCP-TEMPORARY-PATIENTS.md) — the temporary patient record being written back
