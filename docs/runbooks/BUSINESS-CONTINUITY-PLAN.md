# Athma Business Continuity Plan (BCP)

Hospital-facing continuity plan for operating during a cloud HIS/EMR outage using the Athma Edge system.

This is the operational plan for clinical and operations staff. For how the software works, see [Technical Architecture](../architecture/TECHNICAL-ARCHITECTURE.md) and the feature docs linked in [Reference](#appendix-d--reference).

## Purpose and scope

This plan tells hospital staff how to keep documenting and delivering care when the cloud HIS/EMR is unreachable, using the Athma Edge system deployed on the hospital edge server.

It covers the clinical continuity window only: the period between loss of the primary HIS and its restoration, plus the reconciliation work that follows.

**In scope**

- Read access to active patients, lean clinical profiles and synced PDF documents held locally on the edge server
- Free-text clinical documentation created during the outage (BCP Clinical Notes)
- Registration of walk-in patients who do not exist in the synced data (BCP Temporary Patients)
- Activation, communication, recovery and manual reconciliation procedures

**Out of scope**

- Disaster recovery of the cloud HIS itself — Athma Edge is a continuity tool, not a DR system and not an EMR replacement
- Structured order entry, medication prescribing, results entry and billing — none of these exist in Athma Edge; notes are documentation, not executable orders
- The build and operation of the n8n reconciliation workflow itself — this plan says when it runs and who owns its output, not how it is implemented
- Non-clinical continuity (power, network, facilities, staffing surge), which belongs to the hospital's wider emergency plan

**Audience:** clinical staff (doctors, nurses), nursing and medical leadership, the IT/HIS on-call team, and the hospital emergency operations lead.

## Continuity objectives

Athma Edge gives near-zero recovery time for *reading* clinical data, because the edge server holds a continuously refreshed local copy. Recovery point depends on how recently each data class last synced before the outage.

| Capability | Recovery time | Recovery point (worst case at outage) |
|-----------|---------------|---------------------------------------|
| Patient lookup and demographics | Immediate — data already local | Up to 60 seconds of changes lost |
| Lean clinical profile (allergies, diagnosis, vitals, meds, pending investigations) | Immediate | Up to 2 minutes |
| PDF documents (labs, radiology, MAR, discharge summaries) | Immediate | Up to 10 minutes |
| Clinical documentation (BCP notes) | Immediate | Not applicable — written locally |
| Walk-in registration | Immediate | Not applicable — written locally |

Recovery points come from the n8n sync frequencies: active patients every 30–60 seconds, clinical profiles every 1–2 minutes, PDF documents every 5–10 minutes.

**Degraded service accepted during an activation**

- No new vitals, results, medications or documents arrive after the outage starts — everything on screen is a frozen snapshot.
- Outpatients who register after the outage starts are not in the local data and must be registered as temporary patients.
- Everything written locally has to be returned to the HIS after recovery, by the reconciliation workflow and by hand for the exceptions it leaves.

## Activation criteria

Activation is declared by the IT/HIS on-call lead, or by the senior clinician on duty if IT cannot be reached within 10 minutes. Athma Edge itself needs no switching on — it runs continuously — so "activation" means telling staff to work from it and starting the documentation discipline below.

| Trigger | Declare | Notes |
|---------|---------|-------|
| Cloud HIS unreachable or unusable for more than 10 minutes | Full activation | The primary case this plan is written for |
| HIS reachable but clinically unsafe (wrong data, severe latency, partial failure) | Full activation | Clinical judgement of the senior clinician on duty |
| WAN/internet link to the cloud down, hospital LAN intact | Full activation | Athma Edge is on the hospital LAN and stays available |
| Planned HIS maintenance or upgrade window | Planned activation | Confirm sync health immediately before the window starts |
| HIS up, Athma Edge sync degraded or stale | No activation | An IT issue — see [Sync Troubleshooting](SYNC-TROUBLESHOOTING.md); keep using the HIS |
| Hospital LAN or edge server down | Plan does not apply | Fall back to the hospital's paper downtime forms |

**On declaration**

1. Note the declaration time — it marks the cut-off for data freshness and the start of the reconciliation window.
2. Broadcast activation to all clinical areas by the hospital's standard downtime communication channel.
3. Record the last successful sync time for each component from the admin Sync Status dashboard, before anything else changes.
4. Confirm clinical areas can reach the Athma Edge URL and that staff can log in.
5. Escalate to the HIS vendor / cloud team in parallel; continuity and restoration run side by side.

**Stand-down** is declared by the same authority once the HIS is confirmed restored and sync freshness is back under two minutes. Reconciliation continues after stand-down.

## Roles and responsibilities

| Role | During activation | Athma Edge access |
|------|-------------------|-------------------|
| BCP coordinator (IT/HIS on-call lead) | Declares activation and stand-down, owns communication, drives HIS restoration with the vendor | ADMIN |
| Senior clinician on duty | Can declare activation if IT is unreachable; arbitrates clinical safety decisions | DOCTOR |
| Doctors | Look up patients, read profiles and documents, write clinical notes for orders, assessments and progress | DOCTOR |
| Nurses | Look up patients, write nursing, handover and medication-administration notes, register walk-ins | NURSE |
| Ward / department in-charge | Confirms every patient in their area is accounted for, owns the area's reconciliation list | NURSE |
| Registration / front desk | Registers walk-in patients as BCP temporary patients, keeps the temp-patient list for reconciliation | NURSE |
| System administrator | Watches sync status, container and disk health, manages user accounts, pulls the audit log | ADMIN |
| Medical records / HIM | Leads post-recovery reconciliation of notes and temporary patients into the HIS | ADMIN |

Athma Edge has exactly three roles — DOCTOR, NURSE and ADMIN — and a user may hold more than one. Doctors and nurses have identical permissions in the system; the split above is operational, not technical. Only ADMIN can see the sync dashboard, the audit log and user management.

**Accounts must exist before an outage.** There is no self-service registration and no password reset flow, so every clinician who may need access during a BCP event needs an account provisioned and tested in advance. Sessions last 8 hours, matching a clinical shift.

## The Athma Edge capability

```text
                    ┌───────────────────────────────────────┐
                    │           Cloud HIS / EMR             │  source of record
                    │   unreachable during an outage        │
                    └───────────────────┬───────────────────┘
   patients 30-60s · profiles 1-2 min   ╪  <-- the only link that fails
   PDFs 5-10 min                        ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ Hospital edge server — on the hospital LAN, no internet needed           │
│                                                                          │
│  ┌───────────┐    ┌──────────────┐    ┌──────────────┐   ┌────────────┐  │
│  │ n8n sync  │───▶│ PostgreSQL   │───▶│  BCP API     │──▶│  BCP UI    │  │
│  │ pulls and │    │ patients,    │    │ serves reads,│   │ search,    │  │
│  │ upserts   │    │ profiles,    │    │ writes notes │   │ profile,   │  │
│  │ locally   │    │ notes, temp  │    │ and temp     │   │ documents, │  │
│  │           │    │ patients,    │    │ patients     │   │ notes, BCP │  │
│  │           │    │ audit        │    │              │   │ banner     │  │
│  └─────┬─────┘    └──────────────┘    └──────▲───────┘   └─────┬──────┘  │
│        │          ┌──────────────┐           │                 │         │
│        └─────────▶│ PDF storage  │───────────┘                 │         │
│                   │ labs, radio- │                             │         │
│                   │ logy, MAR,   │                             │         │
│                   │ summaries    │                             │         │
│                   └──────────────┘                             │         │
└────────────────────────────────────────────────────────────────┼─────────┘
                                                                 ▼
                                                   ┌──────────────────────┐
                                                   │ Clinical staff       │
                                                   │ on the hospital LAN  │
                                                   │ named login, 8h shift│
                                                   └──────────────────────┘
```

An outage breaks only the link at the top. Everything below it keeps running on the hospital LAN, serving the copy of the data that was already pulled down.

### What is available locally

| Available during an outage | Not available |
|---------------------------|---------------|
| Active patient list and demographics | Any patient not synced before the outage |
| Allergies, blood group, primary diagnosis, high-risk flags | New vitals, results or medication changes |
| Latest vitals, active medications, pending investigations as of the last sync | Structured order entry, prescribing, billing |
| Critical results and handover notes as of the last sync | Historical chart, old encounters, full EMR |
| Synced PDFs: clinical summary, lab, radiology, MAR, nursing notes, discharge summary, consent | Documents issued after the last sync |
| Writing free-text clinical notes | Editing or deleting a note once saved |
| Registering walk-in patients | Deleting a temporary patient, or merging into the HIS |
| Audit log of every access and write | Write-back to the HIS while the HIS is still down |

### Edge server sizing

The edge server is sized for the outage, not the quiet day. On a normal day it is nearly idle; during an event it carries the clinical read load of the entire hospital — the load the HIS normally handles.

| Hospital | Beds | vCPU | RAM | Storage |
|----------|------|------|-----|---------|
| Small | < 200 | 8 | 16 GB | 1 TB SSD / flash |
| Medium | 200–500 | 16 | 32 GB | 1 TB SSD / flash |
| Large | 500–1,000+ | 16 | 64 GB | 1 TB SSD / flash |

A Docker-capable host sited inside the hospital. **Linux is preferred; Windows is supported.** Storage must be SSD or flash — PostgreSQL and PDF serving are both random-read workloads, hit hardest at the moment the hospital depends on them.

The reason for preferring Linux is unattended restart. A Linux host brings the stack back on boot with nobody logged in; Docker Desktop on Windows starts only at user sign-in, so a server that reboots overnight would stay down until someone signed in — and nobody would find out until the HIS failed. Where Windows is used, an unattended start must be configured and tested.

Two siting rules matter more than the figures:

- The edge server must **not** sit behind the same link, router or firewall path whose failure causes the outage. One that shares a single point of failure with the HIS connection is not a continuity system.
- It must stay reachable from every clinical area on the hospital LAN without internet access.

Disk is consumed almost entirely by synced PDFs, which accumulate with no retention policy. 1 TB buys years, not permanence — see [Hardware Requirements](../deployment/DEPLOYMENT-GUIDE.md#hardware-requirements) for the growth model and the monitoring threshold.


## Downtime clinical workflows

Four things staff can do during an outage. Everything else continues on the hospital's existing paper downtime process.

### 1. Find a patient

Search by MRN, UHID, name or mobile number, and filter by care setting, ward, consultant or business date. The default search shows today's active patients. Inpatients stay listed until the HIS records a discharge; outpatient, daycare and emergency records drop off at the daily rollover, so a patient seen yesterday needs the business-date filter and `activeOnly` turned off.

Outpatients are only present if they had checked in, registered, arrived, or had an active encounter at the time of the last sync. Cancelled, no-show, future and past appointments were never synced and will not be found.

### 2. Read the clinical profile

Each patient has a lean continuity profile, not a full chart: allergies, blood group, primary diagnosis, high-risk flags, latest vitals, active medications, pending investigations, critical results and handover notes. Synced PDF documents — clinical summaries, lab and radiology reports, MAR, nursing notes, discharge summaries, consents — can be listed and downloaded from local storage.

Check the last-synced timestamp in the patient header before acting on anything. A stale-data banner appears when the profile is more than five minutes old; during an outage it will be showing on every synced patient, which is expected.

### 3. Document care

Clinical notes are free text, up to 5000 characters, tagged with a type. They are **append-only: once saved, a note cannot be edited or deleted**, so compose carefully and add a correcting note rather than expecting to fix one. Author name and role are captured automatically.

Ten note types are available: Order, Medication, Investigation / Diagnostics, Progress Note, Assessment, Nursing Note, Shift Handover, Incident Report, Communication, Other.

A note is documentation of what was decided or communicated — it does not reach the pharmacy, the lab or any other department. Verbal and phone orders must still be actioned through the hospital's downtime process; the note is the record, not the transmission.

Notes can be written against any patient, synced or temporary, from the patient's profile, from the clinical notes list, or from the new-note page.

### 4. Register a walk-in

Patients arriving during the outage will not be in the synced data. Register them with "Add Patient" on the patient search page: name and care setting are required (care setting defaults to Emergency), the rest — gender, date of birth, age, mobile, ward, bed, consultant — is optional. The system assigns an MRN of the form `BCP-YYYYMMDD-NNN`, and the patient appears in search with a yellow TEMP badge.

Temporary patients carry demographics and clinical notes only — there are no vitals, medications, investigations or documents tabs, because there is no synced data behind them. Demographics can be corrected later; the record cannot be deleted.

If a walk-in turns out to already exist in the HIS, register them as temporary anyway and flag the duplicate for reconciliation. Do not guess an HIS MRN.

## Data freshness and clinical limitations

Every screen in Athma Edge shows a permanent, non-dismissible **BCP LOCAL MODE** banner, and every patient view shows its last-synced time. Treat both as part of the clinical record you are reading.

During an outage, synced data stops advancing at the moment the last successful sync completed. The stale-data warning will be showing everywhere; that is the system working correctly, not a fault.

**What clinicians must keep in mind**

- The profile is a continuity snapshot, not a live chart and not the full EMR. Absence of a finding in Athma Edge does not mean it is absent in the patient's real record.
- Vitals, medications, investigations, results and documents are frozen. Anything recorded on the ward after the outage started exists only on paper or in a BCP note.
- A medication list may be out of date by the length of the outage. Confirm the current regimen with the bedside MAR or the nursing team before acting.
- Pending investigations will not resolve. Results issued during the outage arrive through the lab's own downtime process.
- Patients admitted, transferred or discharged during the outage will show their pre-outage ward, bed and status.
- Temporary patients deliberately show no freshness information — they have no synced data behind them.

**If data looks wrong rather than merely old**, stop using Athma Edge for that patient, fall back to paper, and report it to the BCP coordinator. Do not reconcile a suspect record into the HIS later without verifying it against the source.

## Recovery and reconciliation

Reconciliation depends on the HIS exposing write APIs. Where it does, an n8n write-back workflow pushes what was created during the outage into the HIS once it is reachable again; **for Athma this reconciliation workflow exists in n8n**. Where an HIS offers no write APIs, the same work has to be done by hand.

An automated run does not finish the job. The script moves what it can map cleanly; duplicates, ambiguous matches and anything it rejects come back as a manual exception list. Plan for both.

### Restoration

1. Confirm the HIS is back and stable with the HIS vendor / cloud team.
2. Watch the admin Sync Status dashboard — the inbound sync workflows resume on their own cron schedule; no manual restart should be needed.
3. Confirm all three components return to SUCCESS and freshness drops under two minutes.
4. Spot-check a handful of patients against the HIS before telling staff to switch back.
5. Declare stand-down and tell all clinical areas to resume using the primary HIS.
6. Run the n8n reconciliation workflow, scoped to the outage window, and capture its result: records written, records rejected, records needing a human decision.

If sync does not resume by itself, follow [Sync Troubleshooting](SYNC-TROUBLESHOOTING.md) before declaring stand-down.

### Reconciliation

The automated run is owned by the BCP coordinator. The exception list it produces is owned by Medical Records / HIM, with the ward in-charge for each area and the originating clinician for anything clinical.

| Item | Source in Athma Edge | How it returns to the HIS |
|------|---------------------|---------------------------|
| Clinical notes written during the outage | Clinical notes list, filtered to the outage window | Written back by the n8n workflow, preserving original author, role and timestamp |
| Verbal and phone orders captured as Order notes | Order-type notes | Written back as documentation only. A note is never promoted to an executable order by the script — the responsible clinician confirms and enters the real order |
| Medication given during the outage | Medication and Nursing notes, plus the paper MAR | Notes written back by the script; the MAR itself is reconciled by the ward against the HIS MAR |
| Walk-in patients | Patient search, TEMP badge / `BCP_LOCAL` source | Registered in the HIS by the script, which records the mapping from `BCP-YYYYMMDD-NNN` to the issued HIS MRN |
| Walk-ins who turn out to be existing patients | Flagged duplicates | Manual — the script cannot safely merge identities. HIM merges into the existing HIS record and keeps the BCP MRN in the merge note |
| Records the script rejects or cannot match | Reconciliation run output | Manual — worked through as the exception list |
| Incident reports | Incident-type notes | Manual — raised through the hospital's normal incident system |

**Rules**

- Run the reconciliation workflow once, scoped to the outage window, and keep its run record. Re-running an unscoped workflow risks duplicating notes already written back.
- Reconcile every note, including ones that turned out to be clinically inconsequential. The BCP record is append-only and nothing can be deleted to tidy it up.
- The BCP MRN to HIS MRN mapping is produced by the workflow. Keep it as a durable record — nothing in Athma Edge stores it.
- Work the exception list ward by ward and sign each area off, so partial completion is visible.
- Nothing is reconciled until it is confirmed present in the HIS. Treat the workflow's own success count as a claim to verify, not proof.
- Athma Edge keeps running as a backup after recovery. It is not switched off, and the notes stay in it permanently.

### Sign-off

> **Proposed, pending approval by clinical and HIM leadership.** The roles and the deadline below are a recommended default, not an agreed hospital policy. Confirm or change them before this plan is approved.

| Question | Proposed |
|----------|----------|
| Who signs off that reconciliation is complete | The Medical Records / HIM lead |
| By when | Within **48 hours** of stand-down |
| Evidence it is given against | The reconciliation run record, plus each ward in-charge's area sign-off |
| Partial sign-off | Permitted, with a documented residual list, accepted by the nursing superintendent on duty |
| Where it is recorded | The outage log opened at activation |
| If the deadline passes with work outstanding | Escalate to the hospital emergency operations lead, who sets a new date and records why |

48 hours is chosen so sign-off lands while the clinicians who wrote the notes are still on the same rota and can be asked about an ambiguous entry. A longer deadline makes the exception list harder to resolve, not easier.

### Risks and mitigations

| Risk | Impact if it materialises | Mitigation | Owner |
|------|---------------------------|------------|-------|
| The reconciliation workflow is a skeleton — its HIS-side writes are not implemented and it defaults to a dry run | No automated write-back. Reconciliation is manual in practice, whatever the procedure above describes | Appendix B's manual steps remain the operative procedure. Staff the manual re-entry on the assumption that no automation exists until it is demonstrated in a drill | IT/HIS on-call lead |
| The [HIS Reconciliation Contract](../api/HIS-RECONCILIATION-CONTRACT.md) has not been validated against the Athma HIS. Whether Athma accepts a **backdated authored timestamp** is the largest unknown | A shift's documentation lands in the chart as a block of notes all authored at the moment of reconciliation, destroying the provenance that made the notes worth keeping | Verify before the first automated run. If unsupported, use the contract's degraded mode: the true time and author prefixed into the note text, and the loss recorded in the post-event review | IT/HIS on-call lead |
| The sign-off owner and deadline are a proposal, not approved by clinical and HIM leadership | Reconciliation has no defined end. The exception list is worked partially and nothing forces closure | The proposed default (HIM lead, 48 hours) stands in the interim and is used in drills. Confirm at the next BCP review | BCP coordinator |
| No maximum tolerable downtime has been agreed for this plan, nor a target for how long reconciliation may lag restoration | No trigger for escalating beyond this plan when an outage runs long | Treat the hospital's wider emergency plan as the escalation path until a figure is agreed. Review after the first real activation, when a realistic figure is observable | BCP coordinator |
| An outage spans a daily rollover | Outpatient, daycare and emergency records from the previous day drop out of the default search mid-event | Staff are briefed to search with the business-date filter and `activeOnly` off. Inpatients are unaffected | Ward in-charge |

## Security, access and audit

A BCP event does not relax access control. Athma Edge holds real patient data and enforces the same authentication, role checks and audit logging during an outage as outside one.

**Access**

- Named accounts only — no shared or generic logins, no emergency bypass account, no break-glass path.
- Username and password, hashed with bcrypt; the session is an HttpOnly cookie that JavaScript cannot read.
- Sessions expire after 8 hours and there is no refresh — a long shift will require a second login.
- Roles are DOCTOR, NURSE and ADMIN. Sync status, the audit log and user management are ADMIN-only.
- There is no password self-reset. A locked-out clinician needs an administrator, which is why the admin on-call contact belongs in the appendix.

**Audit**

Every user action is logged automatically and the log is append-only — entries are never deleted. Logged events: login success, login failure, patient search, profile view, PDF download, note creation, temporary patient creation, temporary patient update, and logout. Each entry carries the username, role, tenant, client IP, patient context where applicable, and a timestamp.

The audit log is the evidence base for post-event review and for any clinical or legal query about what was accessed during the outage. Administrators can query it by event type, user and date range.

**Data at rest**

Patient data and PDF documents live on the hospital edge server, not in the cloud. The edge server must be physically secured, access to the Docker host restricted to the system administrator, and the server included in the hospital's normal patching and backup regime.

## Testing, drills and maintenance

A continuity system that is only opened during a crisis will not work during a crisis. The readiness checks below come from [Daily Operations](DAILY-OPERATIONS.md); the drill and review cadence is a plan commitment.

| Activity | Cadence | Owner |
|----------|---------|-------|
| Sync health check — all three components SUCCESS, freshness normal | Daily, each morning | System administrator |
| Census spot-check against expected hospital occupancy | Daily | System administrator |
| Daily rollover verification — yesterday's OP/daycare/ER records inactive, inpatients still active | Daily | System administrator |
| Container health and disk usage on the edge server | Daily | System administrator |
| Audit log review for unusual activity | Weekly | System administrator |
| PostgreSQL backup verification | Weekly | System administrator |
| Login test for a sample of clinical users in each area | Monthly | Ward in-charge |
| Unattended reboot test — restart the server, do not log in, confirm the URL answers from another machine | Quarterly | System administrator |
| n8n execution history reviewed for recurring failures | Monthly | System administrator |
| Docker and n8n security patching | Monthly | System administrator |
| Tabletop drill — walk the activation and reconciliation steps | Quarterly | BCP coordinator |
| Live drill — one ward documents a shift in Athma Edge and reconciles it | Twice yearly | BCP coordinator |
| Plan review and reapproval | Annually, and after every real activation | BCP coordinator |

**After every real activation or live drill**, hold a review within two weeks covering: time from HIS loss to declaration, whether staff could log in, how many notes and temporary patients were created, how long reconciliation took, and what went wrong. Update this plan with what the review finds.

**Changes to the Athma Edge system** — new note types, changed sync frequencies, new roles — require this plan to be reviewed in the same change, since staff instructions here depend on system behaviour.

## Appendix A — Activation checklist

- [ ] Record the time the HIS became unreachable
- [ ] Confirm the hospital LAN and the Athma Edge URL are reachable
- [ ] Capture last successful sync time for active patients, clinical profiles and PDF documents
- [ ] Declare activation and note the declaring authority
- [ ] Broadcast to all clinical areas on the standard downtime channel
- [ ] Each area confirms staff can log in to Athma Edge
- [ ] Escalate to the HIS vendor / cloud team
- [ ] Brief front desk to register walk-ins as BCP temporary patients
- [ ] Remind clinical staff: notes are append-only and are not orders
- [ ] Start an outage log — time, areas affected, decisions taken

## Appendix B — Stand-down and reconciliation checklist

- [ ] HIS confirmed restored and stable by the vendor / cloud team
- [ ] All three sync components show SUCCESS, freshness under two minutes
- [ ] Spot-check several patients against the HIS
- [ ] Declare stand-down and tell all areas to resume the primary HIS
- [ ] Export or list all clinical notes created during the outage window
- [ ] Export or list all `BCP_LOCAL` temporary patients created during the outage
- [ ] Re-enter notes into the HIS, preserving author, role and original timestamp
- [ ] Register temporary patients in the HIS and record the BCP-MRN to HIS-MRN mapping
- [ ] Reconcile medication administration against the paper MAR
- [ ] Raise incident-type notes through the normal incident system
- [ ] Each ward in-charge signs off their area
- [ ] Medical Records / HIM lead signs off reconciliation complete, within 48 hours of stand-down, against the run record
- [ ] Record the sign-off, or the documented residual list, in the outage log
- [ ] Schedule the post-event review within two weeks

## Appendix C — Contacts

To be completed and kept current by the BCP coordinator. Print and hold a copy in each clinical area — during an outage, an online contact list may be unavailable.

| Role | Name | Primary contact | Out of hours |
|------|------|-----------------|--------------|
| BCP coordinator / IT on-call lead | | | |
| System administrator (Athma Edge) | | | |
| HIS vendor / cloud support | | | |
| Network / infrastructure on-call | | | |
| Medical records / HIM lead *(signs off reconciliation)* | | | |
| Nursing superintendent on duty | | | |
| Hospital emergency operations lead | | | |

## Appendix D — Reference

Where this plan and the system documentation disagree, the system documentation describes what the software does and this plan should be corrected.

| Topic | Document |
|-------|----------|
| System design and data flow | [Technical Architecture](../architecture/TECHNICAL-ARCHITECTURE.md) |
| Clinical notes behaviour | [BCP Clinical Notes](../features/BCP-CLINICAL-NOTES.md) |
| Temporary patient registration | [BCP Temporary Patients](../features/BCP-TEMPORARY-PATIENTS.md) |
| Patient search rules | [Patient Search](../features/PATIENT-SEARCH.md) |
| Clinical profile contents | [Clinical Profile](../features/CLINICAL-PROFILE.md) |
| Sync components and health | [Sync Status](../features/SYNC-STATUS.md) |
| Daily rollover rules | [Daily Rollover](../features/DAILY-ROLLOVER.md) |
| Roles and access | [Auth & RBAC](../security/AUTH-AND-RBAC.md) |
| Audit events | [Audit Logging](../security/AUDIT-LOGGING.md) |
| Daily checks and post-recovery steps | [Daily Operations](DAILY-OPERATIONS.md) |
| Sync failure diagnosis | [Sync Troubleshooting](SYNC-TROUBLESHOOTING.md) |
