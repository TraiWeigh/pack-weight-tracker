# PROMPT_026Y_REPORT.md
## TRAILWEIGH — PHONE-ONLY VISUAL / LAYOUT AUDIT
### COORDINATED MOBILE REDESIGN PLAN — READ-ONLY DIAGNOSTIC

---

**Internal version:** 026Y-PHONE-VISUAL-LAYOUT-AUDIT-2026-08-14-R2  
**Date:** 2026-08-14  
**Mode:** READ-ONLY — NO APPLICATION CODE CHANGED

---

## Screenshots / References Used

- `attached_assets/026Y-Current-Mobile-1_1786723867409.png`
- `attached_assets/026Y-Current-Mobile-2_1786723867409.png`
- `attached_assets/026Y-Current-Mobile-3_1786723867409.png`
- `attached_assets/026Y-Current-Mobile-4_1786723867409.png`
- `attached_assets/026Y-Mobile-Target-Reference_1786723867409.png`

---

## Files Inspected

| File | Lines |
|------|-------|
| `src/pages/Checklist.tsx` | 2073–3093 (header, toolbar group, content area, lower toolbar) |
| `src/components/MobileWedgeCategory.tsx` | 1–511 (full file) |
| `src/index.css` | Lines 173, 356–368 (screen-only, @media 1023px, screen-dark) |

---

## A. CURRENT MOBILE VISUAL ARCHITECTURE

### 1. Top App Header
- **File:** `Checklist.tsx` lines 2095–2373
- **Classification:** SHARED — renders at all viewport widths
- **Portrait layout (<sm / <640px):** `flex-col py-2 gap-y-1.5` → two stacked rows:
  - Row 1: Logo (Tent icon + "TrailWeigh" / "GEAR TRACKER") left + Account/Sign-in right
  - Row 2: Actions — (+/New · Undo · Redo · Save · Reset) centered via `justify-center`
- **sm+ layout (≥640px):** collapses to a single `h-16` flex row with `justify-between`
- **Desktop leakage risk:** HIGH — any change to the header's inner classes affects sm+ automatically unless breakpoint-qualified

### 2. Filename Pill / Label
- **File:** `Checklist.tsx` lines 2381–2391
- **Classification:** MOBILE-ONLY — `lg:hidden` wrapper; conditional on `activeLockerFile`
- **CSS:** `pt-4 lg:hidden flex items-center justify-center gap-2 pb-2`
- **Desktop leakage risk:** NONE

### 3. Lower Phone Toolbar
- **File:** `Checklist.tsx` lines 2955–3082
- **Classification:** MOBILE-ONLY — outer `lg:hidden flex flex-col gap-1 pt-1`
- **Row 1:** `flex items-center justify-between gap-2` → Left: Open/Close segmented · Right: Hide + Checklist + ☀/🌙
- **Row 2:** `flex justify-center` → `<UnitToggle />`
- **Position in DOM:** Inside the sidebar content column (after LockerPanel), which renders `order-first` on mobile — meaning the toolbar is scrolled to after Pack Summary + Weight Distribution + Scan + Locker
- **Desktop leakage risk:** NONE

### 4. Light/Dark Toggle
- **File:** `Checklist.tsx` lines 3027–3071
- **Classification:** MOBILE-ONLY (parent `lg:hidden`) for the Sun/Moon segmented control
- **Desktop version:** Part of BackgroundPickerPanel, inside `hidden lg:block` bg picker button
- **Desktop leakage risk:** NONE for mobile toggle

### 5. Imperial/Metric (UnitToggle)
- **File:** `Checklist.tsx` UnitToggle component (lines 51–88), rendered in two places
- **Classification:** SHARED state; MOBILE render at line 3079 in `lg:hidden` parent; DESKTOP render at line 2496 in `hidden lg:flex` right group
- **Desktop leakage risk:** NONE — each render is inside its own viewport-gated wrapper

### 6. MobileWedgeCategory
- **File:** `src/components/MobileWedgeCategory.tsx` (511 lines)
- **Classification:** MOBILE-ONLY — wrapped in `<div className="lg:hidden">` at `Checklist.tsx:2825`
- **Desktop leakage risk:** NONE

### 7. Category Header Actions
- **File:** `MobileWedgeCategory.tsx` (Pencil rename: lines 80–98; Delete/confirm: lines 410–445)
- **Classification:** MOBILE-ONLY (inside MobileWedgeCategory)
- **Desktop leakage risk:** NONE

### 8. Expanded Item Content
- **File:** `MobileWedgeCategory.tsx` `MobileItemRow` (lines 104–268)
- **Classification:** MOBILE-ONLY
- **Desktop leakage risk:** NONE

### 9. Pack Summary
- **File:** `WeightSummary` component, rendered at `Checklist.tsx:2891`
- **Classification:** SHARED — in the sidebar column which has `order-first` on mobile
- **Desktop leakage risk:** LOW (component shared but layout controlled by grid column)

### 10. Weight Distribution
- **File:** `WeightDistribution` component, `Checklist.tsx:2899`
- **Classification:** SHARED — same sidebar column
- **Desktop leakage risk:** LOW

### 11. Locker / Scan Gear List Section
- **File:** `LockerPanel.tsx`, `ImportGearPanel` (`Checklist.tsx:2909, 2931`)
- **Classification:** SHARED — same sidebar column
- **Desktop leakage risk:** LOW

### 12. Checklist Modal
- **File:** `PreviewModal.tsx`, `Checklist.tsx:3105`
- **Classification:** SHARED — renders as overlay at all viewports

### 13. Root Mobile Page / Container
- **File:** `Checklist.tsx` line 2073
- **Classification:** SHARED — `screen-only min-h-[100dvh] lg:h-[100dvh] lg:overflow-hidden flex flex-col bg-background`

### 14. Mobile Typography / Styles
- **Classification:** Inline via Tailwind responsive classes — no dedicated mobile typography file
- Exception: `src/index.css` lines 360–363 contain `@media (max-width: 1023px) { .screen-only { background-image: none !important; } }` (026U)

### 15. Mobile Spacing Styles
- **Classification:** Inline Tailwind — `space-y-1` for categories (shared), `gap-1.5` for sidebar sections (shared grid column)

### Shared Risks Summary

| Component | Shared? | Risk | Safest Isolation |
|-----------|---------|------|-----------------|
| Header | YES | HIGH | Breakpoint-qualify each change with `sm:` / `lg:` |
| Sidebar column order | YES (grid) | MEDIUM | `order-last lg:order-first` swap leaves desktop grid unaffected |
| Categories div `space-y-*` | YES | MEDIUM | Add a mobile wrapper with `space-y-2 lg:space-y-0` to avoid touching shared div |
| UnitToggle component | YES (state only) | NONE | Already rendered in two separate gated divs |

---

## B. IMAGE-BASED COMPARISON

### Current Screenshots vs Target Reference

**What should remain:**
- Colorful category wedge shapes — these are a defining visual identity of TrailWeigh; the target's wedge-arrow style validates them
- Dark mode is functional and looks clean in the current screenshots
- Category color variety and icon differentiation — vibrant and clear in Current-2
- The two-row toolbar solving overflow (026W pass) — keep the structure
- Vertical Weight/Qty/Total/Move stacked item rows — this is the right mobile pattern; target confirms stacked detail rows
- Header branding with logo icon + "TrailWeigh" / "GEAR TRACKER" — correct; target has similar branding priority

**What should change (current → target comparison):**

| Current Problem | Current Evidence | Target Direction |
|----------------|-----------------|-----------------|
| Header too tall — actions row shows 5 icon-only mini buttons, takes ~92px total | Current-1: top 20% of screen is header before any content | Target header is slim, single-line, branding + controls only |
| Sidebar panels (Pack Summary, Weight Distribution, Scan, Locker) appear BEFORE categories on mobile | Current-1: you see the full sidebar before scrolling to gear categories | Target: categories appear immediately below the header; summary is secondary |
| Category wedge too narrow (`w-16` = 64px) and card too short (`min-h: 56px`) | Current-2: wedges look narrow, cards compressed | Target: wedges are ~80-100px wide, cards taller with generous padding, icons visibly larger |
| Category-to-category spacing too tight (`space-y-1` = 4px) | Current-2: cards visually merge | Target: cards clearly separated with ~8-12px gap, each card is a distinct visual unit |
| Item count text extremely small (`text-[11px]`) | Current-2: "2/4 selected" hard to read | Target: item count is readable secondary text below category name |
| Expanded item form still feels like a condensed desktop form | Current-3: vertical rows are there but feel dense | Target: expanded item has a clear card feel, generous internal spacing |
| Lower toolbar buried after 4 sidebar panels | Current-1: toolbar at bottom of long sidebar below Locker | No exact target equivalent, but usability: controls should be discoverable without scrolling |

**TrailWeigh-Specific Adaptations Required:**
- **Do NOT copy:** bottom navigation tabs, trip date range header, "+" floating action button, trip summary dashboard card, search icon — none of these exist in TrailWeigh
- **Adapt wedge proportions** to match target's visual weight without copying its exact arrow style; TrailWeigh's clip-path polygon is correct, just needs to be wider
- **Adapt item count** from current small muted style to be readable (target shows `3 items · 4 packed` at ~13-14px weight)
- **Keep sidebar panels** (Pack Summary, Weight Distribution, Scan, Locker) but move them BELOW categories on mobile so users see their gear first

---

## C. CURRENT MEASUREMENTS (SOURCE VALUES)

Auth wall prevents runtime measurement. All values are SOURCE-DERIVED from Tailwind classes and explicit CSS.

| Element | Value | Source |
|---------|-------|--------|
| Header outer py | `py-2` = 8px top + 8px bottom | `Checklist.tsx:2097` |
| Header inner gap between rows | `gap-y-1.5` = 6px | `Checklist.tsx:2099` |
| Logo icon container | `p-2 rounded-lg` = 8px pad + `w-6 h-6` = 24px icon → 40px total | `:2105` |
| Logo text h1 | `font-bold text-xl leading-tight` → 20px/24px | `:2109` |
| Logo subtitle | `text-[10px]` = 10px | `:2110` |
| Logo row estimated height | max(40px icon, ~34px text block) ≈ 40px | derived |
| Actions row button height | `py-1.5` = 6px + `text-xs` = 12px + 2×6px = **~30px** | `:2037-2038` |
| **Header total estimated** | 8 + 40 + 6 + 30 + 8 = **~92px** | derived |
| Filename pill block | `pt-4` (16px) + pill `py-1.5`+`text-xs` (~24px) + `pb-2` (8px) = **~48px** | `:2382` |
| Lower toolbar `pt-1` | 4px | `:2955` |
| Toolbar row 1 button height | `py-1.5` + icon `h-4 w-4` → **~32–34px** | `:2968` |
| Toolbar row gap | `gap-1` = 4px | `:2955` |
| Toolbar row 2 (UnitToggle) height | `py-1.5 px-3` → **~28–30px** | `:63–66` |
| **Toolbar total estimated** | 4 + 34 + 4 + 30 = **~72px** | derived |
| Gap before first category (mobile) | Sidebar renders first due to `order-first`; category list follows after sidebar panels | `:2889` |
| Category-to-category gap | `space-y-1` = **4px** | `:2791` |
| Wedge width | `w-16` = **64px** | `MobileWedgeCategory.tsx:350` |
| Wedge point depth | clip-path: **14px** | `:353` |
| Wedge / card min-height | `minHeight: 56` = **56px** | `:339` |
| Icon size | `w-5 h-5` = **20px × 20px** | `:357` |
| Category title font | `text-sm font-semibold leading-tight` = **14px / 600** | `:74` |
| Item count font | `text-[11px]` = **11px** | `:382` |
| Category weight font | `text-sm font-mono font-bold` = **14px / 700 mono** | `:393` |
| Category weight secondary | `text-[10px]` = **10px** | `:397` |
| Expanded item outer padding | `px-3 py-2.5` = **12px / 10px** | `:146` |
| Detail row label column | `w-14 text-[10px] uppercase tracking-wide` = **56px label, 10px text** | `:142` |
| Detail row internal spacing | `space-y-1.5` = **6px** | `:202` |
| Weight input | `w-20 px-2 py-1 text-xs` = **80px wide, ~28px tall** | `:213` |
| Rename Pencil button padding | `p-0.5` = **2px** → ~16px touch target | `:90` |
| Delete button padding | `p-2.5` = **10px** → ~44px touch target ✓ | `:436` |

---

## D. PRIORITIZED VISUAL PROBLEMS

### P1 — Strong Visual Problems

**P1-A: Sidebar panels appear before categories on mobile — largest usability issue**
- **Location:** `Checklist.tsx` line 2888–2890, grid content area `div.order-first`
- **Symptom:** Users see Pack Summary + Weight Distribution + Scan Gear + Locker (~300-400px of content) before reaching their first gear category. The gear list is TrailWeigh's primary function and should be the first thing visible.
- **Component/file:** `Checklist.tsx` — shared grid layout, sidebar column has `order-first`
- **Cause:** `order-first lg:order-last` on the sidebar column: correct for desktop (right column last in DOM but `lg:order-last` doesn't apply — wait, it IS `order-first lg:order-last`). On mobile single column, `order-first` makes sidebar appear before categories.
- **Recommended fix:** Change sidebar column class from `order-first lg:order-last` to `order-last lg:order-last` (or just `lg:order-last`) — this lets categories appear first on mobile while desktop grid layout is unaffected (CSS grid ignores order for multi-column layouts where column placement is explicit).
- **Desktop risk:** LOW — desktop uses `lg:grid-cols-[1fr_365px]`, grid placement takes precedence over order in explicit 2-column grid. The sidebar column is the second grid item; without `order-first` it naturally renders in column 2.

**P1-B: Header actions row shows 5 dense icon-only controls at portrait — looks like a desktop toolbar shrunk**
- **Location:** `Checklist.tsx` lines 2160–2371 (actions row)
- **Symptom:** + · ↩ · ↪ · 🔒▾ · ↺ appear as a row of tiny icons with no labels (labels are `hidden md:inline`). At <640px portrait, this looks like an unreadable toolstrip. The most impactful controls (Save/Locker, New) are indistinguishable from utility controls (Undo, Redo).
- **Component/file:** `Checklist.tsx` — SHARED header
- **Cause:** All 5 controls share the same `toolBtn` styling with `hidden md:inline` label hiding. No mobile-specific grouping or priority.
- **Recommended fix (mobile-only):** On portrait (<sm), hide Undo and Redo (`sm:flex hidden` on those two buttons), leaving only New, Save, and Reset visible. Undo/Redo still accessible via Ctrl+Z/Ctrl+Y on keyboard; users rarely tap them on mobile touch.
- **Desktop risk:** MEDIUM — use `hidden sm:flex` class change (mobile hidden, sm+ visible). Must test that sm+ (640px+) still shows all 5.

**P1-C: Category wedge too narrow, card too short, icon too small**
- **Location:** `MobileWedgeCategory.tsx` lines 337–410
- **Symptom:** Category cards look compressed. The wedge (`w-16` = 64px) lacks visual weight relative to the card body. The icon (`w-5 h-5` = 20px) reads as too small within the 64px wedge. `minHeight: 56px` makes cards feel cramped — a user's thumb barely fits.
- **Cause:** Initial conservative sizing
- **Recommended fix:** Increase wedge to `w-[72px]` or `w-20` (80px), card `minHeight` to 68–72px, icon to `w-6 h-6` (24px). Widen clip-path point depth from 14px to 16px to maintain proportional slant.
- **Desktop risk:** NONE

**P1-D: Category-to-category gap too tight (4px) — cards merge visually**
- **Location:** `Checklist.tsx` line 2791 `space-y-1`
- **Symptom:** In Current-2, category cards run together with insufficient visual separation. Target shows ~8-12px separation.
- **Cause:** `space-y-1` is shared for both `<div class="lg:hidden">` (MobileWedgeCategory) and `<div class="hidden lg:block">` (GearCategory) wrappers inside the same `space-y-1` parent. Changing `space-y-1` to `space-y-2` would affect desktop GearCategory spacing too.
- **Recommended fix:** Add a Tailwind responsive override: keep `space-y-1` on the parent but add `mb-1` override in each mobile-specific wrapper, OR change to `space-y-2` if desktop can also benefit from 8px gap (current desktop gap of 4px is also tight; this may be a safe cross-device improvement).
- **Desktop risk:** LOW-MEDIUM if using shared class; NONE if only the lg:hidden wrapper is padded

### P2 — Polish / Refinement

**P2-A: Item count text too small (`text-[11px]`)**
- **Location:** `MobileWedgeCategory.tsx` line 382
- **Symptom:** "2/4 selected" is nearly illegible at arm's length; hard to read in screenshots
- **Recommended fix:** `text-xs` (12px)
- **Desktop risk:** NONE

**P2-B: Rename Pencil button touch target too small (`p-0.5` = 2px padding → ~16px total tap)**
- **Location:** `MobileWedgeCategory.tsx` line 90
- **Symptom:** The rename pencil button is very hard to tap precisely; minimum recommended tap target is 44×44px
- **Recommended fix:** `p-1.5` padding (4px padding × 2 + 12px icon = ~20px; still below 44px, but acceptably combined with the category-name area as a double-tap fallback)
- **Desktop risk:** NONE

**P2-C: `+ Base` pill too small (`text-[10px] px-2 py-0.5`) — hard to tap and visually underweight**
- **Location:** `MobileWedgeCategory.tsx` lines 457–472
- **Recommended fix:** `text-xs px-2.5 py-1` for better tap target and legibility
- **Desktop risk:** NONE

**P2-D: Detail row labels too small (`text-[10px]`) — hard to read**
- **Location:** `MobileWedgeCategory.tsx` line 142 (`labelCls`)
- **Recommended fix:** `text-[11px]` or `text-xs`
- **Desktop risk:** NONE

**P2-E: Lower toolbar position requires scrolling to reach — Open/Close is not immediately visible**
- **Location:** `Checklist.tsx` lines 2955–3082 (inside sidebar column, after all 4 sidebar panels)
- **Symptom:** Once P1-A is fixed (categories-first), toolbar will be below categories at the bottom — still requiring scrolling past all categories. This is acceptable but noted.
- **Recommended fix:** If category-first layout is adopted (P1-A fix), the toolbar naturally moves to after the categories, which is better than after the sidebar. No additional fix needed.
- **Desktop risk:** NONE

**P2-F: Actions row `justify-center` on portrait creates awkward floating icon cluster**
- **Location:** `Checklist.tsx` line 2160
- **Symptom:** 5 icon-only controls float in the center of the row with no left/right anchor. If Undo/Redo are hidden (P1-B fix), the remaining 3 controls should align right (`justify-end`) to match sm+ behavior.
- **Recommended fix:** Change `justify-center` to `justify-end` after P1-B reduces the control set
- **Desktop risk:** LOW (class applies only at portrait, sm+ already uses `justify-end`)

---

## E. CATEGORY OPEN/CLOSE INTERACTION

### Current trigger
**File:** `MobileWedgeCategory.tsx` lines 363–407

The toggle trigger is the **center flex div** (`role="button" tabIndex={0} onClick={handleToggle}`), which spans:
- Category name
- Rename pencil button (calls `e.stopPropagation()`)
- Item count text
- Weight summary
- Chevron

The **wedge icon div** (lines 349–358) is `aria-hidden="true"` and has **no `onClick` handler** — tapping the colored icon/wedge does NOT currently open/close the accordion. Only tapping the center text area does.

### Safe wedge/icon-primary strategy

The safest implementation that matches the standing user preference:

1. **Remove `aria-hidden="true"` from the wedge div** — it is visually meaningful and should be keyboard-reachable
2. **Add click and keyboard handler to the wedge div:**
   ```
   onClick={handleToggle}
   role="button"
   tabIndex={0}
   aria-label={`${name} category — tap to ${isOpen ? 'close' : 'open'}`}
   onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleToggle(); } }}
   ```
3. **Keep the existing center div trigger intact** — it remains a secondary trigger. Users who tap the category name or chevron still toggle the accordion. There is no conflict.
4. **Rename button propagation** remains correct — `e.stopPropagation()` on the Pencil already prevents the center div toggle from firing on rename tap.

### Accessibility
- Keyboard users can Tab to the wedge icon (new `tabIndex={0}`) or to the center div (existing `tabIndex={0}`) and press Enter/Space to toggle
- Screen readers will announce the wedge as `"[Name] category — tap to open"` via `aria-label`
- The center div retains its `aria-expanded={isOpen}` and full `aria-label`
- No nested interactive element conflict — the wedge div is a sibling of the center div, not inside it

---

## F. COORDINATED MOBILE REFINEMENT PLAN

### A. Header

**What stays:** Logo (Tent icon + "TrailWeigh" / "GEAR TRACKER"), portrait two-row structure, Account/Sign-in on right of logo row

**What changes:**
- **Portrait (<sm) actions row:** Hide Undo and Redo at portrait (`hidden sm:flex` on those two buttons). Remaining portrait controls: New (Plus) · Save (🔒▾) · Reset (↺) — 3 controls is readable and intentional.
- **Actions row alignment on portrait:** Change from `justify-center` to `justify-end` (mirrors sm+ behavior, anchors controls to the right)

**Target hierarchy:**
- Logo row: logo left · account right (unchanged)
- Actions row (portrait): [+New] [🔒Save] [↺Reset] — aligned right, compact

### B. Toolbar

**Grouping (keep Row 1 / Row 2 structure — already solving overflow):**
- Row 1: `justify-between` ← already correct: [∨∧ Open/Close] · · · [Hide] [Checklist] [☀🌙]
- Row 2: Imperial/Metric centered — unchanged

**Visual cleanup:**
- Ensure Row 1 left group and right group have consistent control heights (`h-8` baseline, `py-1.5` for text buttons, `py-1.5` for icon buttons)
- Hide and Checklist text buttons: slightly widen `px-3.5` if space allows
- The two-row structure looks intentional when the controls are balanced and have equivalent visual weight; the current `bg-muted rounded-lg` treatment on all groups is correct and should stay

### C. Category Header

**Target wedge proportions:**
- Width: `w-20` (80px) — from 64px; gives the colored wedge real visual mass
- Min-height: `min-h-[68px]` (from 56px) — comfortable thumb target, matches target reference scale
- Point depth: `18px` in clip-path (from 14px) — maintains the slant proportion at wider width

**Icon scale:**
- `w-6 h-6` (24px) — from 20px; fills the wider wedge better

**Category title:**
- Keep `text-sm font-semibold` — scale is appropriate; main change is the card height gives it more breathing room

**Summary (item count):**
- `text-xs` (12px) — from `text-[11px]`

**Weight + chevron placement:**
- Unchanged — right-aligned weight + chevron already correct

**Action placement:**
- Delete button: keep `p-2.5` (44px-ish target) — already adequate
- Rename pencil: increase padding to `p-1.5` (from `p-0.5`)

### D. Expanded Item

**Target card structure:**
1. Item name input (full width, `text-sm font-medium`) — unchanged
2. Sub-type input below (full width, `text-xs text-muted-foreground`) — unchanged
3. Delete X — top right (unchanged)
4. Detail rows (`space-y-2` from `space-y-1.5`): Weight · Qty · Total · Move

**Label/value alignment:**
- Label column: `w-16` (from `w-14`) — gives labels more room; `text-[11px]` (from `text-[10px]`)
- Value: unchanged (inputs, selects, mono text)

**`+ Base` pill:**
- `text-xs px-2.5 py-1` (from `text-[10px] px-2 py-0.5`) — more tappable, more legible

**Spacing:**
- Outer padding: `px-3 py-3` (from `px-3 py-2.5`) — 2px extra vertical breathing room

### E. Category Tap Target

**Change:** Add `onClick={handleToggle}` + `role="button"` + `tabIndex={0}` + keyboard handler to the wedge icon div (currently `aria-hidden`, no click). See section E above for exact implementation.

**Rename stays separate:** Pencil button inside `EditableMobileCategoryName` already stops propagation correctly.

### F. Light/Dark

- Preserve clean neutral surfaces (`bg-background`, `screen-dark` CSS class)
- No changes to light/dark system
- Category color system unchanged

### G. Typography

No global type changes needed beyond:
- Item count: `text-xs` (from `text-[11px]`)
- Detail row labels: `text-[11px]` (from `text-[10px]`)
- `+ Base` pill: `text-xs` (from `text-[10px]`)

Header, category title, weight display, and item name sizing are all appropriate.

---

## G. RESPONSIVE SAFETY

### 320px viewport
- Row 1 (after P1-B: 3 controls): [+New][🔒][↺] aligned right ≈ 3 × ~36px = ~108px; fits
- Wedge at `w-20` (80px) + min 240px body content → total 320px — tight but workable; category body `flex-1 min-w-0` handles compression
- Category-to-category with `space-y-2`: safe, no horizontal concern
- Weight value may truncate on very long values — `tabular-nums` already applied

### 375px viewport
- All changes comfortable at 375px
- Row 1 with 3 portrait controls fits easily
- Wedge at 80px leaves 295px for name + weight + chevron + delete — adequate

### 390px viewport (target measurement size)
- Full row 1 toolbar: [Open/Close ~72px] + [Hide ~52px] + [Checklist ~64px] + [☀🌙 ~66px] = ~254px + `gap-2` × 3 = ~260px < 390px — fits
- Wedge at 80px + rest = fine

### 430px viewport
- All changes comfortable
- Extra whitespace around controls; no layout risk

### Desktop isolation
- **MobileWedgeCategory.tsx changes:** FULLY ISOLATED via `lg:hidden` wrapper in Checklist.tsx
- **Header changes (P1-B):** Must use `hidden sm:flex` on Undo/Redo (not `hidden lg:flex`) — hides only at portrait <640px, restores at sm+. Confirmed safe for ≥640px desktop and tablet.
- **Sidebar order change (P1-A):** Removing `order-first` from the sidebar column. CSS grid with explicit `lg:grid-cols-[1fr_365px]` assigns the sidebar column by grid position (second DOM child → second column), not by CSS order. Desktop rendering is unaffected.
- **`space-y-1` change:** If changed to `space-y-2` on the parent categories div, both `hidden lg:block` (GearCategory) and `lg:hidden` (MobileWedgeCategory) wrappers get 8px gap. Desktop GearCategory currently has 4px; 8px is not harmful. Low risk. Alternatively, apply gap only via the `lg:hidden` wrapper's own `mb-1` or `mb-2`.

---

## H. IMPLEMENTATION RECOMMENDATION

### **Option B — Two prompts. Recommended.**

**Rationale:** Header/sidebar changes (Prompt 1) touch the large shared `Checklist.tsx` file and carry the highest desktop leakage risk. Category/expanded-item polish (Prompt 2) touches only `MobileWedgeCategory.tsx` — mobile-only, zero desktop risk. Splitting them means each prompt can be verified independently. If Prompt 1 causes any desktop regression, it is caught before Prompt 2 begins.

---

### Prompt 1 — Sidebar Order + Header Mobile Simplification + Toolbar Cleanup

**Expected files:**
- `artifacts/pack-checklist/src/pages/Checklist.tsx` (only)

**Changes:**
1. Sidebar column: remove `order-first` (or change to `order-last`) — categories appear first on mobile
2. Header actions row portrait: add `hidden sm:flex` to Undo and Redo buttons — hide on portrait only
3. Header actions row: change `justify-center` to `justify-end` on portrait

**Desktop leakage risk:** MEDIUM — changes are responsive-class-gated; must be verified that sm+ (≥640px) shows all 5 controls and sidebar appears correctly in right column. The sidebar order change is the most important to verify.

**New components:** None

---

### Prompt 2 — Category Wedge Polish + Expanded Item + Tap Target

**Expected files:**
- `artifacts/pack-checklist/src/components/MobileWedgeCategory.tsx` (primary)
- `artifacts/pack-checklist/src/pages/Checklist.tsx` (minor — `space-y-1` → `space-y-2`)

**Changes:**
1. Wedge width `w-16` → `w-20`; clip-path point depth `14px` → `18px`; `minHeight: 56` → `68`
2. Icon `w-5 h-5` → `w-6 h-6`
3. Item count `text-[11px]` → `text-xs`
4. Rename pencil `p-0.5` → `p-1.5`
5. `+ Base` pill: `text-xs px-2.5 py-1` from `text-[10px] px-2 py-0.5`
6. Detail label: `text-[11px]` from `text-[10px]`, `w-16` from `w-14`
7. Detail row spacing: `space-y-2` from `space-y-1.5`
8. Expanded outer padding: `py-3` from `py-2.5`
9. Wedge div: add click/keyboard toggle handler + remove `aria-hidden`, add `role="button"` + appropriate `aria-label`
10. Category spacing: `space-y-1` → `space-y-2` (or mobile-scoped equivalent)

**Desktop leakage risk:** NEAR-ZERO — `MobileWedgeCategory.tsx` is wrapped in `lg:hidden`; the `space-y` change is the only shared-file touch

**New components:** None

---

## I. MATERIAL UNCERTAINTY

**YES — one item:**

**Sidebar `order-first` was added deliberately in a prior session.** The comment at `Checklist.tsx:2889` reads `order-first lg:order-last` — this appears intentional for the desktop two-column layout. Removing `order-first` changes mobile visual order (categories above sidebar) but I have not been able to confirm whether the original intent was specifically to show Pack Summary above the categories on mobile for a product reason, or whether it was a grid-ordering artifact. **Before Prompt 1 is written, confirm that showing gear categories BEFORE Pack Summary/WeightDistribution on mobile is the desired product behavior.** If yes (categories first), removing `order-first` is the correct fix. If Pack Summary should remain above categories on mobile, a different approach is needed (e.g. duplicating a summary-only element, or accepting the current scroll order).

---

## Preflight Git Status

```
HEAD: b7d169a — Update checklist page and add mobile toolbar design asset
Untracked: attached_assets/026Y-*
No application-file changes before or after this diagnostic.
```

**Zero application files were created, modified, or deleted during this diagnostic.**
