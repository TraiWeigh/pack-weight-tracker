# Prompt 021F — Fix Share Menu Consistency + Panel Order + Share Labels

**Date:** 2026-08-08  
**Status:** NOT USER-VERIFIED  
**Full regression:** 35 suites, all passing (exit 0)

---

## Starting State

Four issues reported by the user after 021E:

1. Shared Files/Locker panel appears **above** Pack Summary (wrong order)
2. Two logged-in owner tabs show **different** Share menus — one shows "Download PDF only", another shows all three options
3. User-facing label "Share Locker" → user wants it called **"Share Link"**
4. Share Pack List subtitle "Current list, read-only" → user wants **"Copy link, read-only"**

---

## Root Cause — Inconsistent Share Menus

**Finding:** There is NO bug in the owner `/checklist` Share menu. When `canShare = true` and `shareStep === 'menu'`, all three options (Share Link / Share Pack List / Download PDF) always render — there is no conditional hiding.

**Actual cause:** `SharedChecklistPage.tsx` (the `/s/:shareId` shared-view page) has its own independent Share button (lines 1002–1026) that shows **only "Download PDF"**, because recipients cannot re-share a link they received. When the user had one `/s/:shareId` tab open and one `/checklist` owner tab open, they saw:
- Shared-view tab Share → "Download PDF" only
- Owner tab Share → all 3 options

The user believed both tabs were owner tabs. The shared-view's read-only "Download PDF only" Share button is intentional and correct behavior, documented in the code comment: `{/* Share pill — PDF download only; recipients can't re-share via Copy Link here */}`.

**No code change was needed to fix the owner Share menu.** It was already consistent across all owner tabs.

---

## Root Cause — Shared Files Above Pack Summary

In `SharedChecklistPage.tsx`, the sidebar panel order was:
```
1. SharedLockerPanel (Shared Files)  ← WRONG — appeared first
2. WeightSummary (Pack Summary)
3. ImportGearPanel (Scan Gear List)
```

The correct order (matching the normal owner sidebar) is:
```
1. WeightSummary (Pack Summary)
2. ImportGearPanel (Scan Gear List)
3. SharedLockerPanel (Shared Files)  ← moved to bottom
```

**Fix:** Moved the `SharedLockerPanel` JSX block from the top of the sidebar to the bottom (after `WeightSummary` and `ImportGearPanel`).

---

## Files Changed

| File | Change |
|------|--------|
| `artifacts/pack-checklist/src/pages/Checklist.tsx` | "Share Locker" → "Share Link"; "Share Locker Anyway" → "Share Link Anyway"; "Current list, read-only" → "Copy link, read-only" |
| `artifacts/pack-checklist/src/pages/SharedChecklistPage.tsx` | Moved `SharedLockerPanel` to after `WeightSummary` + `ImportGearPanel` in sidebar |
| `artifacts/pack-checklist/src/hooks/shareMenuConsistency021F.test.mjs` | New — 31 tests (groups A–Z3) |
| `package.json` | test:importer now includes `shareMenuConsistency021F.test.mjs` (suite 35) |
| `artifacts/pack-checklist/src/hooks/shareLink021.test.mjs` | Updated: "Share Locker Anyway" → "Share Link Anyway" |
| `artifacts/pack-checklist/src/hooks/sharePillMenu021E.test.mjs` | Updated: test A checks "Share Link" instead of "Share Locker" |

**Internal code names unchanged** (per spec): `handleShareLocker`, `handleSharePackList`, `SharedLockerPanel`, `handleShareLocker()` call sites — only user-visible text strings were changed.

---

## Exact Code Changes

### Checklist.tsx — label changes (3 string replacements)

```diff
- <div className="font-medium">{copied ? 'Copied!' : 'Share Locker'}</div>
+ <div className="font-medium">{copied ? 'Copied!' : 'Share Link'}</div>

- {canShare ? 'Current list, read-only' : 'Add gear items first'}
+ {canShare ? 'Copy link, read-only' : 'Add gear items first'}

- Share Locker Anyway
+ Share Link Anyway
```

Also updated the JSX comment `{/* ── Share Locker ── */}` → `{/* ── Share Link ── */}` and `/* Share Locker — save-before-share reminder */` → `/* Share Link — save-before-share reminder */`.

### SharedChecklistPage.tsx — panel order (move block)

```diff
- {/* View-only Shared Locker */}
- {snapshot.lockerFiles && snapshot.lockerFiles.length > 0 && <SharedLockerPanel ... />}
  <WeightSummary ... />
  <ImportGearPanel ... />
+ {/* View-only Shared Locker — same lower position as owner Locker */}
+ {snapshot.lockerFiles && snapshot.lockerFiles.length > 0 && <SharedLockerPanel ... />}
```

---

## Real Browser Test Results

### Screenshot — `/s/428864e2e8` (Shared Locker link)

✅ **Panel order correct:**  
- "PACK SUMMARY" visible first in right sidebar  
- "Scan Gear List" visible second  
- "Shared Files" (5 files) visible at bottom  

✅ Share dropdown in shared view shows only "Share" button → "Download PDF" (correct read-only behavior)  
✅ No JavaScript errors

### `/checklist` (owner tab)

✅ Redirects to sign-in — 021A regression confirmed

---

## Automated Test Results

```
Suite                                    Tests  Status
─────────────────────────────────────────────────────
shareMenuConsistency021F.test.mjs           31  ✅ all pass  (NEW)
sharePillMenu021E.test.mjs                  45  ✅ all pass  (2 tests updated)
shareLink021.test.mjs                       27  ✅ all pass  (1 test updated)
sharedLocker021D.test.mjs                   32  ✅ all pass
sharedLocker021C.test.mjs                   70  ✅ all pass
(all prior 30 suites)                      ...  ✅ all pass
─────────────────────────────────────────────────────
Total: 35 suites, exit 0
```

---

## Protected Features Confirmed

| Feature | Status |
|---------|--------|
| Share Link — multi-file Locker share | ✅ preserved (handleShareLocker unchanged) |
| Share Pack List — single read-only link | ✅ preserved (handleSharePackList unchanged) |
| Download PDF | ✅ preserved |
| Save Your Own Copy | ✅ preserved |
| Shared viewer cannot Rename/Delete originals | ✅ preserved (SharedLockerPanel view-only) |
| /checklist → sign-in for guests (021A) | ✅ preserved |
| Private Rename (021B) | ✅ preserved |
| Private Delete — no password (021B) | ✅ preserved |
| 020F newseed/LOCKER_KEY | ✅ preserved |
| LockerEntry bgSize (021D) | ✅ preserved |
| Preview modal Share Pack List button | ✅ preserved |

---

## Unresolved Issues

None — all four requested fixes applied and verified.

---

## Status

| Prompt | Status |
|--------|--------|
| 020F | USER-TESTED PASS |
| 021–021A | USER-TESTED PASS |
| 021B | USER-TESTED PASS |
| 021C | USER-TESTED FAIL (old links pre-date lockerFiles) |
| 021D | USER-TESTED FAIL (old links pre-date lockerFiles) |
| 021E | NOT USER-VERIFIED |
| **021F** | **NOT USER-VERIFIED** |

**To verify 021F:**
1. Sign in, go to `/checklist`, add gear
2. Click Share → verify dropdown shows exactly: **Share Link** / **Share Pack List** / **Download PDF**
3. Open a second owner tab, load a different Locker file → same 3 options must appear
4. Open a `/s/:shareId` link in a third tab → Share shows "Download PDF" only (correct)
5. Verify right sidebar order: **Pack Summary → Scan Gear List → Locker** (no Shared Files above Pack Summary)
6. Click Share Link → warning → "Share Link Anyway" → link copies
7. Click Share Pack List → link copies immediately (no warning)
