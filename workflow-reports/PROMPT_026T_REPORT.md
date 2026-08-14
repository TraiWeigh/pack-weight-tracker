# PROMPT_026T_REPORT.md
## TRAILWEIGH — MOBILE BACKGROUND REMOVAL + DARK MODE PRESERVATION
### DIAGNOSTIC READ-ONLY REPORT

---

**Internal version:** 026T-MOBILE-BACKGROUND-DARK-MODE-DIAGNOSTIC-2026-08-14-R2  
**Date:** 2026-08-14  
**Mode:** READ-ONLY DIAGNOSTIC — NO APPLICATION CODE CHANGED

---

## Preflight Git Status

```
?? attached_assets/026T-Mobile-Live-Evidence-Collapsed_...png
?? attached_assets/026T-Mobile-Live-Evidence-Expanded_...png
?? attached_assets/TrailWeigh-Prompt-026T-...txt
```

Only untracked asset files from the uploaded prompt. Zero application files changed.

---

## Files Inspected

| File | Purpose |
|------|---------|
| `src/pages/Checklist.tsx` (lines 236, 443, 945-949, 2060-2092, 2506-2580, 2946-3000) | Background state, inline style application, button placement, Lower Phone Toolbar |
| `src/components/BackgroundPicker.tsx` (lines 288, 339-340, 1253, 1383-1431) | `BackgroundPickerButton` export, dark tone control, panel dark class |
| `src/components/BackgroundShowcase.tsx` (full file) | Showcase overlay mechanism (separate from inline bg) |
| `src/index.css` (lines 355-372) | `.screen-dark` CSS custom property overrides |
| `src/lib/mobileCategoryTheme.ts` | Confirm KIS absence |
| `src/components/MobileWedgeCategory.tsx` (header comment) | Confirm KIS gap documented |

Live-evidence screenshots confirmed visually: angled wedges present ✓, vertical item rows present ✓, photographic background visible behind mobile UI ✓, Background button present in mobile toolbar ✓.

---

## A. MOBILE PHOTO BACKGROUND

**source:**  
`src/pages/Checklist.tsx` — the `screen-only` `<div>` at line 2071.

The inline `style` prop on this div (lines 2073-2092) applies:
```ts
backgroundImage: `linear-gradient(
  rgba(${bgTone==='dark'?'0,0,0':'255,255,255'}, ${1 - bgFade}),
  rgba(${bgTone==='dark'?'0,0,0':'255,255,255'}, ${1 - bgFade})
), url(${bgImageUrl})`,
backgroundSize: `100% 100%, ${bgSize}`,
backgroundPosition: 'center',
backgroundRepeat: 'no-repeat',
```

`bgImageUrl` is derived at line 945-949:
```ts
const bgImageUrl = background
  ? background.type === 'preset'
    ? resolvePresetUrl(background.id)   // Unsplash or /themes/<slug>/0N.png
    : customBgObjectUrl                  // custom upload blob URL
  : null;
```

`background` is `useState<Background | null>` initialised at line 236, persisted to `localStorage` key `BG_STORAGE_KEY`.

**state/context:**  
`background` state → `bgImageUrl` derived value.  
Both are local to `ChecklistContent` in `Checklist.tsx`.  
No shared context (not in `BarStyleContext`, not in a separate `ThemeContext`).

**desktop shared? YES.**  
There is NO responsive branch on the `.screen-only` div or its `style` prop.  
The same `backgroundImage` inline style renders on every viewport width from 320 px to 4K.

**exact mobile isolation point:**  
The `.screen-only` CSS class name on that single `<div>` is the cleanest isolation point.  
A `@media (max-width: 1023px)` rule targeting `.screen-only` would suppress the background on mobile without touching any desktop code.

---

## B. MOBILE BACKGROUND CONTROL

**source:**  
`src/pages/Checklist.tsx` line 2561 — `<BackgroundPickerButton>`, and line 2566 — `<BackgroundPickerPanel>`.

Both are rendered inside:
```tsx
{/* line 2560 */}
<div ref={bgPickerContainerRef}>
  <BackgroundPickerButton
    onClick={() => setBackgroundPickerOpen(o => !o)}
    active={!!background}
    panelOpen={backgroundPickerOpen}
  />
  <BackgroundPickerPanel
    open={backgroundPickerOpen}
    ...
  />
</div>
```

**responsive branch:**  
The `<div ref={bgPickerContainerRef}>` wrapper at line 2560 has **NO responsive hiding class**.  
Its parent at line 2506:
```tsx
<div className="relative flex items-center pb-3 lg:pl-1 lg:pr-5 lg:overflow-hidden lg:[scrollbar-gutter:stable]">
```
also has **no visibility toggle** — only spacing/overflow modifiers for `lg`.  
`BackgroundPickerButton` therefore renders on all viewport widths.

**handler/panel:**  
`onClick={() => setBackgroundPickerOpen(o => !o)}` — sets local boolean state.  
`BackgroundPickerPanel` opens as a fixed-position portal (portaled to `document.body`) anchored by `bgPickerContainerRef`.

**desktop shared? YES.**  
Single instance — same `BackgroundPickerButton` renders on both mobile and desktop.  
No per-breakpoint duplicate exists.

---

## C. DARK / NIGHT MODE

**exists in current code? YES.**

**exact implementation:**

*State:*  
`bgTone: 'light' | 'dark'` — `useState` initialised at `Checklist.tsx` line 443.  
Persisted to `localStorage` key `'trailweigh:bgTone'` (read at line 474, written at line 479).

*UI control:*  
The 🌙 Dark button lives **inside `BackgroundPickerPanel`** (`BackgroundPicker.tsx` lines 1411-1416):
```tsx
<button
  onClick={() => onBgToneChange('dark')}
  aria-pressed={bgTone === 'dark'}
>🌙 Dark</button>
```
There is NO standalone dark-mode toggle anywhere else in the app.

*CSS application:*  
When `bgTone === 'dark'`, the class `screen-dark` is added to the `.screen-only` div (Checklist.tsx line 2072).  
`index.css` lines 356-371 define `.screen-dark`:
```css
.screen-dark {
  --foreground:         0 0% 93%;
  --card-foreground:    0 0% 93%;
  --muted-foreground:   0 0% 62%;
  --card:               220 15% 14%;
  --card-border:        220 10% 22%;
  --border:             220 10% 28%;
  --muted:              220 12% 18%;
  --background:         220 20% 8%;
  --input:              220 10% 20%;
  --primary:            0 0% 88%;
  --primary-foreground: 220 15% 10%;
  --popover:            220 15% 14%;
  --popover-border:     220 10% 22%;
  --popover-foreground: 0 0% 93%;
}
```
`BackgroundPickerPanel` also adds `screen-dark` to its own panel div (BackgroundPicker.tsx line 1253).

**mobile control:**  
The dark mode class (`screen-dark`) already applies to the `.screen-only` div on mobile — the CSS has no breakpoint restriction.  
However, the **toggle control** (🌙 Dark button) is only accessible via `BackgroundPickerPanel`.  
If the Background button is hidden on mobile, dark mode will still render correctly but the user cannot switch it.

**coupled to theme/photo backgrounds? YES.**  
The dark tone control is embedded inside the Background Edit panel.  
Hiding `BackgroundPickerPanel` on mobile removes the only path to toggle `bgTone`.

---

## D. MINIMUM MOBILE-ONLY REPAIR

### D1 — Remove photo background on mobile

**file(s):** `src/index.css` only (1 file, ~3 lines)

**exact strategy:**
```css
/* 026T: Mobile-only: suppress photo/theme background on narrow viewports.
   Must use !important because the background is set via inline style on .screen-only. */
@media (max-width: 1023px) {
  .screen-only {
    background-image: none !important;
    background-size:  auto !important;
  }
}
```
`!important` is required because inline `style` props have higher CSS specificity than class-based rules.  
`max-width: 1023px` is the Tailwind `lg` breakpoint lower bound — exactly matches the existing mobile/desktop split.

**desktop risk:** NONE.  
`max-width: 1023px` is strictly mobile-only. Desktop (≥ 1024 px) is entirely unaffected.

**mitigation:**  
`.screen-only` has exactly ONE instance in the application (the root `ChecklistContent` div).  
No other elements carry this class; the rule cannot leak.

---

### D2 — Remove Background button/panel on mobile

**file(s):** `src/pages/Checklist.tsx` (1 file, 1 attribute change)

**exact strategy:**  
Add `hidden lg:block` to the `<div ref={bgPickerContainerRef}>` wrapper at line 2560:
```tsx
{/* Before */}
<div ref={bgPickerContainerRef}>

{/* After */}
<div ref={bgPickerContainerRef} className="hidden lg:block">
```
This hides both `BackgroundPickerButton` AND `BackgroundPickerPanel` on mobile, and restores them at `lg` (1024 px+).

**desktop risk:** NONE.  
`lg:block` is additive — desktop behaviour is pixel-identical.

**⚠ Side-effect on dark mode:**  
This also hides the ONLY dark/light tone toggle on mobile.  
The `bgTone` state and `screen-dark` CSS class remain fully functional, but there is no mobile UI path to switch between Light and Dark after this change.  
A future task must add a standalone mobile dark-mode toggle to the Lower Phone Toolbar (line 2950) calling the already-existing `handleBgToneChange` function.

---

## E. KIS

**current KIS state exists? NO.**  
The only reference is a code comment in `MobileWedgeCategory.tsx`:
```
// D. KIS: no KIS state exists in codebase — gap documented; not implemented
```
No flag, context, hook, localStorage key, or URL param for KIS anywhere in the source.

**relevant to this repair? NO.**  
Mobile clean neutral background is fully achievable via one CSS rule in `index.css`.  
KIS state is not required and must not be added as part of this repair.

---

## F. MATERIAL UNCERTAINTY

**YES — one item:**

The dark mode toggle coupling is a UX gap that the repair plan does not fully close.

Specifically: hiding `BackgroundPickerPanel` on mobile (D2) also removes the 🌙 Dark button.  
After the repair, a mobile user who previously set dark mode would see it rendered correctly (`.screen-dark` CSS works on mobile), but could not switch back to light mode on their phone without a separate UI control.

**Exact unanswered question:**  
> Should the mobile dark-mode toggle be part of this same implementation ticket (026U), or treated as a separate follow-up task?

If 026U must satisfy the full user requirement (mobile Night/Dark mode must work), a standalone dark-mode toggle for the Lower Phone Toolbar must be scoped into 026U.  
If 026U is background/button removal only, dark mode becomes a follow-up.

**This is a scope/sequencing question, not a technical blocker.**

---

## Summary Table

| Topic | Finding |
|-------|---------|
| Mobile bg source | `.screen-only` div inline style, `Checklist.tsx:2071` |
| bg state | `background` → `bgImageUrl`, local state in `ChecklistContent` |
| Desktop shared? | YES — single div, no responsive branch |
| Mobile isolation point | `.screen-only` CSS class, one instance |
| Background button source | `Checklist.tsx:2561`, no responsive hiding |
| Button desktop shared? | YES — single instance |
| Dark mode exists? | YES — `bgTone` state, `.screen-dark` CSS class |
| Dark mode coupled to bg panel? | YES — toggle only in `BackgroundPickerPanel` |
| Dark mode works on mobile now? | YES (CSS) — but toggle is inaccessible via mobile UI if panel is hidden |
| Min repair files | 2: `src/index.css` + `src/pages/Checklist.tsx` |
| KIS relevant? | NO |
| Material uncertainty | YES — dark mode toggle mobile path (scope question) |

---

## Confirmation: NO Application Code Changed

```
git status --short (application files):
  (no application file changes)
```

Only files touched in this session are newly created report files in `workflow-reports/`.  
Zero changes to `.tsx`, `.ts`, `.css`, `.toml`, `package.json`, `replit.md`, or `.agents/memory/`.
