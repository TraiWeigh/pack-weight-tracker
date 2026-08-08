# Prompt 022F — Shared-Link Footer Overlay Fix

**Date:** 2026-08-08  
**Status:** COMPLETE ✅  
**Tests:** 32 passed, 0 failed (full suite: all prior suites clean)

---

## Problem Statement

When a shared TrailWeigh link is opened, the footer remains visible at the bottom of the browser viewport while the shared checklist scrolls behind it. The footer appears to "float over" the gear list on all screen sizes.

---

## Root Cause

`SharedChecklistPage.tsx` used the **app-shell** pattern on its outer wrapper:

```tsx
className="screen-only h-[100dvh] overflow-hidden flex flex-col bg-background"
```

This locked the entire page to exactly one viewport height with `overflow-hidden`. Inside:

- `<header>` — `flex-shrink-0` (fixed height)
- `<main>` — `flex-1 min-h-0 lg:overflow-hidden` (takes all remaining space)
  - Left column: `lg:h-full lg:flex lg:flex-col lg:overflow-hidden` with inner `lg:overflow-y-auto` scroll
  - Right column: same pattern
- `<Footer>` — `flex-shrink-0` (always occupies space at bottom of 100dvh box)

Because the outer wrapper was `h-[100dvh]` and the footer was a `flex-shrink-0` sibling inside it, the footer was **always visible at the viewport bottom regardless of content length**. On small screens, gear items were also clipped behind the footer because `overflow-hidden` on the outer div hid them.

---

## Fix Applied

Switched `SharedChecklistPage.tsx` from the **app-shell** pattern to **page-level scrolling**:

### 1. Outer wrapper — `h-[100dvh] overflow-hidden` → `min-h-[100dvh]`

```tsx
// Before
className="screen-only h-[100dvh] overflow-hidden flex flex-col bg-background"

// After
className="screen-only min-h-[100dvh] flex flex-col bg-background"
```

Page grows with content. The footer is now a normal flex child that flows after all content.

### 2. Background image — added `backgroundAttachment: 'fixed'`

```tsx
backgroundAttachment: 'fixed',
```

The background image stays fixed to the viewport as the user scrolls, preserving the visual experience of the background always covering the screen.

### 3. Header — added `sticky top-0`

```tsx
className="... flex-shrink-0 sticky top-0 z-10 shadow-sm"
```

Keeps the header controls (Undo, Preview, Unit toggle, etc.) accessible while the user scrolls the page.

### 4. Main area — removed `lg:overflow-hidden`

```tsx
// Before: flex-1 min-h-0 lg:overflow-hidden
// After:  flex-1 min-h-0
```

`min-h-0` preserved for 021H test contract compatibility (harmless with page-level scrolling).

### 5. Inner grid — removed `lg:h-full`

```tsx
// Before: grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-4 lg:h-full
// After:  grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-4
```

### 6. Left column — removed `lg:h-full lg:flex lg:flex-col lg:overflow-hidden`

```tsx
// Before: lg:col-span-8 lg:h-full lg:flex lg:flex-col lg:overflow-hidden
// After:  lg:col-span-8
```

### 7. Categories div — removed `lg:flex-1 lg:overflow-y-auto lg:min-h-0`, removed `lg:[scrollbar-gutter:stable]`

```tsx
// Before: lg:flex-1 lg:overflow-y-auto lg:min-h-0 space-y-2 pb-8 lg:pr-3 lg:[scrollbar-gutter:stable]
// After:  space-y-2 pb-8 lg:pr-3
```

### 8. Right column — removed `lg:h-full lg:flex lg:flex-col lg:overflow-hidden`

```tsx
// Before: lg:col-span-4 order-first lg:order-last lg:h-full lg:flex lg:flex-col lg:overflow-hidden
// After:  lg:col-span-4 order-first lg:order-last
```

### 9. Sidebar scroll div — removed `lg:flex-1 lg:overflow-y-auto lg:min-h-0`, removed `lg:[scrollbar-gutter:stable]`

```tsx
// Before: lg:flex-1 lg:overflow-y-auto lg:min-h-0 lg:px-3 lg:[scrollbar-gutter:stable]
// After:  lg:px-3
```

---

## Files Changed

| File | Change |
|------|--------|
| `src/pages/SharedChecklistPage.tsx` | 9 targeted edits — switch from app-shell to page-scroll |
| `src/hooks/sharedFooter022F.test.mjs` | NEW — 32 source-level tests |
| `package.json` (root) | Added `sharedFooter022F.test.mjs` to `test:importer` chain |

---

## Files Unchanged (regression-verified)

| File | Status |
|------|--------|
| `src/components/Footer.tsx` | Unchanged |
| `src/pages/info/HelpPage.tsx` | Unchanged (022C) |
| `src/pages/info/AboutPage.tsx` | Unchanged (022D) |
| `src/pages/info/HowItWorksPage.tsx` | Unchanged (022E) |
| `src/App.tsx` | Unchanged |
| `src/pages/Checklist.tsx` | Unchanged |

---

## Backup

`workflow-reports/PRE_022F_SharedChecklistPage_BACKUP.tsx`

---

## Test Coverage (NOT TESTED — runtime-only)

The following behaviours require browser verification and cannot be checked by source analysis:

- **Footer actually renders below all gear-list content** (requires scroll)
- **Footer does not visually overlap gear items at any viewport size**
- **Background image covers viewport during page scroll** (fixed attachment)
- **Sticky header remains accessible while scrolling**
- **Inner gear-list content is not clipped at any screen size**
- **iOS Safari background-attachment behaviour** (known fixed-attachment bug; graceful fallback is scroll)

---

## Test Results

```
022F Root Cause Removed:       4 tests
022F Inner Fixed-Height Removed: 3 tests
022F Sticky Header:             2 tests
022F Background Attachment Fixed: 1 test
022F Footer Preserved:          4 tests
022F Shared Behaviour Preserved: 11 tests
022F Prior Prompt Regression:   3 tests
022F Routing Unchanged:         2 tests
─────────────────────────────────────────
022F Shared Footer Fix: 32 passed, 0 failed

Full suite: all prior suites 0 failed ✅
```
