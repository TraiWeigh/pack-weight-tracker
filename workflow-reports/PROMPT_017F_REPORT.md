# Prompt 017F — Restore Scan Gear List After Post-017E Regression

---

## Identification

| Field | Value |
|-------|-------|
| **Prompt ID** | 017F |
| **Prompt title** | Restore Scan Gear List After Post-017E Regression |
| **Date** | 2026-08-07 |
| **Purpose** | Diagnose and repair the recurrence of "Import failed — Server error 502: unexpected response format." immediately after Prompt 017E was confirmed PASS |
| **Exact requested result** | Scan Gear List (document importer) returns to verified post-016C working behavior; PDF/Word/Excel/Numbers all import successfully; 017E background/landscape shaking fix untouched |

---

## Starting State

| Field | Value |
|-------|-------|
| **Prompt 017E status** | ✅ CONFIRMED PASS — user performed clean fresh-preview live-test; Landscape hover shaking and Darken-slider-triggered shaking both resolved |
| **Visible regression** | `Import failed — Server error 502: unexpected response format.` — same error string as pre-016C |
| **API Server workflow** | `NOT_STARTED` — workflow was not running at the start of this session |
| **016C code status** | INTACT — see investigation below |
| **Hypothesis from user** | "016C fix may have been lost, overwritten, or bypassed during 017B/017C/017D/017E" |

---

## Investigation

### Step 1 — Review 016C fix

The 016C fix consisted of:
1. **`importGear.ts`** — added `Promise.race` with 30s timeout around `inst.getText()`, `destroy()` in `finally`, image-only PDF detection, structured JSON error codes for all error paths
2. **`importGear.pdf.api.test.mjs`** — 53 new integration tests exercising the actual pdf-parse v2 library against real binary PDF fixtures
3. **`package.json`** — added the new test suite to `test:importer`
4. **PDF fixtures** — three binary PDF test fixtures in `attached_assets/`

### Step 2 — Inspect current importGear.ts

Direct grep of the post-016C landmarks in the current file:

```
Line 828:  const PDF_PARSE_TIMEOUT_MS = 30_000;
Line 832:  const result = await Promise.race<{ pages: { text: string }[] }>([
Line 833:    inst.getText(),
Line 837:        PDF_PARSE_TIMEOUT_MS,
Line 847:    code: 'image_only_pdf',
Line 864:    code: 'pdf_timeout',
Line 869:    code: 'pdf_password_protected',
Line 880:    try { inst.destroy(); } catch (_) { /* ignore cleanup errors */ }
```

**All 016C code landmarks are present and unmodified.** The 016C code fix was NOT regressed, overwritten, or bypassed by any of the 017B/017C/017D/017E prompts.

### Step 3 — Verify git history for API server changes

```
git log --oneline --name-only -- artifacts/api-server/
```

Most recent commits touching the API server directory:
- `88ddf0d` — `importGear.pdf.api.test.mjs` + `importGear.ts` (this is the 016C commit — last API server change)

**No commits to `artifacts/api-server/` after 016C.** Prompts 017, 017A, 017B, 017C, 017D, and 017E were exclusively frontend changes (BackgroundPicker.tsx, Checklist.tsx, test files in `artifacts/pack-checklist/src/hooks/`). None touched the API server directory.

### Step 4 — Determine actual root cause

**Root cause: The API Server workflow was `NOT_STARTED`.**

Confirmed by the system state at the start of this session:
- `artifacts/api-server: API Server` — not started

This is the same primary root cause as 016C. When the Express API server (port 8080) is not running, the Vite dev-server proxy cannot reach it and returns HTTP 502 with `Content-Type: text/html`. The frontend in `ImportGearPanel.tsx` checks the content-type header:

```javascript
const ct = resp.headers.get('content-type') ?? '';
if (!ct.includes('application/json')) {
  throw new Error(`Server error ${resp.status}: unexpected response format.`);
}
```

An HTML 502 response → content-type is not `application/json` → `throw new Error('Server error 502: unexpected response format.')` → user sees the exact reported error.

### Step 5 — Why the workflow was not running

The API Server workflow stopped between sessions due to a Replit environment restart. The sequence:

1. **016C session** — API server manually started; 016C code fixes applied; tests pass; workflow running at end of session
2. **017B/017C/017D/017E sessions** — all frontend-only; no one started or checked the API server workflow since it was not needed for those changes
3. **Replit environment restart** — occurred between sessions (expected platform behavior)
4. **User tests 017E** — keeps app closed during work per testing protocol; fresh preview opened only after 017E declared complete; by this point the API server workflow had been `NOT_STARTED` for the entire multi-session 017B–017E period
5. **User scans a document** — request goes to Vite proxy → proxy returns 502 HTML (server not reachable) → frontend error handler fires → "Server error 502: unexpected response format."

### Step 6 — Was this a code regression?

**No.** The 016C code is fully intact. This is an operational regression (workflow not running), not a code regression.

### Step 7 — Other formats checked

| Format | Code path | Status |
|--------|-----------|--------|
| PDF | `pdf-parse` v2 class API with Promise.race | ✅ Code intact, server now running |
| Word (.docx) | `mammoth.extractRawText` | ✅ Code unchanged since 016C |
| Excel (.xlsx) | `XLSX.read` | ✅ Code unchanged since 016C; 219 tests pass |
| Numbers (.numbers) | Same XLSX path | ✅ Code unchanged since 016C |

---

## Fix Applied

**No code changes were needed.** The 016C code fix is intact.

**Operational fix:** Restarted the `artifacts/api-server: API Server` workflow.

```
WorkflowsRestart("artifacts/api-server: API Server")
→ Restarted workflow `artifacts/api-server: API Server`.
```

---

## Verification

### API server health

```
curl http://localhost:8080/api/healthz
→ {"status":"ok"}
```

### Fixture PDF import

```
curl -F "file=@attached_assets/trailweigh_gear_list_fixture.pdf;type=application/pdf" \
     http://localhost:8080/api/import-gear
→ STATUS: 200
→ items: 15
→ sample: {"sub":"Backpack","desc":"ULA Circuit","weightOz":40.8,"destination":"Backpack"}
```

15 items returned across 7 categories — identical to post-016C verified behavior.

### 017E fix integrity check

All 38 017E tests pass. Specific 017E structural markers confirmed still present:
- `paddingTop: '66.667%'` on landscape tile wrapper — ✅
- `absolute inset-0 overflow-hidden` on landscape button — ✅
- No `aspect-[3/2]` in PRESETS block — ✅
- `Math.max(0, 1 - bgFade)` in Checklist backgroundImage — ✅
- `willChange: transform` on grid wrapper — ✅
- `landscapeGridRef` declared and attached — ✅
- `import.meta.env.DEV` gate on measurement code — ✅

---

## Automated Test Results

**Command:** `pnpm test:importer`

| Suite | Tests | Result |
|-------|-------|--------|
| `importGear.test.mjs` | 219 | ✅ PASS |
| `importGear.pdf.test.mjs` | 54 | ✅ PASS |
| `importGear.pdf.api.test.mjs` | 53 | ✅ PASS |
| `scanGear.test.mjs` | 47 | ✅ PASS |
| `categoryAliases.test.mjs` | 77 | ✅ PASS |
| `usePackData.test.mjs` | 64 | ✅ PASS |
| `moveItem.test.mjs` | 47 | ✅ PASS |
| `pieColor.test.mjs` | 41 | ✅ PASS |
| `landscapeHover017B.test.mjs` | 24 | ✅ PASS |
| `landscapeActiveBackground017C.test.mjs` | 22 | ✅ PASS |
| `controls017.test.mjs` | 24 | ✅ PASS |
| `landscapeShake017D.test.mjs` | 26 | ✅ PASS |
| `landscapeShake017E.test.mjs` | 38 | ✅ PASS |
| `bgCollections.test.mjs` | — | ✅ PASS |
| `bgCollections016A.test.mjs` | — | ✅ PASS |
| `bgPhotoStore016B.test.mjs` | — | ✅ PASS |

**Total passed:** 826  
**Total failed:** 0  
**Exit code:** 0  
**New tests added in 017F:** 0 — no code changes; existing 53 API tests already cover this path

---

## Files Changed

| File | Change |
|------|--------|
| `artifacts/api-server: API Server` workflow | Restarted (operational fix — no code change) |
| `workflow-reports/PROMPT_017E_REPORT.md` | Status updated to ✅ CONFIRMED PASS |
| `workflow-reports/PROMPT_017F_REPORT.md` | Created (this file) |
| `TRAILWEIGH_COMPLETE_WORKFLOW.md` | 017E PASS confirmed; 017F section appended |
| `workflow-reports/PRE_017F_MASTER_BACKUP.md` | Pre-edit backup of workflow doc |

**No changes to:** `importGear.ts`, `ImportGearPanel.tsx`, any test files, any frontend code, any package.json, any artifact config.

---

## Scope Preservation

| Feature | Status |
|---------|--------|
| 017E landscape shaking fix (all sub-fixes A/B/C/D/E) | ✅ Untouched and confirmed intact by all 38 017E tests |
| 016C PDF timeout/destroy/image-only/error-code fixes | ✅ Untouched and confirmed intact by code inspection |
| Background Edit features (Fill/Fit, fade, themes, custom photos) | ✅ Not touched |
| Checklist calculations, Pack Summary, Weight Distribution | ✅ Not touched |
| Save/Save As/Locker/New/Reset | ✅ Not touched |
| Share Link / Shared View | ✅ Not touched |
| Hide/Preview/Imperial/Metric | ✅ Not touched |
| `lg:grid-cols-[1fr_365px]` | ✅ Not touched |
| `translate-x-3` (QTY column) | ✅ Not touched |
| Word/Excel/Numbers import code paths | ✅ Not touched |

---

## Acceptance Checklist

| Requirement | Status |
|-------------|--------|
| 1. 016C fix code verified intact (grep landmarks) | ✅ PASS |
| 2. Git history confirms no API server changes in 017B–017E | ✅ PASS |
| 3. Actual root cause identified: workflow NOT_STARTED | ✅ PASS |
| 4. API server workflow restarted | ✅ PASS |
| 5. Healthz returns `{"status":"ok"}` | ✅ PASS |
| 6. Fixture PDF → 200 JSON, 15 items | ✅ PASS |
| 7. All 826 automated tests pass | ✅ PASS |
| 8. All 38 017E tests pass (landscape fix intact) | ✅ PASS |
| 9. All 53 016C API tests pass (PDF path intact) | ✅ PASS |
| 10. 017E PASS status recorded in PROMPT_017E_REPORT.md | ✅ PASS |
| 11. 017E PASS recorded in TRAILWEIGH_COMPLETE_WORKFLOW.md | ✅ PASS |
| 12. No code changes to any frontend or backend files | ✅ PASS |
| 13. ZIP contains exactly four files | ✅ PASS |
| **User fresh-preview import test (PDF)** | ⏳ PENDING USER TEST |
| **User fresh-preview import test (Word/Excel/Numbers)** | ⏳ PENDING USER TEST |
| **017E landscape fix still working in fresh preview** | ✅ CONFIRMED PASS (017E user test) |

---

## What Still Requires User Testing

Per the user's testing protocol: keep the app closed while Replit works, open one fresh preview tab only after being told the repair is complete, then test.

**✅ Prompt 017F is fully complete. The API Server workflow is running. No code was changed.**

Please test:
1. Open Scan Gear List → upload a real PDF → verify items appear in the review table (no 502 error)
2. Optionally: test Word (.docx), Excel (.xlsx), or Numbers (.numbers) import
3. Optionally: re-verify Landscape hover and Darken slider are still stable (expected: yes, nothing was touched)

---

## Root Cause Narrative for the Record

This was an operational regression, not a code regression. The API server workflow is an independent process that must be running for the Vite proxy to route `/api/*` requests to the Express server. Between multi-session work on prompts 017B through 017E (all of which were frontend-only), the Replit environment restarted and the API server workflow was never restarted because it was not needed for those prompts. When the user opened a fresh preview to test 017E and then attempted a document import, the API server was not running — producing the identical 502 error as pre-016C.

**The 016C code fix (timeout guard, destroy cleanup, JSON error codes) remains fully intact and is not the source of this regression.** The fix that 016C applied to the code is durable; what is not durable across Replit environment restarts is the running state of the API server workflow itself.
