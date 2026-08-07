# PRE-017C MASTER BACKUP

Created before any Prompt 017C application code edits.

---

## Verification

| Field | Value |
|-------|-------|
| **Master file** | `TRAILWEIGH_COMPLETE_WORKFLOW.md` |
| **Master line count** | 2882 |
| **Master file size** | 130,873 bytes |
| **Backup created** | 2026-08-07 |

---

## Component Paths

| Component | Path |
|-----------|------|
| Landscape thumbnail | `artifacts/pack-checklist/src/components/BackgroundPicker.tsx` (PRESETS.map block, ~lines 1004–1027) |
| Custom photo thumbnail | `artifacts/pack-checklist/src/components/BackgroundPicker.tsx` (renderPhotoSlot, ~lines 639–695) |
| BackgroundPickerPanel | `artifacts/pack-checklist/src/components/BackgroundPicker.tsx` (line 860 root div) |
| Active background rendering | `artifacts/pack-checklist/src/pages/Checklist.tsx` (main screen div, lines 977–994) |
| BackgroundShowcase | `artifacts/pack-checklist/src/components/BackgroundShowcase.tsx` |
| Inactivity timer | `artifacts/pack-checklist/src/hooks/useInactivityTimer.ts` |

---

## Current Background Rendering (pre-017C)

### Main container (Checklist.tsx lines 977–994)

```jsx
<div
  className={`screen-only h-[100dvh] overflow-hidden flex flex-col bg-background${bgTone === 'dark' ? ' screen-dark' : ''}`}
  style={{
    ...(bgImageUrl ? {
      backgroundImage: bgFade < 1
        ? `linear-gradient(rgba(...),rgba(...)),url(${bgImageUrl})`
        : `url(${bgImageUrl})`,
      backgroundSize: bgFade < 1 ? `100% 100%, ${bgSize}` : bgSize,
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    } : {}),
    opacity:       showcaseActive ? 0 : 1,
    transition:    'opacity 800ms ease',
    pointerEvents: showcaseActive ? 'none' : undefined,
  }}
>
```

- `backgroundImage` only set when `bgImageUrl` is truthy
- `transition: 'opacity 800ms ease'` is ALWAYS set (for showcase fade)
- No `will-change` property

### Object URL lifecycle (Checklist.tsx lines 348–395)

- `activePhotoId` = `background.photoId` when custom background
- `useEffect` on `activePhotoId`: revoke old URL → getPhotoBlob → createPhotoObjectUrl → setCustomBgObjectUrl
- `bgImageUrl = background ? (preset → getFullUrl(photoId)) : (custom → customBgObjectUrl) : null`
- Object URLs are NEVER recreated during hover (only when `activePhotoId` changes)

### BackgroundPickerPanel root div (BackgroundPicker.tsx line 862)

```jsx
className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 w-[24rem] max-h-[calc(100dvh-10rem)] overflow-y-auto bg-card border border-card-border rounded-xl shadow-xl animate-in fade-in slide-in-from-top-2 duration-150"
style={{ display: open ? undefined : 'none' }}
```

- Uses `-translate-x-1/2` CSS transform (2D, does NOT guarantee GPU layer promotion)
- NO `will-change` property
- `overflow-y-auto` — may engage scrollbar if content > max-h

### Landscape tile button (BackgroundPicker.tsx lines 1007–1025, POST-017B)

```jsx
className={`relative overflow-hidden rounded-lg aspect-[3/2] group ring-2 ring-offset-1 transition-[box-shadow,opacity] ${
  isActive ? 'ring-primary' : 'ring-transparent hover:ring-foreground/30'
}`}
```

- `ring-2 ring-offset-1` always present (017B geometry freeze)
- **`transition-[box-shadow,opacity]` — THIS IS THE ACTIVE-BACKGROUND SHAKING CAUSE**
- `pointer-events-none` on label overlay and checkmark (017B)

---

## Hover Event Handlers

### Landscape thumbnail buttons

- `onMouseEnter`: **NONE**
- `onMouseLeave`: **NONE**
- `onPointerEnter`: **NONE**
- `onPointerLeave`: **NONE**
- Only `onClick` for background selection

### Hover preview behavior

- No temporary hovered-background state
- No background preloading on hover
- No background selection before click
- No storage writes during hover

---

## React State Changes During Hover

**NONE confirmed.** Mouse movement over thumbnails does NOT cause any React state updates. Verified by inspecting all state setters (`setBackground`, `setCustomBgObjectUrl`, `setBgSize`, `setBgFade`, `setBgTone`) — none are called from any hover event handler.

The only state-changing activity triggered by mouse events is in `useInactivityTimer.ts`, which calls `startFreshTimer()` on each `mousemove`. This function ONLY manages a `setTimeout` ref — it does NOT call `setShowcaseActive` unless the 5-minute timer fires.

---

## CSS Transitions Present (pre-017C)

| Element | Transition | Paint type |
|---------|-----------|------------|
| Landscape tile button | `transition-[box-shadow,opacity]` | **CPU paint (box-shadow)** |
| Landscape label overlay | `transition-opacity` | GPU composite |
| Custom photo button | `transition-all` | CPU paint (box-shadow + others) |
| BackgroundPickerPanel | none (animation only, one-time) | — |
| Main container | `transition: 'opacity 800ms ease'` | GPU composite (when active) |
| BackgroundShowcase | `transition: opacity 1000ms ease` | GPU composite |

---

## Confirmed Behavior (pre-017C)

| Condition | Shaking |
|-----------|---------|
| Clear background + Landscape hover | ✅ None (017B fixed) |
| Active built-in background + Landscape hover | ❌ **SHAKING** |
| Active custom background + Landscape hover | ❌ **SHAKING** |
| Clear background + Custom-photo hover | ✅ None |
| Active background + Custom-photo hover | Not confirmed by user |

---

## Identified Root Cause (pre-fix)

`transition-[box-shadow,opacity]` on the landscape tile button causes **CSS box-shadow paint cycles on every animation frame during hover**. CSS `box-shadow` transitions are CPU paint operations (unlike `opacity` transitions which are GPU-composited). When the main page container has an active `backgroundImage` applied via inline CSS, the browser's paint system treats the background image as part of the repaint area for child element paint operations. Each frame of the ring-color box-shadow animation (`transparent → foreground/30`) forces a repaint of the full background image layer (1920px Unsplash photo). This per-frame background image repaint causes visible stuttering that appears as shaking/jitter.

With Clear background (no `backgroundImage` on main container), the paint area resolves to a solid flat color, and per-frame repaints are imperceptible.

This explains EXACTLY why: Clear = stable, Active = shaking.

---

## CSS Colors (post-017B, pre-017C)

| Variable | Light mode | Dark mode |
|----------|-----------|-----------|
| `--card` | `hsl(40, 25%, 100%)` — fully opaque | `hsl(220, 15%, 14%)` — fully opaque |
| `--background` | `hsl(40, 20%, 97%)` | `hsl(220, 20%, 8%)` |

`bg-card` is fully opaque in both modes. The background image does NOT show through the BackgroundPickerPanel.
