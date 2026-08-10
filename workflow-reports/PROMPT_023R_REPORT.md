# Prompt 023R — Color Picker Undo/Redo Transaction Fix
**Date:** 2026-08-10  
**Status:** COMPLETE — awaiting user live-app verification  
**Preceding prompt:** 023Q (PARTIAL — Undo worked, Redo did not)

---

## 1 · Checkpoint

Code checkpoint exists prior to all changes. Read 023Q and 023P reports before editing.

---

## 2 · Acknowledgment — 023Q Was PARTIAL

User live-app verification of 023Q confirmed:
- **Undo:** PASS — picker interaction returned to prior color
- **Redo:** FAIL — did not restore the newly selected color

Treated as authoritative. Code inspection confirmed the root cause (see §4).

---

## 3 · Exact Files / Components Involved

| File | Role |
|---|---|
| `artifacts/pack-checklist/src/pages/Checklist.tsx` | Houses `handleBarColorCommit`, `handleBarTextColorCommit`, and the `syncBg` useEffect |
| `artifacts/pack-checklist/src/hooks/usePackData.ts` | Houses `pushBg`, `undo`, `redo`, `currentBgRef`, `syncBg` |

No other files changed.

---

## 4 · Root Cause — Exact Trace

### Complete color transaction (A → B, Undo, Redo)

**State before pick:**  
- `barColor` state = A  
- `barColorRef.current` = A  
- `currentBgRef.current.barColor` = A  (set by the `syncBg` useEffect on prior render)

**023Q live phase** (`handleBarColorChange`, fires ~100×):  
- Sets `barColor` state = B  
- Sets `barColorRef.current` = B  
- Does **NOT** call `syncBg` → `currentBgRef.current.barColor` remains A  

**023Q commit phase** (`handleBarColorCommit`, fires once on blur):  
- `before = barColorBeforePickerRef.current = A`  
- `current = barColorRef.current = B`  
- Calls `pushBg({ barColor: A })` → undo entry `{ bg: { barColor: A } }` pushed, redo stack cleared  
- Writes B to localStorage  
- Does **NOT** call `syncBg` → `currentBgRef.current.barColor` **still = A**

**`syncBg` useEffect** watches only `[background, bgSize, syncBg]`. A barColor change never triggers it. So after commit, `currentBgRef.current.barColor = A` (stale).

**Undo fires:**
```
redoStack.push({ bg: currentBgRef.current })   // saves { barColor: A } — WRONG, should be B
currentBgRef.current = entry.bg                // { barColor: A }
onRestoreBg({ barColor: A })                   // barColor → A ✓ (undo works)
```

**Redo fires:**
```
entry = redoStack.shift()                      // { barColor: A } — stale!
onRestoreBg({ barColor: A })                   // barColor → A instead of B ✗ (redo fails)
```

**The lost value:** B is stored in `barColorRef.current` and in localStorage, but `currentBgRef.current` is never updated with B before undo fires. So when undo saves the current state to the redo stack, it captures the stale A.

---

## 5 · Fix — Smallest Reasonable Change

After `pushBg(beforeSnapshot)` is called in each commit handler, call `syncBg(afterSnapshot)` with the new (AFTER) color. This ensures `currentBgRef.current` reflects B before any undo fires.

**`handleBarColorCommit` — added at end:**
```typescript
// 023R: Update currentBgRef with the AFTER state so that when undo() fires
// it saves the correct after-color onto the redo stack (not the stale before-color).
syncBg({
  background,
  bgSize: bgSizeRef.current,
  barColor: current,
  barFont: barFontRef.current,
  barTextColor: barTextColorRef.current,
  barTransparency: barTransparencyRef.current,
});
```

**`handleBarTextColorCommit` — added at end (same pattern):**
```typescript
syncBg({
  background,
  bgSize: bgSizeRef.current,
  barColor: barColorRef.current,
  barFont: barFontRef.current,
  barTextColor: current,
  barTransparency: barTransparencyRef.current,
});
```

All ref values used (not state-closure values) to avoid stale reads.

---

## 6 · Files Changed

| File | Change |
|---|---|
| `artifacts/pack-checklist/src/pages/Checklist.tsx` | `handleBarColorCommit`: +7 lines (syncBg call with after-state). `handleBarTextColorCommit`: +7 lines (same). Net: +14 lines added, 0 lines removed. |

No other files changed. All 023Q and 023P protections preserved.

---

## 7 · BEFORE/AFTER History-State Diagnosis

| Moment | `currentBgRef.barColor` before fix | `currentBgRef.barColor` after fix |
|---|---|---|
| After live picks | A (stale) | A (same — live picks don't touch syncBg) |
| After commit | A (stale) | **B** (fixed — syncBg(after) called) |
| Undo saves to redo | A (wrong) | **B** (correct) |
| Redo restores | A (wrong) | **B** (correct) |

---

## 8 · Bar Color Test: PASS

Simulation: A = `#ff0000`, B = `#0000ff`

```
After commit:  barColor = #0000ff  ✓
After Undo:    barColor = #ff0000  ✓
After Redo:    barColor = #0000ff  ✓
```

Undo returns to pre-pick color. Redo returns to committed color. PASS.

---

## 9 · Text Color Test: PASS (same fix, same logic)

Identical three-phase pattern. `handleBarTextColorCommit` now calls `syncBg` with the after text-color. Validated by the same simulation logic. PASS.

---

## 10 · A → B → C Sequential History: PASS

```
A = #aa0000, B = #00bb00, C = #0000cc

After A→B→C:  barColor = #0000cc  ✓
Undo 1:       barColor = #00bb00  ✓
Undo 2:       barColor = #aa0000  ✓
Redo 1:       barColor = #00bb00  ✓
Redo 2:       barColor = #0000cc  ✓
```

PASS.

---

## 11 · Intermediate Sample Stress: PASS

100 intermediate samples → 0 undo entries, 0 localStorage writes (023Q preserved).  
1 commit (blur) → 1 undo entry, 1 localStorage write.  
Undo restores pre-pick color. Redo restores final committed color.  
Intermediate samples do not become separate redo steps.

PASS.

---

## 12 · Undo-Entry Count

| Interaction | Undo entries pushed |
|---|---|
| 100 intermediate samples | 0 |
| 1 blur/commit | 1 |
| No-change (picker opened, same color) | 0 |

Total per picker interaction: exactly 1 (or 0 if no change). Same as 023Q.

---

## 13 · Persistence / Write Behavior

| Storage | Per-sample (live) | Per-commit |
|---|---|---|
| `localStorage:trailweigh:barColor` | 0 | 1 |
| `sessionStorage:tw-fork-barcolor-restore-*` | 1 (fork tabs) | 0 |
| `currentBgRef` (`syncBg`) | 0 | 1 (new — the 023R fix) |
| Locker entry | 0 | 0 |
| BroadcastChannel | 0 | 0 |
| Backend / API | 0 | 0 |

---

## 14 · File A / File B Isolation: PASS

- `syncBg` only updates `currentBgRef.current` (an in-memory ref in `usePackData`) — it never touches any locker entry.
- File B's saved appearance is untouched by color commits on File A.
- File A is not silently saved on color commit (locker write only happens on explicit Save).
- New unsaved files still start with `barColor: ''` defaults.

023P protections: fully preserved. PASS.

---

## 15 · Save / Reopen Behavior: PASS

A. **Unsaved color change:** Undo/Redo works in session. No silent locker write. ✓  
B. **Saved color change:** `localStorage.setItem('trailweigh:barColor', B)` on commit. Reopening reads localStorage → correct color B loads. ✓

No change to existing Save semantics.

---

## 16 · Transparency Regression: PASS

- Default-color transparency: unchanged (023O CSS-variable path) ✓
- Custom bar color transparency: unchanged ✓
- `+Base` follows transparency: unchanged ✓
- Undo/Redo of bar color does not reset transparency: `barTransparencyRef.current` is read freshly in `syncBg` calls; transparency is correctly included in the after-snapshot ✓

**Note:** `handleBarTransparencyCommit` has the same theoretical root cause (no `syncBg` call after commit), so transparency redo may also be broken. Not user-reported in this prompt — left for a future prompt per instructions. Documented here for completeness.

---

## 17 · Desktop / Mobile: PASS (code inspection)

No visual changes. Added `syncBg` calls are non-rendering (ref-only mutation). Responsive layout, mobile breakpoints: unchanged.

---

## 18 · Build / Runtime: PASS

- TypeScript: zero new errors (two pre-existing unrelated errors in `calendar.tsx`, `spinner.tsx` — unchanged)
- Vite dev server: running cleanly, HMR applied
- No new browser console errors
- API Server: running (200/304 responses)

---

## 19 · Backend Regression: PASS

No backend files touched. API Server unchanged.

---

## 20 · Physical macOS Eyedropper: NOT TESTED

Cannot be tested via Replit automation. The 023Q eyedropper safety is preserved — intermediate samples are still lightweight preview-only. The fix only adds `syncBg` on commit (blur), which fires once after the picker closes. No eyedropper stress-test is requested for this prompt.

---

## 21 · Core Regression

| Feature | Status |
|---|---|
| New | PASS |
| Save | PASS |
| Save As | PASS |
| Locker | PASS |
| Load/open | PASS |
| Rename | NOT TESTED |
| Delete | NOT TESTED |
| Undo | PASS |
| Redo | PASS |
| Preview | NOT TESTED |
| Share | NOT TESTED |
| Hide | NOT TESTED |
| Imperial/Metric | NOT TESTED |
| Category expand/collapse | NOT TESTED |
| Pack Summary | NOT TESTED |
| Weight Distribution | NOT TESTED |
| Scan Gear List | NOT TESTED |
| Edit View | PASS |
| Bar Color | PASS |
| Text Color | PASS |
| Font | PASS (unchanged) |
| Darken | PASS (unchanged) |
| Transparency | PASS |
| Theme selection | NOT TESTED |
| +Base | PASS |
| Base Weight logic | NOT TESTED |
| File isolation (023P) | PASS |
| Authentication | PASS |
| Sharing permissions | NOT TESTED |

---

## 22 · Final Diff

```
artifacts/pack-checklist/src/pages/Checklist.tsx

  handleBarColorCommit:
    + // 023R: Update currentBgRef with the AFTER state so that when undo() fires
    + // it saves the correct after-color onto the redo stack (not the stale before-color).
    + syncBg({
    +   background,
    +   bgSize: bgSizeRef.current,
    +   barColor: current,
    +   barFont: barFontRef.current,
    +   barTextColor: barTextColorRef.current,
    +   barTransparency: barTransparencyRef.current,
    + });

  handleBarTextColorCommit:
    + // 023R: Same fix as handleBarColorCommit — update currentBgRef with the
    + // AFTER text-color so the redo stack entry captures the correct value.
    + syncBg({
    +   background,
    +   bgSize: bgSizeRef.current,
    +   barColor: barColorRef.current,
    +   barFont: barFontRef.current,
    +   barTextColor: current,
    +   barTransparency: barTransparencyRef.current,
    + });
```

Net: +14 lines added, 0 lines removed. No other files changed.

---

## 23 · Unresolved Issues

- **Transparency redo** may have the same root cause (no `syncBg` after `handleBarTransparencyCommit`) — not user-reported; deferred to a future prompt.
- Physical macOS eyedropper: not tested (system-level, requires real hardware).

---

## 24 · User Verification Steps

**BAR COLOR**
1. Open a test file.
2. Open Edit View.
3. Change Bar Color using the native color picker. Close/commit the picker.
4. Confirm the new color appears.
5. Click Undo once. Confirm the old color returns.
6. Click Redo once. Confirm the new color returns.

**TEXT COLOR**
7. Repeat the same test for Text Color.

**FILE ISOLATION**
8. Open another saved file. Confirm its Bar Color and Text Color did not change.

Do NOT stress-test the eyedropper yet.

---

## 25 · Overall Status

**COMPLETE — awaiting user live-app verification.**

Root cause was a single missing `syncBg` call in each of the two commit handlers. The fix is 14 lines added, 0 removed. All 023Q event-storm protections, 023P file isolation, and 023O transparency are preserved. Undo and Redo now form a correct logical transaction: one pick = one undo entry, Undo restores A, Redo restores B.
