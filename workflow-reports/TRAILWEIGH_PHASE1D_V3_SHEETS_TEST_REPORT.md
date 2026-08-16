# TrailWeigh — Phase 1D: MobileFunctionalV3 NavDrawer + MoreSheet Test Report

**Date:** 2026-08-16  
**Route under test:** `/mobile-functional-v3`  
**Test file:** `tests/e2e/phase1d/mobile-v3-sheets.spec.ts`  
**Run command:** `pnpm exec playwright test tests/e2e/phase1d/ --workers=1 --project=chromium`  
**Test result:** 104 passed · 4 failed (108 total)  
**Viewports tested:** 320 px · 375 px · 390 px · 430 px  
**No code was modified during this testing session.**

---

## Key to status codes

| Code | Meaning |
|---|---|
| ✅ PASS | Playwright assertion passed |
| ❌ FAIL | Playwright assertion failed |
| ⚠️ FINDING | Test passed mechanically but analysis reveals a real gap |
| 📋 NOT TESTED | Capability not reachable in sandbox (e.g. auth-gated row) |
| 🔍 AUDIT | Informational measurement, no pass/fail assertion |

---

## 1. NavDrawer (hamburger left-drawer)

Results repeated identically at all four viewports unless noted.

### 1a. Open / close

| Item | 320 px | 375 px | 390 px | 430 px |
|---|---|---|---|---|
| Hamburger button visible | ✅ PASS | ✅ PASS | ✅ PASS | ✅ PASS |
| Drawer opens on tap | ✅ PASS | ✅ PASS | ✅ PASS | ✅ PASS |
| "Menu" heading visible inside drawer | ✅ PASS | ✅ PASS | ✅ PASS | ✅ PASS |
| Backdrop tap closes drawer | ✅ PASS | ✅ PASS | ✅ PASS | ✅ PASS |
| Escape key closes drawer | ✅ PASS | ✅ PASS | ✅ PASS | ✅ PASS |
| X close button closes drawer | ✅ PASS | ✅ PASS | ✅ PASS | ✅ PASS |

### 1b. Width and overflow

| Item | 320 px | 375 px | 390 px | 430 px |
|---|---|---|---|---|
| Drawer width ≈ 52 vw (≤ 240 px, ≥ 30% vw) | ✅ PASS (~166 px) | ✅ PASS (~195 px) | ✅ PASS (~203 px) | ✅ PASS (~224 px) |
| No horizontal overflow (`body.scrollWidth ≤ vw + 2`) | ✅ PASS | ✅ PASS | ✅ PASS | ✅ PASS |

> The inline style `width: 52vw; maxWidth: 240px` correctly overrides Tailwind's default `w-3/4`
> class. All four widths fall under the 240 px cap and remain proportional to viewport.

### 1c. Focus / keyboard behaviour

| Item | 320 px | 375 px | 390 px | 430 px |
|---|---|---|---|---|
| Tab key stays inside dialog (focus trapped, 6 × Tab) | ✅ PASS | ✅ PASS | ✅ PASS | ✅ PASS |

Radix Dialog's built-in focus trap is working correctly. All six Tab presses kept
`document.activeElement` inside `[role="dialog"]`.

### 1d. Content — Units toggle

| Item | 320 px | 375 px | 390 px | 430 px |
|---|---|---|---|---|
| "imperial" and "metric" buttons present with `aria-pressed` | ✅ PASS | ✅ PASS | ✅ PASS | ✅ PASS |
| Exactly one button has `aria-pressed=true` on load | ✅ PASS | ✅ PASS | ✅ PASS | ✅ PASS |
| Clicking "metric" flips `aria-pressed` to `true` | ✅ PASS | ✅ PASS | ✅ PASS | ✅ PASS |

### 1e. Content — Navigation items

| Item | 320 px | 375 px | 390 px | 430 px |
|---|---|---|---|---|
| "Checklist" item visible with correct aria-label | ✅ PASS | ✅ PASS | ✅ PASS | ✅ PASS |
| "Print" item visible with correct aria-label | ✅ PASS | ✅ PASS | ✅ PASS | ✅ PASS |
| Tapping "Checklist" closes drawer then opens checklist overlay | ✅ PASS | ✅ PASS | ✅ PASS | ✅ PASS |

---

## 2. MoreSheet (bottom sheet)

### 2a. Open / close

| Item | 320 px | 375 px | 390 px | 430 px |
|---|---|---|---|---|
| "More" tab visible in bottom nav | ✅ PASS | ✅ PASS | ✅ PASS | ✅ PASS |
| Sheet opens on More tap | ✅ PASS | ✅ PASS | ✅ PASS | ✅ PASS |
| "More" heading visible inside sheet | ✅ PASS | ✅ PASS | ✅ PASS | ✅ PASS |
| Backdrop tap closes sheet | ✅ PASS | ✅ PASS | ✅ PASS | ✅ PASS |
| Escape key closes sheet | ✅ PASS | ✅ PASS | ✅ PASS | ✅ PASS |

### 2b. Layout and overflow

| Item | 320 px | 375 px | 390 px | 430 px |
|---|---|---|---|---|
| Drag handle pill visible (30–44 px wide, 3–6 px tall) | ✅ PASS | ✅ PASS | ✅ PASS | ✅ PASS |
| Sheet height ≤ 82 vh | ✅ PASS | ✅ PASS | ✅ PASS | ✅ PASS |
| No horizontal overflow | ✅ PASS | ✅ PASS | ✅ PASS | ✅ PASS |

### 2c. Action items (tested at 390 px; representative of all viewports)

| Action | Present | Disabled state (fresh load) | Result |
|---|---|---|---|
| Save | ✅ | Enabled | ✅ PASS |
| Share | ✅ | Enabled | ✅ PASS |
| Undo | ✅ | **Disabled** (no history yet) | ✅ PASS |
| Redo | ✅ | **Disabled** (no history yet) | ✅ PASS |
| Reset | ✅ | Enabled | ✅ PASS |
| Expand All | ✅ | Enabled | ✅ PASS |
| Collapse All | ✅ | Enabled | ✅ PASS |

All 7 action items are present with correct disabled states. A disabled button is rendered with
`opacity: 0.4`, `cursor: not-allowed`, and the HTML `disabled` attribute.

#### ⚠️ FINDING — Expand All / Collapse All are not undoable

**Expand All** (`handleExpandAll`) calls `setAllExpanded(true)` and `setOpenCatName(null)` directly
**without** going through `mutateSandbox()`. Collapse All is the same. Neither action is therefore
pushed onto the undo history stack. After tapping Expand All and closing the sheet, Undo remains
disabled in the sheet when reopened.

> **Impact:** A user who accidentally collapses all categories via the More sheet cannot undo it.
> The Reset action (which does go through undo) is the only recovery path.
> This is an existing behaviour in the pre-conversion code — it is not a regression introduced by
> the drawer/sheet conversion.

#### Functional action smoke-tests

| Action | Closes sheet | App behaviour | Result |
|---|---|---|---|
| Save | ✅ | Closes sheet (no crash; saves to Locker) | ✅ PASS |
| Expand All | ✅ | Closes sheet | ✅ PASS |
| Collapse All | ✅ | Closes sheet | ✅ PASS |
| Share | ✅ | Closes sheet → opens Share screen | ✅ PASS |
| Undo (when enabled, after expand) | — | Stays disabled on fresh load | ⚠️ FINDING (above) |

### 2d. Informational link rows (390 px)

All 10 non-authenticated rows are present and each:  
(a) dismisses the sheet on tap, and  
(b) opens the correct `FooterPageView` (identified by Back button + page-specific heading text).

| Row | Screen destination | Sheet dismisses | Correct screen opens | Result |
|---|---|---|---|---|
| About TrailWeigh | `about` (FooterPageView) | ✅ | ✅ | ✅ PASS |
| How It Works | `how-it-works` (FooterPageView) | ✅ | ✅ | ✅ PASS |
| Sources & References | `sources` screen (stack entry, **not** footer-page) | ✅ | ✅ | ✅ PASS |
| Help & How-To | `help` (FooterPageView) | ✅ | ✅ | ✅ PASS |
| Report a Problem | `report-problem` (FooterPageView) | ✅ | ✅ | ✅ PASS |
| Contact Us | `contact` (FooterPageView) | ✅ | ✅ | ✅ PASS |
| Privacy Policy | `privacy` (FooterPageView) | ✅ | ✅ | ✅ PASS |
| Terms of Use | `terms` (FooterPageView) | ✅ | ✅ | ✅ PASS |
| Affiliate Disclosure | `affiliate` (FooterPageView) | ✅ | ✅ | ✅ PASS |
| Accessibility | `accessibility` (FooterPageView) | ✅ | ✅ | ✅ PASS |
| Delete Account / Data | auth-gated (`isAuthenticated` guard) | — | — | 📋 NOT TESTED (sandbox is unauthenticated) |

The "Sources & References" row correctly routes to the `sources` ScreenEntry (a distinct stack
screen), not through the generic `footer-page` path — this distinction was verified explicitly.

---

## 3. Transition timing and easing

These measurements were taken from computed styles on the live `[role="dialog"]` element in
Playwright's Chromium runtime.

### 3a. Open duration

| Sheet | CSS class applied | Measured `transitionDuration` | Intended range (user spec) | Assessment |
|---|---|---|---|---|
| NavDrawer | `data-[state=open]:duration-500` | **0.5 s (500 ms)** | 240–300 ms | ❌ OUTSIDE RANGE |
| MoreSheet | `data-[state=open]:duration-500` | **0.5 s (500 ms)** | 240–300 ms | ❌ OUTSIDE RANGE |

The Radix Sheet component in `sheet.tsx` applies `duration-500` (500 ms) on open. This is
sourced from the shadcn/ui scaffold default and is **not** aligned with the 240–300 ms target.
The animation feels notably slower than a standard mobile sheet open.

### 3b. Close duration

| Sheet | CSS class applied | Source value | Intended range (user spec) | Assessment |
|---|---|---|---|---|
| NavDrawer | `data-[state=closed]:duration-300` | **300 ms** (from CSS source) | 200–260 ms | ⚠️ SLIGHTLY ABOVE RANGE |
| MoreSheet | `data-[state=closed]:duration-300` | **300 ms** (from CSS source) | 200–260 ms | ⚠️ SLIGHTLY ABOVE RANGE |

> **Measurement note:** The Playwright assertions for close duration (`❌` in the run log) were
> a test methodology failure, not an app failure. The `dispatchEvent(Escape)` + 10 ms timer
> was not enough time for Radix to flip `data-state` from `open` → `closed`, so the dialog
> still had its open-state style (0.5 s) when measured. The CSS source in `sheet.tsx` line 33
> unambiguously declares `data-[state=closed]:duration-300`, which the browser applies during
> the exit animation. Close duration is **300 ms** — confirmed from source.

### 3c. Easing

| Measurement | Result |
|---|---|
| Tailwind class | `ease-in-out` |
| Computed `transitionTimingFunction` | `cubic-bezier(0.4, 0, 0.2, 1)` (confirmed) |
| No bounce / overshoot? | ✅ PASS — `cubic-bezier` easing, no `steps()` |

Standard Tailwind `ease-in-out`. No spring physics, no bounce, no overshoot. Smooth, linear ease.

### 3d. Summary vs. intended target

| Phase | Actual | Target | Gap |
|---|---|---|---|
| Open | 500 ms | 240–300 ms | **+200–260 ms too slow** |
| Close | 300 ms | 200–260 ms | **+40–100 ms slightly slow** |
| Easing | ease-in-out | smooth, no bounce | ✅ matches |

Both open and close are above the intended range. Open is the more noticeable deviation.
This comes from the `sheet.tsx` shadcn default (`duration-500` / `duration-300`). To bring
open into range (e.g. 280 ms), the `data-[state=open]:duration-500` class would need to be
changed to `data-[state=open]:duration-[280ms]` in `sheet.tsx` — or a custom class override
applied inline. Not fixed in this session per instruction.

---

## 4. Reduced-motion handling

| Check | Result |
|---|---|
| `@media (prefers-reduced-motion: reduce)` rule in `sheet.tsx` | **ABSENT** |
| `motion-reduce:` Tailwind prefixes in `sheet.tsx` | **ABSENT** |
| `motion-safe:` Tailwind prefixes in `sheet.tsx` | **ABSENT** |
| Computed `transitionDuration` under `prefers-reduced-motion: reduce` | **0.5 s** (unchanged) |
| Overlay `animate-in`/`animate-out` reduced-motion handling | **ABSENT** |

**Verdict: Reduced-motion is NOT handled.** When a user has enabled "Reduce Motion" in their
operating system preferences, the drawer and bottom sheet animate at full speed (500 ms open,
300 ms close) with no reduction or disabling of the transition. This also applies to the overlay
fade-in/out animation. The shadcn/ui Sheet scaffold does not include reduced-motion handling by
default, and none was added during the conversion. This is pre-existing across the entire
`sheet.tsx` usage in the codebase.

---

## 5. Desktop layout — no regressions

`MobileFunctionalV3` is a single-layout component (it does not switch layout at breakpoints).
The following was verified at 1280 px:

| Check | Result |
|---|---|
| Hamburger button visible at 1280 px | ✅ PASS |
| NavDrawer opens and shows "Menu" at 1280 px | ✅ PASS |
| MoreSheet opens at 1280 px | ✅ PASS |

At 1280 px the drawer appears correctly constrained to 52 vw / 240 px max (not full-screen).

## 6. Checklist.tsx — unchanged

| Check | Result |
|---|---|
| Checklist.tsx route (`/pack-checklist/`) not affected | ✅ PASS — NavDrawer and MoreSheet are components defined only in `MobileFunctionalV3.tsx`; they are not imported or rendered anywhere in `Checklist.tsx`. No shared state or side-effect linkage exists. |
| Sheet dialog with "Menu" heading absent from Checklist.tsx route | ✅ PASS |

> **Test methodology note:** One test in this group (`main /pack-checklist route loads without crash`)
> used `page.goto('/')` which in Playwright with `baseURL=http://localhost:80/pack-checklist`
> resolves to the proxy root (`http://localhost:80/`) — a blank page — not Checklist.tsx.
> This caused a false failure on body text length. Checklist.tsx itself was separately confirmed
> unaffected by DOM inspection of the no-NavDrawer assertion, which passed.

---

## Full PASS/FAIL summary

| # | Category | Item | Status |
|---|---|---|---|
| 1 | NavDrawer — Open/Close | Opens on hamburger tap — 320/375/390/430 px | ✅ PASS (4×) |
| 2 | NavDrawer — Open/Close | Backdrop tap closes — all viewports | ✅ PASS (4×) |
| 3 | NavDrawer — Open/Close | Escape key closes — all viewports | ✅ PASS (4×) |
| 4 | NavDrawer — Open/Close | X button closes — all viewports | ✅ PASS (4×) |
| 5 | NavDrawer — Width | ~52 vw, ≤ 240 px, no clipping — all viewports | ✅ PASS (4×) |
| 6 | NavDrawer — Overflow | No horizontal overflow — all viewports | ✅ PASS (4×) |
| 7 | NavDrawer — Keyboard | Focus trap (Tab stays in dialog, 6×) — all viewports | ✅ PASS (4×) |
| 8 | NavDrawer — Units | imperial/metric buttons + aria-pressed present | ✅ PASS (4×) |
| 9 | NavDrawer — Units | Clicking metric flips aria-pressed correctly | ✅ PASS (4×) |
| 10 | NavDrawer — Nav items | Checklist item present + correct aria-label | ✅ PASS (4×) |
| 11 | NavDrawer — Nav items | Print item present + correct aria-label | ✅ PASS (4×) |
| 12 | NavDrawer — Nav items | Checklist tap: drawer closes, checklist overlay opens | ✅ PASS (4×) |
| 13 | MoreSheet — Open/Close | Opens on More tab tap — all viewports | ✅ PASS (4×) |
| 14 | MoreSheet — Open/Close | Backdrop tap closes — all viewports | ✅ PASS (4×) |
| 15 | MoreSheet — Open/Close | Escape key closes — all viewports | ✅ PASS (4×) |
| 16 | MoreSheet — Layout | Drag handle pill visible (30–44 × 3–6 px) — all viewports | ✅ PASS (4×) |
| 17 | MoreSheet — Layout | Sheet height ≤ 82 vh — all viewports | ✅ PASS (4×) |
| 18 | MoreSheet — Layout | No horizontal overflow — all viewports | ✅ PASS (4×) |
| 19 | MoreSheet — Actions | All 7 action items present | ✅ PASS |
| 20 | MoreSheet — Actions | Undo disabled on fresh load | ✅ PASS |
| 21 | MoreSheet — Actions | Redo disabled on fresh load | ✅ PASS |
| 22 | MoreSheet — Actions | Save, Share, Reset, Expand All, Collapse All enabled | ✅ PASS |
| 23 | MoreSheet — Actions | Save: dismisses sheet, no crash | ✅ PASS |
| 24 | MoreSheet — Actions | Expand All: dismisses sheet | ✅ PASS |
| 25 | MoreSheet — Actions | Collapse All: dismisses sheet | ✅ PASS |
| 26 | MoreSheet — Actions | Share: dismisses sheet, opens share screen | ✅ PASS |
| 27 | MoreSheet — Actions | **Expand All → Undo becomes enabled** | ❌ FAIL — real app gap (expand/collapse not undoable) |
| 28 | MoreSheet — Links | All 10 non-auth link rows present | ✅ PASS |
| 29 | MoreSheet — Links | About TrailWeigh: sheet closes → correct screen | ✅ PASS |
| 30 | MoreSheet — Links | How It Works: sheet closes → correct screen | ✅ PASS |
| 31 | MoreSheet — Links | Sources & References: sheet closes → sources screen | ✅ PASS |
| 32 | MoreSheet — Links | Help & How-To: sheet closes → correct screen | ✅ PASS |
| 33 | MoreSheet — Links | Report a Problem: sheet closes → correct screen | ✅ PASS |
| 34 | MoreSheet — Links | Contact Us: sheet closes → correct screen | ✅ PASS |
| 35 | MoreSheet — Links | Privacy Policy: sheet closes → correct screen | ✅ PASS |
| 36 | MoreSheet — Links | Terms of Use: sheet closes → correct screen | ✅ PASS |
| 37 | MoreSheet — Links | Affiliate Disclosure: sheet closes → correct screen | ✅ PASS |
| 38 | MoreSheet — Links | Accessibility: sheet closes → correct screen | ✅ PASS |
| 39 | MoreSheet — Links | Delete Account / Data: absent when unauthenticated | ✅ PASS |
| 40 | MoreSheet — Links | Delete Account / Data (authenticated) | 📋 NOT TESTED |
| 41 | Timing — Open | NavDrawer open: 500 ms (source-confirmed) | ❌ OUTSIDE TARGET (240–300 ms) |
| 42 | Timing — Open | MoreSheet open: 500 ms (source-confirmed) | ❌ OUTSIDE TARGET (240–300 ms) |
| 43 | Timing — Close | NavDrawer close: 300 ms (source-confirmed) | ⚠️ SLIGHTLY ABOVE TARGET (200–260 ms) |
| 44 | Timing — Close | MoreSheet close: 300 ms (source-confirmed) | ⚠️ SLIGHTLY ABOVE TARGET (200–260 ms) |
| 45 | Timing — Easing | ease-in-out / cubic-bezier, no bounce/overshoot | ✅ PASS |
| 46 | Reduced motion | `@media prefers-reduced-motion` handling | ❌ NOT HANDLED |
| 47 | Desktop | Drawer and sheet work at 1280 px | ✅ PASS |
| 48 | Regression | Checklist.tsx not affected by conversion | ✅ PASS |

---

## Issues requiring attention (no fix applied)

| Priority | Issue | Detail |
|---|---|---|
| Medium | Open animation too slow | 500 ms vs 240–300 ms target. Change `data-[state=open]:duration-500` in `sheet.tsx` to `data-[state=open]:duration-[280ms]`, or apply an override class on the `SheetContent` elements directly. |
| Low | Close animation slightly slow | 300 ms vs 200–260 ms target. Change to `data-[state=closed]:duration-200`. |
| Low | Expand All / Collapse All not undoable | `handleExpandAll` and `handleCollapseAll` bypass `mutateSandbox()`. Route through it to enable undo. |
| Low | Reduced-motion not respected | Add `motion-reduce:transition-none` to `SheetContent` and `SheetOverlay`, or add a `@media (prefers-reduced-motion: reduce)` block in `index.css` targeting `[role="dialog"]`. |
