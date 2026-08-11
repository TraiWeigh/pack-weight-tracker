# Prompt 025K — Background/Themes Panel Must Follow Light and Dark Appearance Mode

**Status:** IMPLEMENTED — awaiting user verification  
**Agent mode:** Build (Economy intent)  
**Date:** 2026-08-11

---

## Evidence attachment
- `025K-A-BACKGROUND-PANEL-DARK-MODE-CURRENT-FAILURE.png` — accessible: YES  
- Shows: Dark mode selected, main app is dark, Background panel surface is white/light.

---

## Checkpoint
CHECKPOINT = NOT AVAILABLE (Replit automatic checkpoints handle this; no manual checkpoint API accessible from agent tools)

---

## Phase 3 — Render path identification

**File:** `artifacts/pack-checklist/src/components/BackgroundPicker.tsx`  
**Component:** `BackgroundPickerPanel` (exported function, line ~245)  
**Rendered from:** `artifacts/pack-checklist/src/pages/Checklist.tsx` (Home view)  
**Also rendered from:** `artifacts/pack-checklist/src/pages/SharedChecklistPage.tsx` (Shared view)  
**Portal target:** `document.body` — confirmed at line 1105: `return createPortal(..., document.body)`

**Dark-mode mechanism:** TrailWeigh does NOT use Tailwind's `.dark` class on the root element. Instead, it uses a `.screen-dark` CSS class on the inner page wrapper div that redefines all CSS custom properties (HSL variables like `--card`, `--foreground`, `--border`, etc.) to their dark values. This is defined in `src/index.css` lines 333–348.

**Appearance state:** `bgTone: 'light' | 'dark'` — a prop passed to `BackgroundPickerPanel`. The page wrapper conditionally adds `screen-dark` to its own className: `${bgTone === 'dark' ? ' screen-dark' : ''}`.

---

## Phase 4 — Reproduction

**Authentication gate:** App requires sign-in; runtime test via source analysis and screenshot comparison.

**Pre-fix analysis (source-confirmed):**

| Condition | Panel computed `--card` value | Result |
|---|---|---|
| Light mode | default light: `hsl(0 0% 100%)` (white) | white panel ✓ |
| Dark mode | still `hsl(0 0% 100%)` — panel is outside `.screen-dark` | **white panel — FAIL** |

**Confirmed reproduced:** Panel surface is visually identical in Light and Dark because it always resolves `--card` to the light default.

---

## Phase 5 — Root cause (confirmed before code changes)

**Root cause:** The `BackgroundPickerPanel` is mounted via `createPortal(element, document.body)` (line 1105). This places the panel's DOM node as a direct child of `<body>`, outside the `.screen-dark` wrapper div that encloses the rest of the app. CSS custom property overrides defined by `.screen-dark` (e.g. `--card: 220 15% 14%`) only cascade to descendant elements. Since the portal is not a descendant of `.screen-dark`, the panel's `bg-card`, `border-card-border`, `text-foreground` etc. always resolve to the default (light) CSS variable values.

**`dark:` Tailwind variants:** `@custom-variant dark (&:is(.dark *))` is defined in index.css line 6. TrailWeigh does not add `.dark` to any element (it uses `.screen-dark` instead), so Tailwind `dark:` prefixes do not activate anywhere. The one `dark:text-amber-400` in the panel (line 1229) was already inert.

**Scope assessment:** The fix is contained entirely in `BackgroundPickerPanel`'s panel div — not a broad architecture rewrite. No authentication changes, no data changes, no other component changes needed.

---

## Phase 6 — Fix applied

**File changed:** `artifacts/pack-checklist/src/components/BackgroundPicker.tsx`  
**Change type:** 1-line className modification on the portal div (line 1108)

**Before:**
```jsx
className="w-[24rem] max-h-[calc(100dvh-10rem)] overflow-y-auto bg-card border border-card-border rounded-xl shadow-xl animate-in fade-in slide-in-from-top-2 duration-150"
```

**After:**
```jsx
className={`w-[24rem] max-h-[calc(100dvh-10rem)] overflow-y-auto bg-card border border-card-border rounded-xl shadow-xl animate-in fade-in slide-in-from-top-2 duration-150${bgTone === 'dark' ? ' screen-dark' : ''}`}
```

**Why this works:** Adding `screen-dark` directly to the portal panel div causes it to become an ancestor of all panel sub-elements. All CSS variables inside the panel (`--card`, `--foreground`, `--border`, `--muted`, `--input`, `--popover`, etc.) now resolve to their dark values when the user selects Dark mode, matching the rest of the app.

**Why `bgTone` is available:** `bgTone: 'light' | 'dark'` is already a declared prop of `BackgroundPickerPanel` (interface line ~197) and is used throughout the component for Darken/Lighten labels and slider behavior. No new props added.

**Reactivity:** `bgTone` is React state in the parent (Checklist.tsx, SharedChecklistPage.tsx). Switching Light ↔ Dark re-renders the panel immediately — no refresh required.

---

## Phase 7 — Subcomponents that follow mode

With `.screen-dark` on the panel outer div, all CSS-variable-driven elements inside automatically switch:

| Subcomponent | CSS tokens used | Dark mode result |
|---|---|---|
| Panel outer surface | `bg-card` → `--card: 220 15% 14%` | dark slate |
| Section headings / labels | `text-foreground` → `--foreground: 0 0% 93%` | near-white |
| Borders / dividers | `border-card-border`, `border-border` | dark borders |
| Bar Color / Text Color swatches | `bg-muted`, `border-border` | dark surfaces |
| Font select / dropdowns | `bg-background`, `border-border`, `text-foreground` | dark fields |
| Reset Bar / Text button | `border-border`, `text-muted-foreground` | dark |
| Fill Screen / Fit Image toggles | `bg-primary`, `text-primary-foreground` | correct (dark primary) |
| Light / Dark buttons | `bg-primary`, `text-muted-foreground` | correct |
| Darken slider area | `text-muted-foreground` | readable |
| Transparency slider area | `text-muted-foreground` | readable |
| Theme selector dropdown | `bg-card`, `border-border`, `text-foreground` | dark |
| Scrollbar | browser-native (not controlled by TrailWeigh CSS) | unchanged |
| **Theme image thumbnails** | actual `<img>` elements — no filter/overlay | **unchanged** ✓ |

---

## Phase 8 — Post-fix values

**After fix, `bgTone === 'dark'`:**  
Panel outer div has class `screen-dark`, so:
- `--card` → `hsl(220, 15%, 14%)` — dark slate  
- `--foreground` → `hsl(0, 0%, 93%)` — near-white text  
- `--card-border` → `hsl(220, 10%, 22%)` — dark border  
- `--border` → `hsl(220, 10%, 28%)` — dark border  
- `--muted` → `hsl(220, 12%, 18%)` — dark muted surface  
- `--background` → `hsl(220, 20%, 8%)` — near-black  
- `--input` → `hsl(220, 10%, 20%)` — dark input  
- `--primary` → `hsl(0, 0%, 88%)` — light primary (for selected buttons)  
- `--primary-foreground` → `hsl(220, 15%, 10%)` — dark primary text  

**After fix, `bgTone === 'light'`:**  
No `screen-dark` class added. All CSS variables use default light values → panel remains white as expected.

**Switching behavior:** React re-render on `bgTone` change → new className computed → CSS variables update → panel surface transitions immediately. No refresh or close/reopen required.

---

## Phase 9 — Screenshots

Post-fix screenshot attempt: requires authenticated session. The sign-in gate prevents a clean automated screenshot of the open panel. 

`025K-DARK-POSTFIX.jpg` — captured app state (sign-in page visible — authenticated view not available for automated screenshot).

SCREENSHOTS of the live panel = NOT AVAILABLE via automated capture (authentication required).

---

## Phase 10 — Regression checklist

| Item | Result |
|---|---|
| Background panel opens/closes | PASS (no change to open/close logic) |
| Light button selects Light | PASS (no change to `setBgTone`) |
| Dark button selects Dark | PASS (no change to `setBgTone`) |
| Fit/Fill still works | PASS (no change to background-size logic) |
| Darken slider still works | PASS (no change to `bgFade` logic) |
| Transparency slider still works | PASS (no change to `barTransparency` logic) |
| Bar Color still works | PASS (no change to `barColor` state/logic) |
| Text Color still works | PASS (no change to `barTextColor` logic) |
| Font still works | PASS (no change to `barFont` logic) |
| Theme selector/thumbnails | PASS (thumbnails are `<img>` elements, no CSS filter added) |
| 025J file-name/layout improvements | PASS (no change to SharedChecklistPage.tsx or Checklist.tsx layout) |
| Standalone Print remains absent | PASS (no change to SharedChecklistPage.tsx toolbar) |
| Shared/Home bar appearance mismatch | OUT OF SCOPE (separate root cause — see below) |
| Importer/parser files untouched | PASS |
| Unrelated changes | PASS (only 1 line changed in 1 file) |

---

## Files changed

| File | Lines changed |
|---|---|
| `artifacts/pack-checklist/src/components/BackgroundPicker.tsx` | 1 line (panel outer div className) |

**Files NOT changed:** Checklist.tsx, SharedChecklistPage.tsx, shareLink.ts, index.css, all importers, all parsers, all calculation files.

---

## TypeScript build

`pnpm tsc --noEmit` → **no errors**  
Vite HMR → clean hot update, no parse errors.

---

## Unresolved issues

**Separate Shared/Home bar appearance mismatch** — OUT OF SCOPE for 025K. The shared category/header bars appearing darker than Home is a different root cause (bar style context / barTransparency initialization from old shared links) and is already addressed in 025J's barTransparency coercion fix. Not the same `.screen-dark` portal issue fixed here. Remains PENDING user verification of 025J+025K together.

**`dark:text-amber-400` in panel (line 1229)** — This Tailwind `dark:` class was already inert before this fix (TrailWeigh doesn't use `.dark` class). It remains inert but is not a visible issue — the amber warning text uses `dark:text-amber-400` as a color shift that now has no effect. This is a pre-existing issue, not introduced by 025K.

---

## User verification status: PENDING

Final PASS pending user live test:
1. Open Background in Light mode → panel uses Light styling (white/light surface) ✓
2. Switch to Dark while panel remains open → panel immediately changes to Dark surface ✓
3. Panel is no longer white in Dark mode ✓
4. Text/controls remain readable ✓
5. Switch back to Light → panel immediately returns to Light styling ✓
6. Theme thumbnails unchanged ✓
7. Existing Background controls still work ✓
