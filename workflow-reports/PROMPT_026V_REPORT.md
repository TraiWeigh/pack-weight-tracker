# PROMPT_026V_REPORT.md
## TRAILWEIGH — MOBILE ARCHITECTURE AUDIT + HORIZONTAL OVERFLOW DIAGNOSTIC
### READ-ONLY REPORT

---

**Internal version:** 026V-MOBILE-ARCHITECTURE-AND-HORIZONTAL-OVERFLOW-DIAGNOSTIC-2026-08-14-R2  
**Date:** 2026-08-14  
**Mode:** READ-ONLY DIAGNOSTIC — NO APPLICATION CODE CHANGED

---

## Preflight Git Status

```
HEAD: 17a5d47 Add evidence assets and prompt report for 026T workflow
No uncommitted application-file changes at preflight.
```

Only untracked: 026V prompt/assets in `attached_assets/`.

---

## Files Inspected

| File | Lines examined |
|------|---------------|
| `artifacts/pack-checklist/index.html` | Full — viewport meta |
| `artifacts/pack-checklist/src/index.css` | Full — breakpoints, `.screen-dark`, `.screen-only` |
| `artifacts/pack-checklist/src/pages/Checklist.tsx` | Lines 51-95 (UnitToggle), 2375-2400 (main/grid), 2950-3070 (Lower Phone Toolbar), 2784-2793 (content area) |
| `artifacts/pack-checklist/src/components/MobileWedgeCategory.tsx` | Lines 320-430 (outer container, header) |
| `artifacts/pack-checklist/vite.config.ts` | Full — confirms `@tailwindcss/vite` |
| `artifacts/pack-checklist/src/components/BackgroundPicker.tsx` | Structural grep |

**Runtime measurement note:** Clerk auth wall prevents loading the Checklist page in dev environment. All width measurements below are calculated from source inspection. Estimates are derived from Tailwind class definitions (px-2 = 8px, px-3 = 12px, text-xs ≈ 12px) and standard browser font rendering for `font-semibold` at 12px.

---

## A. MEASUREMENTS (Calculated from Source)

**Container hierarchy mobile width budget:**
```
viewport width
  − px-3 (left, 12px)                           [main, Checklist.tsx:2375]
  − px-3 (right, 12px)
  = available toolbar width
```

**Lower Phone Toolbar content width:**
```
Left group (Open/Close pill):
  p-0.5(2) + ChevronDown-btn(8+16+8) + gap-0.5(2) + ChevronUp-btn(8+16+8) + p-0.5(2)
  = 70px

gap-2 (justify-between gap): 8px

Right group (flex items-center gap-2 — NO flex-wrap):
  Hide btn:         px-3(12) + text-"Hide"(~24px) + px-3(12) = ~48px
  gap-2:            8px
  Checklist btn:    px-3(12) + text-"Checklist"(~54px) + px-3(12) = ~78px
  gap-2:            8px
  [☀|🌙] toggle:   p-0.5(2) + icon-btn(8+16+8) + gap-0.5(2) + icon-btn(8+16+8) + p-0.5(2) = ~70px
  gap-2:            8px
  UnitToggle:       p-0.5(2) + "Imperial"-btn(12+52+12) + gap-0.5(2) + "Metric"-btn(12+40+12) + p-0.5(2)
                  = 2 + 76 + 2 + 64 + 2 = ~146px
  Right group total = 48+8+78+8+70+8+146 = ~366px

Toolbar total (content only) = 70 + 8 + 366 = 444px
Total including main px-3: 444 + 24 = 468px
```

| Viewport | Available width (−24px padding) | Toolbar content | Overflow |
|----------|--------------------------------|-----------------|---------|
| **320px** | 296px | 444px | **+148px** |
| **375px** | 351px | 444px | **+93px** |
| **390px** | 366px | 444px | **+78px** |
| **430px** | 406px | 444px | **+38px** |

Horizontal overflow is present at **all four tested mobile viewport widths**.

---

## B. OFFENDING ELEMENTS

### Offender 1 — PRIMARY
**component:** Lower Phone Toolbar right group  
**file:** `artifacts/pack-checklist/src/pages/Checklist.tsx` line 2995  
**class/style:** `<div className="flex items-center gap-2">`  
**measured overflow:** ~366px intrinsic width; available space is 296–406px depending on viewport  
**reason:** `flex items-center gap-2` with NO `flex-wrap` and NO `min-w-0` / `flex-shrink: 1` permissions. The flex row contains 4 distinct button groups (Hide, Checklist, [☀|🌙], [Imperial|Metric]). They are all text or icon buttons with fixed intrinsic widths that cannot compress. The line cannot wrap, so the entire row extends beyond the viewport, forcing `documentElement.scrollWidth > clientWidth`.

### Offender 2 — TRIGGER
**component:** Sun/Moon segmented toggle (026U addition)  
**file:** `artifacts/pack-checklist/src/pages/Checklist.tsx` lines 3022-3066  
**class/style:** `<div className="flex items-center bg-muted rounded-lg p-0.5 gap-0.5">` containing 2× `px-2 py-1.5` icon buttons  
**measured overflow contribution:** ~78px (70px + 8px gap) inserted into the right group  
**reason:** This was the final addition that tipped the toolbar over the viewport boundary. Before 026U the right group was Hide+Checklist+UnitToggle ≈ 288px, which fit within a 390px screen (available: 366px). After 026U the right group became Hide+Checklist+[☀|🌙]+UnitToggle ≈ 366px, exceeding even a 430px screen (available: 406px).

### Offender 3 — STRUCTURAL PRECONDITION
**component:** Lower Phone Toolbar container  
**file:** `artifacts/pack-checklist/src/pages/Checklist.tsx` line 2953  
**class/style:** `<div className="lg:hidden flex items-center justify-between gap-2 pt-1">`  
**reason:** The toolbar row itself has no `overflow-hidden`, no `max-w`, no `flex-wrap`. `justify-between` places left and right groups at opposite ends without any width constraint. If the right group is wider than the available space, the flex algorithm does not wrap or shrink — it extends beyond the viewport.

### Offender 4 — MINOR CONTRIBUTOR
**component:** `<main>` element  
**file:** `artifacts/pack-checklist/src/pages/Checklist.tsx` line 2375  
**class/style:** `className="w-full max-w-full mx-auto px-3 sm:px-4 lg:px-8"`  
**reason:** `px-3` (12px each side = 24px total) reduces available toolbar width on mobile. Not the root cause but subtracts from the already-tight budget.

---

## C. PRIMARY ROOT CAUSE

**Exact cause:**  
The right group of the Lower Phone Toolbar (`<div className="flex items-center gap-2">` at Checklist.tsx:2995) is a single `flex-nowrap` row containing 4 button groups — Hide, Checklist, [Sun|Moon], [Imperial|Metric] — with a combined intrinsic minimum width of approximately **366px**. This exceeds the available content width at every standard mobile viewport (296–406px). Because no item in the group has permission to flex-shrink (no `min-w-0`, no explicit `flex-shrink: 1`), and the row has no `flex-wrap`, the browser extends the flex line past the viewport edge, creating a horizontal scrollable document.

The 026U Sun/Moon toggle addition (≈78px including gap) was the direct trigger: it pushed the previously near-fitting right group (~288px) past the breaking point at all viewport widths.

---

## D. SECONDARY CONTRIBUTORS

1. **`justify-between` on the toolbar container** (line 2953): separates left from right with no flex compression room between them.
2. **`main` px-3 padding** (line 2375): consumes 24px of viewport leaving less room for the toolbar.
3. **UnitToggle `[Imperial|Metric]`**: the text "Imperial" alone is ~52px at text-xs — the largest single text label in the row. It was the largest pre-existing contributor but was previously offset by the smaller Hide+Checklist group.

No secondary overflow identified in MobileWedgeCategory: the outer div is `rounded-xl overflow-hidden`; the wedge strip is `w-16 flex-shrink-0` (64px, well within any viewport); the header uses `flex-1` for the center section. The wedge is not a contributor to the document-level overflow.

---

## E. MINIMUM REPAIR

**file(s):**  
`artifacts/pack-checklist/src/pages/Checklist.tsx` — Lower Phone Toolbar only (inside existing `lg:hidden` parent)

**exact strategy (3 options, in order of preference):**

**Option A — Wrap the right group (safest, zero functionality loss):**  
Add `flex-wrap gap-y-1` to the right group div at line 2995:
```tsx
{/* Before */}
<div className="flex items-center gap-2">

{/* After */}
<div className="flex items-center gap-2 flex-wrap justify-end">
```
On very narrow phones (320–375px) the toolbar wraps onto 2 lines; on 390px+ it may fit in one. All controls remain present and functional. The parent `lg:hidden` div constrains this to mobile only.

**Option B — Reduce button label text:**  
Replace text labels with icon-only buttons for Hide and Checklist (EyeOff icon, ClipboardCheck icon) with `aria-label`. This recovers ~130px and eliminates overflow at all phone widths. Requires importing 2 icons; all buttons remain functional.

**Option C — Split the toolbar into two rows (mobile-only):**  
Move [Imperial|Metric] to its own mobile row below the main toolbar row. Both rows remain inside `lg:hidden`.

**why it fixes root cause:**  
Options A and C allow the flex content to occupy more vertical space instead of forcing horizontal extension. Option B reduces the intrinsic minimum width below any mobile viewport.

**why it does not mask the defect:**  
All options fix the actual layout rather than hiding overflow with `overflow-x: hidden`. The document `scrollWidth` becomes equal to `clientWidth` because no element extends past the viewport edge.

**desktop isolation:**  
All three options apply only inside the `<div className="lg:hidden ...">` wrapper at line 2953. At `lg` (1024px+) this entire section does not render. Desktop is completely unaffected by any change to its children.

---

## F. MOBILE/DESKTOP ARCHITECTURE MAP

### Mobile-only render branches (A — safe for mobile changes)
| Area | File | Branch |
|------|------|--------|
| Lower Phone Toolbar | `Checklist.tsx:2953` | `lg:hidden` wrapper — entire toolbar |
| Category accordion (mobile) | `Checklist.tsx:2822` | `<div className="lg:hidden">` |
| Mobile item rows | `MobileWedgeCategory.tsx` | Component only used in `lg:hidden` branch |
| Sun/Moon dark toggle | `Checklist.tsx:3022-3066` | Inside `lg:hidden` toolbar |
| Phone file-name pill row | `Checklist.tsx:2382` | `lg:hidden` |

### Desktop-only render branches (B — safe for desktop changes)
| Area | File | Branch |
|------|------|--------|
| Category accordion (desktop) | `Checklist.tsx:2795` | `hidden lg:block` |
| Desktop left toolbar row | `Checklist.tsx:2402` | `hidden lg:flex` |
| Desktop right group | `Checklist.tsx:2473` | `hidden lg:flex` |
| Background button + panel | `Checklist.tsx:2560` | `hidden lg:block` (since 026U) |
| Sidebar Open/Close group | `Checklist.tsx:2507` | `lg:pl-1 lg:pr-5` context; present at all widths but only meaningful on desktop where sidebar exists |

### Shared presentation (C — changes risk cross-viewport leakage)
| Area | File | Risk |
|------|------|------|
| App header/top toolbar | `Checklist.tsx:2094-2374` | Uses `sm:` branches; changes affect all widths |
| `UnitToggle()` function | `Checklist.tsx:51-95` | Called in both `hidden lg:flex` and `lg:hidden` branches; function changes affect both renders |
| `WeightSummary`, `WeightDistribution` | `WeightSummary.tsx` | Shared sidebar component |
| `ImportGearPanel` | `ImportGearPanel.tsx` | Shared sidebar component |
| `LockerPanel` | `LockerPanel.tsx` | Shared sidebar component |
| `PreviewModal` (Checklist modal) | `PreviewModal.tsx` | Modal used on all viewports |
| `.screen-only` div | `Checklist.tsx:2071` | Root container; shared on all widths |
| `main` element | `Checklist.tsx:2375` | Root container; shared |

### Shared state/logic — safe to reuse (D)
- `bgTone` / `handleBgToneChange` / `trailweigh:bgTone` — data only
- `UnitContext` (`system`, `setSystem`) — data only
- `BarStyleContext` (`barColor`, `barFont`, `barTextColor`, `barTransparency`) — data/config
- `usePackData` — data and persistence logic only
- `categoryOrder`, `openCatIds`, `checklistUse` — data

### High-risk shared CSS / selectors
| Selector | File | Risk |
|----------|------|------|
| `.screen-dark` | `index.css:356` | Global scope; affects all viewports when `bgTone === 'dark'` |
| `.screen-only` base styles | `index.css:173` | Affects root container on all widths |
| `body {}` | `index.css:146` | Global; never touch for mobile-only work |
| `@media (max-width: 1023px) .screen-only` | `index.css:360` | 026U addition; mobile-safe (max-width constrained) |
| Any un-breakpointed class added to shared components | any | Always use `lg:` prefix or `max-width` media query for mobile-only visual changes on shared components |

### Current mobile→desktop breakpoint
**`lg` = 1024px** (Tailwind v4 default) used consistently throughout Checklist.tsx.  
`sm` (640px) is used in the app header for portrait/landscape layout switching.  
`md` (768px) is used for tooltip visibility in some components.  
**No custom breakpoints are defined** in `index.css @theme` or `tailwind.config.*` (no config file found; project uses Tailwind v4 via `@tailwindcss/vite`).

### Can future phone presentation be isolated safely? YES

Proof from current source:
- `MobileWedgeCategory.tsx` exists as a fully phone-only component with zero desktop contamination risk.
- The `lg:hidden` wrapper pattern at Checklist.tsx:2953 creates a proven isolation boundary.
- The 026U `@media (max-width: 1023px)` CSS rule adds mobile-only CSS without touching desktop.
- The `hidden lg:block` / `hidden lg:flex` pattern isolates Background editing to desktop.
- The only structural risk is changes to **shared components** (UnitToggle, sidebar panels, app header) that render on both viewports — these must use responsive classes or be parameterized.

---

## G. BREAKPOINT MAP

| Breakpoint | px | Usage in TrailWeigh |
|-----------|-----|---------------------|
| (base/mobile) | < 640px | Default; mobile layout |
| `sm` | ≥ 640px | App header row layout; some text/element visibility |
| `md` | ≥ 768px | Tooltip visibility, some hover-only decorations |
| `lg` | ≥ 1024px | **Primary mobile→desktop switch** — category layout, toolbars, sidebar grid, background editing |
| `xl`, `2xl` | ≥ 1280/1536px | Not observed in Checklist.tsx source |

**Risky range:** 640–1023px (sm to just below lg). Both `sm:` and `lg:` branches may have partial rendering. App header layout changes at `sm` while category layout does not change until `lg`. Any tablet in portrait (768-1023px) sees the mobile category layout with the sm-adapted header.

**Viewport meta:** `width=device-width, initial-scale=1.0, maximum-scale=1` — correct for responsive web. `maximum-scale=1` prevents iOS auto-zoom but does not prevent horizontal overflow from layout bugs.

---

## H. SAFE MOBILE CHANGE RULEBOOK

### 1. Files/components SAFE for mobile-only visual changes
- `src/components/MobileWedgeCategory.tsx` — exclusively rendered in `lg:hidden` branch
- `src/lib/mobileCategoryTheme.ts` — icon/color mapping for mobile only
- The `lg:hidden` Lower Phone Toolbar section in `Checklist.tsx` (lines 2953-3071)
- New `@media (max-width: 1023px)` blocks in `src/index.css` — mobile-only CSS
- Any NEW mobile-specific component created fresh and placed only in `lg:hidden` branches

### 2. Shared files/components to PROTECT
- `src/components/GearCategory.tsx` / `src/components/GearRow.tsx` — desktop UI; any change affects desktop
- `src/components/WeightSummary.tsx`, `ImportGearPanel.tsx`, `LockerPanel.tsx` — sidebar panels shared across viewports
- `src/components/BackgroundPicker.tsx` — desktop-only since 026U but shared component code
- `UnitToggle()` function at Checklist.tsx:51 — rendered in both mobile and desktop toolbar; visual changes affect both renders
- `src/index.css` `.screen-dark`, `.screen-only` base styles — global scope
- App header section of `Checklist.tsx` (lines 2094-2374) — uses `sm:` branches affecting 640-1023px range

### 3. Shared state/hooks safe to REUSE
All of the following contain data/behavior, not presentation — safe to consume from mobile-only code:
- `bgTone`, `handleBgToneChange`, `trailweigh:bgTone`
- `UnitContext` (system, setSystem)
- `BarStyleContext` (barColor, barFont, barTextColor, barTransparency)
- `usePackData` (data, categoryOrder, checklistUse, etc.)

### 4. High-risk global CSS selectors
- `.screen-dark` — do not add layout properties; safe to extend with color-only variables
- `.screen-only` — do not add layout/width changes without a wrapping `@media` constraint
- `body`, `html`, `:root` — never add layout changes here for phone-only work

### 5. Mobile layout boundary
The current `lg:hidden` wrapper pattern at Checklist.tsx:2953 is a proven isolation boundary. MobileWedgeCategory is a proven dedicated mobile component. These together form a **sufficient mobile-only boundary** for category and toolbar presentation.

### 6. Recommended future pattern
**Prefer mobile-specific components** (like `MobileWedgeCategory`) for complex presentation differences. Use responsive Tailwind classes (`lg:hidden` / `hidden lg:block`) for simple show/hide. Use `@media (max-width: 1023px)` CSS rules for property overrides where inline styles prevent class-level control.

**Do NOT** add presentation changes to shared components (WeightSummary, LockerPanel, etc.) without responsive class scoping.

**Architecture refactor needed now? NO.**  
The existing `lg:hidden` / `hidden lg:block` pattern is sound. The current overflow is a layout-arithmetic bug in the toolbar, not an architecture failure. Fix the toolbar geometry; no structural refactor required.

---

## I. MATERIAL UNCERTAINTY

**YES — one item:**

All measurements in section A are **calculated from source**, not captured from a live runtime DOM. The auth wall prevents loading the Checklist page in the dev environment. Font rendering differences between systems (macOS vs iOS, system font stack, letter-spacing) could shift the exact overflow pixel values ±10-15px from the calculated estimates.

**Impact:** The direction (overflow exists, toolbar is too wide) is certain from source inspection and confirmed by the user's live phone screenshots. The exact `scrollWidth` values (section A measurements) carry ±15px uncertainty. This does not affect the root cause diagnosis or the repair strategy.

---

## Confirmation: NO Application Code Changed

```
git diff --stat HEAD: (no output — zero changes)
git status --short: (no application file changes)
```

Only files written in this session: `workflow-reports/PROMPT_026V_REPORT.md` (this file) and its ZIP.
