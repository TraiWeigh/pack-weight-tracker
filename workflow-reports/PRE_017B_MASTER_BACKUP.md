# PRE-017B MASTER BACKUP

Created before any Prompt 017B application code edits.

---

## Backup Verification

| Field | Value |
|-------|-------|
| **Master file** | `TRAILWEIGH_COMPLETE_WORKFLOW.md` |
| **Master line count** | 2743 |
| **Master file size** | 125,594 bytes |
| **Backup created** | 2026-08-07 |

---

## Confirmed Root Causes (documented before editing)

### Cause 1 — `transition-all` on the landscape button

The landscape thumbnail button class includes `transition-all`. This transitions EVERY CSS property simultaneously. When the ring materializes on hover (from nothing to `ring-2 ring-offset-1`), the box-shadow changes from `none` to a specific multi-value shadow. With `transition-all`, the browser must repaint and re-composite the element on every animation frame during the transition. With `border-radius` + `overflow:hidden` on the same element, the browser must recalculate the clipping path on each frame. This creates a visible shimmer or jitter during each hover entry.

### Cause 2 — Ring geometry changes from 0 to ring-2+ring-offset-1

In the base (unselected, not-hovered) state, the landscape button has NO ring and NO ring-offset. On hover, both appear simultaneously:
- `ring-2` adds a 2px box-shadow ring
- `ring-offset-1` adds a 1px gap (another box-shadow layer)
Total new box-shadow on hover: 3px of new paint area outside the element's border-box

Because `transition-all` interpolates ALL properties, the ring AND offset animate in together. The box-shadow starting value is `none` and the ending value is a complex multi-layer shadow. The browser interpolation of `none → specific shadow` can be inconsistent (browsers sometimes snap rather than interpolate smoothly from `none`), causing visible jitter on hover entry and exit.

### Cause 3 — Decorative label overlay has `pointer-events: auto` (default)

The gradient label at the bottom of each landscape tile:
```jsx
<div className="absolute inset-x-0 bottom-0 ... opacity-0 group-hover:opacity-100 transition-opacity">
```
has default `pointer-events: auto`. Although this div is INSIDE the button (so CSS `:hover` on the button stays active), the pointer-events on the overlay add an extra compositing layer that the browser must calculate on each mousemove event. This extra layer can cause micro-repaints that contribute to perceived jitter.

### Cause 4 — Checkmark missing `pointer-events-none`

Custom photo checkmarks explicitly have `pointer-events-none`:
```jsx
<div className="absolute top-1.5 right-1.5 ... pointer-events-none">
```
Landscape checkmarks do NOT:
```jsx
<div className="absolute top-1.5 right-1.5 ...">  {/* no pointer-events-none */}
```
This means cursor movement over the checkmark adds another compositing layer to the hover calculation.

---

## Landscape Thumbnail Implementation (pre-017B)

**File:** `artifacts/pack-checklist/src/components/BackgroundPicker.tsx`, lines 1004–1027

```jsx
{PRESETS.map(p => {
  const isActive = activePresetId === p.id;
  return (
    <button
      key={p.id}
      onClick={() => onBackgroundChange({ type: 'preset', id: p.id })}
      aria-pressed={isActive}
      aria-label={p.label}
      className={`relative overflow-hidden rounded-lg aspect-[3/2] group transition-all ${
        isActive ? 'ring-2 ring-primary ring-offset-1' : 'hover:ring-2 hover:ring-foreground/30 hover:ring-offset-1'
      }`}
    >
      <img src={getThumbUrl(p.photoId)} alt={p.label} className="w-full h-full object-cover" loading="lazy" />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-[10px] font-semibold text-white leading-none">{p.label}</span>
      </div>
      {isActive && (
        <div className="absolute top-1.5 right-1.5 bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center">
          <Check className="w-2.5 h-2.5" />
        </div>
      )}
    </button>
  );
})}
```

## Current Landscape Hover Classes (pre-017B)

- Button base: `relative overflow-hidden rounded-lg aspect-[3/2] group transition-all`
- Button unselected: (no ring classes)
- Button hover (unselected): `hover:ring-2 hover:ring-foreground/30 hover:ring-offset-1`
- Button selected: `ring-2 ring-primary ring-offset-1`
- Label overlay: `opacity-0 group-hover:opacity-100 transition-opacity` (no pointer-events-none)
- Checkmark: no pointer-events-none

## Custom Photo Thumbnail Classes (pre-017B, stable reference)

- Button base: `w-full relative overflow-hidden rounded-lg aspect-[3/2] transition-all`
- Button unselected: (no ring classes in base)
- Button hover: `hover:ring-2 hover:ring-foreground/30 hover:ring-offset-1`
- Button selected: `ring-2 ring-primary ring-offset-1`
- Checkmark: `pointer-events-none` ✓

---

## Why Only Landscapes Shook

Custom photo thumbnails have an outer `<div className="relative group">` wrapper. The `group` class is on this outer div, not on the button. The button is `w-full` inside the outer div. This means:
- The outer div's `:hover` state controls `group-hover:` utilities
- The button's compositing context is separated from the group hover detection
- The delete button overlay (outside the photo button) uses `group-hover:opacity-100` via the outer div, not via the button's own hover state

Landscape buttons have the `group` class ON the button itself. Any sub-pixel rendering event during `transition-all` on the button directly affects its own group-hover trigger, creating a feedback loop.
