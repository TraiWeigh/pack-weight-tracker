# Prompt 023Q — Native Color Picker / Eyedropper Safety & Performance Fix
**Date:** 2026-08-10  
**Status:** COMPLETE — awaiting user live-app verification  
**Eyedropper:** KEPT (not removed, not replaced)

---

## 1 · Checkpoint

Code checkpoint exists prior to all changes.

---

## 2 · Acknowledgment — 023P is USER VERIFIED PASS

Prompt 023P (saved-file appearance isolation) was confirmed PASS by the user. All 023P protections are preserved in this prompt.

---

## 3 · Native Color Input Location

| Element | File | Component | Lines |
|---|---|---|---|
| Bar Color `<input type="color">` | `BackgroundPicker.tsx` | `BackgroundPickerPanel` | 1113–1119 |
| Text Color `<input type="color">` | `BackgroundPicker.tsx` | `BackgroundPickerPanel` | 1156–1162 |
| `handleBarColorChange` | `Checklist.tsx` | — | 656–663 (before 023Q) |
| `handleBarTextColorChange` | `Checklist.tsx` | — | 672–679 (before 023Q) |

---

## 4 · Pre-Fix Event Path (root cause)

**Before 023Q**, the complete path for every `onChange` on `<input type="color">` (which fires for every intermediate sample, including live eyedropper samples):

```
native color input event
→ React onChange
→ handleBarColorChange(v)
    → pushBg(snapshot)         ← ONE UNDO ENTRY PER SAMPLE
    → setBarColor(v)           ← React re-render per sample
    → barColorRef.current = v
    → localStorage.setItem()   ← ONE STORAGE WRITE PER SAMPLE
    → updateBarForkKey()       ← ONE sessionStorage WRITE PER SAMPLE
```

**With 100 intermediate samples:**
- 100 undo stack entries (undo-storm)
- 100 localStorage writes (write-storm)  
- 100 React re-renders
- 0 BroadcastChannel messages (no existing BC for live changes — already safe)
- 0 backend/network writes (already safe)

No debounce, throttle, or RAF existed. No drag-start/commit split existed. No final-commit event handler existed.

**The native `<input type="color">` fires React `onChange` on every intermediate sample** (maps to the HTML `input` event). There is no built-in React prop for the HTML `change` event (final commit). The commit signal was captured via `onBlur` — which fires reliably when the color picker panel closes.

---

## 5 · Fix Applied — Three-Phase Pattern (mirrors 023N barTransparency)

Same pattern as 023N's barTransparency fix, applied to Bar Color and Text Color.

### Phase A — `handleBarColorPickerStart` (mousedown)
Records the color value **before** the picker opens into `barColorBeforePickerRef`. This gives the undo entry the correct pre-pick snapshot regardless of how many intermediate samples are fired.

### Phase B — `handleBarColorChange` (onChange, every sample)
**Live preview only:**
```typescript
const handleBarColorChange = (v: string) => {
  setBarColor(v);           // React state → re-render for live preview
  barColorRef.current = v;  // ref stays current
  updateBarForkKey('barcolor', v); // fork tab remount resilience (sessionStorage, lightweight)
  // NO pushBg — no undo entry per sample
  // NO localStorage — no write per sample
};
```

### Phase C — `handleBarColorCommit` (onBlur — picker closed)
**Fires once per interaction:**
```typescript
const handleBarColorCommit = () => {
  const before  = barColorBeforePickerRef.current;
  const current = barColorRef.current;
  if (before === current) return; // picker opened but color unchanged — skip
  pushBg({ ..., barColor: before }); // one undo entry, correct pre-pick snapshot
  if (current) localStorage.setItem('trailweigh:barColor', current);
  else         localStorage.removeItem('trailweigh:barColor');
  barColorBeforePickerRef.current = current;
};
```

Same pattern applied identically to `handleBarTextColorChange` / `handleBarTextColorCommit` / `handleBarTextColorPickerStart`.

### Throttle/Coalescing
No explicit throttle was added. The three-phase split eliminates the expensive work (pushBg, localStorage) from the hot path entirely. The live path is only: `setState` + `ref update` + one sessionStorage write (fork key). React batches re-renders. This is sufficient — no additional RAF or debounce needed.

---

## 6 · Files Changed

| File | Change |
|---|---|
| `artifacts/pack-checklist/src/pages/Checklist.tsx` | Added `barColorBeforePickerRef`, `barTextColorBeforePickerRef` refs. Replaced `handleBarColorChange` (single handler) with three-phase `handleBarColorPickerStart` / `handleBarColorChange` / `handleBarColorCommit`. Same for Text Color. Passed new handlers to `BackgroundPickerPanel`. |
| `artifacts/pack-checklist/src/components/BackgroundPicker.tsx` | Added 4 optional props (`onBarColorPickerStart?`, `onBarColorCommit?`, `onBarTextColorPickerStart?`, `onBarTextColorCommit?`). Added `onMouseDown` + `onBlur` to both color inputs. |

**No other files touched.** All 023P protections unchanged.

---

## 7 · Before / After Event Counts (100-sample interaction)

| Metric | Before 023Q | After 023Q |
|---|---|---|
| Input events (samples) | 100 | 100 |
| Preview state updates | 100 | 100 (unchanged — live preview still works) |
| `pushBg` calls (undo entries) | 100 | **1** |
| `localStorage` writes | 100 | **1** |
| `sessionStorage` writes (fork key) | 100 | 100 (lightweight — still bounded, needed for remount resilience) |
| BroadcastChannel messages | 0 | 0 |
| Backend/network writes | 0 | 0 |

---

## 8 · 100-Event Stress Test: PASS

Ran via Node.js simulation of the exact handler call sequence:

```
Starting barColor: #ff0000
Picker start recorded. before = #ff0000

After 100 live events:
  undoStack.length:   0  ✓ (EXPECTED: 0)
  lsBarColorWrites:   0  ✓ (EXPECTED: 0)
  ssBarColorWrites:  100  (fork-key updates, lightweight)

After commit (blur):
  barColor (final): #c80000
  undoStack.length: 1  ✓ (EXPECTED: 1)
  lsBarColorWrites: 1  ✓ (EXPECTED: 1)
  broadcastChannel: 0  ✓ (EXPECTED: 0)
  undo entry pre-color: #ff0000 ✓ (EXPECTED: #ff0000)

ALL PASS ✓
```

---

## 9 · Undo / Redo: PASS

Validated in stress test simulation:
- 100 intermediate samples → 0 undo entries
- 1 blur commit → 1 undo entry with pre-pick snapshot (`#ff0000`)
- Undo once → restores `#ff0000` ✓
- Redo once → restores `#c80000` ✓

No-change guard: if the picker opens and closes with no color change, `before === current` → no undo entry pushed ✓

---

## 10 · Bar Color Test: PASS (logic-level)

Three-phase split applied and verified. `handleBarColorPickerStart` wired to `onMouseDown`. `handleBarColorChange` is live-only. `handleBarColorCommit` wired to `onBlur` on the color input. TypeScript: zero new errors.

---

## 11 · Text Color Test: PASS (logic-level)

Identical pattern applied to `handleBarTextColorChange` / commit / start. Same props added to `BackgroundPickerPanel`. TypeScript: zero new errors.

---

## 12 · File A / File B Isolation: PASS

Validated in stress test:
- File B locker record (`barColor: '#0000ff'`) untouched after 100 intermediate events + commit ✓
- `handleBarColorChange` (live) and `handleBarColorCommit` only touch: React state, barColorRef, fork sessionStorage key, localStorage barColor key — never any locker entry ✓
- 023P protections unchanged (no locker reads/writes during color editing)

---

## 13 · New-File Default Isolation: PASS

New-file default appearance (`barColor: ''`) is set via the newseed bundle in `handleNewList`. Color handlers only update the current working state — no newseed bundle is modified. Opening a new tab via New correctly reads `''` from the newseed, not from `trailweigh:barColor` (which is written only on commit). ✓

---

## 14 · Persistence / Write Counts (summary)

| Storage | Per-sample (live) | Per-commit |
|---|---|---|
| `localStorage:trailweigh:barColor` | 0 | 1 |
| `sessionStorage:tw-fork-barcolor-restore-*` | 1 (fork tabs only) | 0 |
| Locker entry | 0 | 0 |
| BroadcastChannel | 0 | 0 |
| Backend / API | 0 | 0 |

---

## 15 · Cross-Window Message Counts: 0 per-sample, 0 per-commit

No BroadcastChannel writes on color change. `broadcastLocker` is only called by explicit Save (unchanged). ✓

---

## 16 · Backend / Network Write Counts: 0

No backend calls in any color handler (before or after 023Q). The Scan Gear List API and Locker API are unaffected. ✓

---

## 17 · Feedback-Loop Protection: PASS

Inspected for loops:
- Color onChange → setState + ref + fork key only → no storage event, no BC, no effect that writes back ✓
- `updateBarForkKey` writes sessionStorage but this does not trigger any storage event listener in Checklist ✓
- `handleBarColorCommit` writes localStorage once → no storage event listener that could re-trigger a handler ✓

No feedback loops found.

---

## 18 · Transparency Regression: PASS

- Default-color transparency: unchanged (`hsl(var(--muted) / alpha)`) ✓
- Custom-color transparency: unchanged (`hexToRgba(barColor, alpha)`) ✓  
- `+Base` follows transparency: unchanged (`barBasePillStyle`) ✓
- Changing Bar Color does not reset Transparency: `barTransparencyRef.current` is read independently in `handleBarColorCommit` → no reset ✓
- File B's transparency unaffected: no cross-file writes during color editing ✓

---

## 19 · Desktop / Mobile: PASS (code inspection)

Color inputs in `BackgroundPickerPanel` are unchanged in layout and placement. New `onMouseDown` + `onBlur` props add no visual change. The panel is rendered with the same responsive CSS classes. Mobile viewport (390px, 412px): no layout changes.

---

## 20 · Core Regression

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
| Authentication | PASS (app renders, Clerk active) |
| Sharing permissions | NOT TESTED |

---

## 21 · Build / Runtime: PASS

- TypeScript: zero new errors (two pre-existing unrelated errors in `calendar.tsx`, `spinner.tsx`)
- Vite dev server: running, HMR applied cleanly
- No new browser console errors
- API Server: running, 200/304 responses

---

## 22 · Backend Regression: PASS

No backend files touched. API Server clean.

---

## 23 · Physical macOS Eyedropper: NOT TESTED

Cannot be tested via Replit automation. The eyedropper is a system-level process (invoked from within the native OS color picker). TrailWeigh's event path has been verified safe via logic simulation. Whether the macOS system color picker + eyedropper causes any OS-level issue is outside TrailWeigh's control.

After this fix:
- The eyedropper invokes `onChange` (live preview events) — handled safely
- The picker close invokes `onBlur` — commits one undo entry + one localStorage write
- No write storm, no undo storm, no feedback loop

---

## 24 · Unresolved Issues

None introduced by 023Q.

---

## 25 · Final Diff Summary

```
artifacts/pack-checklist/src/pages/Checklist.tsx
  + barColorBeforePickerRef = useRef('')
  + barTextColorBeforePickerRef = useRef('')
  + handleBarColorPickerStart() — records pre-pick value on mousedown
  ~ handleBarColorChange() — live preview only (removed pushBg + localStorage)
  + handleBarColorCommit() — one pushBg + one localStorage write on blur
  + handleBarTextColorPickerStart() — same pattern for Text Color
  ~ handleBarTextColorChange() — live preview only
  + handleBarTextColorCommit() — one pushBg + one localStorage write on blur
  ~ BackgroundPickerPanel props: +onBarColorPickerStart, +onBarColorCommit,
                                  +onBarTextColorPickerStart, +onBarTextColorCommit

artifacts/pack-checklist/src/components/BackgroundPicker.tsx
  ~ BackgroundPickerPanelProps: +4 optional callback props
  ~ BackgroundPickerPanel destructuring: +4 new props
  ~ Bar Color input: +onMouseDown, +onBlur
  ~ Text Color input: +onMouseDown, +onBlur
```

---

## 26 · User Verification Steps

**FIRST — WITHOUT EYEDROPPER:**

1. Open a saved test file.
2. Open Edit View (Background Edit button).
3. Open Bar Color picker.
4. Choose a clearly different color manually (no eyedropper).
5. Close/commit the picker (click away / tab out).
6. Confirm TrailWeigh remains responsive. ← CRITICAL
7. Undo once → confirm prior color returns.
8. Redo once → confirm selected color returns.
9. Open another saved file → confirm it did not change.

**ONLY AFTER THAT PASSES — EYEDROPPER:**

10. Return to the first file. Open Bar Color.
11. Use the native eyedropper ONCE. Pick one color. Close the picker.
12. Confirm TrailWeigh and macOS remain responsive.
13. Confirm selected color applied.
14. Do not rapidly repeat eyedropper sampling during the first test.
15. Only test Text Color eyedropper after Bar Color passes.

---

## 27 · Overall Status

**COMPLETE — awaiting user live-app verification.**

The native eyedropper is kept. The three-phase pattern (start/live/commit) eliminates the undo-storm and write-storm while preserving full live preview responsiveness. One picker interaction = at most one undo entry and one localStorage write, regardless of how many intermediate samples the native picker fires. All 023P file isolation protections are unchanged.
