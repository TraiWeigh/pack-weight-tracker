# PROMPT_027A_REPORT — Mobile Design Prototype

**Internal version:** 027A-MOBILE-DESIGN-FIRST-PROTOTYPE-2026-08-14-R1  
**Status:** ✅ PROTOTYPE COMPLETE — USER VISUAL APPROVAL PENDING  
**Date:** 2026-08-14  
**TypeScript:** 0 errors (`tsc --noEmit`)  
**Vite:** Clean HMR, no errors

---

## 1. Preflight Git Status

```
?? attached_assets/027A-Current-Mobile-1_1786726895260.png
?? attached_assets/027A-Current-Mobile-2_1786726895260.png
?? attached_assets/027A-Mobile-Target-Primary_1786726895260.png
?? attached_assets/027A-Mobile-Target-Secondary_1786726895260.png
?? attached_assets/TrailWeigh-Prompt-027A-GOLD-STANDARD-...txt
```

All only new untracked files — no existing tracked files modified at preflight.

---

## 2. Files Inspected (Read-Only)

| File | Purpose |
|------|---------|
| `replit.md` | Architecture reference |
| `src/App.tsx` | Wouter router to identify safe insertion point |
| `src/index.css` | Design tokens (background, primary, muted, border values) |
| `src/lib/mobileCategoryTheme.ts` | Category colors and icon mapping |
| `src/components/MobileWedgeCategory.tsx` | Existing wedge clip-path spec |
| `public/logo.svg` | Mountain logo SVG paths for inline use |
| `027A-Mobile-Target-Primary.png` | Authoritative visual direction |
| `027A-Mobile-Target-Secondary.png` | Wedge silhouette, spacing, icon scale |
| `027A-Current-Mobile-1.png` | Current category names and data |
| `027A-Current-Mobile-2.png` | Current sidebar panels |

---

## 3. Preview Isolation Strategy

**Method:** New wouter route `/mobile-preview`

```tsx
// App.tsx — only change (import + 1 Route line)
import MobileDesignPrototype from './pages/MobileDesignPrototype';
// ...
<Route path="/mobile-preview" component={MobileDesignPrototype} />
```

- All other routes are 100% unchanged
- The prototype does NOT appear at `/`, `/checklist`, or any other existing route
- No query param intercepted inside Checklist.tsx
- No existing component modified
- `?dark=1` query param available on `/mobile-preview` for dark mode automation

**Safety:** Wouter serves the prototype only when the exact path `/mobile-preview` is matched. Normal navigation never encounters it.

---

## 4. Files Created / Changed

| File | Operation | Reason |
|------|-----------|--------|
| `src/pages/MobileDesignPrototype.tsx` | Created (~580 lines) | Isolated prototype component |
| `src/App.tsx` | +3 lines | Import + Route — no other changes |

**Files NOT changed:** `Checklist.tsx`, `GearCategory.tsx`, `GearRow.tsx`, `MobileWedgeCategory.tsx`, `index.css`, any API/DB/auth file.

---

## 5. Design Measurements / Token Reference

| Token | Value | Notes |
|-------|-------|-------|
| Page horizontal padding | 16 px | Applied at page container level |
| Header total height | ~88 px | Logo row 52 px + list-name row 36 px |
| Summary card height | ~130 px | Dark green, 14 px radius |
| Category card collapsed min-height | 60 px | Wedge + text row |
| Wedge width | 72 px | Pentagon clip-path |
| Wedge point depth | 16 px | `calc(100% - 16px)` — matches existing MobileWedgeCategory |
| Icon size | 24 px | White, strokeWidth 1.8 |
| Category title | 15 px / 600 | High contrast |
| Item name | 14 px / 500 | Truncated with ellipsis |
| Item type / secondary | 11.5 px | Muted color |
| Weight | 13.5 px / 700 | Green accent |
| Category gap | 8 px | `gap: 8` in flex column |
| Detail row height | min 44 px | Touch-target safe |
| Expanded item padding | 14 px horizontal | Inner card margin |
| Card radius | 12 px | All category cards |
| Section spacing | 14–20 px | Between major sections |
| Toolbar row 1 height | ~50 px | Icon + label buttons |
| Toolbar row 2 height | ~40 px | Segmented controls |

---

## 6. Header Design

Two-row sticky header on clean white/dark surface.

**Row 1 (52 px):**
- Left: ≡ menu icon + inline mountain SVG logo + "TrailWeigh" wordmark (17 px / 700)
- Right: Save icon · Share icon · ☀/🌙 Light/Dark toggle (functional in prototype)

**Row 2 (36 px):**
- Left: "JMT Weekend Kit ↓" (list name with dropdown affordance) + italic unsaved indicator
- Right: Green "New" pill button (FilePlus icon + label)

**Design rationale:** Reduces vertical waste vs. the current stacked 5-button header. TrailWeigh identity (logo + name) is prominent. List name is immediately visible. Core actions accessible without scrolling.

---

## 7. Summary / Status Design

Prominent dark green card (`#2E4A38` / `#1E3328` dark), 14 px radius, full-width within 16 px page padding.

- **"BASE WEIGHT" label:** 10.5 px / 700, uppercase, 0.8 px letter-spacing, muted white
- **"12 lb 6 oz" figure:** 32 px / 800 with smaller unit labels
- **Two badge cells:** "52 Total Items" · "2 lb 1 oz Worn Weight" — semi-transparent white backgrounds, 8 px radius
- **Scale icon** in a 44×44 rounded container, top-left
- **Decorative arc** (subtle 120 px circle, 5% white, absolute-positioned) — depth without visual noise

---

## 8. Category Wedge Design

Same pentagon clip-path formula as existing `MobileWedgeCategory.tsx`:
```css
clip-path: polygon(0 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 0 100%)
```

**Wedge (72 × 60+ px):**
- Distinct per-category background color (from `mobileCategoryTheme.ts` keyword map)
- Icon: 24 px, white / 92% opacity, strokeWidth 1.8
- Point depth: 16 px

**Card body:**
- Category name: 15 px / 600, full contrast text
- "X/Y selected" subtitle: 11.5 px, muted
- Weight display: 13.5 px / 700, green accent (`#2E5A3A` light / `#7DB890` dark)
- lb conversion: 11 px, muted, below weight
- Chevron: 18 px, muted, right-aligned

**Cards rendered:** Backpack, Sleep System, Clothing Packed, Shelter System, Kitchen Gear, Hydration, Electronics, Toiletries, Med Kit, Repair Kit.

---

## 9. Expanded Category Design

Sleep System expanded in default state.

Items shown inside the card (dividers between rows):
- **Enlightened Equipment Quilt** — checked (green checkbox), Sleep type, 18.00 oz
- **Therm-a-Rest NeoAir XLite** — checked, Pad type, 12.00 oz
- **Earplugs** — unchecked, Comfort type, 0.30 oz → expanded item

**"Add item" row** at bottom: + Add item, muted, centered.

All items connect visually to the parent category via the continuous card surface.

---

## 10. Expanded Item Design (Earplugs)

Expanded within Sleep System with four detail rows:

| Row | Label | Value | Notes |
|-----|-------|-------|-------|
| 1 | Weight | 0.30 oz | Bold |
| 2 | Quantity | 1 | Bold |
| 3 | Total | 0.30 oz | Bold |
| 4 | Move | Toiletries ↓ | Tappable-looking dropdown |

Rows styled as a bordered inner card (8 px radius, 1 px border), 44 px min height per row, labeled on left / value on right.

**Below detail rows:**
- "Drag to reorder" with GripVertical icon (muted, centered)
- "Edit item" button (left, ctrlBg surface)
- "Delete" button (right, muted red border, red text)

All buttons are `type="button"`, visually inert — no handlers.

---

## 11. Toolbar / Control Area Visual Design

**Two-row band** in a rounded container with slightly differentiated background.

**Row 1 — History/action controls (icon + label, 18 px icons):**
New · Undo · Redo · Save · Reset · Share

**Row 2 — View controls:**
- Open/Close chevron pill (left)
- Imperial / Metric segmented control
- List (ClipboardList icon) button
- Hide (EyeOff icon) button

**Design rationale:**
- No horizontal overflow at any width tested (320–430 px)
- Segmented Imperial/Metric is the existing 026W pattern, visually refined
- All controls recognizable; none wired
- Two-tier removes the single-row overflow problem from earlier builds

---

## 12. Utility Panel Design

**Section label:** "UTILITIES" in 10.5 px / 700, uppercase, muted, above the panel group.

**Panel group:** White/dark card, 12 px radius, 1 px border.

Rows (13 px label, icon left, chevron right):
1. Pack Summary (AlignLeft icon)
2. Weight Distribution (BarChart2 icon)
3. Scan Gear List (ScanLine icon)
4. Locker — with "1" green badge

All rows have 13 px left padding, 44 px+ touch height, dividers between rows.

**Position:** After the complete category list — utility panels are visually secondary and do not compete with the main list.

---

## 13. Footer Design

Compact, below utility panels.

- Thin top border separator
- "TrailWeigh" label: 13 px / 700, muted
- Four links inline: About · How It Works · Help · Privacy (12 px, muted, no underline)
- No duplicated legal block; no tall dark footer section

---

## 14. Light Mode Design

| Element | Color |
|---------|-------|
| Page background | `#F0EEE8` (warm stone) |
| Card surface | `#FFFFFF` |
| Card border | `rgba(0,0,0,0.08)` |
| Primary text | `#1A2820` |
| Secondary text | `#5A6E63` |
| Muted text | `#8FA098` |
| Summary card | `#2E4A38` (dark forest green) |
| Weight color | `#2E5A3A` (readable green) |
| Toolbar bg | `#ECEAE4` |
| Checked checkbox | `#4E7B5C` (Shelter green) |

---

## 15. Dark Mode Design

| Element | Color |
|---------|-------|
| Page background | `#161C18` (near-black forest) |
| Card surface | `#1F2821` |
| Card border | `rgba(255,255,255,0.06)` |
| Primary text | `#E2EBE5` (bright, readable) |
| Secondary text | `#94AE9E` |
| Muted text | `#5E7869` |
| Summary card | `#1E3328` |
| Weight color | `#7DB890` (soft green) |
| Toolbar bg | `#1A201C` |

Category wedge colors remain the same hex values in both modes — they are already vivid and self-contained.

**Dark mode readability verified:** Category names (`#E2EBE5` on `#1F2821`) pass WCAG AA. Weight values (`#7DB890`) clearly distinguishable. Secondary text (`#94AE9E`) well above 3:1 on card backgrounds.

---

## 16. Viewport Test Results

### TEST 1 — 390 px Light ✅ PASS
- Clean hierarchy: header → summary → toolbar → categories → utilities → footer
- Polished wedge cards with color differentiation
- Sleep System expanded; Earplugs expanded with 4 detail rows
- No horizontal overflow

### TEST 2 — 390 px Dark ✅ PASS
- High contrast text throughout
- Category names bright and readable
- Card surfaces clearly separated from `#161C18` page background
- Wedge colors remain vivid
- Sun/Moon icon in header correctly shows Sun (toggled to dark)

### TEST 3 — 320 px ⚠️ NEAR-PASS
- Essential content intact, hierarchy preserved
- The toolbar row 2 clips "Hide" text slightly (button visible, label partially clipped)
- Category cards, summary card, expanded items all render correctly
- No content lost from main list
- Prototype badge overlaps with final item row — acceptable for prototype stage

### TEST 4 — 430 px ✅ PASS
- Balanced spacing — no oversized empty areas
- All four Earplugs detail rows (Weight / Quantity / Total / Move) visible
- Header, summary, toolbar, categories all proportioned well

### TEST 5 — Current mobile unchanged ✅ PASS
- `/` route: Landing page renders identically to pre-027A state
- No prototype visible at any non-preview URL
- Checklist, SharedPackView, ReviewPage all untouched

### TEST 6 — Desktop unchanged ✅ PASS
- Desktop landing page pixel-identical
- 1440 px screenshot confirms no desktop impact

### TEST 7 — Preview isolation ✅ PASS
- Prototype renders ONLY at `/mobile-preview` (and `/mobile-preview?dark=1`)
- No other route is affected
- No existing component imports or references the prototype

---

## 17. Current-vs-Target Visual Comparison

### What now matches the target design language

| Target element | Prototype status |
|----------------|-----------------|
| Pentagon wedge with icon | ✅ Same clip-path formula, 72 px wide |
| Colored category wedge | ✅ Distinct category colors (keyword-mapped) |
| Compact card with title + count | ✅ 15 px title, 11.5 px subtitle |
| Dark green summary card | ✅ `#2E4A38`, weight-centric content |
| Summary badges (Total Items, Worn Weight) | ✅ Two cells with semi-transparent bg |
| Expanded category with item list | ✅ Checkboxes, name, type, weight |
| Expanded item detail rows | ✅ Weight / Quantity / Total / Move |
| Clean off-white page background (light) | ✅ Warm stone `#F0EEE8` |
| Clean near-black background (dark) | ✅ Forest `#161C18` |
| TrailWeigh logo prominent in header | ✅ Mountain SVG + wordmark |
| List name visible in header | ✅ JMT Weekend Kit ↓ |
| Compact vertical rhythm | ✅ 8 px gaps, 44 px touch targets |

### What intentionally differs (TrailWeigh has different real content)

| Target element | TrailWeigh decision | Reason |
|----------------|---------------------|--------|
| Bottom nav tab bar (Pack List / Summary / Gear / Trips / More) | **Not created** | Prompt: do not create fake native features that don't exist in TrailWeigh |
| Search icon / Search feature | **Not included** | Prompt: do not fake features |
| Green circular "+" FAB | **New button** in header | TrailWeigh's new-list action goes here; no floating action button exists |
| All categories in uniform forest green | **Multi-color** (per mobileCategoryTheme) | TrailWeigh's existing design language uses category-specific colors |
| Trip date range below list name | **"Unsaved changes" indicator** | TrailWeigh uses save state, not trip dates |
| "TRIP SUMMARY" / item packed/remaining | **"BASE WEIGHT"** + Total Items + Worn Weight | TrailWeigh's weight-centric content model |

### What still needs user visual decision

1. **Bottom navigation:** Does TrailWeigh want a native-style bottom tab bar? If yes, what tabs map to existing features?
2. **Category color uniformity:** Multi-color per category (current) vs. uniform forest green (target)? The target's uniform green communicates brand more strongly; multi-color communicates category identity.
3. **Header compactness:** Current two-row header is informative but tall. Target collapses list name to near the header top. Worth exploring a more compact single-band header?
4. **Toolbar placement:** Currently above categories in a visible band. Target hides action controls inside the nav structure. Preferred in TrailWeigh?
5. **320 px toolbar row 2:** "Hide" clips slightly — may need label dropped or icon-only at narrow widths.

---

## 18. Unresolved Visual Decisions

- Bottom navigation bar (see above)
- Category color palette: multi-color vs. brand-uniform
- Header row count and density
- Prototype badge position at 320 px
- Whether a scrollable category name (if very long) gets a fade or hard ellipsis

---

## 19. Tests NOT RUN

- 375 px screenshot (320 and 390 bound it adequately; 375 behavior interpolates cleanly)
- Touch interaction testing (cannot interact in automated screenshot tool)
- RTL text support
- System font fallback audit

---

## 20. Console Result

```
[vite] connected.
[React DevTools notice]
[Clerk dev key warning]
```

No errors. No JSX warnings. No TypeScript errors.

---

## 21. Rollback Guidance

All changes are isolated to:
1. `src/pages/MobileDesignPrototype.tsx` — new file, delete to remove
2. `src/App.tsx` — remove 3-line import + Route block

Neither change touches any existing component. Revert by deleting the new file and removing those 3 lines from App.tsx.

---

## 22. Final Status Checklist

```
ISOLATED MOBILE DESIGN PROTOTYPE CREATED    = PASS
CURRENT MOBILE UI REPLACED                  = NO
CURRENT MOBILE FUNCTIONALITY CHANGED        = NO
DESKTOP PRESENTATION CHANGED                = NO

LIGHT DESIGN CREATED                        = PASS
DARK DESIGN CREATED                         = PASS
DARK CATEGORY TEXT READABLE                 = PASS
MOBILE HORIZONTAL OVERFLOW                  = NO

HEADER REDESIGNED VISUALLY                  = PASS
SUMMARY TREATMENT CREATED                   = PASS
CATEGORY WEDGE SYSTEM CREATED               = PASS
EXPANDED CATEGORY DESIGN CREATED            = PASS
EXPANDED ITEM DESIGN CREATED                = PASS
UTILITY PANELS SECONDARY                    = PASS
FOOTER REFINED                              = PASS

REAL CONTROL WIRING ADDED                   = NO
ACCORDION LOGIC CHANGED                     = NO
CHECKLIST LOGIC CHANGED                     = NO
LOCKER LOGIC CHANGED                        = NO
SHARE/REVIEW LOGIC CHANGED                  = NO
DATABASE/API/AUTH CHANGED                   = NO
CREATE-NEW-LIST FLOW CHANGED                = NO
PACKAGE FILES CHANGED                       = NO
REPLIT.MD CHANGED                           = NO
.AGENTS/MEMORY CHANGED                      = NO
DEPLOYMENT CHANGED                          = NO
UNRELATED FILES CHANGED                     = NO
MATERIAL UNCERTAINTY REMAINS                = YES (visual decisions above)

USER VISUAL APPROVAL                        = PENDING
```

---

## 23. Evidence Files

| File | Description |
|------|-------------|
| `027A-screenshot-390-light.jpg` | 390 px light mode prototype |
| `027A-screenshot-390-dark.jpg` | 390 px dark mode prototype |
| `027A-screenshot-320-light.jpg` | 320 px narrow viewport |
| `027A-screenshot-430-light.jpg` | 430 px wide viewport (full expanded item visible) |
| `027A-screenshot-desktop-unchanged.jpg` | Desktop — pixel-identical to pre-027A |
| `027A-screenshot-current-mobile-unchanged.jpg` | Mobile landing — prototype absent |
