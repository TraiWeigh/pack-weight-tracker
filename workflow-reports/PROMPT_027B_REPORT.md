# PROMPT_027B_REPORT — Mobile Design Prototype V2

**Internal version:** 027B-MOBILE-VISUAL-PROTOTYPE-V2-2026-08-14-R1  
**Status:** ✅ PROTOTYPE COMPLETE — USER VISUAL APPROVAL PENDING  
**Date:** 2026-08-14  
**TypeScript:** 0 errors (`tsc --noEmit`)  
**Vite:** Clean HMR, no errors

---

## 1. Preflight Git Status

```
?? attached_assets/027B-Current-Mobile-1_...png
?? attached_assets/027B-Current-Mobile-2_...png
?? attached_assets/027B-Mobile-Target-Primary_...png
?? attached_assets/027B-Mobile-Target-Secondary_...png
?? attached_assets/TrailWeigh-Prompt-027B-GOLD-STANDARD-...txt
```

Only new untracked files — tracked codebase clean at start.

---

## 2. Files Inspected (Read-Only)

| File | Purpose |
|------|---------|
| `replit.md` | Architecture reference |
| `src/App.tsx` | Wouter router — safe insertion point |
| `src/lib/mobileCategoryTheme.ts` | Category color + icon mapping |
| `src/pages/MobileDesignPrototype.tsx` | 027A prototype — understood failure points |
| `public/logo.svg` | Mountain SVG paths for inline watermark |
| `027B-Mobile-Target-Primary.png` | Primary visual target |
| `027B-Mobile-Target-Secondary.png` | Secondary visual target (weight-centric view) |
| `027B-Current-Mobile-1.png` | Current mobile — what NOT to reproduce |
| `027B-Current-Mobile-2.png` | Current mobile utilities — what NOT to reproduce |

---

## 3. Files Created / Changed

| File | Operation | Lines |
|------|-----------|-------|
| `src/pages/MobileDesignPrototypeV2.tsx` | Created (new, from scratch) | ~580 |
| `src/App.tsx` | +4 lines — import + Route only | — |

**Unchanged:** `Checklist.tsx`, `GearCategory.tsx`, `GearRow.tsx`, `MobileWedgeCategory.tsx`, `MobileDesignPrototype.tsx`, `mobileCategoryTheme.ts`, `index.css`, any API/DB/auth file, `replit.md`, `.agents/memory`.

---

## 4. How 027A Visually Failed

The user's live assessment: "prototype looked essentially like the current mobile layout — only Light/Dark and category expansion were noticeably functional."

Root causes identified from inspecting the 027A code and reference screenshots:

| Problem | 027A behaviour | User expectation |
|---------|---------------|-----------------|
| Header | Two-row header with 5 stacked action buttons — identical structure to current production | Single compact row with logo + 2 icon actions |
| List name | Separate grey row below header | Integrated into the dark green summary band |
| Summary card area | Just a dark-green card below a separate header | Large identity band: list name embedded in top of card |
| Item rows | Checkbox + plain text + weight = "website table row" | Phone-native: checkbox + rounded type-icon tile + name/type/weight |
| Bottom nav | Not present | Present in both target images — transforms the composition |
| Mountain watermark | Not present | Subtle mountain silhouette behind the header/summary band |
| Control hierarchy | One flat toolbar band | Hierarchy: primary view controls + secondary file controls |
| Overall feel | Old desktop layout with wedge styling | New TrailWeigh mobile design |

---

## 5. Target vs. Current — Pre-Implementation Comparison

### Current mobile (027B-Current-Mobile-1, -2)
- Dark background (dark mode default in screenshots)
- Small hexagonal wedges (hex-shaped not pentagon)
- Very small category titles, muted green text
- Separate stacked toolbar rows at the top with tiny controls
- No list identity area — categories start immediately
- No summary card — just the category list
- No bottom navigation bar
- Utility panels are heavy dark grey blocks
- Footer is verbose
- Overall: "website adapted for small screen"

### Target primary (027B-Mobile-Target-Primary)
- Clean single header: logo + search + green FAB
- List name + date metadata with mountain watermark behind
- Strong dark green summary card: "48 items" dominant
- Category cards: tall (72+px), pentagon wedge, clean card radius 16px
- Items inside expanded category: checkbox + item name + quantity + reorder grip
- Expanded item: icon per row (Weight / Bag-Location / Packed / Move)
- Bottom nav bar: Pack List · Summary · Gear · Trips · More
- Overall: native iOS app quality

### Target secondary (027B-Mobile-Target-Secondary)
- Same header + green FAB
- "JMT Weekend Kit" list name, mountain watermark
- BASE WEIGHT: "12 lb 6 oz" dominant
- 52 Total Items + 2 lb 1 oz Worn Weight badges
- Backpack expanded with tent-icon item tiles
- Expanded Tent item: Weight / Quantity / Total / Move rows with icons
- Bottom nav: Pack List · Summary · Gear · Stats · More
- All category cards: uniform dark forest green wedge (not multi-color)

---

## 6. New Composition Strategy (027B)

Built `MobileDesignPrototypeV2.tsx` from scratch — zero code reuse from 027A.

**Structural changes vs. 027A:**

1. **Merged header + list identity + summary** into a single dark green top section — the list name is displayed inside the dark band, above the BASE WEIGHT card, not in a separate white strip
2. **Mountain SVG watermark** inside the dark band using inline SVG paths derived from `public/logo.svg`
3. **Compact single-row header** with only: hamburger | logo + wordmark | light/dark toggle | search | green FAB
4. **Item rows redesigned** to use a 30×30 rounded-square type-icon tile (translucent category color) instead of bare text — this is the most visible phone-native change
5. **Bottom navigation bar** added: sticky at viewport bottom, 5 tabs — Pack List (active/green) · Summary · Gear · Stats · More
6. **Control hierarchy** split into: primary row (Imperial/Metric segmented + Open All / Hide / List icon buttons) and secondary row (New / Undo / Redo / Save / Reset small icon+label row)
7. **Container structure** changed to `height: 100dvh; overflow: hidden` with inner `flex: 1; overflow-y: auto` — ensures bottom nav always appears at viewport bottom
8. **Card radius** increased to 16px throughout
9. **Category card height** 72px minimum (up from 60px in 027A)
10. **Wedge point depth** 18px (vs. 16px in 027A), slightly wider 72px

---

## 7. Header Design

**Single row, 56px height:**

```
☰  🏔 TrailWeigh     [☀/🌙]  [🔍]  [●+]
```

- Left: hamburger menu icon (22px, secondary color)
- Center-left: mountain logo (26px SVG) + "TrailWeigh" wordmark (19px / 700)
- Right: light/dark toggle (functional — only toggle in the prototype) + search icon + green circular "+" FAB (34px diameter)
- Background: white/dark card surface, 1px bottom border
- No action buttons, no file controls, no old "GEAR TRACKER" subtitle

**Why:** Target shows this exact pattern — brand identity is established here, utility actions are secondary.

---

## 8. Summary / List Identity Design

**Dark green band (background `#2D5A3B` light / `#1B3526` dark):**

- Top section (relative positioned):
  - Mountain watermark SVG (absolute, right-aligned, 62% width, 8% opacity — subtle)
  - "JMT Weekend Kit ↓" in 20px / 700, white text — the dropdown chevron signals editability
  - "Unsaved changes" in 12.5px, 50% white — save state indicator

- Summary card (nested, inside the green band, semi-transparent surface):
  - Scale icon in 40×40 rounded box
  - "BASE WEIGHT" label: 11px / 700, uppercase, 55% white
  - "12 lb 6 oz" dominant: 42px / 800 for numbers, 22px / 600 for unit labels
  - Two badge cells: "52 / Total Items" · "2 lb 1 oz / Worn Weight" — 12% white background

**Visual effect:** The list identity and summary merge into one hero section — the list name sits above the weight number in the same dark green band. This is the most significant compositional change from 027A.

---

## 9. Category Card Design

**Card:** white/dark surface, 16px radius, 1px border, light shadow  
**Minimum height:** 72px  
**Layout:** `[WEDGE] [name + count] [weight + chevron]`

**Wedge (72×72px):**
- Pentagon clip-path: `polygon(0 0, 54px 0, 72px 50%, 54px 100%, 0 100%)`
- Distinct category color (from `mobileCategoryTheme` keyword map)
- Icon: 28px, 92% white opacity, strokeWidth 1.6
- Cursor pointer — signals primary tap target per standing user preference

**Center (flex: 1):**
- Category name: 17px / 600, primary text, 1.2 line-height
- "X items • Y selected": 13px, muted color

**Right:**
- Weight: 15px / 700, green accent color
- lb conversion: 11.5px, muted
- Chevron: 18px, muted

**Categories rendered (8 total):**
Backpack (#3B6978 teal) | Sleep System (#5C6BC0 indigo, expanded) | Shelter System (#4E7B5C forest) | Clothing Packed (#7B5D87 purple) | Kitchen Gear (#A06030 amber) | Hydration (#1B7A8A teal-blue) | Electronics (#B8722A orange) | Toiletries (#A05898 magenta)

---

## 10. Expanded Category Design

**Sleep System** is shown expanded.

The expanded body is a continuous extension of the category card (same card boundary, slightly off-white/dark bg inside, 1px top divider).

Items inside:
- Enlightened Equipment Quilt (checked ✓) — Quilt type — 18.0 oz
- Therm-a-Rest NeoAir XLite (checked ✓) — Pad type — 12.0 oz
- Earplugs (unchecked □) — Comfort type — 0.30 oz → EXPANDED with detail rows

"+ Add item" row at the bottom.

**Separation from collapsed cards:** The expanded body uses `expandedBg` (slightly off-white/dark) vs the white card surface — creates a subtle visual containment for the expanded state.

---

## 11. Item Row Design (Phone-Native)

**Key change from 027A: each item has a rounded type-icon tile on the left**

Layout per item row (44px+ height):
```
[✓/□ checkbox 22px]  [icon tile 30×30 r8]  [name 15px/500 + type 12px muted]  [weight 13.5px + chevron]
```

**Checkbox:** 22px square, 6px radius. Checked = solid `#4E7B5C` with white ✓. Unchecked = transparent with 1.5px border.

**Icon tile:** 30×30px, 8px radius. Background = category color at 13% opacity. Border = category color at 27% opacity. Icon = category color, 14px. This gives each item a visual "type badge" matching its parent category — phone-native, scannable.

**Item name:** 15px / 500, full contrast, ellipsis overflow  
**Type label:** 12px, muted  
**Weight:** 13.5px / 600, green accent  

---

## 12. Expanded Item Design

**Earplugs** is shown expanded.

The detail block appears below the item header inside a rounded card (8px radius, 1px border, detailBg surface).

**Four detail rows, each ≥44px:**

| Icon | Label | Value |
|------|-------|-------|
| Weight icon | Weight | 0.30 oz |
| Hash icon | Quantity | 1 |
| Package icon | Total | 0.30 oz |
| MapPin icon | Move | Toiletries ↓ |

Each row: 15px icon (muted) | label 14px (secondary) | value 14px / 600 (primary)  
Rows separated by 1px dividers.

**Drag to reorder row** at bottom: GripVertical icon + "Drag to reorder" label, muted, centered.

---

## 13. Static Control Hierarchy

**Primary view controls (Row 1 of control strip):**
- Left: `[Imperial | Metric]` segmented control (13px, rounded 10px, active pill with shadow)
- Right: `[⌄ Open All]` · `[👁‍🗨 Hide]` · `[📋 List ✓]` — icon + label, "List" shown active (green tint)

**Secondary file controls (Row 2 of control strip):**
Compact row inside a `ctrlBg` pill: `[New]` · `[Undo]` · `[Redo]` · `[Save]` · `[Reset]`
Each: 15px icon + 9.5px label, muted. All five visible, no overflow.

**Visual hierarchy result:**
- User scans: view controls (immediate utility) → file controls (secondary)
- Controls do NOT dominate above the category list
- Light/dark toggle lives in the header (top-right)

---

## 14. Utility Panel Treatment

Located **after** all category cards + Add Category button.

**Section label:** "UTILITIES" in 11px / 700, uppercase, muted, 0.8px letter-spacing.

**Panel card:** white/dark surface, 14px radius, 1px border, light shadow.

**4 rows** (icon | label | optional badge | chevron):
- Pack Summary (AlignLeft)
- Weight Distribution (BarChart2)
- Scan Gear List (ScanLine)
- Locker (Lock) — "1" green badge

Each row: 14px label, 13px left padding, ≥44px touch height, 1px dividers between rows.

**Visual weight:** Significantly quieter than categories — smaller icons, muted section label, no colored wedge, no bold weights.

---

## 15. Footer Treatment

Below utility panels, above bottom nav padding.

- Thin 1px top border separator
- "TrailWeigh" in 13px / 700, secondary color
- 4 links inline: About · How It Works · Help · Privacy — 12px, muted
- Total height: ~55px including top padding

**No dark footer block, no duplicated legal text, no excessive spacing.**

---

## 16. Light Mode Result (390px)

✅ PASS

- Page: warm stone `#F2EFE9`
- Header: white, clean single row
- List identity band: dark forest green `#2D5A3B`
- Mountain watermark: subtle at 8% white opacity
- Summary card: "12 lb 6 oz" at 42px/800 — dominant and readable
- Summary badges: readable white on translucent backgrounds
- Category cards: white surface, vivid wedge colors
- Item rows: rounded icon tiles clearly visible
- Control strip: clear two-tier hierarchy
- Bottom nav: white bar, green "Pack List" active tab
- No horizontal overflow confirmed

---

## 17. Dark Mode Result (390px)

✅ PASS

- Page: near-black `#141A16`
- Header: dark card surface `#1C2520`, separated from page by 1px border
- List identity band: deep forest `#1B3526`
- "JMT Weekend Kit" and "Unsaved changes": white and 50% white — readable
- Summary: "12 lb 6 oz" bright white on dark green — strong contrast
- Category names: `#DDE8E2` (bright warm white) — clearly readable
- Category wedge colors: same vivid hex values as light mode — remain vivid
- Item icon tiles: category color at 13% opacity — visible on dark card surface
- Control strip: dark green tones with visible text `#B8D0C4`
- Bottom nav: dark card with `#7EC895` green for active tab
- No black-on-dark text issues confirmed

---

## 18. 320px Result

✅ NEAR-PASS

- No horizontal overflow
- Header: clean single row — all elements fit
- List identity band: "JMT Weekend Kit ↓" fits on one line
- Summary card: "12 lb 6 oz" readable, badges stack correctly
- Control strip Row 1: segmented control + 3 icon buttons fit
- Control strip Row 2: all 5 file controls fit
- Category cards: wedge icon and title readable
- Bottom nav: 5 tabs fit at 320px
- Minor: Backpack card is partially clipped (viewport shows just its top sliver at the bottom) — scroll needed to see categories; this is expected at this viewport height

---

## 19. 375px Result

✅ PASS

- All sections readable without overflow
- Category names not truncated at this width
- Sleep System expanded: items visible with icon tiles
- "Enlightened Equipment..." truncates gracefully with ellipsis
- Bottom nav visible

---

## 20. 390px Result (Primary test viewport)

✅ PASS

- Full composition visible: header → list band → summary → controls → categories
- Backpack card fully visible
- Sleep System expanded with 2 visible items (Earplugs below fold, visible on scroll)
- Bottom nav visible with 5 tabs
- No overflow

---

## 21. 430px Result

✅ PASS

- All category items readable without truncation
- Earplugs expanded — Weight detail row (0.30 oz) visible in viewport
- Balanced proportions, no excessive empty space
- Bottom nav visible
- Expanded item detail row icons and labels clearly visible

---

## 22. Target Comparison After Implementation

### Matching visual traits

| Target element | V2 status |
|----------------|-----------|
| Single-row header: logo + icons + green FAB | ✅ Matches exactly |
| List name with ↓ chevron | ✅ Present |
| Dark green identity/summary band | ✅ Present |
| Mountain watermark behind list name area | ✅ Inline SVG, 8% opacity |
| Dominant weight/item number in summary card | ✅ "12 lb 6 oz" at 42px/800 |
| Summary badges (2 metrics) | ✅ Total Items + Worn Weight |
| Pentagon wedge, 72px+ tall cards | ✅ Present |
| Distinct category colors per wedge | ✅ Present (multi-color) |
| Item rows with type-icon tiles | ✅ Rounded square tile, category-colored |
| Checkbox left of item row | ✅ 22px, filled green when checked |
| Item name + type label stacked | ✅ 15px/500 name + 12px muted type |
| Expanded item detail rows (Weight/Qty/Total/Move) | ✅ Present with row icons |
| "Drag to reorder" hint | ✅ GripVertical + label |
| Bottom navigation bar | ✅ Pack List · Summary · Gear · Stats · More |
| "Pack List" active with distinct color | ✅ Green active tab |
| Utility panels secondary / quieter | ✅ After categories, muted section label |
| Compact footer | ✅ ~55px total height |

### Intentional TrailWeigh-specific differences

| Target element | TrailWeigh V2 decision | Reason |
|----------------|----------------------|--------|
| All-uniform dark green category wedges (secondary) | Multi-color per `mobileCategoryTheme` | TrailWeigh's existing brand language; user decision pending |
| Trip date range (Primary target) | "Unsaved changes" indicator | TrailWeigh uses save state, not trip dates |
| "TRIP SUMMARY / 48 items" (Primary) | "BASE WEIGHT / 12 lb 6 oz" (Secondary) | Weight-centric content model is TrailWeigh-specific |
| Quantity column shown in collapsed items | Weight shown in collapsed items | Weight is TrailWeigh's primary data point |

### Remaining visual differences (user decision needed)

1. **Category color palette:** Target secondary uses uniform forest green. V2 uses multi-color. Which is preferred?
2. **List identity band height:** Target has a taller watermark area with more visual breathing room. V2 is more compact. More height wanted?
3. **Item-row quantity vs. weight:** Target (Primary) shows "1" quantity in the collapsed item row. V2 shows the weight. User preference?
4. **Bottom nav destinations:** Target has "Trips". V2 has "Stats". What labels match TrailWeigh's actual feature set?

---

## 23. Current Mobile Safety

✅ PASS — `/` route unchanged. Landing page renders identically. No `/checklist`, `/shared`, `/s/:id`, or any existing route was touched. Confirmed via screenshot.

---

## 24. Desktop Safety

✅ PASS — 1440px screenshot identical to pre-027B. The new route `/mobile-design-v2` adds only one path to the router; it has no effect on any other route.

---

## 25. Console Result

```
[vite] connected.
[React DevTools notice]
[Clerk dev key warning]
```

No errors. No JSX warnings. No TypeScript errors.

---

## 26. Unresolved Visual Decisions

1. **Category color uniformity** — multi-color (current) vs. uniform forest green (target secondary)
2. **List identity band height** — compact (V2) vs. more breathing room (target)
3. **Item collapsed row content** — weight (V2) vs. quantity (target Primary)
4. **Bottom nav tab labels** — Stats vs. something else? Trips doesn't exist in TrailWeigh.
5. **Category card editing affordance** — rename/edit icon visible on collapsed cards, or only on expanded?
6. **Summary card metrics** — current: Base Weight + Total Items + Worn Weight. Add Total Weight? Remove one?

---

## 27. Final Status Checklist

```
V2 PROTOTYPE CREATED                          = PASS
V2 VISIBLY DIFFERENT FROM CURRENT MOBILE      = PASS
V2 VISUALLY CLOSER TO TARGET                  = PASS

LIGHT DESIGN                                  = PASS
DARK DESIGN                                   = PASS
DARK TEXT CONTRAST                            = PASS
HORIZONTAL OVERFLOW                           = NO

HEADER COMPOSITION REDESIGNED                 = PASS
SUMMARY CARD REDESIGNED                       = PASS
CATEGORY CARDS REDESIGNED                     = PASS
EXPANDED CATEGORY REDESIGNED                  = PASS
EXPANDED ITEM REDESIGNED                      = PASS
CONTROL HIERARCHY REDESIGNED VISUALLY         = PASS
UTILITY PANELS SECONDARY                      = PASS
FOOTER COMPACT                                = PASS

REAL CONTROL WIRING ADDED                     = NO
CURRENT MOBILE CHANGED                        = NO
027A ROUTE CHANGED                            = NO
DESKTOP CHANGED                               = NO
CHECKLIST LOGIC CHANGED                       = NO
LOCKER LOGIC CHANGED                          = NO
SERVER/DATABASE/API/AUTH CHANGED              = NO
CREATE-NEW-LIST CHANGED                       = NO
REPLIT.MD CHANGED                             = NO
.AGENTS/MEMORY CHANGED                        = NO
DEPLOYMENT CHANGED                            = NO
UNRELATED FILES CHANGED                       = NO

USER VISUAL APPROVAL                          = PENDING
```

---

## 28. Evidence Files

| File | Description |
|------|-------------|
| `027B-screenshot-390-light.jpg` | 390px light — primary test viewport |
| `027B-screenshot-390-dark.jpg` | 390px dark mode |
| `027B-screenshot-320-light.jpg` | 320px narrow viewport |
| `027B-screenshot-375-light.jpg` | 375px viewport |
| `027B-screenshot-430-light.jpg` | 430px wide viewport |
| `027B-screenshot-current-mobile-unchanged.jpg` | Current mobile landing — prototype absent |
| `027B-screenshot-desktop-unchanged.jpg` | Desktop — pixel-identical to pre-027B |
