---
name: TrailWeigh MobileFunctionalV3 Visual-Formula Audit
description: Exact construction rules for every layout layer, visual effect, and state-dependent geometry in the final pre-app v3 web implementation. Use when building the native app to compare numerically. Extracted read-only from source — no inferences.
---

# TrailWeigh MobileFunctionalV3 — Visual-Formula Audit

*All values are literals or computed formulas from MobileFunctionalV3.tsx and mobileCategoryTheme.ts. "Runtime-measured" means computed from live DOM at mount/resize.*

---

## 1. CONSTANTS REFERENCE TABLE

| Constant | Value | Role |
|---|---|---|
| WEDGE_W | 72 px | Category/location wedge width |
| WEDGE_POINT | 17 px | Arrow-tip depth on right edge |
| CHECKLIST_ROW_H | 64 px | Minimum height of every category/location bar |
| CHECKLIST_RIGHT_INSET | 34 px | Right padding for item rows and detail panel rows |
| CATEGORY_WEIGHT_RIGHT_INSET | 44 px | Right padding for category/location bars |
| APPBAR_RIGHT_INSET | 44 px | = CATEGORY_WEIGHT_RIGHT_INSET |
| FILTER_BAR_H | 50 px | Locked filter slot height |
| BAR_PEEK_H | 68 px | Visible height of inactive stacked deck bar |
| R0101_TRAILING_SCROLL_H | 560 px | Trailing scroll space below category list |
| ADD_ITEM_ACCORDION_H | ≈132 px | 3 × 44 px (creation-method rows) |
| NAV_H | 58 px | Bottom tab bar fallback height (actual DOM-measured) |
| SWIPE_ACTION_W | 88 px | Width of each swipe-revealed action button |
| SWIPE_SLOP_PX | 8 px | Gesture disambiguation slop |
| SWIPE_EDGE_ZONE | 0.4 | Swipe must start in right 40% of row (closed state) |
| TAP_MAX_PX | 8 px | Movement below this = tap on deck stacked bar |
| LONG_PRESS_MS | 400 ms | Hold duration to enter reorder mode |
| HOLD_SLOP_PX | 10 px | Finger jitter tolerated during hold phase |
| DRAG_SLOP_PX | 8 px | Movement that locks gesture as scroll or lift |
| GROUP_SWIPE_THRESHOLD | 44 px | Horizontal drag to commit nav-group change |
| NUM_BOX_GROUPS | 4 | Bottom nav groups |
| HISTORY_LIMIT | 30 | Max undo/redo steps |

---

## 2. COLOUR TOKENS

```
PAGE_BG      #F2EDE4     Warm off-white shell/overlay background
CARD_BG      #FFFFFF     Category panels, deck bars, sheet surfaces
HEADER_BG    #FFFFFF     AppBar background
HEADER_BDR   rgba(0,0,0,0.07)   AppBar/header bottom divider
CARD_BORDER  rgba(0,0,0,0.06)   Card outlines, input borders
CARD_SHADOW  0 1px 6px rgba(0,0,0,0.10), 0 0 1px rgba(0,0,0,0.04)
PRIMARY      #1A2920     Dark forest-green body text
SECONDARY    #4A5D54     Medium green sub-labels, icons
MUTED        #667270     Grey-green meta text
DIVIDER      rgba(0,0,0,0.06)   Row separators
SUMMARY_BG   #2A5740     Dark green — Summary bar, active nav
NAV_BG       #FFFFFF     Bottom bar background
NAV_ACTIVE   #2A5740     Active/selected nav icon and label
NAV_INACTIVE #6E7672     Inactive nav icon/label
CB_CHECKED   #4E7D5C     Checkbox fill and border when checked
CB_UNCHECKED rgba(0,0,0,0.18)   Checkbox border when unchecked
DETAIL_BG    #F5F0E8     Item detail panel background
DETAIL_BDR   rgba(0,0,0,0.06)   Detail row separators
OVERLAY_BG   #F2EDE4     Full-screen overlay background
TOAST_BG     #2A5740     Toast pill background
DELETE_RED_SWIPE  #B03A2E   Swipe-reveal Delete button
DELETE_RED_DIALOG #dc2626   Locker-Delete confirm / Photo-Delete buttons
RESET_AMBER       #b45309   Reset Checks button
CAMERA_BLUE       #4f87c4   Camera icon pill in photo-edit sheets
```

Font: `'Inter Variable', 'Inter', system-ui, -apple-system, sans-serif` — both SANS and SERIF resolve to this; no serif font in V3.

---

## 3. OUTER SHELL GEOMETRY

Shell (.tw-v3-root):
```
position: fixed
top: var(--tw-safe-top)              = env(safe-area-inset-top, 0px)
left:  max(0px, calc(50% - 215px))   centred; full-width below 430 px
right: max(0px, calc(50% - 215px))
height: calc({layoutViewportHeight}px - var(--tw-safe-top))
padding-top: 52px    (AppBar reserve)
padding-bottom: {bottomLayerOffset}px   (measured nav height)
background: #F2EDE4; overflow: hidden
```

Max shell width: **430 px** (215 × 2). Below that: full-bleed.

Runtime-measured values:
- `layoutViewportHeight`: from `visualViewport.height` (Safari stable layout viewport, not shrunk visual)
- `bottomLayerOffset`: measured height of BoxGroupBar DOM element including safe-area padding
- `summaryH`: measured height of Summary + Filter bars

Global document lock:
```css
html:has(.tw-v3-root), body:has(.tw-v3-root) {
  height: 100%; overflow: hidden; overscroll-behavior: none;
}
```

Safe-area classes (applied to scroll areas and sheets):
```
.tw-sa-8  → padding-bottom: calc(8px  + env(safe-area-inset-bottom, 0px))
.tw-sa-12 → padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px))
.tw-sa-32 → padding-bottom: calc(32px + env(safe-area-inset-bottom, 0px))
.tw-sa-36 → padding-bottom: calc(36px + env(safe-area-inset-bottom, 0px))
.tw-sa-40 → padding-bottom: calc(40px + env(safe-area-inset-bottom, 0px))
.tw-cat-sheet → max-height: 70vh/70dvh + padding-bottom calc(32px + env(safe-area-inset-bottom))
```

---

## 4. APP BAR

```
position: absolute  top:0  left:0  right:0  height: 52 px
background: #FFFFFF; border-bottom: 1px solid rgba(0,0,0,0.07)
padding: 0 44px 0 8px;  z-index: 10; overflow: hidden
On Home screen: box-shadow: 0 2px 10px rgba(0,0,0,0.10)
```

- Hamburger: min-width/height 44px, Menu icon size=22, color #2A5740, strokeWidth=2
- Logo gap: 6px; LogoMark size=24; Wordmark fontSize=19, fontWeight=600
- Decorative icons: 6 icons, size=18, color #2A5740, strokeWidth=1.55, each max-width=38px

---

## 5. SUMMARY BAR

```
position: absolute  top: 52px  left:0  right:0  z-index: 9
Inner green panel: background rgba(42,87,64,0.94)
  padding: 10px 44px 12px 14px
  box-shadow: 0 4px 12px rgba(0,0,0,0.22)
```

- Luggage tile: 66×66, border-radius=14, bg rgba(0,0,0,0.20), icon size=34
- List name: fontSize=15.5, fontWeight=700, color #FFFFFF
- Item count: fontSize=40, fontWeight=800, letterSpacing=-1.5px
- Chevron: size=36, strokeWidth=1.5, marginRight=28, minWidth/Height=44
- Selected indicator: 18×18 circle, border-radius=9

---

## 6. FILTER BAR

```
position: absolute  top: 52px + summaryH  left:0  right:0
height: 50px  z-index: 8
background: #FFFFFF; border-bottom: 1px solid rgba(0,0,0,0.06)
box-shadow: 0 3px 8px rgba(0,0,0,0.08); padding: 5px 14px
```

- Button: min-height=36, padding=6px 10px, border-radius=8, fontSize=13, fontWeight=600
- SlidersHorizontal: size=15, color NAV_ACTIVE; ChevronDown: size=17, rotates when open
- Dropdown: position absolute, left/right=14px, z-index=12, border-radius=10, box-shadow: 0 8px 22px rgba(0,0,0,0.18); items min-height=44

---

## 7. MAIN-SCROLL VIEWPORT

```
flex: 1 1 0; min-height: 0
margin-top: summaryH + (showFilterSlot ? 50 : 0)
overflow-y: auto; overflow-x: hidden; overscroll-behavior: contain
-webkit-overflow-scrolling: touch; touch-action: pan-y; scrollbar-width: none
```

Trailing spacer: height=560px (R0101_TRAILING_SCROLL_H)

---

## 8. CATEGORY BAR

Wedge clip-path:
```
polygon(0 0, calc(100% - 17px) 0, 100% 50%, calc(100% - 17px) 100%, 0 100%)
```
- Wedge: width=72px, min-height=64px, padding-right=8.5px (WEDGE_POINT/2)
- Icon: size=26, color rgba(255,255,255,0.93), strokeWidth=1.5
- Shadow sibling: same clip-path, filter: drop-shadow(3px 0 10px rgba(0,0,0,0.07))

Content grid (right of wedge):
```
flex:1; width:100%; display:grid
grid-template-columns: minmax(0,1fr) minmax(44px,auto)
padding: 8px 44px 8px 12px; column-gap: 10px
```
- Category name: fontSize=17, fontWeight=500, letterSpacing=-0.1px
- Subtitle: fontSize=12.5, color #667270
- Weight: fontSize=13, fontWeight=600, letterSpacing=-0.2px, max-width=96px

Category wrapper shadows:
- Resting: box-shadow: 0 3px 10px rgba(0,0,0,0.18)
- Dragging: box-shadow: 0 8px 26px rgba(0,0,0,0.24), 0 2px 6px rgba(0,0,0,0.14); scale(1.015)
- Dim target: opacity=0.55
- Sticky header: box-shadow: 0 3px 8px rgba(0,0,0,0.16)

Swipe-reveal (category = dual buttons = 176px total):
- Secondary (Edit): right=88px, width=88px, bg #2A5740; Delete: right=0, width=88px, bg #B03A2E
- Transition: 0.18s ease-out; gesture: right 40% of row only (closed), past-half (88px) = stay open

---

## 9. ITEM ROWS

- Row: min-height=44px, border-bottom: 1px solid rgba(0,0,0,0.06)
- Checkbox: 44px tap target, 20×20 visual, border-radius=5, border=1.5px
  - Checked: fill+border #4E7D5C; Check icon size=11, color #fff, strokeWidth=2.5
- Item name: fontSize=14.5, fontWeight=450; Qty: fontSize=14, color #4A5D54
- Right padding: 34px (CHECKLIST_RIGHT_INSET)

Detail panel (all rows except Total):
- Padding: 0 34px 0 14px; min-height=44; gap=10
- Icons: size=14, strokeWidth=1.8, color #667270
- Background: #F5F0E8 (DETAIL_BG)
- **Total row: height=42px (FIXED, not min-height) — only anomalous row**
- Delete Item row: uses border-TOP (not bottom); color #B03A2E
- Photo row "Add Photo" button: fontSize=11.5, min-height=36 (shorter than other rows)
- Inline photo viewer: max-height=300px, object-fit=contain, background=#111

---

## 10. ADD ITEM BAR & ACCORDION

Add Item bar: min-height=44, border-top 1px, padding-right=34px
Accordion rows (3): min-height=44, padding=0 14px, icons size=14 color NAV_ACTIVE, fontSize=13.5
Long-mode chevrons: width=44, min-height=44; disabled opacity=0.35

---

## 11. BOTTOM BOX-GROUP BAR

```
position: absolute
top: calc({stableTop}px - var(--tw-safe-top, 0px))
background: #FFFFFF; backdrop-filter: blur(8px) saturate(1.15)
border-top: 1px solid rgba(0,0,0,0.07)
box-shadow: 0 -3px 10px rgba(0,0,0,0.07)
padding-bottom: var(--tw-safe-bottom, env(safe-area-inset-bottom, 0px))
z-index: 40; min-height: 58px; overflow: hidden; touch-action: none
```

Track: width=400% (4 groups); each group=25% of track; transform translateX(-groupIdx×25% + dragX)
Animation: motionDuration()=0.28s normal/0.01s reduced-motion; cubic-bezier(0.4,0,0.2,1)
Settle window: 400ms; Haptic: navigator.vibrate(10) on group settle

NavBox: flex:1; padding: 7px 0 8px; gap=2px; icon size=21; label fontSize=10
- Active: icon strokeWidth=2.1, fontWeight=700, letterSpacing=0.1px; bg rgba(42,87,64,0.10)
- Inactive: icon strokeWidth=1.6, fontWeight=400

---

## 12. CARD DECK

Deck panel:
```
position: fixed; left/right: max(0px, calc(50% - 215px)); bottom: bottomOffset
max-height: calc(100dvh - bottomOffset - 60px); z-index: 31
transform: translateY(105%) → translateY(0); transition: motionDuration() cubic-bezier
```

Backdrop: z-index=30; background rgba(20,28,24, 0→0.45); bottom=bottomOffset

- Label row: padding=0 14px 8px; fontSize=16, fontWeight=700, color #fff
- Close: 44×44 tap / 28×28 visual circle rgba(255,255,255,0.16); icon size=16
- Active card: bg #FFFFFF; box-shadow 0 4px 18px rgba(0,0,0,0.18); header min-height=68px; icon slot 32×32
- Inactive bar: min-height=68px; padding=0 14px; border-top 1px; ChevronLeft size=16 rotated 90°

---

## 13. BOTTOM SHEETS (Shared Pattern)

All sheets:
```
Backdrop: position fixed; inset 0; background rgba(0,0,0,0.45); align bottom
Sheet: width 100%; max-width 500px; bg #fff; border-radius 16px 16px 0 0
       box-shadow: 0 -4px 32px rgba(0,0,0,0.18)
```

Padding variants:
- Most photo/category sheets: padding 20/20/40/20 + .tw-sa-40
- Name dialogs (Save As, New List, Location Name): padding 24/20/40/20 + .tw-sa-40
- Confirm dialogs (Reset, Locker Delete): padding 24/20/36/20 + .tw-sa-36
- Category Direct-Edit / Location dialogs: padding 24/20/36/20 + .tw-sa-36

Action buttons in photo sheets: min-height=52, padding=13px 16px, border-radius=12
Icon pill: 36×36, border-radius=9 (blue=#4f87c4/green=NAV_ACTIVE/red=#dc2626)
Cancel: min-height=44, border-radius=10, padding=12px 0, fontSize=15

---

## 14. Z-INDEX LAYERS

```
10   AppBar
 9   Summary bar
 8   Filter bar
 7   Category sticky header
30   Deck backdrop
31   Deck panel
40   BoxGroupBar (bottom nav)
50   Full-screen overlays (Preview/Checklist/Summary/Scanner)
200  Save Chooser, Reset Confirm, New List Name, Cat Direct-Edit
201  Locker Delete Confirm
210  Item/Location Photo Edit sheets
212  Photo List Source sheet
213  Photo List Assignment sheet
214  Photo List Location Name form; Item Destination sheet
9999 Toast
```

---

## 15. ANIMATIONS & TIMING

| Animation | Duration | Easing |
|---|---|---|
| BoxGroupBar track slide | 0.28s (0.01s reduced) | cubic-bezier(0.4,0,0.2,1) |
| Deck rise/fall | same | same |
| Deck backdrop fade | same | same |
| Category drag transitions | motionDuration() | ease-out |
| Category box-shadow (resting) | 0.15s | default |
| Swipe-row settle | 0.18s | ease-out |
| Haptic vibrate | 10 ms | — |
| Toast dismiss | 3 000 ms default | — |

---

## 16. PHOTO LIST UI STATES (all code-only — no screenshots exist)

### Photo List empty state card
```
margin: 24px 16px; padding: 24px 20px; border-radius: 16px
background: #FFFFFF; border: 1px solid rgba(0,0,0,0.06); text-align: center
Camera icon container: 48×48, border-radius=14, bg rgba(42,87,64,0.10), Camera size=24, strokeWidth=1.7
Title "Your Photo List is ready": fontSize=18, fontWeight=700
Subtitle: fontSize=13.5, lineHeight=1.5, marginTop=6
Pending photo (capture held): width=100%, height=168px, object-fit=cover, border-radius=10
"Choose Location or Item" button: minHeight=42, border 1px solid NAV_ACTIVE, border-radius=9, bg #fff
"Add Photo" CTA button: minHeight=44, border-radius=10, bg NAV_ACTIVE, fontSize=14.5, fontWeight=650
2-col location grid: gap=8, location tile border-radius=9, thumbnail 34×34
```

### Photo List source sheet (z-index 212)
```
Camera row: minHeight=56, icon pill 34×34 (NAV_ACTIVE), fontSize=15, fontWeight=650
Photos row: same dimensions
Cancel: minHeight=44, border-radius=10
```

### Photo List Assignment sheet (z-index 213)
```
Thumbnail preview: 52×52, border-radius=10, object-fit=cover
Title "What is this photo?": fontSize=17, fontWeight=700
Options: minHeight=60, padding=12px 14px, border-radius=12
  Icon pill: 36×36, border-radius=9, bg NAV_ACTIVE
  MapPin size=18 (Location) / PackageOpen size=18 (Item)
  Option title: fontSize=15, fontWeight=650
  Sub: fontSize=12.5, marginTop=2
"Decide later" Cancel: minHeight=44, marginTop=2
```

### Location naming form (z-index 214)
```
Title: fontSize=17, fontWeight=700
Body: fontSize=13, lineHeight=1.45, marginTop=4
Input: width=100%, minHeight=46, border-radius=9, border 1px, padding=8px 11px, fontSize=15
Buttons: flex row, gap=10, marginTop=14; flex:1 each; "Save Location" bg NAV_ACTIVE
```

### Item destination sheet (z-index 214, max-height 76vh)
```
2-col grid: grid-template-columns repeat(2, minmax(0, 1fr)); gap=10
Unassigned tile: minHeight=116, border DASHED, border-radius=12, padding=10
  Icon: 36×36 border-radius=9, bg rgba(42,87,64,0.10)
  PackageOpen size=18, color NAV_ACTIVE
  "Unassigned": fontSize=14, fontWeight=700, marginTop=12
  Sub: fontSize=11.5, color MUTED, marginTop=3
Location tiles: minHeight=116, border solid, border-radius=12, padding=8
  Photo: width=100%, height=66px, border-radius=7, object-fit=cover
  Name: fontSize=13, fontWeight=700, marginTop=7, truncated
```

### Location wedge bar
```
Same as category wedge (width=72, min-height=64, same pentagon clip-path)
Background: NAV_ACTIVE (#2A5740) — ALL location wedges same green
Icon: MapPin size=26
Content grid: padding 8px 34px 8px 12px (right=CHECKLIST_RIGHT_INSET, not CATEGORY_WEIGHT)
Location thumbnail: 42×42, border-radius=8, object-fit=cover
Location name col: fontSize=13, fontWeight=600, max-width=130, textAlign=right
```

---

## 17. CATEGORY COLOUR MAP (keyword → wedge bg)

25 named keywords (see mobileCategoryTheme.ts). All text='#fff'.
Fallback palette (index % 10): #3B6978, #6B8F71, #8B5E52, #5C6BC0, #7B7F44, #7C4585, #BF6B3B, #2C7873, #5F7A8A, #7A6C5D

Demo category colours: Backpack=#3B6978, Clothing=#7B5D87, Toiletries=#A05898, Electronics=#B8722A, Shelter=#4E7B5C, Kitchen=#A06030

---

## 18. SAFARI-SPECIFIC COMPENSATIONS

- Shell: position:fixed + layoutViewportHeight from visualViewport (stable, not shrunk)
- Document scroll lock: html:has(.tw-v3-root) → overflow:hidden
- --tw-safe-top / --tw-safe-bottom CSS properties bridge JS↔CSS
- -webkit-overflow-scrolling: touch on main-scroll
- -webkit-backdrop-filter on bottom bar
- navigator.vibrate() absent on iOS → try/catch skips silently
- Deck uses 100dvh not 100vh
- BoxGroupBar uses window.addEventListener (not setPointerCapture) — avoids child button click trap
- Photo taps unreliable on iOS bare img → always wrap in button

---

## 19. TOTAL ROW ANOMALY

Detail panel Total row: `height: 42px` (FIXED) not `min-height: 44`. Only non-interactive row. Native must use fixed height 42 for parity.
