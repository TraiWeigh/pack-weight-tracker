# PROMPT 021K — Restore Category Padding and Equalize the Three Main Gutters

**Date:** 2026-08-08  
**Status:** NOT USER-VERIFIED (gutter layout) | Disclosure chevrons = previously USER-TESTED PASS, preserved

---

## 1. Checkpoint / Recovery

`workflow-reports/PRE_021K_MASTER_BACKUP.md` — created before any edits (copy of `TRAILWEIGH_COMPLETE_WORKFLOW.md`).  
Git state at start: 021J changes committed to tree.

---

## 2. Step 1 — lg:pr-3 Restored

**File:** `artifacts/pack-checklist/src/pages/Checklist.tsx` — left-column scrollable container

| | State |
|---|---|
| Before 021J (baseline) | `lg:pr-3 lg:[scrollbar-gutter:stable]` |
| After 021J (removed) | `lg:[scrollbar-gutter:stable]` (no lg:pr-3) |
| **After 021K (restored)** | **`lg:pr-3 lg:[scrollbar-gutter:stable]`** ✅ |

Change: single token `lg:pr-3` re-inserted immediately before `lg:[scrollbar-gutter:stable]`.  
No other 021J changes touched. Chevron behavior, aria-expanded, all other formatting — unmodified.

---

## 3. Step 2 — Owner /checklist DOM Measurement

### Measurement Attempt

Playwright (headless Chromium) was located in the Replit environment at  
`~/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/`

Launch failed with a fatal system-library error:

```
chrome-headless-shell: error while loading shared libraries:
libglib-2.0.so.0: cannot open shared object file: No such file or directory
```

**Chromium cannot launch in this NixOS container.** The required GLib shared libraries are not on the dynamic linker path.

### Secondary Check

Even if the browser had launched, the `/checklist` route serves the Vite SPA shell (HTTP 200) and then Clerk's client-side auth guard executes and redirects unsigned sessions to Clerk's sign-in page. A headless browser session without a valid Clerk session cookie cannot reach the authenticated owner layout.

### Authentication Safety Rule — Applied

Per Prompt 021K, Section "AUTHENTICATION SAFETY RULE":

> "If Replit's browser/testing environment CANNOT access the authenticated owner page:  
> STOP.  
> DO NOT MAKE THE NEW GUTTER ADJUSTMENT.  
> Report: 'Owner /checklist DOM could not be measured directly. No gutter correction was attempted.'"

**Result: Owner /checklist DOM could not be measured directly. No new gutter correction was attempted.**

The `lg:pr-3` restore (Step 1) is explicitly allowed by the same rule:  
> "Restoring the known 021J lg:pr-3 regression is still allowed."

---

## 4. Steps 3–5 — Not Executed

Per the authentication safety rule, the following steps were **not performed**:

- Step 3: Identify real spacing sources (requires owner-page DOM)
- Step 4: Calculate common target T (requires real G1/G2/G3 measurements)
- Step 5: Apply CSS changes to equalize gutters

No gutter-equalization CSS changes were made.

---

## 5. Mandatory Before/After Table

Because the owner page could not be measured, exact DOM pixel values cannot be provided for the owner layout. The table below reflects the **known state from 021I's shared-page baseline** (which is structurally identical on the left column, but SharedChecklistPage.tsx still retains its own `lg:pr-3`):

|  | BEFORE 021K | AFTER 021K |
|--|-------------|------------|
| G1 Left | 32px (021I baseline) | 32px (unchanged) |
| G2 Center | 43px (021I baseline, shared page) | 43px (lg:pr-3 restored = pre-021J state) |
| G3 Right | 32px (021I baseline) | 32px (unchanged) |
| Largest − smallest | 11px | 11px (no equalization performed) |
| Viewport width | 1280px | 1280px |
| Sidebar width | 365px | 365px (unchanged) |
| Grid gap | 16px | 16px (unchanged) |
| Outer left padding | 32px | 32px (unchanged) |
| Outer right padding | 32px | 32px (unchanged) |

> ⚠️ These are the 021I shared-page values. Real owner-page values may differ slightly due to viewport, scrollbar state, or content rendering. The table is provided for completeness; it does not satisfy the prompt's requirement for AFTER DOM measurements from the owner page.

---

## 6. 021J Chevron Protection

All 021J disclosure-chevron changes are preserved exactly:

| Component | Collapsed | Expanded | Changed by 021K? |
|-----------|-----------|----------|-----------------|
| GearCategory.tsx | ChevronDown | ChevronUp | ✅ No |
| WeightSummary.tsx Pack Summary | ChevronDown | ChevronUp | ✅ No |
| WeightSummary.tsx Weight Distribution | ChevronDown | ChevronUp | ✅ No |
| LockerPanel.tsx | ChevronDown | ChevronUp | ✅ No |
| SharedChecklistPage.tsx SharedLockerPanel | ChevronDown | ChevronUp | ✅ No |
| ImportGearPanel.tsx (static) | ChevronDown | — | ✅ No |
| BackgroundPicker.tsx (true dropdown) | rotate-180 | — | ✅ No |
| Checklist.tsx MOVE (true dropdown) | ChevronDown | — | ✅ No |

Disclosure chevrons = **021J USER-TESTED PASS — preserved**.

---

## 7. Files Changed

| File | Type | Change |
|------|------|--------|
| `artifacts/pack-checklist/src/pages/Checklist.tsx` | App source | `lg:pr-3` restored on left scrollable div |
| `artifacts/pack-checklist/src/hooks/gutterLayout021H.test.mjs` | Test | E2 reverted to assert `lg:pr-3` is present (021K restore) |

**1 application source file changed. 1 test file updated.**

No other files changed.

---

## 8. Automated Regression Test Results

**Command:** `pnpm test:importer`

| Suite | Tests | Status |
|-------|-------|--------|
| importGear.test.mjs | 24 | ✅ |
| importGear.pdf.test.mjs | 22 | ✅ |
| importGear.pdf.api.test.mjs | 24 | ✅ |
| scanGear.test.mjs | 26 | ✅ |
| categoryAliases.test.mjs | 38 | ✅ |
| usePackData + moveItem + pieColor + bgCollections (multiple) | — | ✅ |
| bgCollections016A–landscapeShake017E | multiple | ✅ |
| activeFileName018–018C | multiple | ✅ |
| sidebar019.test.mjs | 30+ | ✅ |
| newBlank020–crossTabIsolation020E | multiple | ✅ |
| inheritedSessionStorage020F.test.mjs | 28 | ✅ |
| shareLink021.test.mjs | — | ✅ |
| authProtection021A.test.mjs | 28 | ✅ |
| lockerSimpleDelete021B.test.mjs | 41 | ✅ |
| sharedLocker021C.test.mjs | 70 | ✅ |
| sharedLocker021D.test.mjs | 32 | ✅ |
| sharePillMenu021E.test.mjs | 45 | ✅ |
| shareMenuConsistency021F.test.mjs | 31 | ✅ |
| sharedFileOpen021G.test.mjs | 48 | ✅ |
| gutterLayout021H.test.mjs (E2 updated) | 29 | ✅ |

**37 suites — all passed — exit 0.**

---

## 9. Final Diff Review

```
2 files changed, 9 insertions(+), 5 deletions(-)
artifacts/pack-checklist/src/pages/Checklist.tsx          | 2 +-
artifacts/pack-checklist/src/hooks/gutterLayout021H.test.mjs | 12 +++++++---
```

No unrelated refactoring, cleanup, renaming, file movement, or dependency changes.

---

## 10. Data / Storage Protection

- No localStorage / sessionStorage / IndexedDB reads or writes
- No locker file IDs modified
- No schema migration
- No authentication data touched
- User data: zero changes

---

## 11. Responsive Check

The only change to app source is restoring one Tailwind token (`lg:pr-3`) on the left scrollable div — a desktop-only (`lg:`) class. No mobile or tablet classes were added, removed, or modified.

| Viewport | Impact |
|----------|--------|
| ≥1024px desktop | `lg:pr-3` restored — same as pre-021J state |
| <1024px tablet/phone | No change (class is `lg:` prefixed) |

---

## 12. Dark / Light Mode

No color, background, or theme properties were modified. The `lg:pr-3` token is pure spacing — applies identically in both dark and light mode.

---

## 13. Acceptance Checklist

| Item | Status |
|------|--------|
| Checkpoint/backup created before edits | ✅ PASS |
| `lg:pr-3` restored to Checklist.tsx left scrollable div | ✅ PASS |
| 021J chevron behavior preserved (ChevronDown=closed, ChevronUp=open) | ✅ PASS |
| Owner /checklist DOM measurement attempted | ✅ PASS (attempted) |
| Owner /checklist DOM measurement obtained | ❌ FAIL — environment cannot run Chromium; Clerk auth wall additional barrier |
| New gutter equalization CSS applied | ⛔ NOT ATTEMPTED (authentication safety rule) |
| G1/G2/G3 AFTER measurements from real DOM | ⛔ NOT OBTAINED |
| Sidebar equalized / centered | ⛔ NOT ATTEMPTED |
| All regression tests pass | ✅ PASS (37 suites, exit 0) |
| No unrelated source changes | ✅ PASS |
| No user data/storage changed | ✅ PASS |
| Mobile/tablet unchanged | ✅ PASS |
| **021K gutter layout USER visual verification** | ⏳ NOT USER-VERIFIED |

---

## 14. Unresolved Issues

**Gutter equalization blocked by measurement constraint.**

The owner `/checklist` page requires Clerk authentication that a headless browser in this Replit environment cannot satisfy (Chromium also cannot launch due to missing system libraries). The prompt's authentication safety rule explicitly blocks the gutter adjustment in this case.

**What was accomplished:**
- `lg:pr-3` restored → layout returned to pre-021J (021H) state
- Chevrons remain at 021J's USER-TESTED PASS state
- All 37 regression suites pass

**What is unresolved:**
- G1/G2/G3 equalization not performed
- G2 remains ~11px wider than G1/G3 at desktop widths

**Path forward for gutter equalization:**
The user must provide real owner-page G1/G2/G3 measurements using browser DevTools directly (F12 → Console → `getBoundingClientRect()` on the relevant elements while signed in). Those pixel values can then be used to calculate target T and apply the minimal CSS change.

---

## 15. User Tests Required

**Chevrons (previously USER-TESTED PASS — confirm still working):**
1. Open any category → expanded → shows **↑ Up** chevron
2. Close any category → collapsed → shows **↓ Down** chevron
3. Same for Pack Summary, Weight Distribution, Locker, Shared Files

**Layout (restored to pre-021J / 021H state):**
1. Load `/checklist` at desktop viewport
2. Confirm left column spacing looks the same as before 021J
3. (Gutter equalization still pending — G2 will still look wider than G1/G3)

**021K gutter layout = NOT USER-VERIFIED**  
Disclosure chevrons = previously USER-TESTED PASS and must remain protected.
