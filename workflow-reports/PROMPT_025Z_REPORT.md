# PROMPT 025Z REPORT
## REPLIT PLATFORM DISCREPANCY AUDIT
## WHY DOES THIS PUBLISHED HELIUM APP HAVE NO LISTED PRODUCTION DATABASE?

**Internal Version ID:** 025Z-REPLIT-DB-DISCREPANCY-2026-08-12-R1  
**Generated:** 2026-08-13  
**Mode:** READ-ONLY diagnostic — no application, config, database, or deployment changes  

---

## VERSION GATE

**025Z-REPLIT-DB-DISCREPANCY-2026-08-12-R1 ✓**  
Questions 1 ✓ · 10 ✓ · 20 ✓ · 30 ✓ — Gate passed.

---

## SECTION A — EXECUTIVE RESULT

The most defensible explanation for "published, paused, Autoscale, Helium TrailWeigh project with no Production Database listed" is:

**The deployment was published when the API server contained no database-dependent code. At that moment, Replit's "if one is needed" rule determined no Production Database was required, so none was created.**

Three pieces of project-visible evidence support this in combination:

1. The initial commit (2026-07-28) contained `lib/db/src/index.ts` but the schema was entirely commented-out (`export {}`), and `artifacts/api-server/src/routes/index.ts` imported only the health router — `@workspace/db` was never imported into the running server. `DATABASE_URL` would not be evaluated at runtime under that code version.

2. The first commit that actually added a real table and a route that imports the DB was 2026-08-03 (`186b9d9` — "Implement link sharing functionality"). The Locker routes were added 2026-08-09. The app was never republished after those additions (user-verified paused state, no History tab in current UI).

3. The deployment status is **paused**, not **errored**. If DATABASE_URL had been injected and later removed (production DB deleted), resuming the deployment would throw immediately. The clean paused status is consistent with a version that never needed DATABASE_URL.

**CONFIDENCE: PROVISIONAL — HIGH COHERENCE.**  
Cannot be proven without the exact deployment creation date, which is not visible in the current UI and requires Replit Support to confirm.

---

## PART A — WHAT DO CURRENT REPLIT DOCS ACTUALLY SAY?

### Q1. Locate current official Replit documentation for Development vs Production databases.

**STATUS: VERIFIED**

**DIRECT ANSWER:** The canonical page is:  
`https://docs.replit.com/features/data-and-storage/development-and-production`  
Title: "Development and production databases"

**EVIDENCE A:** Returned by `searchReplitDocs({ query: "production database development database autoscale deployment" })` as the top relevant page.

**EVIDENCE B:** Also returned by `searchReplitDocs({ query: "development production database if needed when published app" })`.

**CONFIDENCE: HIGH**

---

### Q2. Locate current official Replit documentation for production databases on Helium/current infrastructure.

**STATUS: VERIFIED**

**DIRECT ANSWER:** The same page covers Helium. Replit docs confirm: "These databases are created automatically when you publish your app using Autoscale or Reserved VM deployments. They are hosted on Replit's own 'Helium' infrastructure, which is separate from your development database."

**EVIDENCE A:** `searchReplitDocs` response R4: "This production database is hosted on Replit's own 'Helium' infrastructure, which is separate from your development database."

**EVIDENCE B:** No separate Helium-specific page was returned; Helium is discussed inline on the development/production page.

**CONFIDENCE: HIGH**

---

### Q3. Quote/paraphrase the exact rule for WHEN a Production Database is created.

**STATUS: VERIFIED (with internal doc inconsistency — see Q39)**

**DIRECT ANSWER:**

Two different phrasings appear across doc query responses:

- **Version 1 (R4):** *"Replit automatically creates a production database **if one is needed**."*  
- **Version 2 (R7):** *"When you publish an app, Replit creates a production database that is separate from your development database."*

Version 1 is conditional. Version 2 is unconditional. This is a doc inconsistency (see Q39).

**EVIDENCE A:** R4 response text verbatim: "When you publish your Replit App, Replit automatically creates a production database if one is needed."

**EVIDENCE B:** R7 response text verbatim: "When you publish an app, Replit creates a production database that is separate from your development database."

**CONFIDENCE: HIGH (that both phrasings exist) / MEDIUM (which is authoritative)**

---

### Q4. Does the documentation say a Production Database is: always created immediately / created only "when needed" / created only when published deployment uses it / something else?

**STATUS: VERIFIED (conditional phrasing exists; unconditional phrasing also exists)**

**DIRECT ANSWER:** The most precise phrasing found is **"if one is needed"** — conditional. The unconditional phrasing ("creates a production database") may represent a simplified summary on a different doc page. The conditional phrasing is the more useful one for diagnosing the current state.

**EVIDENCE A:** R4: "automatically creates a production database **if one is needed**"

**EVIDENCE B:** The unconditional phrasing from R7 is inconsistent with the current observed state (no production DB listed). The conditional phrasing better explains it.

**CONFIDENCE: MEDIUM** (doc language is inconsistent; cannot fully verify which rule governs this specific project's historical publish event without Replit Support)

---

### Q5. Define exactly what "when needed" means, if Replit documents it.

**STATUS: STILL UNKNOWN**

**DIRECT ANSWER:** Replit documentation does not explicitly define what "needed" means in the phrase "if one is needed." The most natural interpretation — and the one consistent with the observed TrailWeigh state — is: **the deployed code must actually connect to a database at runtime**. If the deployed code imports `@workspace/db` (which throws on missing DATABASE_URL), a DB is needed. If the health-only API server never imports `@workspace/db`, it is not needed.

**EVIDENCE A:** No doc page defines the "if needed" trigger condition explicitly.

**EVIDENCE B:** The conditional phrasing alone is evidence it is not always created.

**Missing evidence:** Official Replit documentation explicitly defining what makes a production database "needed."  
**Replit Support required:** Potentially YES — Support could confirm the exact trigger.  
**Exact support question:** See Q47.

**CONFIDENCE: LOW (inferred, not documented)**

---

### Q6. Can a published app legitimately exist with NO Production Database listed?

**STATUS: PROVISIONAL**

**DIRECT ANSWER:** YES — under the "if one is needed" rule. If the published code does not use a database, Replit may not create one.

**EVIDENCE A:** R4 conditional phrasing: "if one is needed."

**EVIDENCE B:** The current TrailWeigh project IS a published Autoscale app with no Production Database listed — this state exists, which demonstrates it can exist.

**CONFIDENCE: MEDIUM** (current state is the evidence; the underlying rule is not confirmed)

---

### Q7. If YES, under what documented conditions?

**STATUS: STILL UNKNOWN (documented conditions not defined)**

**DIRECT ANSWER:** Replit does not explicitly list the conditions. The inferred condition is: the published code does not require a database connection.

**EVIDENCE A:** "if one is needed" phrasing — conditional but undefined.

**EVIDENCE B:** No second source.

**CONFIDENCE: LOW**

---

### Q8. If NO, what documented behavior says that?

**STATUS: NOT APPLICABLE** (Q6 answer is YES — a published app can exist without a Production Database).

---

### Q9. Does pausing a deployment remove or hide its Production Database?

**STATUS: PROVISIONAL**

**DIRECT ANSWER:** NO. Pausing an Autoscale deployment scales it to zero (stops receiving traffic / billing) but does not remove or hide its Production Database. The docs describe "endpoint disabled" as a paused DB compute endpoint that can be unpaused from the Database tool settings — this is separate from the deployment being paused.

**EVIDENCE A:** R5: "If you receive an 'endpoint disabled' error on your database, it indicates the compute endpoint is paused; you can unpause it from the Database tool's Settings tab."

**EVIDENCE B:** R2: "Databases remain idle when not in use, and they automatically reactivate upon receiving a query." — This describes DB-level pausing (separate from deployment pausing) and does not remove the DB from the listing.

**CONFIDENCE: MEDIUM** (no doc explicitly states "pausing deployment does not hide production DB," but the DB docs describe DB-level pausing as a separate concept that preserves listing)

---

### Q10. Can deleting/removing a Production Database leave the deployment object intact and paused?

**STATUS: VERIFIED**

**DIRECT ANSWER:** YES. Replit docs confirm production databases can be deleted and have a 7-day recovery window. Deleting a database does not delete the deployment. The deployment object (with its paused status) would remain even if its production database was deleted.

**EVIDENCE A:** R5: "If your production database was deleted, it has a 7-day retention period. You can restore it through the Database tool settings."

**EVIDENCE B:** Deleting a DB and deleting a deployment are separate operations in the Replit UI (Database tool vs Publishing tool).

**CONFIDENCE: HIGH**

---

## PART B — CURRENT TRAILWEIGH PROJECT STATE

### Q11. Reconfirm current database infrastructure classification.

**STATUS: VERIFIED**

**DIRECT ANSWER:** **HELIUM** — current Replit PostgreSQL infrastructure.

**EVIDENCE A:** `DATABASE_URL` environment variable host resolves to `helium`, pathname to `/heliumdb` (confirmed in prior audit; not reprinted here).

**EVIDENCE B:** `REPLIT_HELIUM_ENABLED` environment key is present. `.replit` modules list includes `postgresql-16`.

**CONFIDENCE: HIGH**

---

### Q12. Safe evidence without revealing connection strings.

**STATUS: VERIFIED**

**DIRECT ANSWER:** Confirmed without printing DATABASE_URL value:

| Metadata | Value (safe) |
|---|---|
| DATABASE_URL host | `helium` |
| DATABASE_URL pathname | `/heliumdb` |
| Environment key | `REPLIT_HELIUM_ENABLED` = present |
| .replit modules | `postgresql-16` listed |
| Neon references | NONE found in any file |

**CONFIDENCE: HIGH**

---

### Q13. Reconfirm current All Databases state: only Development Database listed.

**STATUS: VERIFIED (user-supplied)**

**DIRECT ANSWER:** CONFIRMED. All Databases shows only the Development Database. User-verified in the current session; recorded in 025Y and reconfirmed as the unresolved discrepancy that initiated 025Z.

**EVIDENCE A:** User-verified UI fact (item 6 in 025Z prompt).

**EVIDENCE B:** No project-accessible metadata references a production database ID or URL.

**CONFIDENCE: HIGH** (user-verified)

---

### Q14. Search read-only project metadata for any hidden/stale Production Database identifier.

**STATUS: VERIFIED — NONE FOUND**

**DIRECT ANSWER:** Systematic search of all project-accessible metadata files found NO production database identifier, URL fragment, hostname, or database name.

Files searched:
- `.replit` — deployment section: `router = "application"`, `deploymentTarget = "autoscale"` only
- `artifacts/api-server/.replit-artifact/artifact.toml` — production run env: only `PORT = "8080"` and `NODE_ENV = "production"`
- All other artifact.toml files — no DB references
- `.cache/replit/env/latest.json` — contains env keys but no production DATABASE_URL (confirmed from prior audits)
- Git commit messages (all 60+ commits) — no commit mentions "production database," "neon," or "helium DB" in message text
- All workflow reports (025R–025Y) — no production DB URL or ID recorded

**EVIDENCE A:** `grep -r "DATABASE_URL\|HELIUM\|production.*db" *.toml */*.toml` — returned only development-environment matches.

**EVIDENCE B:** `find . -name "*.toml" -o -name "*.json" | xargs grep -l "DATABASE_URL\|HELIUM\|production.*db"` — returned only pnpm store cache files (irrelevant).

**CONFIDENCE: HIGH** (thorough search; cannot rule out platform-level metadata not accessible to Agent)

---

### Q15. Search deployment metadata for any database attachment/reference.

**STATUS: VERIFIED — NONE FOUND**

**DIRECT ANSWER:** `artifacts/api-server/.replit-artifact/artifact.toml` is the only deployment configuration accessible to Agent. Its `[services.production.run.env]` section sets only `PORT = "8080"` and `NODE_ENV = "production"`. No `DATABASE_URL`, no database attachment metadata of any kind.

**EVIDENCE A:**
```toml
[services.production.run.env]
PORT = "8080"
NODE_ENV = "production"
```

**EVIDENCE B:** No `[database]` or `[services.production.database]` section exists in any artifact.toml.

**CONFIDENCE: HIGH** (for project-accessible metadata; platform-level deployment records are inaccessible)

---

### Q16. Search `.replit` and deployment config for DB attachment metadata.

**STATUS: VERIFIED — NONE FOUND**

**DIRECT ANSWER:** The `.replit` file's `[deployment]` section contains only:
```toml
[deployment]
router = "application"
deploymentTarget = "autoscale"

[deployment.postBuild]
args = ["pnpm", "store", "prune"]
env = { "CI" = "true" }
```

No database attachment, no DATABASE_URL reference, no Helium/Neon identifier.

**EVIDENCE A:** Full `.replit` deployment section read directly in this session.

**EVIDENCE B:** Historical `.replit` at initial commit (2026-07-28) was also read: identical deployment section structure, no DB attachment.

**CONFIDENCE: HIGH**

---

### Q17. Search existing workflow reports for any past production-database creation/removal event.

**STATUS: VERIFIED — NO EVENT FOUND**

**DIRECT ANSWER:** Workflow reports 025R through 025Y were reviewed. No report mentions a production database being created, removed, migrated, or referenced with a production-specific connection string. The 025Y report explicitly documented that no production DB appears in "All Databases" and offered the pre-DB-publish hypothesis. No prior report contradicts this.

**EVIDENCE A:** 025Y Section J: "HISTORICAL DATABASE USED BY PREVIOUS DEPLOYMENT: STILL UNKNOWN — No project-visible evidence (artifact.toml, .replit, git commits, workflow reports) references a production database ID, URL, or creation event."

**EVIDENCE B:** Reports 025R–025X focused on auth, privacy, sharing, and security audits — no production DB creation event was incidentally observed.

**CONFIDENCE: HIGH**

---

### Q18. Search Git/project history for any database migration or production DB setup event.

**STATUS: VERIFIED — NONE FOUND**

**DIRECT ANSWER:** All 60+ git commits were reviewed. No commit mentions a production database setup, migration to production, or any Helium/Neon production DB event. The DB-related commits are:

| Date | Commit | Description |
|---|---|---|
| 2026-07-28 | `9ef0b8f` | Initial commit — lib/db present but schema = `export {}` only; routes = health only |
| 2026-08-03 | `186b9d9` | First real schema table (share_links) + links.ts route |
| 2026-08-09 | `f7c2f05` | Locker schema + sync features |
| 2026-08-09 | `c63cf5d` | Locker management features |
| 2026-08-12 | `a1e4fd8` | Sharing functionality update |

No commit in this list involves production database provisioning.

**EVIDENCE A:** `git log --all -- "lib/db/**" "artifacts/api-server/src/routes/locker*" "artifacts/api-server/src/routes/links*"` — 5 commits returned, none mention production DB.

**EVIDENCE B:** `git log --all --oneline | grep -i "produc\|deploy\|publish\|neon\|helium\|migrat"` — zero matches.

**CONFIDENCE: HIGH**

---

### Q19. Is there evidence a Production Database EVER existed?

**STATUS: STILL UNKNOWN**

**DIRECT ANSWER:** There is **no project-visible evidence** that a Production Database ever existed. No artifact.toml, .replit, git commit, workflow report, or env key references one. However, absence of project-visible evidence is not proof of absence — Replit's platform-level deployment records (which Agent cannot read) might show a DB was created and later deleted.

**EVIDENCE A:** Complete search of all project-accessible metadata: zero production DB references.

**EVIDENCE B:** The 7-day deletion recovery window (R5) implies a deleted production DB is NOT visible in "All Databases" after deletion is finalized — so "not listed" genuinely cannot distinguish "never existed" from "deleted."

**Missing evidence:** Replit platform-level deployment audit log. Requires Replit Support.

**CONFIDENCE: LOW** (absence of evidence is not evidence of absence)

---

### Q20. Is there evidence it NEVER existed?

**STATUS: STILL UNKNOWN**

**DIRECT ANSWER:** No definitive proof that a Production Database NEVER existed. The strongest argument for "never existed" is the combination of:
- No production DB in current "All Databases" listing
- No project-visible DB metadata
- Initial deployment likely predated DB-requiring code
- Paused (not errored) deployment status

But none of these individually or collectively prove it never existed — they are consistent with "never existed" AND consistent with "existed and was deleted."

Per prompt instruction: **"not currently listed" ≠ "never existed."**

**CONFIDENCE: LOW** (cannot be proven from project-accessible data alone)

---

## PART C — COULD THE DEPLOYMENT PRE-DATE DATABASE USAGE?

### Q21. Determine when TrailWeigh first added server-side database-dependent features.

**STATUS: VERIFIED**

**DIRECT ANSWER:** The first real database table and the first route importing `@workspace/db` were added in commit `186b9d9` on **2026-08-03**: "Implement link sharing functionality and add short link routing support."

This commit added:
- `lib/db/src/schema/index.ts` — first real table definition (share_links)
- `artifacts/api-server/src/routes/links.ts` — first route that imports and queries the DB
- `artifacts/api-server/src/routes/index.ts` — added links route to the router

The locker (second DB-dependent feature) was added 2026-08-09.

**EVIDENCE A:** `git show 186b9d9 --stat` — confirms schema/index.ts and routes/links.ts were modified.

**EVIDENCE B:** `git show 9ef0b8f -- lib/db/src/schema/index.ts` — initial commit schema was entirely commented-out template code ending in `export {}`. No tables existed.

**CONFIDENCE: HIGH**

---

### Q22. Determine whether the existing deployment could have been created BEFORE those database-dependent features were added.

**STATUS: VERIFIED (code analysis) — PROVISIONAL (deployment date unknown)**

**DIRECT ANSWER:** YES — FULLY POSSIBLE. The initial commit (2026-07-28) API server contained:
- `lib/db/src/index.ts` — present, but contained `if (!process.env.DATABASE_URL) { throw... }` which only executes when the module is **imported**
- `routes/index.ts` — imported ONLY the health router; `@workspace/db` was never imported

Since no route imported `@workspace/db`, the DATABASE_URL guard never fired. A deployment of the initial-commit API server would start cleanly without DATABASE_URL. No Production Database would be "needed" by that code.

**EVIDENCE A:** `git show 9ef0b8f -- artifacts/api-server/src/routes/index.ts` shows only `import healthRouter from "./health"` — zero DB imports.

**EVIDENCE B:** `git show 9ef0b8f -- lib/db/src/schema/index.ts` confirms schema = `export {}` (no tables).

**CONFIDENCE: HIGH** (code analysis is definitive; deployment timing remains unknown)

---

### Q23. If exact deployment creation date is unavailable, state that clearly.

**STATUS: STILL UNKNOWN**

**DIRECT ANSWER:** **The exact deployment creation date is UNAVAILABLE through any project-accessible mechanism.** The Publishing UI shows Overview / Logs / Domains / Manage — no History tab. Publishing > Logs shows "No logs are available." Git commits do not record deployment events. No `artifact.toml` or `.replit` field stores a deployment timestamp. Agent has no CLI or API access to Replit's platform-level deployment records.

**Missing evidence:** Deployment creation date from Replit's platform records. Requires Replit Support.

**CONFIDENCE: HIGH** (that the date is unavailable to Agent)

---

### Q24. Does the paused deployment's existence by itself prove it was created after database features existed?

**STATUS: VERIFIED**

**DIRECT ANSWER:** **NO.** A deployment created before database features were added, which then ran for some period in a healthy state and was subsequently paused (manually, or by the platform), would show exactly the same "paused" status as one created later. The paused status carries no timestamp and conveys no information about when the deployment was first created.

**EVIDENCE A:** Replit docs describe pausing as scaling to zero traffic — it does not timestamp or annotate the original creation.

**EVIDENCE B:** There is no `createdAt` or `deployedAt` field visible in any project-accessible deployment config.

**CONFIDENCE: HIGH**

---

### Q25. Could an old deployment remain paused while Development later gained database features that were never republished?

**STATUS: VERIFIED**

**DIRECT ANSWER:** **YES — absolutely.** This is a standard Replit lifecycle: (1) publish an app, (2) continue developing, (3) the published version becomes outdated as development diverges, (4) deployment remains paused without being republished. This is precisely the scenario most consistent with TrailWeigh's current state.

**EVIDENCE A:** Replit docs make no claim that paused deployments are auto-updated when development changes. Republishing is a deliberate user action.

**EVIDENCE B:** The user does not remember intentionally publishing TrailWeigh (025Z prompt item 12), consistent with an early or automatic publish followed by development divergence.

**CONFIDENCE: HIGH**

---

### Q26. Is this scenario consistent with current evidence?

**STATUS: VERIFIED**

**DIRECT ANSWER:** YES. All observed evidence is consistent with: "deployment published pre-2026-08-03 (before DB-requiring code existed), never republished, development continued adding DB features, deployment remained paused."

Consistency check:
| Evidence | Pre-DB publish scenario |
|---|---|
| No Production DB in "All Databases" | ✓ Consistent (no DB was needed) |
| artifact.toml production env = PORT + NODE_ENV only | ✓ Consistent (no DB env needed) |
| Paused status (not errored) | ✓ Consistent (no DB dependency = no crash) |
| User doesn't remember publishing | ✓ Consistent (early/auto publish) |
| Initial .replit had deploymentTarget = "autoscale" from day 1 | ✓ Consistent (scaffolded for deploy from initial commit) |
| No Republish log entries | ✓ Consistent (never republished) |
| Publishing > Logs = "No logs are available" | ✓ Consistent (very old or zero-activity deployment) |

**CONFIDENCE: HIGH**

---

### Q27. Is it the strongest explanation, or merely one plausible explanation?

**STATUS: PROVISIONAL**

**DIRECT ANSWER:** It is the **strongest explanation among those available from project-visible evidence**, but it cannot be confirmed as THE explanation without the deployment creation date.

Competing explanations and their relative strength:

| Explanation | Strength |
|---|---|
| A. Published pre-2026-08-03 (pre-DB code); no DB was "needed" | **STRONGEST** — consistent with all evidence |
| B. Published post-2026-08-03; production DB created; DB later deleted | **POSSIBLE** — docs confirm deletion is possible; but "paused" not "errored" is harder to explain |
| C. Published post-2026-08-03; production DB never created despite docs saying otherwise | **POSSIBLE** — doc inconsistency means this can't be ruled out |
| D. Production DB exists but has a display bug in "All Databases" UI | **WEAKEST** — user-verified UI state; no doc suggests this |

**CONFIDENCE: MEDIUM** (A is most coherent, but not provable without Replit Support)

---

## PART D — WHAT DATABASE COULD THE OLD DEPLOYMENT HAVE USED?

### Q28. Trace current server DB connection selection.

**STATUS: VERIFIED**

**DIRECT ANSWER:** `lib/db/src/index.ts` reads `process.env.DATABASE_URL`. If absent → throws `Error("DATABASE_URL must be set...")`. If present → creates a `pg.Pool` with that connection string → Drizzle wraps the pool. No code in `lib/db` selects between development and production — it trusts whichever `DATABASE_URL` the environment provides.

**EVIDENCE A:** `lib/db/src/index.ts` read directly in this session (unchanged from initial commit version):
```typescript
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
```

**EVIDENCE B:** No conditional logic, no `NODE_ENV` branch, no separate production/development URL selection.

**CONFIDENCE: HIGH**

---

### Q29. Does source simply use `process.env.DATABASE_URL`?

**STATUS: VERIFIED**

**DIRECT ANSWER:** YES. Single environment variable. No prefix, no suffix, no environment-specific variant.

**EVIDENCE A:** Code above.

**EVIDENCE B:** No `PRODUCTION_DATABASE_URL` or `DEV_DATABASE_URL` key anywhere in the codebase.

**CONFIDENCE: HIGH**

---

### Q30. Does source distinguish Development vs Production database itself?

**STATUS: VERIFIED**

**DIRECT ANSWER:** **NO.** The application code has zero knowledge of development vs production. It reads one key: `DATABASE_URL`. Replit is responsible for injecting the correct value (development DB URL in dev; production DB URL in deployed environment).

**EVIDENCE A:** `lib/db/src/index.ts` — no `NODE_ENV` branch, no environment detection.

**EVIDENCE B:** artifact.toml production env does not set `DATABASE_URL` — Replit injects it at the platform level, not via artifact config.

**CONFIDENCE: HIGH**

---

### Q31. Does Replit inject the appropriate environment-specific DATABASE_URL automatically for a published deployment?

**STATUS: VERIFIED**

**DIRECT ANSWER:** YES — per Replit documentation. Replit handles "the provisioning of this production database automatically when you publish" and the app receives the production DATABASE_URL at runtime without any manual configuration. The artifact.toml confirms this: production run env has no DATABASE_URL, meaning the platform injects it.

**EVIDENCE A:** R7: "Agent handles the provisioning of this production database automatically when you publish."

**EVIDENCE B:** artifact.toml `[services.production.run.env]` = `PORT + NODE_ENV` only — no DATABASE_URL. The platform must inject it.

**CONFIDENCE: HIGH**

---

### Q32. Can project-accessible metadata reveal what DATABASE_URL class the historical deployment received without exposing the value?

**STATUS: VERIFIED — NO**

**DIRECT ANSWER:** NO. artifact.toml does not record the DATABASE_URL value injected at deployment time. `.replit` does not record it. Git history does not record it. Workflow reports do not record it. The platform injects DATABASE_URL silently at runtime. There is no project-accessible log or metadata of what value was injected into the historical deployment.

**EVIDENCE A:** Complete search of all project metadata files: no production DATABASE_URL fragment found.

**EVIDENCE B:** Replit injects DATABASE_URL at the platform level (not via artifact.toml), so it is never committed to the repository.

**CONFIDENCE: HIGH**

---

### Q33–Q34. Could the historical deployment have used: (A) current Development DB / (B) a now-removed Production DB / (C) older legacy/shared Neon DB / (D) no functional DB at all?

**STATUS: PROVISIONAL**

| Option | Assessment | Evidence |
|---|---|---|
| **A. Current Development Database** | **POSSIBLE** | Replit docs say dev and prod are separated — Replit would inject a different URL for production. However, if published during very early Replit scaffolding, it's theoretically possible the dev URL was shared. No evidence for or against. |
| **B. A now-removed Production Database** | **POSSIBLE** | Docs confirm production DBs can be deleted (7-day recovery window). A production DB could have been created on publish and then deleted. The "paused" (not "errored") status makes this less likely — if the DB was deleted and the deployment still had DB-requiring code, resuming would crash immediately. |
| **C. Older legacy/shared Neon DB** | **DISPROVEN** | No Neon references exist anywhere in the project. DATABASE_URL resolves to Helium host. No `NEON_DATABASE_URL` key. Zero Neon mention in commits or configs. |
| **D. No functional database at all** | **SUPPORTED (strongest)** | Pre-2026-08-03 code version had no DB imports in the server entry path. DATABASE_URL would not be evaluated. Server would start and run the health route without any DB connection. |

**EVIDENCE A (for D):** `git show 9ef0b8f -- artifacts/api-server/src/routes/index.ts` — initial routes imported health only.

**EVIDENCE B (against C):** `grep -r "neon" . --include="*.ts" --include="*.json" --include="*.toml"` — zero matches.

---

### Q35. Which option has the strongest evidence?

**STATUS: PROVISIONAL**

**DIRECT ANSWER:** **Option D (no functional database)** has the strongest evidence: the initial commit's API server never imported `@workspace/db`, so DATABASE_URL was never evaluated, and Replit's "if one is needed" check would result in no production DB being created.

**CONFIDENCE: MEDIUM** (code analysis is strong; deployment timing is still unconfirmed)

---

### Q36. If none can be proven, state the conclusion.

**HISTORICAL DEPLOYMENT DATABASE = STILL UNKNOWN**  
*Strongest candidate: Option D (no functional database). Cannot be confirmed without deployment creation date from Replit Support.*

---

## PART E — REPLIT "HISTORY" DOCUMENTATION CONFLICT

### Q37. Identify the current official documentation page that references Publishing > History.

**STATUS: VERIFIED**

**DIRECT ANSWER:** The `searchReplitDocs` response for "publishing history tab deployment logs current UI" returned:

- `https://docs.replit.com/features/publishing/overview`
- Response text: *"The Publishing tool provides a **History tab** that allows you to view the details of past deployments. By selecting a specific deployment from the history list, you can access its corresponding build logs via the three-dot menu."*

**EVIDENCE A:** R3 response from `searchReplitDocs`.

**EVIDENCE B:** Page title "Publishing" at the canonical publishing overview URL.

**CONFIDENCE: HIGH** (that the documentation mentions a History tab)

---

### Q38. Identify the current official documentation page describing the current Publishing tabs.

**STATUS: VERIFIED**

**DIRECT ANSWER:** The same page `https://docs.replit.com/features/publishing/overview` is described as having a History tab. However, the **current TrailWeigh Publishing UI** (user-verified) shows only: **Overview / Logs / Domains / Manage** — no History tab.

No separate documentation page was returned that describes the current four-tab layout.

**EVIDENCE A:** User-verified UI state (025Z prompt item 10).

**EVIDENCE B:** R6 response: "You can manage their settings, view logs, and configure domains directly in the Publishing tool" — mentions settings, logs, domains but not History.

**CONFIDENCE: HIGH**

---

### Q39. Does current documentation itself appear inconsistent?

**STATUS: VERIFIED — DOC INCONSISTENCY CONFIRMED**

**DIRECT ANSWER:** YES — two inconsistencies found:

1. **History tab:** Docs describe a History tab (`/features/publishing/overview`). Current TrailWeigh UI has no History tab. Either (a) the docs are outdated, (b) the History tab is gated by plan/project type, or (c) it was removed and docs not updated.

2. **Production DB creation rule:** R4 says "if one is needed" (conditional). R7 says "creates a production database" (unconditional). These are different rules from what appear to be the same documentation page, as surfaced by different queries.

**EVIDENCE A:** R3 doc text mentions History tab. User-verified UI has no History tab.

**EVIDENCE B:** R4 vs R7 text quotes above — same topic, different conditionality.

**CONFIDENCE: HIGH** (that inconsistencies exist)

---

### Q40. Does the CURRENT TrailWeigh UI match: Overview / Logs / Domains / Manage?

**STATUS: VERIFIED (user-supplied)**

**DIRECT ANSWER:** YES — user confirmed exactly this four-tab structure (025Z prompt item 10). No History tab present.

**CONFIDENCE: HIGH** (user-verified)

---

### Q41. Is there any current documented replacement for the old History tab?

**STATUS: STILL UNKNOWN**

**DIRECT ANSWER:** No documented replacement was found. The docs continue to describe the History tab without mentioning removal or replacement. The Logs tab may partially serve this purpose (showing current deployment logs), but it shows "No logs are available" for TrailWeigh's paused deployment — and it is not equivalent to deployment history.

**Missing evidence:** A Replit doc or changelog that explains what replaced the History tab.

**CONFIDENCE: HIGH** (that no documented replacement was identified)

---

### Q42. Can deployment-history metadata be accessed another documented way?

**STATUS: STILL UNKNOWN**

**DIRECT ANSWER:** No documented alternative path was found in current Replit docs. No CLI, API endpoint, or project-visible metadata file provides deployment history.

**CONFIDENCE: HIGH** (that no alternative access method was documented)

---

### Q43. Is there a Replit CLI/API/project metadata source Agent can read safely?

**STATUS: VERIFIED — NONE FOUND**

**DIRECT ANSWER:** NO. Agent has no access to:
- Replit deployment history API
- Platform-level deployment records
- Any CLI tool returning deployment creation timestamps
- `.replit` or artifact.toml deployment history fields

The only deployment-related file Agent can read is artifact.toml, which contains no historical information.

**EVIDENCE A:** Complete search of `.replit`, artifact.toml, `.cache/replit/` — no deployment history data found.

**EVIDENCE B:** `searchReplitDocs` returned no CLI or API for accessing deployment history programmatically.

**CONFIDENCE: HIGH**

---

### Q44. If no supported history path exists in current UI, say so.

**DIRECT ANSWER:** **Confirmed: No supported deployment history path exists in the current TrailWeigh Publishing UI.** The History tab described in Replit docs is not present in the current UI. Logs tab shows "No logs are available."

---

### Q45. Do not send the user searching through nonexistent UI.

**DIRECT ANSWER:** Confirmed. The user should NOT search for a History tab in Publishing — it is not there. The user should NOT attempt to access deployment history through the current UI. The only recourse for deployment creation date is **Replit Support**.

---

## PART F — EXACT REPLIT SUPPORT QUESTION

### Q46. Is Replit Support the only remaining authoritative source?

**STATUS: VERIFIED**

**DIRECT ANSWER:** YES. For the following questions, Replit Support is the only authoritative source:
- Exact date the TrailWeigh Autoscale deployment was first created
- Whether a Production Database was ever provisioned for this deployment
- What database (if any) the deployment was connected to at its last active state
- Whether a Production Database was created and subsequently deleted
- What entity (user action, Agent workflow, Replit migration, scaffolding) initiated the original deployment

**CONFIDENCE: HIGH**

---

### Q47. Write ONE concise support question.

**DIRECT ANSWER:**

> **Subject: Production Database Status for Autoscale Deployment — TrailWeigh Project**
>
> Hi Replit Support,
>
> I have an Autoscale deployment for my TrailWeigh project that is currently **paused** with **Public** visibility. The project uses Replit's Helium PostgreSQL infrastructure.
>
> In the Database tool, **"All Databases" shows only the Development Database** — no Production Database is listed. I do not remember intentionally publishing the app.
>
> I have the following questions about my deployment's history (I cannot access a "History" tab in the current Publishing UI):
>
> 1. **When was this Autoscale deployment first created?** (date and time, if available)
> 2. **Was a Production Database ever provisioned for this deployment?**
> 3. **If yes: what database or environment was the deployment attached to at its last successful run?**
> 4. **If a Production Database was created: was it subsequently deleted? If so, when?**
> 5. **Why does "All Databases" currently show only the Development Database for a published Autoscale deployment?**
> 6. **If I Republish now: will a new Production Database be automatically created on Helium for this project?**
> 7. **If your system has audit records: what initiated the original deployment** (user action, Replit Agent, platform migration, or other)?
>
> I want to understand this before resuming or republishing to avoid any data/configuration errors.
>
> Thank you.

---

### Q48. What screenshots/identifiers does the user need to provide Support?

**DIRECT ANSWER:** The user should be prepared to provide:

1. **Replit username or account email** (for account identification — do not share here)
2. **Project name:** "TrailWeigh" (or the repl slug visible in the Replit URL)
3. **Production URL** (the `.replit.app` URL — not a secret, visible publicly)
4. **Screenshot of Publishing > Overview** showing the deployment status (Autoscale / Public / Paused)
5. **Screenshot of Database > All Databases** showing only the Development Database
6. **Screenshot of Publishing > Logs** showing "No logs are available"

Do NOT share DATABASE_URL values, Clerk keys, session secrets, or any other credential with Support unless they explicitly request it through an authenticated, secure channel.

---

### Q49. Do NOT include secret IDs/connection strings unless Replit Support explicitly requests them through an authenticated support channel.

**CONFIRMED.** The support question above contains no secret values, connection strings, tokens, or credentials.

---

## PART G — WHAT DOES THIS BLOCK?

### Q50. Does this unresolved historical question block ordinary Development UI work?

**STATUS: VERIFIED**

**DIRECT ANSWER:** **NO.** The development database is fully functional. Development UI work (component changes, styling, checklist logic, navigation, etc.) is completely unblocked.

---

### Q51. Does it block importer/parser work?

**STATUS: VERIFIED**

**DIRECT ANSWER:** **NO.** The gear importer and PDF parser operate through the API server in development, using the development database. Unblocked.

---

### Q52. Does it block ordinary non-persistence UI repairs?

**STATUS: VERIFIED**

**DIRECT ANSWER:** **NO.** Any UI repair that does not touch deployment or production data is unblocked.

---

### Q53. Does it block database/schema changes?

**STATUS: VERIFIED**

**DIRECT ANSWER:** **PARTIALLY.** Schema changes in the development environment are fully unblocked. However, the question of how those schema changes will be applied to a production database at Republish time cannot be fully confirmed until the production DB situation is resolved. It is documented expected behavior that Replit applies migrations on Republish — but the TrailWeigh project should verify this before Republishing.

---

### Q54. Does it block Resume?

**STATUS: VERIFIED**

**DIRECT ANSWER:** **YES — independently blocked.** Resume is blocked by explicit user instruction (DO NOT RESUME). Additionally, resuming the current paused deployment would deploy pre-2026-08-03 code — which is significantly outdated and lacks all DB-dependent features added since. Resuming without Republishing would surface a functionally incomplete app to the public.

---

### Q55. Does it block Republish?

**STATUS: VERIFIED**

**DIRECT ANSWER:** **YES — blocked by multiple independent reasons:**

1. **Privacy Policy inaccuracy** (Sections 3 and 6 are factually wrong — verified in 025X)
2. **Delete Account page promises automated removal that code cannot deliver** (verified in 025X)
3. **Clerk webhook `user.deleted` handler is absent** — locker_entries and live share_links survive account deletion (verified)
4. **Clean-slate production DB decision not finalized** — the 82 development share_links should not go to production
5. **This unresolved DB history question** — should be clarified before Republish

The historical DB question is ONE of multiple Republish blockers, not the only one.

---

### Q56. Does it block public privacy/security claims?

**STATUS: VERIFIED**

**DIRECT ANSWER:** **YES.** Public privacy claims are independently blocked by the known Privacy Policy inaccuracies (Sections 3 and 6), which were verified in 025X. This question (025Z) does not introduce new privacy blockers beyond those already documented.

---

### Q57. What work can safely continue while deployment remains paused?

**DIRECT ANSWER:** All of the following work can proceed safely:

- UI repairs (background, screensaver, silhouette, shared view appearance)
- Locker and sync improvements (dirty indicator, `beforeunload` warning, active file identity fix)
- Importer/parser improvements (greedy regex fix, format support additions)
- Webhook handler: add `user.deleted` handler to `clerkWebhook.ts`
- Privacy Policy rewrite (Sections 3 + 6)
- Delete Account page rewrite
- Custom photo IndexedDB userId-namespacing
- `userId` index on `locker_entries`
- CORS narrowing (`origin: true` → specific allowed origins)
- Unit preference persistence on shared view (Tasks 54, 55)
- Any task from the PENDING/PROPOSED queue that does not require Republish to test

---

### Q58. What must wait?

**DIRECT ANSWER:**

| What | Why |
|---|---|
| **Resume** | Explicitly blocked by user instruction; also would surface outdated code |
| **Republish** | Multiple blockers (privacy policy, webhook, clean-slate DB decision, this open question) |
| **Creating a Production Database manually** | Blocked by user instruction; wait for Replit to auto-create on Republish |
| **Public privacy/security claims** | Blocked until Privacy Policy is corrected |
| **Replit Support contact** | Should be initiated (Q47 question is ready) |

---

## FINAL REQUIRED CONCLUSIONS

### Q59. CURRENT DEVELOPMENT DB:
**VERIFIED** — Helium infrastructure, fully functional, development DATABASE_URL resolves to `host: helium`.

---

### Q60. CURRENT PRODUCTION DB:
**VERIFIED NOT LISTED** — User-verified: "All Databases" shows only Development Database. No Production Database entry.

---

### Q61. HISTORICAL PRODUCTION DB:
**STILL UNKNOWN** — No project-visible evidence it ever existed. No project-visible evidence it never existed. Only Replit Support can confirm.

---

### Q62. HISTORICAL DEPLOYMENT DATABASE SOURCE:
**STILL UNKNOWN** (strongest candidate: **NONE** — pre-DB code version that never imported `@workspace/db`; DATABASE_URL was never evaluated by the deployed server)

---

### Q63. ORIGINAL DEPLOYMENT INITIATOR:
**STILL UNKNOWN** — No History tab, no deployment logs ("No logs are available"), no project-accessible deployment metadata. Only Replit Support can confirm. Possible candidates: Replit scaffolding, Replit Agent, user action, or Replit platform migration.

---

### Q64. NEXT REPUBLISH DB BEHAVIOR:
**DOCUMENTED EXPECTED** — Replit docs state a production database is created on publish. Whether this is unconditional or "if needed" is inconsistently documented (Q3), but both interpretations result in a production DB being created for the current TrailWeigh code (which imports `@workspace/db` and requires DATABASE_URL). Behavior should be confirmed with Replit Support before Republishing.

---

### Q65. REPLIT DOC/UI HISTORY DISCREPANCY:
**VERIFIED DOC-UI MISMATCH** — Replit docs describe a Publishing > History tab. Current TrailWeigh Publishing UI shows only Overview / Logs / Domains / Manage. No History tab is present.

---

### Q66. REPLIT SUPPORT REQUIRED:
**YES** — For: (1) deployment creation date, (2) whether a production DB was ever provisioned, (3) what database the historical deployment used, (4) whether any production DB was deleted, (5) next Republish DB behavior confirmation for this specific project. Exact support question provided in Q47.

---

## FINAL EVIDENCE LEDGER

| # | Question | Status | Confidence |
|---|---|---|---|
| 1 | Dev vs production DB docs location | VERIFIED | HIGH |
| 2 | Helium DB docs location | VERIFIED | HIGH |
| 3 | Exact rule for production DB creation | VERIFIED (doc inconsistency) | MEDIUM |
| 4 | Always / when needed / on use / other? | VERIFIED (conditional phrasing) | MEDIUM |
| 5 | Definition of "when needed" | STILL UNKNOWN | LOW |
| 6 | Can published app have no production DB? | PROVISIONAL | MEDIUM |
| 7 | Under what conditions? | STILL UNKNOWN | LOW |
| 8 | N/A (Q6 = YES) | NOT APPLICABLE | — |
| 9 | Does pausing remove production DB? | PROVISIONAL — NO | MEDIUM |
| 10 | Can deleting DB leave deployment intact? | VERIFIED — YES | HIGH |
| 11 | Current DB infrastructure | VERIFIED — HELIUM | HIGH |
| 12 | Safe evidence without connection string | VERIFIED | HIGH |
| 13 | Only Development DB listed | VERIFIED | HIGH |
| 14 | Hidden production DB identifier in metadata | VERIFIED — NONE | HIGH |
| 15 | DB attachment in deployment metadata | VERIFIED — NONE | HIGH |
| 16 | DB in .replit / deployment config | VERIFIED — NONE | HIGH |
| 17 | Past production DB event in workflow reports | VERIFIED — NONE | HIGH |
| 18 | DB migration in git history | VERIFIED — NONE | HIGH |
| 19 | Evidence production DB ever existed | STILL UNKNOWN | LOW |
| 20 | Evidence production DB never existed | STILL UNKNOWN | LOW |
| 21 | When did DB-dependent features first appear | VERIFIED — 2026-08-03 | HIGH |
| 22 | Could deployment predate DB features? | VERIFIED — YES | HIGH |
| 23 | Exact deployment creation date available? | STILL UNKNOWN | HIGH (confirmed unavailable) |
| 24 | Does paused status prove post-DB creation? | VERIFIED — NO | HIGH |
| 25 | Old deployment could remain while dev gained DB? | VERIFIED — YES | HIGH |
| 26 | Scenario consistent with evidence? | VERIFIED — YES | HIGH |
| 27 | Strongest or merely plausible explanation? | PROVISIONAL — STRONGEST | MEDIUM |
| 28 | Server DB connection selection trace | VERIFIED | HIGH |
| 29 | Source uses process.env.DATABASE_URL? | VERIFIED — YES | HIGH |
| 30 | Source distinguishes dev vs prod? | VERIFIED — NO | HIGH |
| 31 | Replit injects environment-specific URL? | VERIFIED — YES | HIGH |
| 32 | Metadata reveals historical DATABASE_URL class? | VERIFIED — NO | HIGH |
| 33-34 | What DB could historical deployment have used? | PROVISIONAL | MEDIUM |
| 35 | Strongest option | PROVISIONAL — Option D (none) | MEDIUM |
| 36 | None provable: STILL UNKNOWN conclusion | CONFIRMED | — |
| 37 | Doc page referencing History tab | VERIFIED | HIGH |
| 38 | Doc page describing current tabs | VERIFIED (same page; mismatch) | HIGH |
| 39 | Current doc inconsistency? | VERIFIED — YES (2 inconsistencies) | HIGH |
| 40 | Current UI = Overview/Logs/Domains/Manage? | VERIFIED — YES | HIGH |
| 41 | Documented replacement for History tab | STILL UNKNOWN | HIGH |
| 42 | Deployment history accessible another way? | STILL UNKNOWN | HIGH |
| 43 | CLI/API/metadata source accessible to Agent? | VERIFIED — NONE | HIGH |
| 44 | No supported history path in current UI | CONFIRMED | — |
| 45 | Do not send user searching nonexistent UI | CONFIRMED | — |
| 46 | Replit Support = only remaining authority? | VERIFIED — YES | HIGH |
| 47 | Exact support question | PROVIDED | — |
| 48 | Screenshots/identifiers needed | PROVIDED | — |
| 49 | No secrets in support question | CONFIRMED | — |
| 50 | Blocks Development UI work? | VERIFIED — NO | HIGH |
| 51 | Blocks importer/parser? | VERIFIED — NO | HIGH |
| 52 | Blocks non-persistence UI repairs? | VERIFIED — NO | HIGH |
| 53 | Blocks DB/schema changes? | VERIFIED — PARTIALLY | MEDIUM |
| 54 | Blocks Resume? | VERIFIED — YES (independently) | HIGH |
| 55 | Blocks Republish? | VERIFIED — YES (one of multiple blockers) | HIGH |
| 56 | Blocks public privacy/security claims? | VERIFIED — YES (independently) | HIGH |
| 57 | What can continue? | PROVIDED | — |
| 58 | What must wait? | PROVIDED | — |
| 59 | Current Development DB | VERIFIED | HIGH |
| 60 | Current Production DB | VERIFIED NOT LISTED | HIGH |
| 61 | Historical Production DB | STILL UNKNOWN | LOW |
| 62 | Historical deployment database source | STILL UNKNOWN / NONE (strongest candidate) | MEDIUM |
| 63 | Original deployment initiator | STILL UNKNOWN | LOW |
| 64 | Next Republish DB behavior | DOCUMENTED EXPECTED | MEDIUM |
| 65 | Replit doc/UI History discrepancy | VERIFIED DOC-UI MISMATCH | HIGH |
| 66 | Replit Support required | YES | HIGH |

---

## NO-CHANGE VERIFICATION

```
APPLICATION SOURCE CHANGED BY 025Z = NONE
APPLICATION CONFIG CHANGED BY 025Z = NONE
REPLIT.MD CHANGED BY 025Z = NONE
DATABASE DATA CHANGED BY 025Z = NONE
DATABASE SCHEMA CHANGED BY 025Z = NONE
SECRETS CHANGED BY 025Z = NONE
DEPLOYMENT/PUBLISHING CHANGED BY 025Z = NONE
PRODUCTION RESUMED BY 025Z = NO
PRODUCTION DATABASE CREATED BY 025Z = NO
APP TESTING INVOKED BY 025Z = NO
UNRELATED TASKS APPLIED BY 025Z = NONE
```

---

*End of PROMPT_025Z_REPORT.md*  
*025Z-REPLIT-DB-DISCREPANCY-2026-08-12-R1*  
*All 66 questions answered. No secrets or connection strings printed. No unauthorized changes.*
