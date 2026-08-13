# TRAILWEIGH — PROMPT 026K REPORT
## Main Category Accordion: Single-Open + Zero-Open + Expand All / Collapse All
### Internal Version ID: 026K-MAIN-CATEGORY-ACCORDION-BEHAVIOR-2026-08-13-R1

---

## 1. AGENT MODE

Build mode — Economy. Auto-apply OFF.

---

## 2. USER-REQUESTED BEHAVIOR

A. Single-open: opening Category B automatically collapses Category A.
B. Zero-open: clicking the only open category closes it; no other opens.
C. Expand All (left-side DOWN arrow): opens all simultaneously — intentional exception.
D. Return-to-normal after Expand All: next individual click leaves only that one open.
E. Collapse All (left-side UP arrow): closes every category from any state.
F. Group independence: main-category actions must not affect sidebar, and vice versa.

---

## 3. USER-VERIFIED BASELINE PRESERVED

- RIGHT-SIDEBAR ACCORDION GROUP: USER-VERIFIED PASS — not modified.
- Share dropdown layering: USER-VERIFIED PASS — not touched.
- Share/Review background and Locker behavior: not touched.
- All main-category visuals (6px spacing, header height, padding, icons, chevrons,
  fonts, colors, left-side arrow control): preserved — behavior change only.

---

## 4. ACTIVE COMPONENT / STATE / HANDLER TRACE

### Component rendering main categories

**`GearCategory.tsx`** — single shared component used by both Owner (Checklist.tsx) and
Share/Review (SharedChecklistPage.tsx). Same file for both views — no fork.

### Pre-026K state shape

**Checklist.tsx (line 972–973):**
```typescript
const [allOpen, setAllOpen] = useState(false);      // single boolean flag
const [openCloseSeq, setOpenCloseSeq] = useState(0); // bumped on Expand/Collapse All
```

**SharedChecklistPage.tsx (line 584–585):** same shape.

### Pre-026K click handler (root cause)

Inside **GearCategory.tsx line 206:**
```javascript
onClick={() => setIsOpen(o => !o)}
```
PURELY LOCAL. No callback to parent. Parent never knew a category was manually toggled.
Siblings never closed — multi-open was always possible.

### Pre-026K Expand All / Collapse All

```javascript
setAllOpen(true);  setOpenCloseSeq(s => s + 1);   // Expand All
setAllOpen(false); setOpenCloseSeq(s => s + 1);   // Collapse All
```

### Pre-026K GearCategory force-open wiring

```jsx
<GearCategory forceOpen={allOpen} forceOpenSeq={openCloseSeq} ... />
```
ALL categories received the SAME boolean. No individual-open awareness in parent.

---

## 5. ROOT CAUSE / CURRENT BEHAVIOR (PRE-EDIT)

**Root cause:** No `onToggle` callback from `GearCategory` to parent.
The parent never learned which category was manually opened.
No sibling-close logic could run.
All categories maintained fully independent local `isOpen` state.

`allOpen` was a boolean pushed identically to all categories — it only changed on
Expand/Collapse All. Between those clicks, every category's open state was local-only,
siblings never closed.

---

## 6. SIDEBAR GOLDEN REFERENCE INSPECTED

**`Checklist.tsx` sidebar pattern:**
```typescript
const [sidebarForce, setSidebarForce] =
  useState<Record<SidebarPanelKey, { open: boolean; seq: number }>>({...});

const handleSidebarPanelToggle = useCallback((id, nowOpen) => {
  setSidebarForce(prev => {
    const next = { ...prev };
    if (nowOpen) {
      for (const k of SIDEBAR_KEYS)
        if (k !== id) next[k] = { open: false, seq: prev[k].seq + 1 };
      next[id] = { open: true, seq: prev[id].seq };
    } else {
      next[id] = { open: false, seq: prev[id].seq };
    }
    return next;
  });
}, []);
```

Each panel has per-panel `{ open, seq }` state. Opening one auto-closes all others.

**For main categories:** Per-key Record not used because categories are user-defined
(dynamic names). `Set<string>` of open category IDs is equivalent and handles dynamics.

---

## 7. EXPECTED CHANGED FILES

1. `artifacts/pack-checklist/src/components/GearCategory.tsx`
2. `artifacts/pack-checklist/src/pages/Checklist.tsx`
3. `artifacts/pack-checklist/src/pages/SharedChecklistPage.tsx`

---

## 8. ACTUAL CHANGED FILES

```
artifacts/pack-checklist/src/components/GearCategory.tsx
artifacts/pack-checklist/src/pages/Checklist.tsx
artifacts/pack-checklist/src/pages/SharedChecklistPage.tsx
```

No other files changed. No unrelated formatting sweeps. No sidebar state touched.

---

## 9. EXACT IMPLEMENTATION

### GearCategory.tsx

**Interface (added `onToggle` prop):**
```typescript
/** 026K: called with the new open/closed state when the header is clicked manually. */
onToggle?: (isNowOpen: boolean) => void;
```

**Destructuring:** `onToggle` added.

**Click handler changed from:**
```javascript
onClick={() => setIsOpen(o => !o)}
```
**to:**
```javascript
onClick={() => { const next = !isOpen; setIsOpen(next); onToggle?.(next); }}
```

### Checklist.tsx (+ SharedChecklistPage.tsx — identical pattern)

**State replaced:**
```typescript
// Old:
const [allOpen, setAllOpen] = useState(false);
const [openCloseSeq, setOpenCloseSeq] = useState(0);

// New (026K):
// Set of currently-open category names — drives single-open accordion behavior
const [openCatIds, setOpenCatIds] = useState<ReadonlySet<string>>(new Set());
const [catSeq, setCatSeq] = useState(0); // bumped on every force-open/close action
```

**Derived button highlight state (added):**
```typescript
// 026K: Derived Expand All / Collapse All button highlight state
const allCatsOpen   = categoryOrder.length > 0 && categoryOrder.every(k => openCatIds.has(k));
const allCatsClosed = categoryOrder.every(k => !openCatIds.has(k));
// (SharedChecklistPage uses store.order in place of categoryOrder)
```

**Handler added (mirrors sidebar golden reference):**
```typescript
/** 026K: Single-open accordion for main categories.
 *  If multiple categories are open (post-Expand-All), any individual click
 *  collapses all others and keeps only the clicked one open.
 *  Closing the only open category leaves zero open. */
const handleCategoryToggle = useCallback((name: string, nowOpen: boolean) => {
  setOpenCatIds(prev => {
    if (prev.size > 1) return new Set([name]); // post-Expand-All: select only clicked
    if (nowOpen) return new Set([name]);        // normal open: single-open
    return new Set<string>();                   // normal close: zero open
  });
  setCatSeq(s => s + 1);
}, []);
```

**Expand All button handler:**
```typescript
// Old: setAllOpen(true); setOpenCloseSeq(s => s + 1);
// New:
setOpenCatIds(new Set(categoryOrder)); setCatSeq(s => s + 1);
// (SharedChecklistPage: new Set(store.order))
```

**Collapse All button handler:**
```typescript
// Old: setAllOpen(false); setOpenCloseSeq(s => s + 1);
// New:
setOpenCatIds(new Set<string>()); setCatSeq(s => s + 1);
```

**Button highlights:** `allOpen === true` → `allCatsOpen`, `allOpen === false` → `allCatsClosed` (in both className and style props, desktop + mobile, both files).

**GearCategory render:**
```jsx
// Old:
forceOpen={allOpen}
forceOpenSeq={openCloseSeq}

// New:
forceOpen={openCatIds.has(category)}
forceOpenSeq={catSeq}
onToggle={nowOpen => handleCategoryToggle(category, nowOpen)}
```

---

## 10. EXPAND ALL BEHAVIOR

`setOpenCatIds(new Set(categoryOrder))` — all category names entered into Set.
Each GearCategory gets `forceOpen={openCatIds.has(name)} = true`. `catSeq` increments →
`useEffect` fires → all `isOpen = true`.

Expand All button highlights when `allCatsOpen = true`.

---

## 11. COLLAPSE ALL BEHAVIOR

`setOpenCatIds(new Set<string>())` — empty Set.
Each GearCategory gets `forceOpen = false`. `catSeq` increments → `useEffect` fires →
all `isOpen = false`. Works from all open / several open / one open / none open.

Collapse All button highlights when `allCatsClosed = true`.

---

## 12. POST-EXPAND-ALL INDIVIDUAL-CLICK BEHAVIOR

After Expand All: `openCatIds.size > 1` (several names in Set).

User clicks Category C:
1. GearCategory header fires: `setIsOpen(!isOpen)`, `onToggle(!isOpen)` 
2. `handleCategoryToggle('C', ...)` fires: `prev.size > 1` branch → `return new Set(['C'])`
3. All other categories: `forceOpen = false`, `catSeq` increments → force-closed
4. Category C: `forceOpen = true`, `catSeq` increments → useEffect corrects local state if needed

Result: **only C is open** ✅

User then clicks C again (size=1, normal mode):
- `prev.size = 1`, `nowOpen = false` → `return new Set()` → zero open ✅

---

## 13. GROUP INDEPENDENCE BEHAVIOR

`handleCategoryToggle` touches only `openCatIds`/`catSeq` — no sidebar state.
`handleSidebarPanelToggle` / `handleSharedSidebarToggle` touches only `sidebarForce` — no main-category state.
Left-side arrow control Expand All/Collapse All: only calls `setOpenCatIds`/`setCatSeq`.
Right-side sidebar arrow control: only calls `setSidebarForce`.

Groups are fully independent ✅

---

## 14. OWNER / REVIEW SHARED-PATH RESULT

Both Checklist.tsx and SharedChecklistPage.tsx use the same `GearCategory` component
with the same `handleCategoryToggle` pattern. Implementation is once per page, not forked.
Behavior is identical in Owner (Home) and Share/Review modes.

OWNER/REVIEW ACCORDION PATH FORKED = NO ✅

---

## 15. TEST MATRIX — SOURCE ANALYSIS

(Interactive UI testing requires user verification — see Tests Not Run section)

**TEST 1 — SINGLE-OPEN** (source analysis)
- A open, user clicks B: `handleCategoryToggle('B', true)` → `prev.size=1`, `nowOpen=true` → `new Set(['B'])` → A force-closed, B open.
- SOURCE ANALYSIS: PASS ✅

**TEST 2 — ZERO-OPEN** (source analysis)
- B only open, user clicks B: `handleCategoryToggle('B', false)` → `prev.size=1`, `nowOpen=false` → `new Set()` → zero open.
- SOURCE ANALYSIS: PASS ✅

**TEST 3 — EXPAND ALL** (source analysis)
- Click DOWN arrow: `setOpenCatIds(new Set(categoryOrder))` → all IDs in Set → all `forceOpen=true` → all open.
- SOURCE ANALYSIS: PASS ✅

**TEST 4 — RETURN TO NORMAL AFTER EXPAND ALL** (source analysis)
- All open (size > 1), click C: `prev.size > 1` → `new Set(['C'])` → only C open.
- Click C again: `prev.size=1`, `nowOpen=false` → `new Set()` → zero open.
- SOURCE ANALYSIS: PASS ✅

**TEST 5 — COLLAPSE ALL** (source analysis)
- Click UP arrow from any state: `setOpenCatIds(new Set<string>())` → empty Set → all `forceOpen=false` → all closed.
- SOURCE ANALYSIS: PASS ✅

**TEST 6 — MAIN → SIDEBAR INDEPENDENCE** (source analysis)
- `handleCategoryToggle` writes only `openCatIds`/`catSeq` — no sidebar state reads or writes.
- SOURCE ANALYSIS: PASS ✅

**TEST 7 — SIDEBAR → MAIN INDEPENDENCE** (source analysis)
- `handleSidebarPanelToggle` / `handleSharedSidebarToggle` writes only `sidebarForce` — no main-category state.
- SOURCE ANALYSIS: PASS ✅

**TEST 8 — VISUAL PRESERVATION** (source analysis)
- No className, CSS, Tailwind class, color, font, icon, spacing, or layout changes.
- Only `onClick` handlers, `forceOpen` expressions, and `forceOpenSeq` prop updated.
- SOURCE ANALYSIS: PASS ✅

**TEST 9 — OWNER / REVIEW PARITY** (source analysis)
- Same GearCategory + same handler pattern in both views.
- SOURCE ANALYSIS: PASS ✅

**TEST 10 — REGRESSIONS** (source analysis)
- Sidebar accordion: untouched (`sidebarForce` state unchanged).
- Share dropdown layering: untouched.
- Share/Review background and Locker: untouched.
- Browser console: clean after final HMR update (23:18:18, no errors).
- SOURCE ANALYSIS: PASS ✅

---

## 16. TESTS NOT RUN

**All tests are source-analysis only.** Interactive click-sequence testing (opening and
closing categories in the live browser) was not performed — this is an interaction defect
and source analysis cannot fully substitute for live UI testing.

The following must be verified by USER:
- Tests 1–9 in the USER LIVE VERIFICATION PLAN above.
- Actual visual: no spacing, header, or arrow-control appearance changes.
- No console errors during normal interaction.

---

## 17. INTERACTION EVIDENCE

No screen recording or interactive browser test performed. Evidence is:
1. Source code trace: complete handler path documented above.
2. Vite HMR: all three changed files hot-updated cleanly (23:18:18, no TypeScript errors).
3. Browser console: no errors after final edit; app loaded to home page with Clerk and Vite connected.
4. Stale reference check: zero remaining `allOpen`/`setAllOpen`/`openCloseSeq`/`setOpenCloseSeq` in executable code (only a harmless comment at Checklist.tsx:1553).

---

## 18. VISUAL REGRESSION RESULT

No visual changes made. Only `onClick` handlers, `forceOpen={...}` expressions, and one
new `onToggle={...}` prop per GearCategory added. All className and style props for buttons
are identical in structure — only `allOpen === true/false` replaced with derived
`allCatsOpen`/`allCatsClosed` booleans.

LEFT-SIDE ARROW CONTROL VISUALS CHANGED = NO ✅
MAIN CATEGORY VISUALS CHANGED = NO ✅

---

## 19. SIDEBAR REGRESSION RESULT

The right-sidebar accordion implementation in Checklist.tsx (lines 989–1003) and
SharedChecklistPage.tsx (lines 821–833) was not modified.

`sidebarForce`, `setSidebarForce`, `handleSidebarPanelToggle`, `handleSharedSidebarToggle`,
`sidebarExpandActive`, `sidebarCollapseActive`, all sidebar `forceOpen`/`forceOpenSeq`/`onToggle`
props: unchanged.

RIGHT-SIDEBAR BEHAVIOR CHANGED = NO ✅

---

## 20. ROLLBACK GUIDANCE

Revert ONLY these 3 files to their pre-026K state:
```
src/components/GearCategory.tsx
src/pages/Checklist.tsx
src/pages/SharedChecklistPage.tsx
```

No DB, schema, auth, config, or deployment changes — rollback is purely source-file.
The Replit checkpoint before 026K contains the previous version.

---

## 21. UNRESOLVED ISSUES

- Post-Expand-All click on already-open category: local `setIsOpen(false)` fires before
  parent corrects to `forceOpen=true`. Two React renders occur. In practice (React 18 
  automatic batching) this should be imperceptible, but user live testing is required 
  to confirm there is no visible flash.

---

## 22. ELAPSED TIME

~8 minutes

---

## 23. AGENT ACTIONS

Read: GearCategory.tsx (full), Checklist.tsx (key sections), SharedChecklistPage.tsx (key sections), Vite logs, browser console
Edits: GearCategory.tsx (3 edits), Checklist.tsx (6 edits), SharedChecklistPage.tsx (6 edits)
Verified: stale reference check, Vite HMR clean, app screenshot/console clean

---

## 24. LINES READ

~250 lines across 3 source files (targeted grep + section reads), plus Vite log files.

---

## 25. FINAL SELF-AUDIT

1. Did I edit only the active main-category accordion path? YES — only GearCategory click handler, Checklist/SharedChecklistPage main-category state/handler/buttons.
2. Does normal manual use allow only one open? YES — `new Set([name])` on open.
3. Can zero categories be open? YES — `new Set()` on close when size=1.
4. Does Expand All still open all? YES — `new Set(categoryOrder)`.
5. Does first individual click after Expand All leave only that category open? YES — `prev.size > 1` branch.
6. Does Collapse All close all? YES — `new Set<string>()`.
7. Are main and sidebar groups still independent? YES — separate state, no cross-writes.
8. Is the left-side arrow control visually unchanged? YES — only `onClick` and highlight expressions changed.
9. Are category spacing/header/body visuals unchanged? YES — no CSS/className changes.
10. Is sidebar USER-VERIFIED behavior untouched? YES — sidebar state/handler untouched.
11. Did I preserve shared Owner/Review architecture rather than fork it? YES — same component, same pattern.
12. Did I avoid unrelated Share/background/Locker work? YES.
13. Did I avoid DB/auth/deployment/replit.md/.agents/memory changes? YES.
14. Did I review every changed file? YES — grep + section reads.
15. Did I stay inside scope/cost? YES — ~8 min, 3 files, targeted patch.
16. Is any material uncertainty unresolved? One: potential visual flash in post-Expand-All case needs user live verification.

---

## MANDATORY FINAL STATUS

```
ROOT CAUSE IDENTIFIED = YES
  GearCategory had no onToggle callback — parent never knew about individual opens;
  siblings never closed.

MAIN CATEGORY SINGLE-OPEN = PASS (source analysis)
MAIN CATEGORY ZERO-OPEN = PASS (source analysis)
MAIN CATEGORY EXPAND ALL = PASS (source analysis)
POST-EXPAND-ALL RETURNS TO SINGLE-OPEN = PASS (source analysis)
MAIN CATEGORY COLLAPSE ALL = PASS (source analysis)
MAIN CATEGORY → SIDEBAR INDEPENDENCE = PASS (source analysis)
SIDEBAR → MAIN CATEGORY INDEPENDENCE = PASS (source analysis)
LEFT-SIDE ARROW CONTROL VISUALS CHANGED = NO
MAIN CATEGORY VISUALS CHANGED = NO
RIGHT-SIDEBAR BEHAVIOR CHANGED = NO
SHARE DROPDOWN LAYERING CHANGED = NO
SHARE/REVIEW BACKGROUND BEHAVIOR CHANGED = NO
SHARE/REVIEW LOCKER BEHAVIOR CHANGED = NO
OWNER/REVIEW ACCORDION PATH FORKED = NO
DATABASE DATA CHANGED = NO
DATABASE SCHEMA CHANGED = NO
REPLIT.MD CHANGED = NO
.AGENTS/MEMORY CHANGED = NO
DEPLOYMENT/PUBLISHING CHANGED = NO
UNRELATED FILES CHANGED = NO

USER VERIFICATION = PENDING
```
