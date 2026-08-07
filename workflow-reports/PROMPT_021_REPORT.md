# Prompt 021 Report — Share Link Repair

**Status:** COMPLETE — NOT USER-VERIFIED  
**Date:** 2026-08-07

---

## Scope

Five interrelated fixes to the Share Link feature:

1. **Crash fix** — `SharedChecklistPage` rendered `GearCategory` without the required `order` prop (and also `moveItem`), causing `order.filter(...)` to throw on every shared-view page load.
2. **normalizeSnapshot completeness** — `normalizeSnapshot` omitted `name` and `unit` fields from its returned object, causing the shared-view banner to never show the list name and the unit system to always fall back to the app default.
3. **Empty-list Share UX** — replaced the "Nothing to share" destructive toast with a visually grayed-out Share button that shows an explanatory message on desktop hover/focus and mobile tap.
4. **Save-before-sharing warning** — added a two-step flow inside the Share dropdown: clicking "Copy Link" first shows a reminder ("Save the currently open file first so the shared version is current."), with "Copy Link Anyway" and "Cancel" options.
5. **TypeScript error fix** — `BackgroundPickerButton` in `SharedChecklistPage` was missing the required `panelOpen` prop.

---

## Root Cause Analysis — The Crash

### `GearRow.tsx:48` — `order.filter(c => c !== category)`

`GearRow` receives `order: string[]` from its parent `GearCategory`, which itself receives `order` from the render loop in `SharedChecklistContent`. The render loop at line 723 called `GearCategory` **without passing `order`**, so the prop arrived as `undefined`. TypeScript reports this as a missing-prop error but does not prevent the app from running. At runtime, the first render of any `GearRow` called `undefined.filter(...)` and crashed.

`moveItem` was also absent from the same `GearCategory` call. The move-to dropdown in `GearRow` would have called `undefined(...)` if a user tried to move an item to another category.

### `normalizeSnapshot` — missing `name` and `unit`

`normalizeSnapshot` reconstructed a `SharePayload` from the raw API response but did not forward `raw.name` or `raw.unit`. Both fields are present in `SharePayload` and used downstream (`snapshot.name` in the "Viewing …" banner, `snapshot.unit` in `UnitProvider`). The omission was silent (both have graceful fallbacks) but meant the shared view always showed the generic banner text and ignored the sender's unit preference.

---

## Files Changed

| File | Change |
|------|--------|
| `src/pages/SharedChecklistPage.tsx` | Added `order={store.order}` and `moveItem={moveItem}` to `GearCategory` render; added `moveItem` `useCallback` implementation; fixed `normalizeSnapshot` to return `name` and `unit`; fixed `BackgroundPickerButton` missing `panelOpen` prop |
| `src/pages/Checklist.tsx` | Removed "Nothing to share" toast; added `totalItems`, `canShare`, `shareStep`, `showEmptyShareMsg`; replaced Share button section with grayed-button-when-empty + save-before-sharing two-step dropdown |
| `src/hooks/shareLink021.test.mjs` | New — 27 structural tests for all five fixes |

---

## Implementation Detail

### A. Crash fix — SharedChecklistPage

```tsx
// Before (missing props → crash):
<GearCategory
  ...
  updateItem={updateItem}
  removeItem={removeItem}
  addItem={addItem}
  ...
/>

// After (both props supplied):
<GearCategory
  ...
  order={store.order}          // ← critical crash fix
  updateItem={updateItem}
  removeItem={removeItem}
  moveItem={moveItem}          // ← second fix
  addItem={addItem}
  ...
/>
```

`moveItem` was implemented with `pushAndSet` (same pattern as `removeItem`):

```typescript
const moveItem = useCallback((sourceCategory, destinationCategory, itemId) => {
  pushAndSet(prev => {
    const item = (prev.items[sourceCategory] || []).find(i => i.id === itemId);
    if (!item) return prev;
    return {
      ...prev,
      items: {
        ...prev.items,
        [sourceCategory]:      (prev.items[sourceCategory] || []).filter(i => i.id !== itemId),
        [destinationCategory]: [...(prev.items[destinationCategory] || []), item],
      },
    };
  });
}, [pushAndSet]);
```

### B. normalizeSnapshot completeness

```typescript
// Added to the return object:
unit: (raw.unit === 'metric' || raw.unit === 'imperial') ? raw.unit : undefined,
name: typeof raw.name === 'string' ? raw.name : undefined,
```

Both fields are validated before returning to prevent injecting unexpected values.

### C. Empty-list Share UX

- Computed `totalItems` and `canShare` at the component render level (not inside the handler).
- When `!canShare`: renders a visually dimmed button with `aria-disabled="true"` and `cursor-not-allowed` (no native `disabled` attribute, so hover events still fire).
- Desktop: CSS `group-hover:opacity-100` tooltip: "Add some gear items before creating a share link."
- Mobile: `showEmptyShareMsg` state, toggled by tap, shows identical message below the button.
- Removed the "Nothing to share" destructive toast entirely.

### D. Save-before-sharing warning

- Added `shareStep: 'menu' | 'warning'` state, initialised to `'menu'`.
- When the Share button opens the dropdown and `canShare` is true, the dropdown shows "Copy Link" and "Download PDF" (unchanged UX).
- Clicking "Copy Link" no longer immediately copies — it sets `shareStep = 'warning'`, transforming the dropdown to show:
  - Warning: "Save the currently open file first so the shared version is current."
  - "Copy Link Anyway" → closes menu, resets step, calls `handleCopyLink()`
  - "Cancel" → resets step back to `'menu'`
- `shareStep` resets to `'menu'` whenever the dropdown is closed.

### E. TypeScript error

`BackgroundPickerButton` gained a required `panelOpen: boolean` prop at some earlier point. The call in `SharedChecklistPage` was missing it.

```tsx
// Fixed:
<BackgroundPickerButton
  onClick={() => setBgPickerOpen(o => !o)}
  active={!!background}
  panelOpen={bgPickerOpen}   // ← added
/>
```

---

## Automated Test Results

```
021:  27/27 ✅
020F: 28/28 ✅ (regression — all passing)
020E: 24/24 ✅ (regression — all passing)
020D: 30/30 ✅ (regression — all passing)
```

---

## Data-Ownership Verification

- Shared view writes nothing to `localStorage` or `IndexedDB` during render — all state is in React memory.
- "Save Your Own Copy" uses `crypto.randomUUID()` for every new entry — sender's UUID is never reused.
- The API link store has no DELETE endpoint; shared links are immutable.
- `commitSave` opens the recipient's copy in a new tab via `?savedListId=<newId>` — the fork mechanism ensures complete isolation from the sender.

---

## What Requires User Verification

1. Open a valid share link → page renders without crashing, all gear categories visible.
2. Open the main checklist with an empty list → Share button is visually dimmed; hovering (desktop) or tapping (mobile) shows "Add some gear items before creating a share link."
3. Add a gear item → Share button returns to normal appearance.
4. Click Share → Copy Link → confirm the save-warning step appears before any link is generated.
5. Click "Copy Link Anyway" → link is copied to clipboard, dropdown closes.
6. Click Share → Copy Link → Cancel → dropdown returns to normal menu.
7. Open a shared link with a list name → "Viewing *[name]*" banner appears.
8. Open a shared link with metric items → unit toggle defaults to metric.

---

## Prompt History

017 = PASS | 017A–017F = PASS | 018–018C = PASS | 019 = PASS | 020–020F = PASS/NOT-VERIFIED | **021 = NOT USER-VERIFIED**
