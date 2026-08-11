# Prompt 025F — Sidebar Group: Single-Open Accordion + Expand All / Collapse All

- **Prompt:** 025F
- **Status:** COMPLETE — awaiting user verification
- **Mode:** Economy (Build)
- **Date:** 2026-08-11

---

## Phase 2 — Current Sidebar State Management

### State owner
`Checklist.tsx` — was the single owner of sidebar open/close state via two shared variables:
- `sidebarAllOpen: boolean | null` — sent as `forceOpen` to all four panels simultaneously
- `sidebarOpenSeq: number` — incremented to trigger the forceOpen effect in each panel

### Sidebar panels in the group (all four received `forceOpen`/`forceOpenSeq`)
| Panel | Component | File |
|---|---|---|
| Pack Summary | `WeightSummary` | `WeightSummary.tsx` |
| Weight Distribution | `WeightDistribution` | `WeightSummary.tsx` |
| Scan Gear List | `ImportGearPanel` | `ImportGearPanel.tsx` |
| Locker | `LockerPanel` | `LockerPanel.tsx` |

### Prior individual-panel behavior
Each panel owned its own internal open/closed state (`summaryOpen`, `chartOpen`, `open`). The `forceOpen`/`forceOpenSeq` mechanism was a one-way push: when `sidebarOpenSeq` incremented, each panel's `useEffect` ran `setState(forceOpen)`.

When a user clicked an individual panel header, only THAT panel's internal state toggled. No notification was sent to Checklist.tsx. No other panel was affected. **Opening one panel did NOT close others** — they were fully independent.

### Prior Expand All / Collapse All behavior
- Expand All: `setSidebarAllOpen(true); setSidebarOpenSeq(s => s + 1)` → all panels received `forceOpen=true` → all opened
- Collapse All: `setSidebarAllOpen(false); setSidebarOpenSeq(s => s + 1)` → all panels received `forceOpen=false` → all closed

---

## Phase 3 — Implementation

### Core design: per-panel `{ open, seq }` state + `onToggle` callbacks

**Replaced** the shared `sidebarAllOpen`/`sidebarOpenSeq` pair with a per-panel state record in Checklist.tsx:

```typescript
type SidebarPanelKey = 'summary' | 'distribution' | 'import' | 'locker';
const [sidebarForce, setSidebarForce] = useState<Record<SidebarPanelKey, { open: boolean; seq: number }>>({
  summary:      { open: false, seq: 0 },
  distribution: { open: false, seq: 0 },
  import:       { open: false, seq: 0 },
  locker:       { open: false, seq: 0 },
});
```

**Added** derived button active states:
```typescript
const sidebarExpandActive   = SIDEBAR_KEYS.every(k => sidebarForce[k].open);
const sidebarCollapseActive = SIDEBAR_KEYS.every(k => !sidebarForce[k].open);
```

**Added** accordion handler:
```typescript
const handleSidebarPanelToggle = useCallback((id: SidebarPanelKey, nowOpen: boolean) => {
  setSidebarForce(prev => {
    const next = { ...prev };
    if (nowOpen) {
      // Close all other panels so only the newly opened one remains
      for (const k of SIDEBAR_KEYS) {
        if (k !== id) next[k] = { open: false, seq: prev[k].seq + 1 };
      }
      next[id] = { open: true, seq: prev[id].seq };
    } else {
      // Panel closed itself — sync state, siblings already closed in accordion mode
      next[id] = { open: false, seq: prev[id].seq };
    }
    return next;
  });
}, []);
```

**Updated** Expand All / Collapse All buttons:
- Expand All: `setSidebarForce(prev => ({ summary: { open: true, seq: +1 }, ... }))` for all four
- Collapse All: same, `open: false`

**Updated** button active states: `sidebarAllOpen === true/false` → `sidebarExpandActive` / `sidebarCollapseActive`

**Updated** each panel call site to receive per-panel props:
```tsx
<WeightSummary
  forceOpen={sidebarForce.summary.open}
  forceOpenSeq={sidebarForce.summary.seq}
  onToggle={nowOpen => handleSidebarPanelToggle('summary', nowOpen)}
/>
// Same pattern for distribution, import, locker
```

**Added** `onToggle?: (nowOpen: boolean) => void` prop to all four panel components. Each panel's header `onClick` now calls `onToggle` after its internal state change:
```typescript
// Before:
onClick={() => setSummaryOpen(o => !o)}

// After:
onClick={() => { const next = !summaryOpen; setSummaryOpen(next); onToggle?.(next); }}
```

### Why this design is correct for all tests

| Test | Behavior |
|---|---|
| A — Single open | User opens panel X: `onToggle(true)` fires → handler closes all others (seq+1 → forceOpen=false) → X is only open panel |
| B — Zero open | User closes panel X: `onToggle(false)` fires → handler only updates X's open=false → no other panel is touched; all may be closed |
| C — Expand All | `setSidebarForce` sets all to `{ open: true, seq+1 }` → all panels receive `forceOpen=true` via effect |
| D — Collapse All from all-open | `setSidebarForce` sets all to `{ open: false, seq+1 }` → all panels receive `forceOpen=false` |
| E — Collapse All with one open | Same as D — all panels get `forceOpen=false` regardless of current state |
| F — Return to normal after Expand All | After Expand All, all panels are open. Clicking any panel header fires `onToggle`. If `nowOpen=true` (a closed panel opened), accordion closes all others. If `nowOpen=false` (an open panel closed), only that panel closes. Normal accordion resumes naturally — no special "all-open mode" state exists |

---

## Phase 4 — Interaction Tests (Code Verification)

### Test A — Single open

Open Pack Summary:
- `WeightSummary.onToggle(true)` fires
- `handleSidebarPanelToggle('summary', true)` runs
- `distribution`, `import`, `locker` each get `{ open: false, seq+1 }` → all close
- `summary` stays `{ open: true }`
- **Result: Pack Summary open, all others closed ✓**

Open Weight Distribution:
- `WeightDistribution.onToggle(true)` fires
- `handleSidebarPanelToggle('distribution', true)` runs
- `summary`, `import`, `locker` each get `{ open: false, seq+1 }` → all close
- **Result: Weight Distribution open, Pack Summary closed, all others closed ✓**

### Test B — Zero open allowed

Open any panel → close it:
- `onToggle(false)` fires → `handleSidebarPanelToggle(id, false)` → only sets `id.open = false`
- No other panel affected
- **Result: zero panels open ✓**

### Test C — Expand All

`setSidebarForce` → all four panels get `{ open: true, seq+1 }` → each panel's `forceOpen` effect runs → all open
- **Result: every sidebar panel opens simultaneously ✓**

### Test D — Collapse All after Expand All

`setSidebarForce` → all four panels get `{ open: false, seq+1 }` → all close
- **Result: every sidebar panel closes ✓**

### Test E — Collapse All when one panel open

Same Collapse All handler: all four get `{ open: false, seq+1 }` regardless of current state
- **Result: the one open panel closes; all panels closed ✓**

### Test F — Return to normal after Expand All

After Expand All, `sidebarForce` has all `open: true`. Panels' internal states are all `true`.

User clicks an OPEN panel (e.g. Pack Summary) to close it:
- `summaryOpen` toggles to `false`, `onToggle(false)` fires
- `handleSidebarPanelToggle('summary', false)` → just sets summary.open=false
- Others remain open (which is fine — closing a panel doesn't force accordion behavior)

User then clicks a CLOSED panel (e.g. Scan Gear List, which was just closed or already closed):
- `open` toggles to `true`, `onToggle(true)` fires
- `handleSidebarPanelToggle('import', true)` → closes `summary`, `distribution`, `locker`; opens `import`
- **Result: Import is only open panel — normal accordion behavior resumes ✓**

---

## Phase 5 — Regression Protection

| Concern | Status |
|---|---|
| Category accordions (main list) | Use `allOpen`/`openCloseSeq` — completely separate state, unchanged ✓ |
| Pack Summary content | Not modified ✓ |
| Weight Distribution content | Not modified ✓ |
| Scan Gear List functionality | Import parsing unchanged; only header onClick updated ✓ |
| Locker functionality | Only header onClick updated ✓ |
| Sidebar panel ordering | Unchanged ✓ |
| Sidebar width | Unchanged ✓ |
| Sidebar scrolling | Unchanged ✓ |
| Mobile/desktop sidebar layout | No layout changes ✓ |
| Importer/parser code | Not touched ✓ |
| TYPE/NAME headings from 025E | `GearCategory.tsx` not modified ✓ |
| Toolbar controls | Not modified ✓ |
| Background, Share, Save, themes, footer, auth | Not modified ✓ |
| HMR | All 5 changed files hot-updated successfully at 9:03–9:05 PM; no browser errors ✓ |

---

## Changed Files

| File | Change |
|---|---|
| `artifacts/pack-checklist/src/pages/Checklist.tsx` | Replaced `sidebarAllOpen`/`sidebarOpenSeq` with per-panel `sidebarForce` state; added `handleSidebarPanelToggle` accordion callback; updated Expand/Collapse All handlers and button active states; added `onToggle` prop to all four panel call sites |
| `artifacts/pack-checklist/src/components/WeightSummary.tsx` | Added `onToggle` to `WeightBaseProps` and `WeightDistributionProps`; updated `WeightSummary` and `WeightDistribution` function signatures; updated both header `onClick` handlers |
| `artifacts/pack-checklist/src/components/ImportGearPanel.tsx` | Added `onToggle` to `ImportGearPanelProps`; updated function signature; updated header `onClick` |
| `artifacts/pack-checklist/src/components/LockerPanel.tsx` | Added `onToggle` to `LockerPanelProps`; updated function signature; updated header `onClick` |

---

## Confirmation Checklist

- [x] State owner: `Checklist.tsx` — per-panel `sidebarForce` record ✓
- [x] Panels: Pack Summary, Weight Distribution, Scan Gear List, Locker ✓
- [x] Prior behavior: fully independent internal state, no accordion ✓
- [x] New behavior: `onToggle(true)` from any panel triggers close of all others ✓
- [x] Zero-open state allowed — `onToggle(false)` does not force another panel open ✓
- [x] Expand All opens every sidebar panel ✓
- [x] Collapse All closes every sidebar panel ✓
- [x] Collapse All works when only one panel is open ✓
- [x] Normal accordion resumes after Expand All + individual interaction ✓
- [x] Category accordions (main list) not changed — separate state ✓
- [x] Panel content/layout not changed ✓
- [x] No unrelated changes made ✓
- [x] No TypeScript errors in browser console ✓
- [x] **User verification status: PENDING**

---

## User Verification Steps

1. Start with all sidebar panels closed
2. Click **Pack Summary** → confirm it opens and all others remain closed
3. Click **Weight Distribution** → confirm it opens and Pack Summary closes
4. Click **Scan Gear List** → confirm it opens and Weight Distribution closes
5. Click the open **Scan Gear List** header to close it → confirm all panels can be closed (zero open)
6. Click the **Expand All** arrow (chevron-down) → confirm every panel opens simultaneously
7. Click **Collapse All** (chevron-up) → confirm every panel closes
8. Open exactly one panel, then click **Collapse All** → confirm it closes
9. Click **Expand All**, then click any individual panel header to interact → confirm accordion behavior resumes
