# TRAILWEIGH PLAYWRIGHT / REPLIT CAPABILITY & COVERAGE AUDIT

Date: 2026-08-15 · Diagnostic-only. No application source, test code, or config was modified (verified: `git diff --name-only -- artifacts/` → empty; `tests/e2e/**`, `playwright.config.ts`, `package.json` untouched by this audit).

Legend: **[FACT]** = proven by cited code/config/command output · **[INFERENCE]** = reasoned from facts · **UNKNOWN — NEEDS CONTROLLED EXPERIMENT** where evidence is insufficient.

---

## Executive Summary

1. **The Phase 1 target route is a self-contained sandbox, not production code.** `/mobile-functional-v3` (`App.tsx:246-247`, comment: "V3 functional preview — isolated sandbox, no production mutation") keeps its own state and mutation handlers; it shares presentation/math utilities with production but NOT the owner data layer (`usePackData`) or owner item editors. **[FACT]**
2. **Defect reclassification:** TW-P1-002 is a **proven sandbox-only code defect** (auto-expand intended but broken); TW-P1-003 is a **sandbox-only feature gap** (production owner routes DO have item name/type editors); TW-P1-001 is **intentional sandbox behavior by explicit code comment**, i.e. a test-assumption/design conflict, not a proven defect. None of the three is proven in shared production code. **[FACT]**
3. Phase 1 therefore validated shared weight math, unit conversion, category/item interaction patterns, and error-free rendering — but **not** the production owner data layer, server persistence, auth, Review/shared page, importers, or themes.
4. **Phase 1B is required before visual regression** — the highest-value untested surfaces (Review/shared page, importers with fixtures, production-route math) are functional, not visual.
5. Environment: 4 vCPU / 8 GB / 252 GB free disk. `workers: 1` remains the safe default; a controlled benchmark showed `workers: 2` is viable for quick reruns (27% faster, no failures). Background (`nohup`) execution is killed when the Agent shell session ends — long suites must run as foreground chunks ≤ ~4.5 minutes. **[FACT]**
6. Authenticated testing needs architecture (Clerk + no staging backend + no reset endpoints) — safe path exists but must be designed first.

---

## Current Environment

All verified by direct command output during this audit:

| Item | Value |
|---|---|
| Playwright | `@playwright/test` **1.62.1** (pinned) **[FACT]** |
| Browser | Chromium 151.0.7922.34 only (`playwright.config.ts`, `projects: chromium`) **[FACT]** |
| Workers / retries | config default; Phase 1 executed with `--workers=1`; `retries: 0` **[FACT]** |
| Test dirs / scripts | `tests/e2e` (smoke + `core/` 11 specs + `helpers/`); scripts `test:e2e`, `test:e2e:core`, `test:e2e:smoke` **[FACT]** |
| baseURL / route | `http://localhost:80/pack-checklist`; tests target `/mobile-functional-v3` **[FACT]** |
| Smoke test | `tests/e2e/smoke.spec.ts` present, unmodified **[FACT]** |
| Phase 1 suite | 11 spec files present, unmodified by this audit **[FACT]** |
| App-source diff | `git diff --name-only -- artifacts/` → empty **[FACT]** |
| CPU | `nproc` = 4; cgroup `cpu.max` = `400000 100000` (4 full cores) **[FACT]** |
| Memory | 7965 MB total; cgroup `memory.max` = 8589934592 (8 GB hard limit) **[FACT]** |
| Disk | 252 GB free on workspace volume; browsers cache 656 MB; test-results 1.9 MB **[FACT]** |
| Process limit | `ulimit -u` = 31847 (not a practical constraint) **[FACT]** |

---

## Phase 1 Route Representativeness

**Q1 — What is `/mobile-functional-v3`?** A **development-only demo/sandbox prototype**. Route registered at `App.tsx:246-247` with the comment "V3 functional preview — isolated sandbox, no production mutation"; siblings `/mobile-preview`, `/mobile-design-v2`, `/mobile-design-v3` are explicitly dev-only (`App.tsx:240-245`). Not linked from any production navigation. **[FACT]**

**Q2 — Shared vs self-contained** (from `MobileFunctionalV3.tsx:39-74`):
- SHARED with owner/Review: `WeightSummary`/`WeightDistribution`, `PreviewBody`, `ImportGearPanel`, `generatePackPDF`, `buildShareURL`, `resolveDestination`, weight math (`calcTotalOz`, `formatWeight`, `smallUnit`, `gramsToOz`), `UnitProvider/useUnit`, `BarStyleProvider`, category theming, `LockerEntry` type, `LOCKER_KEY` constant. **[FACT]**
- SELF-CONTAINED: local `PackState`/`SandboxStore`, inline `DEMO_SEED` (`:76-122`), its own mutation handlers and undo history (`:1302-1385`), its own accordion/expand logic, its own localStorage locker helpers. It does **not** call `usePackData` (the production data hook, imported only for types). **[FACT]**
- Production owner route: `/checklist` → `Checklist` (`App.tsx:183-186, :222`), using `usePackData` + `lockerApi` + server persistence. Review: `/s/:id` → `ReviewPage` → shared `ChecklistContent` (`ReviewPage.tsx:219-231`) — Review and Owner share the real UI components (`GearCategory`, `GearRow`, `MobileWedgeCategory`, …). **[FACT]**

**Q3 — Phase 1 behaviors exercising SAME production logic:** unit conversion & weight formatting math, weight-summary/distribution rendering, unit context, category theming, PDF/share URL helpers (imported but share was route-blocked). **[FACT]**

**Q4 — Demo-only code exercised:** everything stateful — add/delete/rename categories, add/delete items, checkbox selection, qty/weight commit handlers, accordion, undo/redo, reset, locker save, reload semantics. These are V3's own implementations. **[FACT]**

**Q5 — Defect provenance:** see next section. Summary: TW-P1-001 → **D (demo-only, intentional)**; TW-P1-002 → **B (proven only in mobile-functional-v3)**; TW-P1-003 → **B/D (sandbox gap; production has the feature)**.

**Q6 — Material differences limiting Phase 1 conclusions:** (all **[FACT]**)
1. No production data layer (`usePackData`, parseV5, server sync) is exercised.
2. No auth — owner flows (server Locker, share creation, account save) unreachable.
3. Item editing differs fundamentally: production has name/type text editors (`GearRow.tsx:70-86`; `MobileWedgeCategory.tsx` `MobileItemRow`); V3 has none.
4. Accordion logic differs (V3 `handleCatToggle` vs owner `openCatIds` Set + `forceOpen`).
5. Search/Catalog/Create-New-List are disabled placeholders in V3.
6. Themes/background picker, dark mode, and Review flows are absent from V3.

**Q7 — Recommended role:** keep as **smoke-test target + safe destructive sandbox target** for interaction-pattern regression. Do NOT treat it as the core functional regression target for production behavior; Phase 1B should shift core coverage to Review (`/s/:id` with a disposable/mocked link) and — once auth architecture exists — the owner route.

---

## Phase 1 Defect Validation

### TW-P1-001 — Close wedge after Expand All
- **Q8 expected behavior [FACT]:** V3: single-open accordion (`openCatName`), `allExpanded` flag; `isCatOpen = allExpanded || openCatName === cat` (`MobileFunctionalV3.tsx:1608`). `handleCatToggle` (`:1584-1595`): when `allExpanded` is true it sets `allExpanded=false; openCatName=clicked` with the explicit comment "**Exit expand-all; the tapped category stays open (single-open mode resumes)**" (`:1586-1587`). Collapse All clears both (`:1602-1606`).
- **Q9 — definitely an app defect? NO.** The code comment proves the behavior is intentional in the sandbox. The wedge's accessible name ("Close X category") contradicts what it does after Expand All — that is at worst a **labeling/UX inconsistency**, at best working-as-designed. Production owner uses a different but analogously intentioned handler (`Checklist.tsx:1016-1027`, documented "keep only clicked category"). **Reclassified: TEST-ASSUMPTION vs DESIGN — needs a product decision, not a code fix.** The minimum decision required: "after Expand All, should tapping a Close wedge close that category, or collapse to single-open with it selected?"

### TW-P1-002 — new item auto-expand
- **Q10/Q11 — auto-expand IS explicitly intended and broken [FACT]:** the add button handler calls `addItem(catName)` then `setExpandedItem({ cat: catName, id: '' })` with the comment "`// will be set after state update`" (`MobileFunctionalV3.tsx:2266-2268`). Render compares exact ids (`:2048`); a fresh UUID never equals `''`, so the intended auto-open never happens. **CONFIRMED APPLICATION DEFECT — but only in the sandbox route.** Production `usePackData.addItem` (`usePackData.ts:589-605`) has no auto-expand concept; owner UIs show inline editors instead (**[FACT]**), so this defect does not exist in production code paths.
- **Q12/Q13:** not applicable — evidence is unambiguous.

### TW-P1-003 — no item name editor
- **Q14/Q15 [FACT]:** V3's detail panel (`MobileFunctionalV3.tsx:2125-2257`) offers only weight (`:2140-2173`), quantity (`:2185-2197`), and move (`:2222-2235`); the name is a read-only `<div>` (`:2095-2100`). Production **desktop** has text inputs for item type (`GearRow.tsx:71-76`) and name (`:79-85`); production **mobile wedge** (`MobileWedgeCategory.tsx` `MobileItemRow`, `:104-215`) also has name/type inputs.
- **Q16 verdict:** **demo-route defect / intentionally-incomplete sandbox behavior — NOT a shared production defect.** Whether the sandbox *should* have the editor is a product decision; production users are unaffected. Severity within the sandbox route stands (an add-item flow that can never name the item), but the Phase 1 report's "HIGH, core product loop broken" framing applies only to `/mobile-functional-v3`.

---

## Complete Coverage Gap Matrix

(also shipped as `coverage-gap-matrix.csv` in the ZIP)

| # | Feature | Status | Why / what is required |
|---|---|---|---|
| Q17 | Category drag-reorder | NOT AUTOMATABLE RELIABLY YET | Hold-and-drag touch gesture (`Drag to reorder…` buttons, `aria-grabbed`); needs mouse-event choreography experiments; brittle today |
| Q18 | Item Move dropdown | NOT TESTED — SAFE TO AUTOMATE NOW | Native `<select>` in V3 detail panel (`:2222-2235`); simple Phase 1B addition |
| Q19 | Print | NOT TESTED — SAFE TO AUTOMATE NOW | Stub `window.print` via init script; assert PrintLayout renders |
| Q20 | Successful Share flow | NOT TESTED — REQUIRES AUTHENTICATED TEST ENVIRONMENT | Real link creation writes server rows scoped to a Clerk user (`links.ts:35-47`); Phase 1 deliberately route-blocked it |
| Q21 | Create New List | NOT PRESENT (V3: aria-disabled div) / owner: REQUIRES AUTH | |
| Q22 | Guided list creation | UNKNOWN — NEEDS CONTROLLED EXPERIMENT | Not present in V3; owner-route presence unverified in this audit |
| Q23 | Track Weight Yes/No | UNKNOWN — NEEDS CONTROLLED EXPERIMENT | Not in V3 control inventory; owner-route feature audit needed |
| Q24 | Edit View | NOT TESTED — REQUIRES AUTH (owner display mode) | |
| Q25 | Keep it Simple | NOT PRESENT IN CURRENT PRODUCT | KIS mode absent from codebase (verified during Phase 1 inventory) |
| Q26 | Be Creative | UNKNOWN — NEEDS CONTROLLED EXPERIMENT | Owner-route display/style modes need their own inventory |
| Q27 | Light mode | OUT OF PHASE 1 SCOPE — owner/theme surface; safe once target route decided |
| Q28 | Dark mode | OUT OF PHASE 1 SCOPE — same |
| Q29 | Built-in themes | NOT TESTED — REQUIRES AUTH + remote images | Landscape theme = remote Unsplash (`BackgroundPicker.tsx:225-229`) → must be mocked for determinism |
| Q30 | Custom Theme | NOT TESTED — REQUIRES AUTH + FILE FIXTURES | Custom photos live in IndexedDB (`bgPhotoStore.ts`) |
| Q31 | Undo/Redo (representative mutations) | TESTED IN PHASE 1 (V3 scope only) | Owner-route undo semantics untested |
| Q32 | Search | NOT PRESENT in V3 (disabled div); owner: REQUIRES AUTH | |
| Q33 | Catalog | NOT PRESENT in V3 (disabled div); owner: REQUIRES AUTH | |
| Q34 | Locker | PARTIALLY TESTED | Browser-local save/load/reload tested in V3; server Locker (`/api/locker*`) requires auth |
| Q35 | PDF import | NOT TESTED — REQUIRES FILE FIXTURES | Route-blocked mutating APIs also needed; 77-item regression fixture exists in repo history |
| Q36 | CSV import | NOT TESTED — REQUIRES FILE FIXTURES | |
| Q37 | DOCX import | NOT TESTED — REQUIRES FILE FIXTURES | |
| Q38 | Review/shared page | NOT TESTED — SAFE TO AUTOMATE NOW | `/s/:id` is unauthenticated; use a mocked `/api/links/:id` response or a dedicated disposable link |
| Q39 | Owner vs Review isolation | NOT TESTED — REQUIRES MULTI-CONTEXT/MULTI-USER SETUP + auth architecture | |
| Q40 | Save/persistence to account | NOT TESTED — REQUIRES AUTHENTICATED TEST ENVIRONMENT | |
| Q41 | Sign-in/sign-out | NOT TESTED — REQUIRES AUTHENTICATED TEST ENVIRONMENT | Clerk-hosted UI |
| Q42 | Account/data deletion | NOT TESTED — UNSAFE WITH CURRENT ENVIRONMENT | No staging backend; no delete-cascade endpoint exists (`routes/` audit) |
| Q43 | Tooltip/help behavior | NOT TESTED — SAFE TO AUTOMATE NOW | |
| Q44 | Keyboard interaction | PARTIALLY TESTED (Escape, typed input) — rest SAFE TO AUTOMATE NOW | |
| Q45 | Touch/mobile interaction | PARTIALLY TESTED (clicks under mobile-sized viewport) — tap/touch emulation SAFE TO AUTOMATE NOW | |
| Q46 | Mobile swipe actions | UNKNOWN — NEEDS CONTROLLED EXPERIMENT | No swipe surface confirmed in V3 inventory |
| Q47 | Qty/weight calc on real production route | NOT TESTED — Review route SAFE NOW; owner route REQUIRES AUTH | Same shared math modules, but production data path unexercised |
| Q48 | Unit switching | TESTED IN PHASE 1 (V3); Review-page unit toggle NOT TESTED — SAFE NOW | |
| Q49 | List rename/delete/duplicate | NOT TESTED — REQUIRES AUTH | Server Locker PUT/PATCH/DELETE, userId-scoped (`locker.ts:145-231`) |
| Q50 | Sidebar/overlay panels | TESTED IN PHASE 1 (V3 panels) | Owner sidebar untested |
| Q51 | Expand/Collapse All | TESTED IN PHASE 1 (V3; owner logic differs and is untested) | |
| Q52 | Reload/persistence | TESTED IN PHASE 1 (V3 scope: sandbox reset + localStorage unit pref + local locker) | |
| Q53 | Theme/device sync | NOT TESTED — REQUIRES AUTH + backend feature (project task "Keep your background choice the same across all your devices" is still pending) | |

---

## Phase 1B Decision

**Q54 — Phase 1B required before visual regression? YES.**

Phase 1B functional areas (do not write yet):
1. **Review/shared page** (`/s/:id`) — load, render, unit toggle, sandbox edits, isolation from owner copy (mock-backed or disposable link). **CRITICAL**
2. **Importer fixtures** — PDF (incl. 77-item regression), CSV, DOCX, malformed files, with all mutating APIs route-blocked. **CRITICAL**
3. **Production-route math and item editing** on Review route (shared `ChecklistContent`, real `GearRow`/`MobileWedgeCategory` editors). **HIGH**
4. Item Move dropdown, Print (stubbed), tooltips, keyboard pass on V3. **MEDIUM**
5. Network/error injection on Locker + links APIs (offline, 4xx/5xx/timeout via route interception). **MEDIUM**
6. Drag-reorder feasibility spike. **LOW**

**Q55:** moving straight to visual regression would freeze screenshots of a sandbox route while the production-shared UI (Review path) has zero functional coverage — premature. Ranking as above.

---

## Worker / Resource Findings

- **Q56:** Phase 1 ran with `--workers=1`. **[FACT]**
- **Q57/Q58:** `workers: 1` is the safest default. Evidence: 4 vCPU / 8 GB cgroup limits shared with two dev servers (Vite + API) and the Agent itself; the earlier pnpm D-state I/O wedge and one mid-run workspace restart show the environment is sensitive to sustained load. **[FACT + INFERENCE]**
- **Q59 — controlled benchmark [FACT]:** startup spec (7 tests, read-only): workers=1 → 26.5 s; workers=2 → 20.2 s (−27%), all passed, load average rose 0.62 → 1.81 (still < 4 cores). No failures, no stall.
- **Q60/Q61/Q62:** 4 CPUs (`cpu.max 400000 100000`), hard 8 GB memory cgroup, 252 GB disk free, `ulimit -u` 31847 (irrelevant). Each Chromium worker ≈ 300–500 MB typical. **[FACT / INFERENCE for memory-per-worker]**
- **Q63:** plausible — 3–4 Chromium workers + Vite + API + Agent could approach the 8 GB/4-CPU ceiling and reproduce high-load symptoms. UNKNOWN in exact threshold — NEEDS CONTROLLED EXPERIMENT before ever exceeding 2. **[INFERENCE]**
- **Q64 recommendation:** smoke = 1; quick regression reruns = 2 (proven safe at small scale); deep audit = 1 (determinism and machine headroom over speed).

---

## App Testing vs Playwright

- **Q65:** technically yes — Replit App Testing drives its own browser; nothing prevents concurrency. **[INFERENCE]**
- **Q66:** they compete for CPU, memory, and the same dev server; both spawn Chromium-class processes. **[INFERENCE]**
- **Q67/Q68 standing rule: D — only one at a time.** Run Playwright for deterministic scripted regression; use App Testing for exploratory/agentic verification of new features where no script exists. App Testing adds human-like exploration and no-code assertions; Playwright adds deterministic, repeatable, CI-style regression with evidence artifacts. Never run both concurrently on this 4-CPU workspace.

---

## Long-Run Execution Findings

- **Q69 [FACT, observed twice]:** `nohup`-backgrounded runs died silently when the Agent shell session ended (log froze at header, no process remained); one full run was also lost to a workspace restart.
- **Q70:** Agent command end → **YES, background children are killed** (observed). Shell close → YES (same mechanism). Task timeout → the command is killed at the 5-minute tool limit. Workspace idle/compute restart → YES, everything dies (observed once mid-run). **[FACT/observed]**
- **Q71/Q72/Q73:** run everything as **foreground chunks ≤ ~4 minutes** (buffer under the 5-minute ceiling): 5-min suite = 2 chunks; 15-min = ~4–5 chunks; 30-min = ~8; 60+ min Deep Audit = scripted chunk sequence with per-chunk JSON/log output. Chunks must be deterministic (fixed file lists, no time-based splitting).
- **Q74 — preventing partial results misreported as complete:** (1) write a per-chunk result line (file list, counts, exit code) to an append-only run manifest; (2) the report generator must refuse to claim completion unless every planned chunk has a recorded exit; (3)总 counts must equal the sum of chunk counts. This audit's Phase 1 runs already followed the chunk pattern.

---

## Test Server Recommendation

- **Q75:** YES for now — reusing the Replit-managed dev server (fail-fast webServer stub) remains correct for hundreds of tests, because only that server receives the Replit-injected `PORT`/base-path config; a cold-started duplicate would fight for the port. **[FACT for the config constraint]**
- **Q76–Q79:** dev-server reuse: zero setup, HMR noise, dev-mode React (pro: fast; con: not prod bytes). Dedicated Vite test server: isolation, but port/base-path conflicts in this workspace — not recommended. Preview/production build (`vite preview`): most production-faithful bytes, slower cycle; best for visual baselines. Deployed staging: most realistic end-to-end, but costs and drift; UNKNOWN value until auth architecture exists.
- **Q80 architecture:** functional suites → managed dev server (current model); visual-regression baselines → a production build served once per baseline session (config change — requires authorization); authenticated/staging suites → decide with the auth architecture.

---

## Authenticated Testing Architecture

- **Q82 [FACT]:** Clerk (Replit-managed) — `ClerkProvider` in `App.tsx:193-217`, server middleware `api-server/src/app.ts:31-55`, cookie-forwarded sessions (`lockerApi.ts:7-9`).
- **Q81/Q83:** YES, feasible — a dedicated Clerk test user is isolated by design because every Locker/link row is `userId`-scoped (`locker.ts:76-84` etc.). Risks: test data pollutes the production database (no staging), Clerk bot-detection on automated sign-in, secrets leakage into artifacts.
- **Q84/Q85:** Playwright `storageState` works with cookie-based Clerk sessions. Auth-state files must live outside git (e.g. `tests/.auth/`, gitignored) and outside any ZIP.
- **Q86:** secrets only via Replit Secrets; never CLI args or config literals; storageState gitignored; disable video and use targeted screenshots for authenticated suites; scrub trace network bodies before export (traces capture headers/cookies — see Security section).
- **Q87/Q88:** isolation exists per-userId; a `TEST` namespace flag would need a schema/API change — **not present today [FACT]**, do not add now.
- **Q89 [FACT]:** no staging backend or non-production database exists.
- **Q90 safest architecture (recommendation):** dedicated Clerk test account + strict naming convention for its data (e.g. list names prefixed `E2E-`), cleanup-by-API in fixtures (existing DELETE endpoints are userId-scoped), storageState reused across tests, artifacts scrubbed. **F = NEEDS ARCHITECTURE.**

## Backend Reset Strategy

- **Q91:** via the existing userId-scoped REST endpoints under the test account (`POST/PUT/PATCH/DELETE /api/locker*`). **[FACT that they exist]**
- **Q92/Q93:** lists/items/categories/locker: deletable per-entry via `DELETE /api/locker/:id`; shares: **no delete endpoint found** for links **[FACT]** — links accumulate; themes/preferences: client-side (context-isolated) except future server sync; uploads: import endpoints parse-only per current audit.
- **Q94:** a test-only cleanup endpoint (or a bulk "delete all my locker entries + links" route) **would be required** for fail-safe cleanup — do not add now.
- **Q95:** DB-transaction rollback is not reachable through HTTP; namespace-based cleanup (test account + name prefix) works today.
- **Q96:** crash before cleanup → orphaned rows in the production DB under the test account (bounded blast radius, but real). **Q97 recommended fail-safe:** global-setup sweep that deletes all `E2E-`-prefixed data for the test account BEFORE each run (cleanup-on-start, not cleanup-on-exit), plus the future bulk-cleanup endpoint.

## Multi-User / Review Testing

- **Q98/Q99:** YES — multiple BrowserContexts (owner storageState + fresh anonymous contexts) in one test are standard Playwright; contexts are fully isolated client-side. Touching only the test account's share keeps real users untouched (links are ownerId-scoped, `links.ts:35-47`). **[FACT for scoping]**
- **Q100:** requires the authenticated-test architecture (test account + storageState) + one disposable share; then owner-creates/viewer-opens/viewer-edits-sandbox/owner-unchanged/viewer-saves-copy are all assertable (Review sandbox is token-scoped localStorage, `ReviewPage.tsx:17-21`). 
- **Q101:** YES — multi-context runs fine with `workers: 1` (contexts are within one worker). **Q102:** roughly +300–500 MB and +CPU per extra live context [INFERENCE]; keep ≤ 3 simultaneous contexts.

## Storage Isolation

- **Q103 [FACT]:** localStorage (`pack-checklist-v5-*` owner data, `tw-unit-system`, Locker key, `trailweigh:review:<token>:*`, migration markers); sessionStorage (locker save-identity stash); IndexedDB (custom background photos, `bgPhotoStore.ts`); cookies (`sidebar_state`, Clerk session cookies); **no** Cache Storage, **no** service worker.
- **Q104:** ALL of the above are isolated by a fresh BrowserContext. **Q105:** none require explicit cleanup in unauthenticated tests. **Q106:** nothing survives context closure (no persistent profile is used). **Q107 standing procedure:** always use a fresh context per test (current fixture already does); never share storageState between tests except deliberate auth reuse.

## Visual Regression Stability

- **Q108:** NixOS Linux container, Chromium 151, fontconfig from `replit.nix` glib/X11 set. **Q109:** stable across restarts/runs **as long as `replit.nix` and the pinned browser build are unchanged**; a Nix channel or browser-revision bump WILL shift rendering. **[INFERENCE]**
- **Q110:** yes, if fonts load late — must wait for `document.fonts.ready`. **Q111:** DSF is fixed per config viewport — controllable. **Q112:** yes — CSS transitions/toasts (~3 s) are active; must disable animations. **Q113:** YES — Landscape theme uses remote Unsplash URLs (`BackgroundPicker.tsx:225-229`); must be mocked/blocked. **Q114:** demo seed is deterministic; toasts and transient states must be masked/awaited. 
- **Q115:** YES — baselines generated and compared only inside this same workspace environment.
- **Q116/Q117 baseline policy:** `reducedMotion: 'reduce'` + CSS animation-kill injection, fixed viewport + DSF 1, fixed locale/timezone (`en-US`, `America/Los_Angeles`), wait for `document.fonts.ready` + UI-state assertion (not networkidle), route-block remote images with local stand-ins, mask toast region, `maxDiffPixelRatio` small-but-nonzero (e.g. 0.001), baselines committed per-environment. Requires config additions → future authorized prompt. **H = WITH CONTROLS.**

## Firefox / WebKit Feasibility

- **Q118/Q119:** UNKNOWN — NEEDS CONTROLLED EXPERIMENT. Chromium needed a manual Nix system-library set; Firefox and especially WebKit require additional/different libraries (WebKit's dependency list on non-Ubuntu distros is notoriously long), and `playwright install-deps` does not work on NixOS. **[FACT for the NixOS constraint]**
- **Q120:** additional GTK/harfbuzz/libsoup/gstreamer-class libraries [INFERENCE from Playwright docs knowledge]; exact set = experiment. **Q121:** ~90 MB (Firefox) + ~90–120 MB (WebKit) download, several hundred MB installed [INFERENCE]. Disk is not a constraint (252 GB free). **Q122:** comparable per-browser memory to Chromium. **Q123:** NixOS library resolution is the main risk.
- **Q124:** **neither until staging/CI.** Cross-browser value is highest for visual/compat testing, which itself is premature (Phase 1B first). **I = UNKNOWN, J = UNKNOWN.**

## Mobile Emulation Limits

- **Q125:** YES — Chromium reliably emulates iPhone/Android/tablet viewports, touch events, DSF, orientation via Playwright devices. **Q126:** it does NOT reproduce Safari/WebKit rendering & scrolling physics, iOS keyboard/IME, rubber-banding, safe-area insets behavior, or real gesture latency. **Q127:** layout at mobile widths, tap targets, accordion/nav flows, form entry are trustworthy under emulation. **Q128:** Safari-specific rendering, momentum scrolling, and any swipe gestures need WebKit or a real device later.

## Importer Fixture Strategy

- **Q129:** YES — `setInputFiles` with local fixtures is fully supported. **Q130:** `tests/e2e/fixtures/` (committed, small). **Q131:** PDF/CSV/DOCX/PNG/JPEG/malformed/large-but-reasonable all fine. **Q132:** ≤ 10 MB per fixture (the API body limit is 12 MB — stay under it). **[FACT for the 12 MB limit]** **Q133:** run importers on the V3 sandbox route or with mutating APIs route-blocked; import endpoints are parse-only per this audit, but blocking guarantees it. **Q134:** YES — the 77-item PDF regression is automatable with a committed fixture. **Q135:** no additional harness needed beyond fixtures + the existing route-block pattern.

## Network / Failure Injection

- **Q136/Q137:** YES to all (offline via `context.setOffline`, aborts, fulfilled 4xx/5xx, delayed responses) — entirely client-side interception; the real backend never sees blocked calls (proven pattern: Phase 1's Share test). **[FACT]** **Q138:** Locker CRUD + `/api/locker/status` retry/debounce logic (`Checklist.tsx:1347-1436`), `/api/links/:id` Review load, import endpoints. **Q139:** no service worker exists **[FACT]** — no cache interference.

## Retry / Flaky Policy

- **Q140:** YES — keep `retries: 0` for development suites; a failure must mean something. **Q141:** YES — Deep Audit may use `retries: 1` strictly to auto-classify flaky vs reproducible. **Q142:** reproducible = fails twice identically; flaky = pass-on-retry; environment failure = infra signature (5-min kill, restart, ECONNREFUSED); test-infra failure = assertion/locator proven wrong (fix test, rerun). **Q143:** YES — Playwright 1.62 reports flaky status and `--fail-on-flaky-tests` exists. **Q144 standing policy:** retries 0 everywhere except Deep Audit (=1, classification only); flaky tests get quarantined + investigated, never silently retried green.

## Artifact Retention

- **Q145 [FACT]:** `test-results/` (traces/videos/screenshots, retain-on-failure), `playwright-report/` (HTML), `workflow-reports/` (deliverables). **Q146:** 252 GB free. **Q147:** a failing-heavy Deep Audit ≈ 1–2 MB per failure (screenshot+video+trace); even 100 failures ≈ 200 MB — trivially safe. **Q148:** only a runaway always-on-video config (~GBs) would matter; not a realistic risk with current settings. **Q149:** passing = nothing (current behavior); failing = keep all; flaky = keep trace on the failed attempt; release audits = archive the ZIP only. **Q150:** YES — trace ZIPs fit comfortably in report ZIPs (Phase 1 ZIP with 3 full evidence sets ≈ 2 MB). **Q151:** no practical limit at these sizes. **Q152:** video **retain-on-failure** (current setting) — keep.

## Readiness / networkidle Strategy

- **Q153/Q154:** networkidle is currently workable on the sandbox route because the app has **no polling/analytics/websocket/SW [FACT]** — but owner-route debounced saves with retry (`Checklist.tsx:1347-1436`) and Unsplash background loads make it unreliable there. **Q155:** initial load → assert `LIST SUMMARY` visible; list loaded → summary counters present; category opened → `Close <cat> category` visible; import completed → item-count change or success toast; Review initialized → list name + token-scoped render. **Q156:** YES — standing rule: **UI-state assertions first; networkidle only as a supplementary settle on the sandbox route; never on owner/Review routes.**

## Playwright Agent/CLI Evaluation

- **Q157–Q161:** **EVALUATE LATER.** Codegen/healer tooling overlaps with what Replit Agent already does (authoring, inventory via code reading, self-healing edits); running extra agent browser sessions would compete for the same 4 CPUs / 8 GB (see App Testing rule). Potential future value: `codegen` for quickly drafting selectors on new surfaces. No current gap justifies the resource and complexity cost.

## Testability Gaps

- **Q162–Q164 [FACT, from Phase 1 + this audit]:**
  1. Drag-reorder — touch/hold-drag choreography; blocker: canvas/drag/touch behavior. 
  2. Toasts — no `aria-live`, ~3 s plain divs; blocker: timing ambiguity + missing semantics.
  3. Search / Catalog / Create New List — `aria-disabled` **divs**, not buttons; blocker: missing accessible roles (currently only assertable as "disabled placeholder").
  4. Successful share/auth flows — backend dependency + missing deterministic test data.
  5. Expand-All wedge semantics — the accessible name ("Close X category") does not match behavior after Expand All; ambiguity is both a testability and a UX/a11y problem.
- **Q165:** items 2, 3, 5 are simultaneously accessibility problems.
- **Q166 classification (do not implement now):** toast `aria-live="polite"` — **RECOMMENDED**; proper `button` roles when Search/Catalog/Create ship — **REQUIRED at that time**; wedge label/behavior reconciliation after Expand All — **RECOMMENDED**; stable `data-testid` on item rows — **OPTIONAL** (aria labels are serving well); test-only bulk-cleanup endpoint before authenticated deep audit — **REQUIRED for that phase**.
- **Decision L:** NO change is strictly required before a *sandbox-scope* Deep Audit; the REQUIRED items above gate only the authenticated phase.

## Security / Privacy of Test Evidence

- **Q167:** YES — traces record request/response headers (cookies, auth headers), and videos/screenshots capture whatever is on screen (emails, list names). For unauthenticated sandbox tests this is benign (demo data only). **Q168:** for authenticated tests: dedicated test account only (never real accounts), disable video, targeted screenshots, and do not export raw traces — or scrub them — because Clerk session cookies live in trace network entries. **Q169:** NEVER in ZIPs: storageState/auth-state files, cookies, tokens, `.env`/secrets, real-user data, raw authenticated traces. **Q170:** YES — with test-account-only data and the artifact rules above, authenticated reports are exportable.

## Replit Mode / Cost Strategy

- **Q171:** Power genuinely helps: test authoring against an unexplored surface, debugging failures with traces, architecture/audit work (this document). **Q172:** Economy suffices for: rerunning a known-green suite, regenerating a report/ZIP, mechanical chunk execution. **Q173:** authoring=Power; debugging=Power; routine smoke=Economy; routine core regression=Economy; Deep Audit=Power (classification judgment); visual baseline generation=Economy (mechanical) with Power for triage; a11y=Power initially; security=Power. **Q174:** suite organization to minimize cost: keep the shared fixture/helpers model (one place to fix), chunked spec files ≤ ~15 tests each, storageState reuse for authenticated suites, cleanup-on-start (avoids re-running cleanup debugging).

## Recommended Full Testing Architecture

| Suite | Route/env | Auth | Browser | Viewport | Workers | Retries | Evidence | Runtime | Mode |
|---|---|---|---|---|---|---|---|---|---|
| Smoke | V3 sandbox, dev server | none | Chromium | 1280×720 | 1 | 0 | on-failure | <1 min | Economy |
| Core functional (Phase 1) | V3 sandbox | none | Chromium | default | 1 (2 for reruns) | 0 | on-failure | 4–6 min chunked | Economy |
| Phase 1B | Review `/s/:id` (mocked links) + V3 | none | Chromium | mobile + desktop | 1 | 0 | on-failure | 5–10 min | Power author / Economy rerun |
| Importers | V3 + fixtures, APIs route-blocked | none | Chromium | desktop | 1 | 0 | on-failure | 3–5 min | Power author |
| Visual regression | prod build served locally (needs config auth) | none | Chromium | 3 fixed viewports | 1 | 0 | all diffs | 5–10 min | Economy |
| Authenticated Owner | dev server + Clerk test account | storageState | Chromium | desktop+mobile | 1 | 0 | screenshots only, no video/trace export | 10–15 min | Power |
| Owner/Review isolation | multi-context | owner state + anon | Chromium | mixed | 1 | 0 | screenshots | 5 min | Power |
| Network/error injection | V3 + Review, route interception | none | Chromium | desktop | 1 | 0 | on-failure | 3–5 min | Economy |
| A11y (Axe) — later | Review + V3 | none | Chromium | mobile+desktop | 1 | 0 | JSON reports | 3–5 min | Power |
| Perf (Lighthouse) — later | prod build | none | Chromium | mobile | 1 | 0 | JSON | 5 min | Economy |
| Cross-browser — CI/staging only | staging | varies | FF/WebKit | matrix | n/a | 1 | on-failure | n/a | n/a |
| Deep Audit | all of the above, chunk manifest | mixed | Chromium | matrix | 1 | 1 (classify) | full | 60+ min chunked | Power |

## Required Decision Summary

| # | Decision | Answer |
|---|---|---|
| A | Keep current Phase 1 suite? | **YES** (with the reclassifications noted: TW-P1-001 test-assumption, 002/003 sandbox-scope) |
| B | Phase 1B required? | **YES** |
| C | Ready for visual regression after Phase 1A? | **NO** — Phase 1B first |
| D | Safe default worker count | **1** (2 permitted for quick reruns) |
| E | App Testing concurrent with Playwright? | **NO** — one at a time |
| F | Safe path to authenticated testing exists? | **NEEDS ARCHITECTURE** (Clerk test account + cleanup-on-start + artifact scrubbing) |
| G | Safe multi-user Owner/Review path exists? | **NEEDS ARCHITECTURE** (depends on F; multi-context itself is safe) |
| H | Replit suitable for visual baselines? | **WITH CONTROLS** (same-environment-only, animation/font/remote-image normalization) |
| I | Firefox feasible? | **UNKNOWN** — NEEDS CONTROLLED EXPERIMENT (NixOS deps) |
| J | WebKit feasible? | **UNKNOWN** — NEEDS CONTROLLED EXPERIMENT (heavier deps) |
| K | Playwright Agent/CLI | **EVALUATE LATER** |
| L | App testability changes required before Deep Audit? | **NO** for sandbox scope; toast `aria-live` RECOMMENDED; cleanup endpoint REQUIRED before the *authenticated* phase |
| M | Next recommended step | **Phase 1B: Review/shared-page functional suite (mock-backed `/api/links/:id`) + importer fixture suite with route-blocked mutations** |
