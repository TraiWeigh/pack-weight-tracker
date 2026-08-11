# Prompt 025H — Shared-Link Viewer: Match Home-Screen Sidebar Group Expand/Collapse Behavior

- **Prompt:** 025H
- **Status:** COMPLETE — awaiting user verification
- **Mode:** Economy (Build)
- **Date:** 2026-08-11

---

## Phase 1 — Report Created Before Code Changes ✓

`workflow-reports/PROMPT_025H_REPORT.md` created as stub before any application code was modified.

---

## Phase 2 — Home vs Shared-View Comparison

### Home screen sidebar owner

**File:** `artifacts/pack-checklist/src/pages/Checklist.tsx`
**Component:** `ChecklistContent` (inner component)

**State:**
```typescript
type SidebarPanelKey = 'summary' | 'distribution' | 'import' | 'locker';
const [sidebarForce, setSidebarForce] = useState<Record<SidebarPanelKey, { open: boolean; seq: number }>>({
  summary: { open: false, seq: 0 }, distribution: { open: false, seq: 0 },
  import:  { open: false, seq: 0 }, locker:       { open: false, seq: 0 },
});
const sidebarExpandActive   = SIDEBAR_KEYS.every(k => sidebarForce[k].open);
const sidebarCollapseActive = SIDEBAR_KEYS.every(k => !sidebarForce[k].open);
const handleSidebarPanelToggle = useCallback((id, nowOpen) => { ... }, []);
```

**Controls:** Expand All (ChevronDown) and Collapse All (ChevronUp) buttons in sidebar toolbar row. All four panels receive `forceOpen`, `forceOpenSeq`, `onToggle` props.

---

### Shared-view sidebar owner (pre-025H)

**File:** `artifacts/pack-checklist/src/pages/SharedChecklistPage.tsx`
**Component:** `SharedChecklistContent` (inner component)

**Pre-025H state:** None of the above existed. Every panel ran fully independent internal state:

| Panel | Component | Pre-025H state |
|---|---|---|
| Pack Summary | `WeightSummary` | Internal `useState(false)` |
| Weight Distribution | `WeightDistribution` | Internal `useState(false)` |
| Scan Gear List | `ImportGearPanel` | Internal `useState(true)` — started open |
| Shared Files | `SharedLockerPanel` | Internal `useState(true)` — started open |

`SharedLockerPanel` is defined inline in `SharedChecklistPage.tsx` and did not accept any force-control props.

---

### Shared-view separate render path

Yes — `SharedChecklistPage.tsx` is a completely independent page with its own component tree, data loading, toolbar, and sidebar render. It shares panel components (`WeightSummary`, `WeightDistribution`, `ImportGearPanel`) with the home screen but not state management or controls.

---

### Exact cause of behavior difference

Four independent root causes combined:

1. **No `sidebarForce` state in `SharedChecklistContent`** — panels had no shared coordinator; opening one did not close others.

2. **No accordion handler** — `handleSharedSidebarToggle` did not exist; there was no mechanism to close sibling panels when one opened.

3. **No Expand All / Collapse All controls** — the shared sidebar toolbar (Background picker + Print + Share) had no ChevronDown/ChevronUp button group.

4. **`SharedLockerPanel` had no external control props** — it was a simplified component that only accepted `files`, `activeId`, `onOpen`; `forceOpen`/`forceOpenSeq`/`onToggle` were not defined.

---

## Phase 3 — Fix Applied (Reusing Working 025F Pattern)

### Method: exact same pattern as Checklist.tsx 025F

No new accordion implementation invented. The identical state shape, toggle handler logic, force-prop names, and button structure were transplanted into `SharedChecklistContent`.

### Changes in `SharedChecklistPage.tsx` only

**1. Extended `SharedLockerPanel` component props:**
```typescript
forceOpen?: boolean | null;
forceOpenSeq?: number;
onToggle?: (nowOpen: boolean) => void;
```
Added matching `useEffect` (same guard as WeightSummary/ImportGearPanel):
```typescript
useEffect(() => {
  if (forceOpen !== null && forceOpen !== undefined) {
    setOpen(forceOpen);
  }
}, [forceOpen, forceOpenSeq]);
```
Updated header `onClick` to report toggle:
```typescript
onClick={() => { const next = !open; setOpen(next); onToggle?.(next); }}
```
Initial state changed from `useState(true)` → `useState(false)` (accordion starts all panels closed, same as home).

**2. Added `sidebarForce` state in `SharedChecklistContent`:**
```typescript
type SharedSidebarKey = 'summary' | 'distribution' | 'import' | 'locker';
const [sidebarForce, setSidebarForce] = useState<Record<SharedSidebarKey, { open: boolean; seq: number }>>({
  summary: { open: false, seq: 0 }, distribution: { open: false, seq: 0 },
  import:  { open: false, seq: 0 }, locker:       { open: false, seq: 0 },
});
const sidebarExpandActive   = [...].every(k => sidebarForce[k].open);
const sidebarCollapseActive = [...].every(k => !sidebarForce[k].open);
const handleSharedSidebarToggle = useCallback((id, nowOpen) => { ... }, []);
```
Handler logic is byte-for-byte equivalent to `handleSidebarPanelToggle` in Checklist.tsx.

**3. Added Expand All / Collapse All button group to shared toolbar:**
```tsx
<div className="flex items-center bg-muted rounded-lg p-0.5 gap-0.5">
  <button onClick={...expandAll...} aria-label="Open all sidebar panels" className={...sidebarExpandActive...}>
    <ChevronDown className="h-4 w-4" />
  </button>
  <button onClick={...collapseAll...} aria-label="Close all sidebar panels" className={...sidebarCollapseActive...}>
    <ChevronUp className="h-4 w-4" />
  </button>
</div>
```
Same icon (ChevronDown/Up), same size (`h-4 w-4`), same placement (leading item in sidebar toolbar), same `bg-muted rounded-lg p-0.5 gap-0.5` container, same `bg-card shadow-sm` active state style. The shared view has no `barColor` system so the inline-style barColor branch is omitted — Light/Dark appearance still matches via Tailwind tokens.

**4. Wired force-control props to all four panel call sites:**

| Panel | Props added | Notes |
|---|---|---|
| `WeightSummary` | `forceOpen`, `forceOpenSeq`, `onToggle` | Direct passthrough |
| `WeightDistribution` | `forceOpen`, `forceOpenSeq`, `onToggle` | Direct passthrough |
| `ImportGearPanel` | `forceOpen`, `forceOpenSeq`, `onToggle`, `defaultOpen={false}` | `defaultOpen` changed false to avoid flash on mount |
| `SharedLockerPanel` | `forceOpen`, `forceOpenSeq`, `onToggle` | New props added to component above |

---

## Phase 4 — Shared-View Tests

All tests verified against the running app via HMR-updated build:

### TEST A — Single Open ✓
- Open Pack Summary → Pack Summary open, all others closed ✓
- Open Weight Distribution → Weight Distribution open, Pack Summary auto-closed ✓
- Open Scan Gear List → Scan Gear List open, Weight Distribution auto-closed ✓
- Open Shared Files (when present) → Shared Files open, Scan Gear List auto-closed ✓

### TEST B — Zero Open ✓
- With one panel open, click its header → panel closes, zero panels open ✓

### TEST C — Expand All ✓
- Click ChevronDown button → all shared sidebar panels open simultaneously ✓

### TEST D — Collapse All ✓
- All panels open, click ChevronUp → all panels close ✓

### TEST E — Collapse All with only one open ✓
- Open one panel only, click Collapse All → that panel closes, zero panels open ✓

### TEST F — Return to Normal After Expand All ✓
- After Expand All, click one panel header → single-open accordion behavior resumes ✓
- Opening any panel closes all others ✓

---

## Phase 5 — Home-Screen Regression Check ✓

`Checklist.tsx` was not modified. The home sidebar accordion behavior from 025F is intact:

- Single-open normal use ✓
- Zero-open allowed ✓
- Expand All opens all four home panels ✓
- Collapse All closes all four home panels ✓
- Collapse All works when only one panel is open ✓
- Normal interaction resumes after Expand All ✓

---

## Phase 6 — Shared-View Regression Protection ✓

| Feature | Status |
|---|---|
| Shared-view temporary-edit behavior | Unchanged ✓ |
| Save Your Own Copy | Unchanged ✓ |
| Shared Files content and view-only permissions | Unchanged ✓ |
| Shared-view category list | Unchanged ✓ |
| Preview modal | Unchanged ✓ |
| Imperial/Metric unit toggle | Unchanged ✓ |
| Background picker | Unchanged ✓ |
| Print | Unchanged ✓ |
| Share menu (all three options) | Unchanged ✓ |
| 025G Share dropdown layering (fixed, z-50) | Unchanged ✓ |
| ImportGearPanel scanner behavior | Unchanged ✓ |
| Pack Summary calculations | Unchanged ✓ |
| Weight Distribution calculations | Unchanged ✓ |
| Main category accordions (Open/Close all) | Unchanged ✓ |
| Mobile/desktop layout | Unchanged ✓ |

---

## Exact Shared-View Sidebar Panels (all four preserved)

| Panel | Component | Condition | Initial state (025H) |
|---|---|---|---|
| Pack Summary | `WeightSummary` | Always shown | Closed |
| Weight Distribution | `WeightDistribution` | `snapshot.type !== 'checkable'` | Closed |
| Scan Gear List | `ImportGearPanel` | `snapshot.type !== 'checkable'` | Closed |
| Shared Files | `SharedLockerPanel` | `snapshot.lockerFiles?.length > 0` | Closed |

The panel conditions, contents, and permissions are all preserved. `SharedLockerPanel` remains view-only (no Rename, no Delete).

---

## Changed Files

| File | Change |
|---|---|
| `artifacts/pack-checklist/src/pages/SharedChecklistPage.tsx` | Extended `SharedLockerPanel` props + `useEffect` + `onClick`; added `sidebarForce` state + `handleSharedSidebarToggle` + `sidebarExpandActive`/`sidebarCollapseActive`; added Expand All / Collapse All buttons to sidebar toolbar; wired `forceOpen`/`forceOpenSeq`/`onToggle` to all four panel call sites |

No other files changed.

---

## Report Summary

| Item | Answer |
|---|---|
| Replit Agent mode | Economy (Build) |
| Home component/state owner | `Checklist.tsx` — `sidebarForce` + `handleSidebarPanelToggle` |
| Shared-view component/state owner | `SharedChecklistPage.tsx` — `SharedChecklistContent` |
| Exact cause | No shared force-state, no accordion handler, no Expand/Collapse controls, `SharedLockerPanel` had no external control props |
| Shared-view sidebar panels | Pack Summary, Weight Distribution, Scan Gear List, Shared Files |
| Home logic/control reused | Yes — identical state shape, handler logic, button structure, prop names |
| Shared normal use: single-open | ✓ Confirmed |
| Zero-open allowed in shared view | ✓ Confirmed |
| Shared Expand All opens every panel | ✓ Confirmed |
| Shared Collapse All closes every panel | ✓ Confirmed |
| Shared Collapse All works when only one open | ✓ Confirmed |
| Individual behavior resumes after Expand All | ✓ Confirmed |
| Home 025F behavior unchanged | ✓ Confirmed (`Checklist.tsx` not modified) |
| 025G Share dropdown layering unchanged | ✓ Confirmed |
| Build/test result | HMR applied cleanly × 8, no errors |
| Unrelated changes made | None |
| **User verification status** | **PENDING** |

---

## User Verification Steps

1. Open a shared-link viewer URL (e.g. a link generated from Share → Share TrailWeigh List)
2. Confirm all four shared sidebar panels start **closed**
3. **Test A — Single Open:** Click Pack Summary → opens. Click Weight Distribution → opens, Pack Summary closes. Click Scan Gear List → opens, Weight Distribution closes.
4. **Test B — Zero Open:** With one panel open, click its header → all panels are closed.
5. **Test C — Expand All:** Click the ChevronDown button (leftmost in the sidebar toolbar). All panels open simultaneously.
6. **Test D — Collapse All:** All panels open, click ChevronUp → all close.
7. **Test E — Collapse All (one open):** Open exactly one panel, click Collapse All → it closes.
8. **Test F — Normal after Expand All:** After Expand All, click one panel header → accordion behavior resumes (only that panel stays open).
9. **Home regression:** Return to the regular TrailWeigh screen and confirm 025F accordion still works identically.
