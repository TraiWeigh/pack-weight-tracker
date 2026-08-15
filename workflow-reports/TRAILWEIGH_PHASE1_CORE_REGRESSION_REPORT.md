# TrailWeigh — Phase 1 Core Regression + Bug Hunt Report

Date: 2026-08-15 · Target: `/pack-checklist/mobile-functional-v3` (demo sandbox route) · Browser: Chromium 151.0.7922.34 (Playwright 1.62.1, pinned)

---

## 1. Executive Summary

| Metric | Value |
|---|---|
| Total core tests | **71** (across 11 spec files) |
| Passed | **68** |
| Failed (reproducible defects) | **3** |
| Flaky | **0** |
| Smoke test | PASS (kept intact, 1 passed) |
| App source modified | **NO** (verified — see §10) |
| Console errors / page errors during passing tests | **0** (every test asserts a clean error log via fixture) |

Three failures were each rerun in isolation **twice** and failed identically every time → classified **REPRODUCIBLE** and assigned defect IDs TW-P1-001…003. All three are app defects (user-intent assertions), not test bugs. No data-safety issues: the demo route is a client-side sandbox; nothing server-side was mutated.

**SAFE TO KEEP SUITE: YES** · **READY FOR PHASE 2: YES**

---

## 2. Pre-flight

- `@playwright/test` pinned at **1.62.1** in root `package.json` — verified.
- Chromium launches with `--no-sandbox --disable-setuid-sandbox` — verified.
- `playwright.config.ts` untouched (fail-fast webServer stub intact; suite requires the already-running dev workflow, which was confirmed serving HTTP 200 before every run).
- Smoke test (`tests/e2e/smoke.spec.ts`) passes before and after the core suite.
- Mid-session note: the workspace restarted once during the first full run (environment event, not test-induced); the dev + API workflows were restarted and the suite rerun from scratch. Background (`nohup`) runs are killed when the shell session ends in this environment, so the suite was executed in foreground chunks.

## 3. Control Inventory (as tested)

Locators actually exercised (all role/label-based):

- Category wedge `Open/Close ${cat} category`; options `Category options for ${cat}`; drag `Drag to reorder ${cat} category`.
- Add category: `Add a new category to this list` → label `New category name` → `Confirm add category`; rename input placeholder `Category name…`.
- Item row `${name} — expand/collapse details`; checkbox `${name} selected/not selected for checklist`; `Delete ${name}` → dialog `Delete item confirmation` (Cancel / `Delete Item`); `Quantity of ${name}` select (1–20); `Weight of ${name} in oz|g` spinbutton (blur commits); `Add item to ${cat}`.
- Menu (`Open menu`): Undo, Redo (native `disabled`), Reset, Expand All, Collapse All, Imperial, Metric, Checklist, Share, Print.
- Bottom nav: `List/Locker/Summary/More — …`. Panels (Locker/Summary/More/About/Help) are **full-screen and cover the bottom nav** — switching panels requires `Back to list` (documented design behavior, screenshot-verified).
- Disabled-by-design: Search, Catalog, Create New List (aria-disabled divs — see §8 testability findings).
- Toasts: plain divs, text-assert only (~3 s), no `aria-live` (see §8).

## 4. Test Matrix

| Spec file | Area | Tests | Result |
|---|---|---|---|
| startup-navigation.spec.ts | A. Startup / navigation | 7 | 7 pass |
| lists.spec.ts | B. List / file behavior | 5 | 5 pass |
| categories.spec.ts | C. Categories | 13 | 12 pass, **1 fail (TW-P1-001)** |
| items.spec.ts | D. Items | 8 | 6 pass, **2 fail (TW-P1-002, TW-P1-003)** |
| weights.spec.ts | E. Weight / quantity math | 10 | 10 pass |
| sidebar.spec.ts | F. Panels / overlays | 4 | 4 pass |
| display-modes.spec.ts | G. Display-mode controls | 3 | 3 pass |
| undo-redo.spec.ts | H. Undo / Redo | 4 | 4 pass |
| persistence.spec.ts | I. Reload / persistence | 4 | 4 pass |
| edge-cases.spec.ts | 5. Torture inputs | 8 | 8 pass |
| rapid-interaction.spec.ts | 6. Rapid interaction | 5 | 5 pass |
| **Total** | | **71** | **68 / 3** |

Run times: first half (A–E) 2.2 min, second half (F–6) 1.2 min, smoke 5 s; single worker, Chromium only.

## 5. Defects (REPRODUCIBLE — each failed 3× total: full run + 2 isolated reruns)

### TW-P1-001 — Close wedge does not close a category while "Expand All" is active — **MEDIUM**
- Test: `categories.spec.ts:45`. Steps: menu → Expand All → click `Close Backpack category`.
- Expected: Backpack collapses. Actual: wedge click is accepted but the category stays open (`aria-expanded` remains open state).
- User impact: after Expand All, per-category collapse silently does nothing; only Collapse All recovers.
- Evidence: `test-results/core-categories-C-Category-f63a2-category-actually-closes-it-chromium/` (screenshot, video, trace).

### TW-P1-002 — Newly added item does not open for editing — **MEDIUM**
- Test: `items.spec.ts:65`. Steps: open category → `Add item to Backpack`.
- Expected: new "Unnamed item" row appears expanded so the user can immediately edit it. Actual: row is appended collapsed (`Unnamed item — expand details`; the `— collapse details` state never appears). Root-cause candidate observed in source during inventory: the add-item handler expands id `''` instead of the new item's id.
- User impact: every add requires an extra tap to start editing; combined with TW-P1-003 the item can never be named at all.
- Evidence: `test-results/core-items-D-Item-core-beh-94927-em-and-opens-it-for-editing-chromium/`.

### TW-P1-003 — No item name/type editor exists anywhere — **HIGH**
- Test: `items.spec.ts:83`. Steps: add item → expand its detail panel → search entire page for any `input[type="text"]`.
- Expected: a way to name the item. Actual: detail panel offers quantity, weight, delete — zero text inputs on the page. Items remain "Unnamed item" forever; a gear list where items cannot be named fails its core purpose.
- Evidence: `test-results/core-items-D-Item-core-beh-27e12-name-item-capability-check--chromium/`.

## 6. Flaky Tests

None. Every failure reproduced identically on both isolated reruns; every pass was stable across chunked runs and the final full run.

## 7. Test-code repairs made during the run (test bugs, not app bugs)

Per the prompt, test code was repaired only where the test itself was proven wrong; assertions were never weakened to force green:

1. `Summary` overlay legitimately contains "LIST SUMMARY" text — assertion changed to check the `Back to list` control instead (startup + sidebar specs).
2. `getByRole('button', { name: 'Back' })` substring-matched "Open **Back**pack category" — now `exact: true`. Same class of fix for `'Undo'` vs a test-created "UndoProbe" category.
3. `openCategory`/new `openItemDetail` helpers made tolerant of already-open state after menu/overlay round-trips (UI legitimately preserves accordion state).
4. Panel-switch tests rewritten to use `Back to list` between panels — screenshot proof that panels are full-screen and cover the bottom nav (design, not defect).
5. `12abc` weight test: `fill()`/programmatic assignment on `type=number` inputs is blanked by the browser before the app ever sees it — rewritten with real keystrokes (`pressSequentially`), where the browser normalizes to `12`; app then behaves correctly.

After an independent review round, three hardening changes were also made (suite rerun green afterwards):

6. `expectClean` now fails on `console.error` output and failed network requests too (narrow documented allowlist: `net::ERR_ABORTED` navigation cancellations and Vite HMR/websocket churn), and the hand-created fresh-context test got equivalent listeners.
7. The Share test now **blocks every mutating `/api/**` request** via route interception (fulfilled with 403), guaranteeing no share link or server record can be created by the suite, and waits on an observable UI state instead of a fixed timeout.
8. The item-name-editor capability check (TW-P1-003) was broadened to a semantic editor search — text/search inputs, untyped inputs, textareas, `contenteditable`, and accessible textboxes named for the item — so it cannot false-fail on a non-`input[type=text]` editor.

## 8. Testability / accessibility findings (not counted as Phase-1 defects)

- Toasts have no `aria-live` region — invisible to screen readers and awkward to await in tests.
- Search, Catalog, Create New List are `aria-disabled` **divs**, not buttons — fine for now, but they will need proper roles when enabled.

## 9. Console / network summary

- Custom fixture logs every `pageerror`, `requestfailed`, HTTP ≥ 500 response, and `console.error` per test; `expectClean` asserts all four are empty (failed requests filtered through a narrow documented allowlist for navigation-abort and dev-server HMR noise). All 68 passing tests were clean under the strengthened assertion; the 3 failing tests failed on functional assertions, not console/network noise.
- API server was running; mutating API traffic from the Share flow is route-blocked by the test itself, so no server-side data was ever created. No 5xx responses observed.

## 10. Files created/modified & app-source safety

- Created: `tests/e2e/helpers/trailweigh.ts`, 11 spec files under `tests/e2e/core/`, this report, the ZIP.
- Modified: root `package.json` **scripts only** — added `test:e2e:core`, `test:e2e:smoke` (existing `test:e2e` preserved).
- NOT touched: app source, `replit.nix`, `playwright.config.ts`, `tests/e2e/smoke.spec.ts`.
- Verification: `git diff --name-only -- artifacts/` → **empty output** (no app-source changes).
- Data safety: demo route is a client-side sandbox; Locker saves are browser-localStorage only inside throwaway test contexts. No shared/server data was created or mutated.

## 11. ZIP contents

`workflow-reports/trailweigh-phase1-core-regression-report.zip` contains:
- `TRAILWEIGH_PHASE1_CORE_REGRESSION_REPORT.md` (this report)
- `tests/` — all 11 core specs + helper fixture
- `package-scripts-excerpt.txt` — the three `test:e2e*` scripts
- `run-summary.txt` — plain-text pass/fail listing of the final run
- `evidence/` — screenshot/video/trace directories for the 3 defects
(Integrity verified with `unzip -t` after build.)

## 12. Ranked next actions

1. **Fix TW-P1-003 (HIGH)** — add an item name/type editor to the detail panel; without it the product's core loop is incomplete.
2. **Fix TW-P1-002 (MEDIUM)** — expand the newly added item (pass the new item's id, not `''`).
3. **Fix TW-P1-001 (MEDIUM)** — make the per-category Close wedge override Expand-All mode.
4. Add `aria-live="polite"` to the toast container (small win for a11y and test stability).
5. Proceed to Phase 2 on the current suite foundation.

**SAFE TO KEEP SUITE: YES** — deterministic, role-based locators, no app coupling beyond public labels.
**READY FOR PHASE 2: YES** — foundation and Phase 1 gates are green; the 3 defects are documented, not blocking.
