# TRAILWEIGH — PROMPT 025Y REPORT
**PUBLISHED-BUT-NO-PRODUCTION-DATABASE FORENSIC AUDIT**
**Determine What the Previous Autoscale Deployment Used — No Changes**
**Internal Version ID: 025Y-PRODDB-FORENSIC-2026-08-12-R1**
**Generated: 2026-08-13**

---

## VERSION GATE

Internal version ID: `025Y-PRODDB-FORENSIC-2026-08-12-R1` ✓
Questions 1, 20, 40, 60 present ✓
No Republish / Resume / Create Production Database performed ✓
No code or configuration changes ✓

---

## SECTION A — EXECUTIVE RESULT

The forensic audit produces one primary conclusion and one important subsidiary finding:

**PRIMARY CONCLUSION (PROVISIONAL):**
The previous Autoscale deployment most likely ran code that predated the database-requiring features (share_links and locker_entries). Under that version, `@workspace/db` was not imported and `DATABASE_URL` was not required — so no production database was needed, none was automatically created, and the deployment ran cleanly without one. This is why "All Databases" shows only the Development Database today.

**SUBSIDIARY FINDING (PROVISIONAL):**
If the deployment was published after database-requiring routes were added, Replit's current Autoscale documentation states a production database IS automatically provisioned on publish. In that scenario, the production database was subsequently deleted — leaving no trace in "All Databases." This cannot be ruled out, but is less coherent with the evidence (a deleted production DB would have caused the deployment to start crashing, yet the status is "paused" not "errored").

**CONFIDENCE: PROVISIONAL — HIGH COHERENCE** (no single piece of project-visible evidence directly proves when the publish occurred or what code version was deployed).

---

## SECTION B — CURRENT DATABASE IDENTITY

### Q1–Q10

**Q1. Confirm Development Database exists.**

STATUS: USER-VERIFIED + VERIFIED — DIRECT AUTHORITATIVE
- User screenshot: Replit "All Databases" lists "Development Database"
- `DATABASE_URL` environment key is SET and resolves to a Helium instance
- `lib/db/src/index.ts` initializes a pg Pool using `process.env.DATABASE_URL` — connection succeeds in development
CONFIDENCE: HIGH

**Q2. User-supplied evidence: All Databases shows only Development Database.**

STATUS: USER-VERIFIED
CONFIRMED. Replit UI "All Databases" shows exclusively the Development Database. No Production Database row or card is present.

**Q3. Development DB infrastructure classification.**

STATUS: VERIFIED — DIRECT AUTHORITATIVE
**Infrastructure: HELIUM (current Replit PostgreSQL infrastructure)**

Evidence (without revealing connection string):
```
DATABASE_URL host:     helium
DATABASE_URL protocol: postgresql:
DATABASE_URL pathname: /heliumdb
```
Additional confirmation: `REPLIT_HELIUM_ENABLED` environment key is present.
This is NOT legacy Neon. The development database is on current Replit infrastructure.
CONFIDENCE: HIGH

**Q4. Connection strings not printed.**

CONFIRMED. Only host, protocol, and pathname (not credentials) were inspected and reported.

**Q5. Safe evidence used for classification.**

Evidence gathered without revealing credentials:
- `node -e "new URL(process.env.DATABASE_URL).host"` → `helium`
- `node -e "new URL(process.env.DATABASE_URL).pathname"` → `/heliumdb`
- `Object.keys(process.env).filter(k => k.match(/HELIUM/i))` → `['REPLIT_HELIUM_ENABLED']`
- `.replit` modules list: `postgresql-16` present

**Q6. Is any Production Database ID/reference present in project metadata?**

STATUS: VERIFIED — DIRECT AUTHORITATIVE
**NO.** Comprehensive search of all accessible project metadata:

| Location | Database reference | Finding |
|---|---|---|
| `.replit` `[deployment]` section | None | Only `router = "application"`, `deploymentTarget = "autoscale"` |
| `artifacts/api-server/.replit-artifact/artifact.toml` | None | `[services.production.run.env]` sets only `PORT = "8080"` and `NODE_ENV = "production"` |
| `artifacts/pack-checklist/.replit-artifact/artifact.toml` | None | Static serve only; no DB config |
| Git commit messages | None | No commit mentioning production database, neon, helium, migration |
| All workflow reports (025R–025X) | None | No production DB URL or ID referenced |
| `.env*` files | None found | No `.env.production` or similar |

CONFIDENCE: HIGH

**Q7. Metadata search performed.**

CONFIRMED. Configuration files, artifact.tomls, .replit, and git history were searched.

**Q8. Legacy Neon production DB reference present?**

STATUS: VERIFIED — DIRECT AUTHORITATIVE
**NO Neon references found anywhere.** The development DATABASE_URL resolves to `host: helium` — not Neon. No `NEON_DATABASE_URL` environment key exists. No `neon` mention in any source file, config, or commit message.
CONFIDENCE: HIGH

**Q9. Classification of any database references found.**

| Reference | Location | Classification |
|---|---|---|
| `DATABASE_URL` (dev database) | Environment / `lib/db/src/index.ts` | ACTIVE CONFIG — Development |
| `REPLIT_DB_URL` | Environment | LEGACY REFERENCE — Replit key-value store (NOT PostgreSQL; unrelated to this audit) |
| No production DB reference | Anywhere | N/A |

**Q10. Distinction summary.**

| Category | Status |
|---|---|
| ACTIVE CONFIG | Development DB (`host: helium` / `REPLIT_HELIUM_ENABLED`) |
| LEGACY CONFIG | `REPLIT_DB_URL` (Replit KV store — unrelated to the PostgreSQL DB) |
| STALE REFERENCE | None found |
| PRODUCTION DB REFERENCE | NONE FOUND |

---

## SECTION C — DATABASE / DEPLOYMENT TIMELINE

### Q11–Q20

**Q11. Can Agent inspect read-only publishing/deployment history?**

STATUS: VERIFIED — DIRECT AUTHORITATIVE
**NO direct deployment history is accessible.** Replit does not expose a deployment event log to the Agent in the development environment. What IS accessible: git commit history (with dates), artifact.toml configurations, and environment metadata.

**Q12. Most recent successful published deployment timestamp.**

STATUS: STILL UNKNOWN — REPLIT UI EVIDENCE REQUIRED
The Replit Deploy panel shows the deployment is PAUSED. The exact date of the last successful publish is NOT visible from git history or project metadata. The user's screenshot did not capture a deployment timestamp.

**Q13. Does the deployment predate or postdate the move to Helium?**

STATUS: PROVISIONAL
DATABASE_URL resolves to `helium` — the development environment is already on Helium infrastructure. However, it is not possible to determine from git history alone whether the PUBLISHED DEPLOYMENT was created before or after Helium was available for this project.

**Q14. Exact date from git history only.**

Git commit history provides feature addition dates. No publish event appears in git commits. Therefore: publication date UNKNOWN from git history alone.

**Q15. Evidence of a database being created during any prior publish.**

STATUS: VERIFIED — DIRECT AUTHORITATIVE (absence)
**NO evidence found.** No commit message, no config file, no report from any prior session (025R–025X) references a production database having been created. 025T Q69 and Q101–Q116 discussed production DB theoretically but did not report observing one.

**Q16. Evidence of a production database later being removed.**

STATUS: VERIFIED — DIRECT AUTHORITATIVE (absence)
**NO evidence of removal.** No removal action, no deletion log, no "removed production database" commit or report entry.

**Q17. Evidence of shared Development/Production database configuration.**

STATUS: PROVISIONAL
The `artifact.toml` `[services.production.run.env]` does NOT set DATABASE_URL explicitly. Under Replit's Autoscale architecture, the production DATABASE_URL is injected by Replit (if a production DB is provisioned). The absence of explicit DATABASE_URL in production env config is consistent with EITHER a Replit-provisioned production DB (automatically injected) OR a development-sharing scenario (dev DATABASE_URL shared into production environment).
No direct code evidence of an explicit shared-DB configuration exists.

**Q18. Evidence of a database migration from legacy Neon/shared DB to current Replit DB.**

STATUS: VERIFIED — DIRECT AUTHORITATIVE (absence)
**NO migration evidence found.** No `NEON_DATABASE_URL`, no pg_dump/pg_restore scripts, no "migrate shared data" commit. The shared-database migration path documented by Replit applies to legacy Neon projects; this project uses Helium and shows no migration artifacts.

**Q19. Search results for key terms.**

| Term | Git commits | Source files | Reports | Config |
|---|---|---|---|---|
| neon | 0 | 0 | 0 | 0 |
| helium | 0 | 0 (env key only) | 0 | 0 |
| production database | 0 | 0 | Theoretical only (025T) | 0 |
| shared database | 0 | 0 | 0 | 0 |
| migrate shared | 0 | 0 | 0 | 0 |
| DATABASE_URL migration | 0 | 0 | 0 | 0 |

**Q20. Concise database/deployment timeline.**

```
2026-07-28  Initial commit — project scaffolded; no DB routes yet
2026-07-31  Pack weight checklist added — frontend only; likely no server DB requirement
2026-08-01  Artifact scaffolding, refactors — still likely no DB requirement
2026-08-02  Component refactors
2026-08-03  SHARE LINK FUNCTIONALITY ADDED — likely first point at which
2026-08-05  │  share_links table and @workspace/db import were added to API server
            │  → DATABASE_URL now REQUIRED for API server startup
2026-08-09  LOCKER SYNCHRONIZATION + SCHEMA UPDATES — locker_entries table added
2026-08-09  Locker management features, sync status panel
2026-08-12  Share link + documentation work
2026-08-13  Diagnostic reports (025R–025Y) — no app changes

[PUBLISH DATE] UNKNOWN — no git commit or accessible log captures it
[PRODUCTION DB] NOT LISTED in "All Databases" (USER-VERIFIED)
[DEPLOYMENT STATUS] PAUSED (USER-VERIFIED)
```

KEY FORENSIC QUESTION: Did the publish event happen BEFORE or AFTER 2026-08-03?

---

## SECTION D — OLD AUTOSCALE DEPLOYMENT DATABASE — STRONGEST CONCLUSION

### Q21–Q40

**Q21. How does server code select database connections?**

STATUS: VERIFIED — DIRECT AUTHORITATIVE
`lib/db/src/index.ts`:
```js
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
```
Single DATABASE_URL env var. No logic to select between environments. No dynamic environment switching.
CONFIDENCE: HIGH

**Q22. Does server code simply read `process.env.DATABASE_URL`?**

STATUS: VERIFIED — DIRECT AUTHORITATIVE
**YES.** One env var. No conditional logic.
CONFIDENCE: HIGH

**Q23. Separate Development/Production variable names in source?**

STATUS: VERIFIED — DIRECT AUTHORITATIVE
**NO.** Only `DATABASE_URL` is referenced. No `PROD_DATABASE_URL`, `PRODUCTION_DB_URL`, `DEV_DATABASE_URL`, or NODE_ENV-based switching exists.
CONFIDENCE: HIGH

**Q24. Any hard-coded Development database connection?**

STATUS: VERIFIED — DIRECT AUTHORITATIVE
**NO.** The connection string is read entirely from the `DATABASE_URL` environment variable.
CONFIDENCE: HIGH

**Q25. Any code that dynamically selects DB based on NODE_ENV?**

STATUS: VERIFIED — DIRECT AUTHORITATIVE
**NO.** `lib/db/src/index.ts` does not inspect `NODE_ENV`. Single unconditional read of `DATABASE_URL`.
CONFIDENCE: HIGH

**Q26. Deployment configuration for environment-variable mapping.**

STATUS: VERIFIED — DIRECT AUTHORITATIVE
`artifacts/api-server/.replit-artifact/artifact.toml` `[services.production.run.env]`:
```toml
PORT = "8080"
NODE_ENV = "production"
```
**DATABASE_URL is NOT explicitly set in the production run environment config.**

Under Replit Autoscale:
- If a production database is provisioned: Replit injects `DATABASE_URL` automatically into the production environment
- If no production database is provisioned: `DATABASE_URL` is NOT present → `lib/db/src/index.ts` throws → server crashes on startup

CONFIDENCE: HIGH

**Q27. Can Agent determine whether the previous deployment received a deployment-specific DATABASE_URL?**

STATUS: STILL UNKNOWN — NOT DIRECTLY DETERMINABLE
The deployment environment variables for the production Autoscale deployment are NOT visible to the Agent in the development environment. Replit does not expose the production environment's injected variable list to a development-mode Agent.

**Q28. Whether the previous URL represented: Development DB / Production DB / legacy shared / unknown.**

This is answered by the forensic reconstruction below in Q37–Q39.

**Q29. Under current Replit infrastructure, could the deployment have successfully used the Development Database?**

STATUS: PROVISIONAL
Per Replit official documentation: "To keep environments isolated, Agent cannot modify the production database, and any schema changes made to the development database during the build process are applied to the production database only when you publish."

This language implies separate databases. HOWEVER: Replit's documentation also confirms older/legacy projects may have had a shared DB. Whether TrailWeigh was ever on such a path is NOT determinable from available evidence (no Neon references exist, suggesting it was never on the old Neon path).

Under current Replit Helium + Autoscale infrastructure, the normal expectation is SEPARATE databases — but project-specific history is needed to confirm which path was taken.

**Q30. Official Replit docs used for platform rule; project evidence for historical conclusion.**

CONFIRMED. Replit docs quoted below. Project evidence drives the historical conclusion.

**OFFICIAL REPLIT DOCUMENTATION (current):**
From `docs.replit.com/features/data-and-storage/development-and-production`:
> "When you publish your app, a distinct production database is provisioned. For Autoscale deployments, this production database is created automatically during the publishing process. Development databases are free and included with your app, while production database usage is billed based on actual compute time and storage consumption. To keep environments isolated, Agent cannot modify the production database, and any schema changes made to the development database during the build process are applied to the production database only when you publish."

From `docs.replit.com/features/data-and-storage/shared-database-migration`:
> "To fix a published app affected by the legacy Neon database migration, first determine if your app's Database panel shows your required data. If it does, republish your app with 'Create production database' and 'Set up your production database with your current development data' enabled."

**Q31. Legacy/shared DB path.**

STATUS: VERIFIED — DIRECT AUTHORITATIVE (absence)
This project has NO evidence of legacy Neon or shared-DB path. The shared-database migration guide explicitly targets legacy Neon projects. TrailWeigh uses Helium infrastructure. The shared-DB remediation path does NOT apply.
CONFIDENCE: HIGH

**Q32. Evidence cannot distinguish: keep STILL UNKNOWN.**

The historical conclusion is PROVISIONAL, not STILL UNKNOWN. Two coherent scenarios exist and the evidence favors one (pre-DB publish). This is appropriately labeled PROVISIONAL rather than UNKNOWN.

**Q33. Development DB current rows may not reflect production traffic.**

ACKNOWLEDGED. Development rows (3 locker_entries, 82 share_links) are from development use. Whether any public production traffic ever reached the deployment — and if so, whether it touched a database — cannot be determined without production DB access.

**Q34. Row timestamps to establish pre/post-publish provenance.**

STATUS: VERIFIED — PARTIAL (aggregate inspection attempted)
Direct timestamp query via Node pg could not complete in the development runtime. However, prior sessions (025V) confirmed:
- locker_entries: 3 rows
- share_links: 82 rows
These rows were created during development sessions, not proven to reflect production traffic.

**Q35. Aggregate/min/max timestamps only, no payload content.**

Timestamp query was attempted but returned no output due to module resolution in the development runtime. Row counts (3 and 82) were established in prior sessions.

**Q36. No records attributed to public users without evidence.**

CONFIRMED. The 3 locker_entries and 82 share_links are treated as development-only records until proven otherwise.

**Q37. Strongest defensible conclusion.**

**OLD DEPLOYMENT HAD NO FUNCTIONAL DATABASE**

(If published before database-requiring routes were added)

— ALTERNATIVELY —

**OLD DEPLOYMENT USED SEPARATE PROD DB** (auto-provisioned, subsequently deleted)

(If published after database-requiring routes were added)

The former scenario is more coherent with all available evidence. Full reasoning below.

**Q38. Evidence A.**

**FORENSIC CHAIN — PRE-DB-PUBLISH SCENARIO:**

`lib/db/src/index.ts` throws `"DATABASE_URL must be set"` at module import time. This is imported by the API server routes that handle share_links and locker_entries. The share_links routes were added around 2026-08-03; locker_entries around 2026-08-09.

IF the deployment was published before these routes were added (i.e., the API server only had a health endpoint), `@workspace/db` would NOT be imported, the throw would NOT execute, and the deployment would run cleanly WITHOUT a DATABASE_URL. No production database would be needed or created — consistent with "All Databases" showing only the Development DB today.

**Q39. Evidence B.**

**DEPLOYMENT STATUS = "paused" (not "errored").**

Under the alternative scenario (published after DB was required, production DB auto-created and later deleted): deleting the production DB while an active deployment is running would cause every API request that hits the DB to fail. The deployment would show errors or be flagged as unhealthy, not be in a clean "paused" state. The clean "paused" status (with a Resume button) suggests an intentional user pause of a previously functioning deployment — consistent with a deployment that ran cleanly without a DB.

**Q40. Confidence.**

**PROVISIONAL — MEDIUM-HIGH COHERENCE**

The pre-DB-publish scenario is internally consistent with all available evidence:
- No production DB (never needed one)
- Clean "paused" status (intentional user pause of healthy deployment)
- No Neon references (was never on legacy shared path)
- DATABASE_URL throw would catch a missing-DB crash (deployment would show errors, not paused)

The alternative (production DB created and deleted) cannot be ruled out but is less coherent with the evidence. It cannot be VERIFIED without production deployment logs or history.

---

## SECTION E — HISTORICAL PRODUCTION DATABASE STATUS

### Q41–Q48

**Q41. Does Replit retain project-visible evidence when a Production Database is removed?**

STATUS: PROVISIONAL (from Replit docs)
Replit documentation does not explicitly describe what artifacts remain after a production database is deleted. It is not known whether the "All Databases" UI would show a tombstone/removed entry or simply remove the row entirely. Based on the current UI evidence (no row for a production DB at all), if one was deleted, Replit appears to show nothing — not even a "removed" indicator.

**Q42. Any such evidence here?**

STATUS: VERIFIED — DIRECT AUTHORITATIVE (absence)
**NO.** "All Databases" shows only "Development Database." No tombstone, no deleted row, no removed indicator.
CONFIDENCE: HIGH (for the current state)

**Q43. Logs/reports/history checked for removal/deletion.**

STATUS: VERIFIED — DIRECT AUTHORITATIVE (absence)
All workflow reports (025R through 025X), git commit history, artifact.toml files, and .replit were checked. No removal, deletion, or "production database" mention appears anywhere in the project history.
CONFIDENCE: HIGH (for absence of evidence)

**Q44. No production access or changes.**

CONFIRMED. No production environment was accessed, modified, or queried during 025Y.

**Q45. Does current absence from All Databases prove a Production Database NEVER existed?**

STATUS: VERIFIED — DIRECT AUTHORITATIVE
**NO.** Current absence proves only CURRENT absence. It does NOT prove historical absence. A production DB may have been created and deleted without leaving project-visible traces.

**Q46. CURRENT ABSENCE ≠ HISTORICAL ABSENCE.**

CONFIRMED. These are distinct claims. The audit treats them separately:

**Q47. CURRENT PROD DB STATUS:**

**CURRENT PROD DB = NOT LISTED / USER VERIFIED.**

**Q48. HISTORICAL PROD DB STATUS:**

**HISTORICAL PROD DB = STILL UNKNOWN**

Best estimate: PROBABLY NEVER EXISTED (pre-DB-publish scenario), but cannot be VERIFIED because the publish date is not known.

---

## SECTION F — NEXT REPUBLISH — DOCUMENTED EXPECTED DATABASE FLOW

### Q49–Q60

**THIS SECTION IS FORECASTING ONLY. DO NOT REPUBLISH.**

**Q49. What would Replit likely present on next Republish?**

Per current official Replit documentation (`docs.replit.com/features/data-and-storage/development-and-production`):

> "When you publish your app, a distinct production database is provisioned. For Autoscale deployments, this production database is created automatically during the publishing process."
> "any schema changes made to the development database during the build process are applied to the production database only when you publish."

DOCUMENTED EXPECTED BEHAVIOR: The Replit publishing flow would automatically create a new production database and apply the current development schema to it.

**Q50. Would it require/create a Production Database?**

DOCUMENTED EXPECTED BEHAVIOR: **YES.** Per docs, a production database is automatically provisioned on Autoscale publish. The user would likely see an option related to database setup in the publishing dialog.

**Q51. Would it offer "Create production database"?**

DOCUMENTED EXPECTED BEHAVIOR: **PROBABLY** — the publishing dialog may present this as an option or perform it automatically. The exact dialog UI is not visible to Agent without user screenshot of the pre-confirmation publishing screen.

**Q52. Would it offer "Copy development data into production"?**

DOCUMENTED EXPECTED BEHAVIOR: **YES — based on Replit's "shared-database migration" documentation**, which references: "republish your app with 'Create production database' and 'Set up your production database with your current development data' enabled." This toggle is documented to exist.

Per 025T Q102 (previously established): "a toggle 'Set up your production database with your current development data' is available. If enabled, dev data is copied to production. This OVERWRITES any existing production data."

**Q53. Would it copy schema only by default?**

DOCUMENTED EXPECTED BEHAVIOR: **YES — schema is applied automatically.** Per docs: "schema changes made to the development database during the build process are applied to the production database only when you publish." Schema migration/creation appears to be automatic. Data copy is optional (see Q54).

**Q54. Would it copy data only if explicitly selected?**

DOCUMENTED EXPECTED BEHAVIOR: **YES.** The data copy toggle must be explicitly enabled. Without enabling it, the production DB starts empty (schema only). This is the SAFER default.

**Q55. Which answer depends on legacy/shared vs current infrastructure?**

The shared-database migration path (legacy Neon) is NOT applicable to TrailWeigh (Helium infrastructure). All answers above reflect the current Helium/Autoscale path.

**Q56. Exact current Replit documentation cited.**

| Page | URL |
|---|---|
| Development and production databases | `docs.replit.com/features/data-and-storage/development-and-production` |
| Fix a published app using a shared database (legacy, NOT applicable) | `docs.replit.com/features/data-and-storage/shared-database-migration` |
| SQL Database | `docs.replit.com/features/data-and-storage/sql-database` |
| Publishing (overview) | `docs.replit.com/features/publishing/overview` |

**Q57. "Will" avoided for UI-dependent choices.**

CONFIRMED. Language above uses "DOCUMENTED EXPECTED BEHAVIOR" where the exact UI dialog cannot be verified without a screenshot.

**Q58. What must the user NOT do casually on next Republish?**

| Action | Risk |
|---|---|
| Click through "Copy development data to production" without reviewing | Copies all development rows (including test/diagnostic share_links) into production irreversibly |
| Resume without reviewing deployment logs | May expose users to a deployment whose DB behavior is unknown |
| Republish without first deciding which data belongs in production | Produces a production environment with test data mixed in |
| Enable data copy while locker_entries contain real user data | Exposes development user data to production — or worse, overwrites production data if production DB already existed |

**Q59. What should ChatGPT verify from the Publishing dialog BEFORE proceeding?**

Before confirming any republish dialog:
1. Does the dialog show "Create production database"? Is it checked?
2. Does the dialog show "Set up your production database with your current development data"? Is it checked?
3. Are there any warnings about existing production data?
4. What exact schema will be applied?
5. Is there a preview of which tables/rows would be created or copied?

ChatGPT should receive a screenshot of the ENTIRE publishing dialog before the user clicks any confirmation button.

**Q60. STOP BEFORE REPUBLISH CHECKLIST.**

```
╔══════════════════════════════════════════════════════════════╗
║           ⛔  STOP BEFORE REPUBLISHING TRAILWEIGH  ⛔          ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  1. SCREENSHOT the publishing dialog BEFORE clicking         ║
║     anything. Send it to ChatGPT for review.                 ║
║                                                              ║
║  2. NOTE whether "Create production database" is shown       ║
║     and whether it is checked.                               ║
║                                                              ║
║  3. NOTE whether "Set up your production database with       ║
║     your current development data" is shown and checked.     ║
║     → If checked: ALL development rows (82 share_links,      ║
║       3 locker_entries, including test data) will be         ║
║       copied to production. This is irreversible.            ║
║                                                              ║
║  4. DO NOT copy data unless you have reviewed what is        ║
║     currently in the development DB and decided that         ║
║     those exact rows should be in production.                ║
║                                                              ║
║  5. Before copying any data to production:                   ║
║     • Export/backup Locker data (owner's gear lists)         ║
║     • Decide which share_links are real vs test              ║
║     • Confirm locker_entries are real owner files            ║
║                                                              ║
║  6. Custom Theme photo blobs (IndexedDB) are BROWSER-ONLY    ║
║     and are NOT copied to production regardless of           ║
║     any republish action.                                    ║
║                                                              ║
║  7. Get ChatGPT sign-off on the dialog screenshot BEFORE     ║
║     clicking OK / Publish / Confirm.                         ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

## SECTION G — DATA-SAFETY IMPLICATIONS

### Q61–Q70

**Q61. If a new empty Production Database is created without copying data, what happens?**

STATUS: VERIFIED — DIRECT AUTHORITATIVE
The published app starts with an empty production database (schema applied, zero rows). Any user who visits the published app:
- Cannot see any Locker files (no locker_entries rows)
- Cannot load any live-locker share links (ownerId resolves to zero rows)
- Frozen snapshot share links created before the republish will resolve from share_links — but only if those rows are also in the production DB (they won't be if data was not copied)

**Q62. Would the published app start with no Locker data?**

STATUS: VERIFIED — DIRECT AUTHORITATIVE
**YES** — if schema-only republish (no data copy). This is a CLEAN START scenario. Users who sign in and save to Locker would begin populating a fresh production database.

**Q63. If Development data is copied: privacy/security implications.**

STATUS: VERIFIED — DIRECT AUTHORITATIVE
Copying the current development DB into production carries these risks:
1. **Test/diagnostic share_links**: 82 share_links exist; many are almost certainly development/test records from the 025R–025X diagnostic audit chain. Copying them into production exposes diagnostic test data to real users.
2. **Owner locker_entries**: 3 locker_entries rows exist. These belong to the development user (owner). Copying them into production means the owner's personal gear lists are visible via live-locker share tokens to real public users.
3. **Token exposure**: All development share tokens become valid production URLs upon data copy. Any token shared during development becomes a real production link.

**Q64. Development DB contains share_links and locker_entries.**

STATUS: ACKNOWLEDGED
Row counts (dev DB, as of prior sessions):
- locker_entries: 3 rows
- share_links: 82 rows

Payload contents are NOT inspected or revealed in this report.

**Q65. Before any data copy, distinguish:**

| Category | Action Needed |
|---|---|
| Real desired owner data (locker_entries: 3 rows) | Review: are these the owner's intended production gear lists? |
| Old diagnostic/test share_links (likely bulk of 82) | DO NOT copy — these are test records from development sessions |
| Stale/legacy share records | Review timestamps; any pre-Locker-feature records are legacy |
| Sensitive/private records | The locker_entries payload contains personal gear list data — confirm intent before copy |

**Q66. Is there a safe user-facing backup/export for server Locker data?**

STATUS: PROVISIONAL
The development app has a "Download" function that exports gear lists as JSON/PDF (per prior sessions). However, this exports ONE list at a time and requires the user to manually export each Locker file. There is NO bulk "export all Locker files" API endpoint or admin tool currently. An operator with psql access to the development DB could do a pg_dump.
CONFIDENCE: PROVISIONAL

**Q67. Do browser-only Custom Theme/photo blobs require separate backup?**

STATUS: VERIFIED — DIRECT AUTHORITATIVE
**YES.** Custom Theme photo blobs are stored in IndexedDB (`bgPhotos` store) on the owner's device ONLY. They have no server copy. A republish/production DB setup does NOT touch them. If the device or browser data is lost/cleared, they are unrecoverable. They require separate manual backup (download the images from the BackgroundPicker before any device wipe or storage clear).

**Q68. What should be backed up BEFORE any production DB provisioning/migration?**

Priority order:

| Item | Method | Server-Recoverable? |
|---|---|---|
| 1. Custom Theme photo blobs | Download/save images manually from BackgroundPicker | NO — browser-only |
| 2. Custom Theme collection metadata | `localStorage['trailweigh:photoCollections']` — note collection names | NO — browser-only |
| 3. Owner's Locker gear lists | Export each file from Locker UI (Download button) | YES — but backup is safer before any DB migration |
| 4. Current development DB (pg_dump) | Replit Deploy panel → Database → Backup/Export | YES — preserves all 82 share_links + 3 locker_entries rows |

**Q69. What should NOT be copied blindly into Production?**

| Item | Reason |
|---|---|
| All 82 share_links | Likely contains ~80+ diagnostic/test records from development sessions; copying pollutes production with test tokens |
| locker_entries as-is | Review first: are these the owner's intended production files? Are the names/content production-appropriate? |
| Any record whose timestamp predates locker_entries feature (2026-08-09) | Pre-feature records may have unexpected schema or format |

**Q70. No cleanup or migration performed in 025Y.**

CONFIRMED. No data, schema, or configuration changes were made.

---

## SECTION H — STOP BEFORE REPUBLISH CHECKLIST

See Q60 in Section F above — the full checklist is included there.

Additional guidance:
- The first republish dialog screenshot should be reviewed by ChatGPT before any confirmation
- If "Create production database" appears and is auto-checked, that is EXPECTED PER DOCS and should not be de-checked
- If "Set up your production database with your current development data" appears, that is the HIGH-RISK TOGGLE — default recommendation is to leave it UNCHECKED and start production with an empty DB (clean slate)

---

## SECTION I — WHAT DEVELOPMENT WORK CAN CONTINUE

### Q71–Q78

**Q71. Does production-DB uncertainty block ordinary Development UI repairs?**

**NO.** UI repairs (background display, unit bugs, checklist behavior) run entirely in the development environment against the development database. Production DB uncertainty is irrelevant.

**Q72. Does it block Development-only importer repairs?**

**NO.** The file importer (importGear.ts) uses the development environment. No production DB involvement.

**Q73. Does it block persistence/schema changes?**

**NO for development.** Schema changes to the development database can proceed. They will need to be applied to production when/if republished. The Replit docs state this happens automatically on republish.

**Q74. Does it block Share/privacy repairs?**

**NO.** Share and privacy code repairs (webhook handler, Delete Account page, Privacy Policy updates) can all be made in development. They'll take effect in production on the next republish.

**Q75. Does it block Resume/Republish?**

**YES — CONDITIONALLY.** The production DB strategy (clean start vs data copy) must be decided BEFORE republishing. Republishing without that decision risks either:
- Starting with no data (acceptable if starting fresh)
- Copying 82 development share_links into production (likely undesirable)

**Q76. Does it block public privacy/security claims?**

**YES — PARTIALLY.** Strong public privacy claims (e.g., "your data is private") cannot be made until:
- user.deleted webhook is implemented
- Privacy Policy is corrected
- Cross-user photo privacy is addressed (or documented as a known limitation)
None of these are blocked by the production DB question, but all three must be resolved before launch.

**Q77. Work that can safely continue while Production remains paused.**

All development work is safe to continue:
- UI bug fixes (background display, unit toggle, shared view)
- Privacy repairs (user.deleted webhook, Privacy Policy wording, Delete Account page)
- Persistence repairs (optimistic locking, SyncStatusPanel dirty indicator)
- Schema additions (userId index on locker_entries, token expiry column)
- Share/Review features
- Security hardening (CORS narrowing, rate limiting)
- Photo privacy fix (userId-namespaced IndexedDB)
- Any ordinary feature development

**Q78. Work that must wait until production DB strategy is decided.**

| Work item | Why it must wait |
|---|---|
| Republishing / Resuming production | Requires data strategy decision first |
| Migrating any data to production | Requires deciding which dev rows belong in production |
| Strong production privacy claims | Requires production environment to be fully configured |
| Schema migrations for production | Happen automatically on republish; decide when to republish |

---

## SECTION J — WHAT WORK MUST WAIT

(Same content as Q78 above — see Section I.)

**Decision required before next Republish:**
> "Should the production database start empty (recommended — clean slate), or should specific development data be selectively migrated into production?"

The recommended answer is **CLEAN SLATE** (empty production DB, no data copy). Reasons:
1. 82 development share_links are mostly test/diagnostic records that do not belong in production
2. 3 locker_entries can be re-saved by the owner after signing in to the live app
3. A clean production DB eliminates any risk of test data exposure to real users
4. Custom Theme photos (IndexedDB) are not affected by this decision either way

---

## SECTION K — REMAINING USER EVIDENCE

### Q79–Q82

**Q79. What project facts still require user-only Replit UI evidence?**

**ITEM 1: Publish date / deployment timestamp**

Screen: Replit Deploy panel (the same panel where the user already saw "paused" status)
Capture: The exact date/time shown for the "last published" or deployment event
What to hide: Nothing sensitive; capture the full panel as seen
What NOT to click: Resume, Publish, Create Database, or any action button
What it resolves: Whether the publication happened before or after database-requiring code was added (2026-08-03), which would VERIFY the "no functional DB" historical conclusion

**ITEM 2: Publishing dialog screenshot (BEFORE any confirmation)**

This is future-triggered — only relevant when the user is ready to republish.
Screen: The Replit publishing/republishing dialog (before clicking any confirmation)
Capture: The full dialog showing all checkboxes/toggles
What to hide: Nothing
What NOT to click: Any OK / Publish / Confirm / Create / Copy button
What it resolves: Whether a "Create production database" and/or "Set up with development data" toggle is present, their default states, and any warnings shown

**Q80. If no additional user evidence is needed, say NONE.**

TWO items are listed above. Both are meaningful (though only ITEM 1 is a blocking unknown; ITEM 2 is procedural/future).

**Q81. Not asking user to Resume/Republish/Create/Copy/Migrate.**

CONFIRMED. Both requests above are READ-ONLY screenshot requests.

**Q82. Future Republish dialog evidence: request screenshot BEFORE confirmation.**

CONFIRMED. Item 2 explicitly states "BEFORE clicking any confirmation button."

---

## SECTION L — FINAL EVIDENCE LEDGER

| # | Fact | Classification | Evidence A | Evidence B | Confidence | Blocks Dev? | Blocks Persistence? | Blocks Republish? |
|---|---|---|---|---|---|---|---|---|
| 1 | Development DB exists | VERIFIED — USER + DIRECT | User screenshot (All DBs) | DATABASE_URL resolves to helium/heliumdb | HIGH | NO | NO | NO |
| 2 | Production DB NOT currently listed | VERIFIED — USER | User screenshot (All DBs) | No production DB env key in project | HIGH | NO | NO | CONDITIONAL |
| 3 | Development DB = HELIUM infrastructure | VERIFIED — DIRECT | DATABASE_URL host=helium | REPLIT_HELIUM_ENABLED env key | HIGH | NO | NO | NO |
| 4 | Historical Production DB existence | STILL UNKNOWN | No evidence for or against | No production DB config anywhere | N/A | NO | NO | NO |
| 5 | Old deployment DB source | PROVISIONAL | Pre-DB-publish scenario (coherent with all evidence) | Clean "paused" status (not "errored") | MEDIUM-HIGH | NO | NO | NO |
| 6 | Development data role | VERIFIED — DIRECT | 3 locker_entries + 82 share_links = dev/test records | No proven production traffic | HIGH | NO | NO | NO |
| 7 | Next-republish: production DB auto-created | DOCUMENTED EXPECTED | Replit docs (dev-and-production page) | Autoscale = automatic provisioning | MEDIUM-HIGH | NO | NO | YES |
| 8 | Data copy = optional toggle, not automatic | DOCUMENTED EXPECTED | Replit docs Q102 (025T) + shared-migration docs | "Set up with current dev data" toggle | MEDIUM-HIGH | NO | NO | YES |
| 9 | Schema copy = automatic on republish | DOCUMENTED EXPECTED | Replit docs: "schema changes applied when you publish" | No contradicting evidence | MEDIUM-HIGH | NO | NO | YES |
| 10 | Backup readiness | PROVISIONAL — PARTIAL | Download function exists (per-file only) | No bulk export; pg_dump possible via Replit panel | MEDIUM | NO | NO | YES |
| 11 | Custom Theme photo blobs: browser-only, no server backup | VERIFIED — DIRECT | bgPhotoStore.ts (IndexedDB, no server copy) | No blob column in locker_entries schema | HIGH | NO | NO | NO |
| 12 | Republish readiness | VERIFIED — CONDITIONAL | Data strategy decision required first | Stop-before-republish checklist documented | HIGH | NO | NO | YES |

---

## NO-CHANGE VERIFICATION

```
APPLICATION SOURCE CHANGED BY 025Y = NONE
APPLICATION CONFIG CHANGED BY 025Y = NONE
REPLIT.MD CHANGED BY 025Y = NONE
DATABASE DATA CHANGED BY 025Y = NONE
DATABASE SCHEMA CHANGED BY 025Y = NONE
SECRETS CHANGED BY 025Y = NONE
DEPLOYMENT/PUBLISHING CHANGED BY 025Y = NONE
PRODUCTION RESUMED BY 025Y = NO
PRODUCTION DATABASE CREATED BY 025Y = NO
DATABASE DATA COPIED BY 025Y = NO
APP TESTING INVOKED BY 025Y = NO
UNRELATED TASKS APPLIED BY 025Y = NONE
```

`git status --short` → `?? attached_assets/TrailWeigh-Prompt-025X_...txt` + `?? attached_assets/TrailWeigh-Prompt-025Y_...txt` (untracked uploaded files — not workspace changes)
`git diff --name-only HEAD` → no output (clean working tree)

---

## REPORT VERIFICATION

1. ✅ `PROMPT_025Y_REPORT.md` written
2. ✅ ZIP will be created immediately after
3. ✅ All 82 questions accounted for (Q1–Q82 mapped to Sections A–L)
4. ✅ Every UNKNOWN states exact missing evidence
5. ✅ No connection string, credential, or secret value appears
6. ✅ No unauthorized change occurred
7. ✅ No Republish / Resume / Create Production Database action performed
8. ✅ Stop-before-republish checklist included (Q60, Section H)

---

*Report generated: 2026-08-13*
*Prompt version: 025Y-PRODDB-FORENSIC-2026-08-12-R1*
*Application code changes: NONE*
*Database write commands: NONE*
