# PRE-017A MASTER BACKUP

Created before any Prompt 017A application code edits.

---

## Backup Verification

| Field | Value |
|-------|-------|
| **Master file** | `TRAILWEIGH_COMPLETE_WORKFLOW.md` |
| **Master line count** | 2650 |
| **Master file size** | 122,351 bytes |
| **Backup created** | 2026-08-06 |

---

## Root Cause Documented Before Editing

The Hide button in `artifacts/pack-checklist/src/pages/Checklist.tsx` (lines 1252–1267) is wrapped in:

```jsx
{background && (
  <button ...>Hide</button>
)}
```

`background` is the active `Background` object (type `{ type: 'preset'; id: string } | { type: 'custom'; photoId: string }`). It is `null` / `undefined` when no background has been selected by the user.

In a fresh signed-in session — or any session where the user has not chosen a background — `background` is falsy and the Hide pill never renders. This is why the user saw only `Preview → Imperial → Metric` with no Hide pill.

---

## Current Hide JSX (pre-017A)

```jsx
{background && (
  <button
    onClick={() => { setBackgroundPickerOpen(false); triggerShowcase(); }}
    disabled={showResetConfirm || showShareMenu || showPreview || dragCat !== null || hasInputFocus}
    aria-label="Hide interface and show background view"
    title={
      showResetConfirm || showShareMenu || showPreview || dragCat !== null || hasInputFocus
        ? 'Finish the current action first'
        : 'Fill the screen with your background'
    }
    className="flex items-center bg-muted rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
  >
    Hide
  </button>
)}
```

## Current Preview JSX

```jsx
<button
  onClick={() => setShowPreview(true)}
  aria-label="Open checked-items preview"
  className="flex items-center bg-muted rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
>
  Preview
</button>
```

## Current UnitToggle JSX

```jsx
<UnitToggle />
```

## Current Rendered Order (pre-017A, no background selected)

```
[Open | Close]  ——————————  [Preview] [Imperial/Metric]
```

## Current Rendered Order (pre-017A, background selected)

```
[Open | Close]  ——————————  [Hide] [Preview] [Imperial/Metric]
```

## Required Order (post-017A, always)

```
[Open | Close]  ——————————  [Hide] [Preview] [Imperial/Metric]
```
