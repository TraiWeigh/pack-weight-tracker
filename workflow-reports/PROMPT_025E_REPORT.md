# Prompt 025E — Lock TYPE and NAME Column Headings

- **Prompt:** 025E
- **Status:** COMPLETE — awaiting user verification
- **Mode:** Economy (Build)
- **Date:** 2026-08-11

---

## Phase 2 — Component That Renders TYPE ✎ and NAME ✎

**File:** `artifacts/pack-checklist/src/components/GearCategory.tsx`

**Component:** `EditableColHeader` (lines 34–86, pre-025E)

```
// ── Inline-editable column header ──
function EditableColHeader({ value, placeholder, onCommit, className }) { ... }
```

**How the pencil icon appeared:**

The component rendered a `<div>` with:
- `className="... cursor-pointer"` — pointer cursor on hover
- `title="Click to rename column"` — tooltip
- `onClick={() => setEditing(true)}` — click opens an `<input>` for rename
- An inline SVG pencil path that faded in on `group-hover` (opacity 0 → 0.60)

When editing was active, it rendered an `<input>` (autoFocus, onBlur commits) replacing the label.

**Where TYPE and NAME used it:**

```tsx
{/* Col 2 — TYPE heading */}
<EditableColHeader
  value={meta.subLabel ?? ''}
  placeholder="Type"
  onCommit={v => onUpdateMeta({ subLabel: v || undefined })}
  className="w-28"
/>
{/* Col 3 — NAME heading */}
<EditableColHeader
  value={meta.descLabel ?? ''}
  placeholder="Name"
  onCommit={v => onUpdateMeta({ descLabel: v || undefined })}
/>
```

**Other column headings (Move, Weight, Qty, Total, Delete):** plain `<div>` elements — never used `EditableColHeader`. No other component in the codebase uses `EditableColHeader`.

---

## Phase 3 — Minimum Safe Change

**One prop added to `EditableColHeader`: `readOnly?: boolean` (default `false`).**

When `readOnly` is `true`, the component returns immediately with a static `<span>`:

```tsx
if (readOnly) {
  return (
    <span className={`${className} text-xs font-semibold uppercase tracking-wider text-muted-foreground`}>
      {value || placeholder}
    </span>
  );
}
```

No `onClick`, no `cursor-pointer`, no `title`, no pencil SVG, no `<input>`, no `setEditing` — the entire rename path is skipped.

**Both TYPE and NAME usages updated to pass `readOnly`:**

```tsx
{/* Col 2 — TYPE heading (025E: readOnly — no pencil, no rename) */}
<EditableColHeader
  value={meta.subLabel ?? ''}
  placeholder="Type"
  onCommit={v => onUpdateMeta({ subLabel: v || undefined })}
  className="w-28"
  readOnly
/>
{/* Col 3 — NAME heading (025E: readOnly — no pencil, no rename) */}
<EditableColHeader
  value={meta.descLabel ?? ''}
  placeholder="Name"
  onCommit={v => onUpdateMeta({ descLabel: v || undefined })}
  readOnly
/>
```

`onCommit` is still present in the prop signature (harmless — it is never called when `readOnly`). This avoids TypeScript errors without removing the prop from the interface.

---

## Phase 4 — Required Visual Result

After the fix:

| Heading | Pencil icon | cursor-pointer | Click handler | tooltip | rename `<input>` |
|---------|------------|----------------|---------------|---------|-----------------|
| TYPE    | ✗ removed  | ✗ removed      | ✗ removed     | ✗ removed | ✗ removed     |
| NAME    | ✗ removed  | ✗ removed      | ✗ removed     | ✗ removed | ✗ removed     |

Both headings render as `<span>` elements — no interactive DOM elements, no hover states, no event listeners. Clicking does nothing.

---

## Phase 5 — Row Value Regression Check

**No row-editing code was touched.** Only `GearCategory.tsx` was modified, and only the `EditableColHeader` component's `readOnly` path and its two call sites.

- `GearRow.tsx` — not modified; Type (`sub`) and Name (`desc`) inputs unchanged ✓
- `ImportGearPanel.tsx` — not modified; import preview rows unchanged ✓
- 025C/025D's `isManual` changes — not expanded or reverted; narrowest scope preserved ✓
- `usePackData.ts` — not modified ✓
- `Checklist.tsx` — not modified ✓

Type and Name row values remain editable wherever they were editable before this prompt.

---

## Phase 6 — Other Header Regression Check

Other column headings in the same grid row:

| Heading | Type | Modified? |
|---------|------|-----------|
| Move    | Plain `<div>` | No — was never `EditableColHeader` |
| Weight  | Plain `<div>` | No |
| Qty     | Plain `<div>` | No |
| Total   | Plain `<div>` | No |
| Delete  | Plain `<div>` spacer | No |

No other component in the codebase uses `EditableColHeader`. The editable-heading code path is fully preserved inside the component for any future use — only `readOnly` skips it. No rename functionality was removed globally.

---

## Build / Test Result

- Vite HMR: `hot updated: /src/components/GearCategory.tsx` — confirmed in browser console at 8:48 PM ✓
- No TypeScript errors in workflow logs ✓
- Workflow status: RUNNING ✓

---

## Changed Files

| File | Change |
|------|--------|
| `artifacts/pack-checklist/src/components/GearCategory.tsx` | Added `readOnly?: boolean` prop to `EditableColHeader`; passed `readOnly` to TYPE and NAME usages |

No other files changed.

---

## Confirmation Checklist

- [x] Exact component: `EditableColHeader` in `GearCategory.tsx`
- [x] Exact cause: `onClick={() => setEditing(true)}` + pencil SVG with `group-hover` opacity
- [x] TYPE pencil icon removed — `readOnly` branch returns `<span>`, no SVG rendered ✓
- [x] NAME pencil icon removed — same ✓
- [x] Clicking TYPE does nothing — no `onClick` in `readOnly` branch ✓
- [x] Clicking NAME does nothing — same ✓
- [x] Type row values remain editable — `GearRow.tsx` not modified ✓
- [x] Name row values remain editable — same ✓
- [x] Import preview row values unchanged — `ImportGearPanel.tsx` not modified ✓
- [x] Move / Weight / Qty / Total / Delete headings preserved — were never `EditableColHeader` ✓
- [x] No importer/parser/routing code changed ✓
- [x] No unrelated changes made ✓
- [x] **User verification status: PENDING**

---

## User Verification Steps

1. Open the TrailWeigh gear list (any category that shows the column header row)
2. Look at the **TYPE** heading — confirm no pencil icon on hover
3. Click **TYPE** — confirm nothing happens (no rename input, no tooltip)
4. Look at the **NAME** heading — confirm no pencil icon on hover
5. Click **NAME** — confirm nothing happens
6. Click a Type value in an actual gear row — confirm it is still editable
7. Click a Name value in an actual gear row — confirm it is still editable
