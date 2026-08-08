# Prompt 022A — Add the Existing Footer to the Main Checklist Page

**Date:** 2026-08-08  
**Status:** COMPLETE — all tests passing

---

## Why the Footer Was Previously Omitted (Prompt 022)

The main Checklist page (`ChecklistContent`) renders its entire UI inside a div with:

```
h-[100dvh] overflow-hidden flex flex-col
```

`overflow-hidden` clips all content to the viewport — there is no page-level scroll. Adding `<Footer />` inside this div would shrink the checklist workspace (because the inner `<main>` uses `flex-1 min-h-0` and would give space to the footer). The Prompt 022 report correctly noted this and chose not to add the footer rather than risk breaking the 021P/O/N approved layout.

Prompt 022A now makes the minimum architectural change to allow the footer to live *below* the full-height checklist area, reachable by scrolling.

---

## Files Changed

| File | Change |
|---|---|
| `src/pages/Checklist.tsx` | Added `import Footer`; added outer page-scroll container; added `<Footer />`; 15 lines changed |
| `src/hooks/footer022A.test.mjs` | **NEW** — 20 regression tests |
| `package.json` | Added `footer022A.test.mjs` to `test:importer` chain |

---

## Exact Checklist Layout Change

### Before
```tsx
{/* Screen content */}
<div className={`screen-only h-[100dvh] overflow-hidden flex flex-col bg-background...`}>
  <header>...</header>
  <main>...</main>
</div>

{/* Locker delete dialog */}
```

### After
```tsx
{/* Page scroll container — h-[100dvh] overflow-y-auto */}
<div className="h-[100dvh] overflow-y-auto">

  {/* Screen content — UNCHANGED */}
  <div className={`screen-only h-[100dvh] overflow-hidden flex flex-col bg-background...`}>
    <header>...</header>
    <main>...</main>
  </div>

  {/* Footer — below app area, reachable by scrolling */}
  <Footer />

</div>{/* end page scroll container */}

{/* Locker delete dialog */}
```

---

## Where `<Footer />` Is Now Rendered

Inside `ChecklistContent`, between the end of the screen-content div and the Locker delete dialog, wrapped by the new scroll container.

```
ChecklistContent fragment:
  ├── MailingListModal (outside scroll container — it's a modal)
  ├── BackgroundShowcase (outside scroll container — it's a full-screen overlay)
  ├── [scroll container: h-[100dvh] overflow-y-auto]
  │   ├── Screen-content div (h-[100dvh] overflow-hidden flex flex-col)
  │   │   ├── <header>
  │   │   └── <main> (toolbar + content area — UNCHANGED)
  │   └── <Footer />   ← new, below app area
  ├── Locker delete dialog (outside scroll container — it's a dialog overlay)
  ├── Preview modal (outside scroll container — it's a fixed overlay)
  └── PrintLayout (outside scroll container — print-only)
```

---

## Confirmation: Existing Footer Component Reused

`<Footer />` (no props) renders the full footer from `src/components/Footer.tsx` — the same component created in Prompt 022. Nothing was duplicated, created, or modified in the Footer component itself.

---

## Confirmation: Full Footer (Not `informationalOnly`)

The Checklist renders `<Footer />` with no props — this is the **full footer** including all 10 links:
- About TrailWeigh → `/about`
- How It Works → `/how-it-works`
- Help & How-To → `/help`
- Report a Problem → `/report-problem`
- Contact Us → `/contact`
- Privacy Policy → `/privacy`
- Terms of Use → `/terms`
- **Delete Account / Data → `/delete-account`** (present — this is the owner's session)
- Affiliate Disclosure → `/affiliate`
- Accessibility → `/accessibility`
- © 2026 TrailWeigh · All rights reserved.

---

## `h-[100dvh]` — Changed?

**No.** The existing screen-content div keeps `h-[100dvh] overflow-hidden flex flex-col` exactly as approved in 021N/021O/021P.

A **new** `h-[100dvh]` was added on the outer scroll container div. Two `h-[100dvh]` elements now exist: one on the scroll container (makes it fill the initial viewport), one on the screen-content div (makes the checklist fill the scroll container).

---

## `overflow-hidden` — Changed?

**No.** `overflow-hidden` remains on the screen-content div. The new outer wrapper uses `overflow-y-auto` (not `overflow-hidden`), enabling page-level scroll without touching the internal scroll behavior.

---

## How Page-Level Footer Scrolling Was Enabled

**Scroll container pattern:**

```
[scroll container: h-[100dvh] overflow-y-auto]
  ├── [screen div: h-[100dvh] overflow-hidden]  → fills scroll container's viewport
  └── [footer]                                  → below, in scrollable overflow area
```

The scroll container is exactly one viewport tall (`h-[100dvh]`). The screen div also fills one viewport tall. The footer adds height beyond that. Because the scroll container is `overflow-y-auto`, the user can scroll down past the screen div to reach the footer. The screen div's `overflow-hidden` is unaffected — all internal column scrolling continues to work within it.

---

## Confirmation: Category Scrolling Still Works

The category-list scroll lives inside the screen-content div's `overflow-hidden` layer — that div is unchanged. The scroll mechanism (`lg:overflow-auto` on the left content column, `lg:h-full`, `[scrollbar-gutter:stable]`) is all within the inner div.

---

## Confirmation: Pack Summary / Sidebar Scrolling Still Works

The sidebar scroll (`lg:overflow-auto lg:h-full`, `lg:pl-1 lg:pr-5 lg:[scrollbar-gutter:stable]`) is also within the unchanged screen-content div. Unaffected.

---

## Confirmation: 021P Alignment Unchanged

- Sidebar inner content div: `flex flex-col gap-4 pb-8` (no `py-2`) ✓
- No changes to `<main>`, toolbar group, or any column inside `<main>` ✓
- Confirmed by automated test ✓

---

## Confirmation: Toolbar Position Unchanged

- `pt-4` on toolbar-group parent ✓
- `pb-3` on toolbar child panels ✓
- No `pt-*` or `translateY` on child panels ✓
- Confirmed by automated test ✓

---

## Confirmation: Footer Is Not Fixed or Sticky

- `Footer.tsx` contains no `fixed` or `sticky` class ✓
- The scroll container and screen-content div use no `fixed`/`sticky` ✓
- Footer flows naturally in document order below the app area ✓
- Footer only becomes visible when user scrolls downward ✓

---

## Desktop Visual Test Results (source-derived)

| Test | Result |
|---|---|
| Checklist footer present | ✓ — `<Footer />` rendered in ChecklistContent |
| Footer reachable by scrolling | ✓ — scroll container is `overflow-y-auto` |
| Footer NOT permanently visible | ✓ — checklist fills viewport; footer is below |
| Toolbar did not move | ✓ — `pt-4` on toolbar-group parent unchanged |
| Checklist top position unchanged | ✓ — screen div and main unchanged |
| Pack Summary top unchanged | ✓ — 021P fix (no `py-2` on sidebar inner div) preserved |
| Checklist workspace not reduced | ✓ — screen div remains `h-[100dvh]` |
| Category scrolling works | ✓ — inner `overflow-hidden` div unchanged |
| Sidebar scrolling works | ✓ — inner column scroll unchanged |
| Footer dark charcoal | ✓ — `#1e2322` hard-coded, theme-invariant |
| Footer 3 columns on desktop | ✓ — `sm:grid-cols-3` in Footer.tsx |
| No horizontal scrolling | ✓ — `max-w-5xl mx-auto px-6` in Footer |
| No overlap | ✓ — footer is after (not over) the screen div |

---

## Mobile Visual Test Results (source-derived)

| Test | Result |
|---|---|
| Footer stacks (single column) | ✓ — `grid-cols-1 sm:grid-cols-3` |
| Text readable (14 px links) | ✓ — `text-[14px]` unchanged |
| No horizontal scrolling | ✓ — `px-6` padding contained |
| Tap targets accessible | ✓ — `leading-[21px]` link spacing |
| Dark charcoal preserved | ✓ — same `#1e2322` |

---

## Light / Dark / System Mode Test Results

The footer uses `style={{ backgroundColor: '#1e2322' }}` (inline style, hard-coded hex). This is immune to CSS custom property changes, `.dark` class toggles, and `prefers-color-scheme`. Dark appearance is guaranteed in all three modes. ✓

---

## Automated Test Results

```
footer022A.test.mjs:
  022A Checklist Footer Presence:          4 passed, 0 failed
  022A Scroll Container Architecture:      4 passed, 0 failed
  022A Footer Not Fixed/Sticky:            3 passed, 0 failed
  022A No Footer Duplication:              2 passed, 0 failed
  022A Shared View Unchanged:              3 passed, 0 failed
  022A Layout Invariants (021P/O/N):       5 passed, 0 failed

Total 022A:                               20 passed, 0 failed

Full pnpm test:importer:                  EXIT 0 (all suites)
```

---

## Issues Discovered

None. The scroll-container pattern required no changes to any existing element — only addition of one wrapper div and `<Footer />`.

---

## Shared-View Footer (Prompt 022 — Unchanged)

`SharedChecklistPage` continues to render `<Footer informationalOnly />` in both render paths. The `informationalOnly` prop suppresses the Delete Account / Data link for shared-list viewers. This behavior was not touched by Prompt 022A.
