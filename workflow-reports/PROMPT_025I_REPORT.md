# Prompt 025I — Shared-link viewer must match Home view exactly

**Status:** IMPLEMENTED  
**Date:** 2026-08-11

---

## Root causes addressed

| Issue | Root cause | Fix |
|---|---|---|
| Black category bars / panels | `GearCategory` reads `useBarStyle()` from `BarStyleContext`. Shared view had no `BarStyleProvider`, so all components got the default (empty) bar style. | Added `BarStyleProvider` wrapping the entire `SharedChecklistContent` return. |
| Bar style never transmitted | `SharePayload` did not include `barColor`, `barFont`, `barTextColor`, `barTransparency`. | Added all four fields to `SharePayload` and `SharedLockerFile` in `shareLink.ts`. |
| Bar style not sent by Home | `handleShareLocker` and `handleShareCheckableList` in `Checklist.tsx` did not include bar style in the payload. | Added bar style fields to both payloads, plus to the `lockerFiles` per-file mapping. |
| "Open/Close" text pills | Shared view used text-label buttons where Home uses compact ChevronDown/Up icon-only buttons. | Replaced with icon-only buttons on both mobile and desktop variants. |
| Missing Hide button | No showcase/hide functionality in shared view. | Added `showcaseActive` state, `BackgroundShowcase` component, opacity fade on main wrapper, and Hide button in desktop right group (matches Home). |
| Standalone Print pill | Print appeared as a standalone pill in the shared sidebar toolbar. Home exposes Print only inside Preview. | Removed the Print pill. Print remains accessible via PreviewModal (which has `onPrint` wired). |
| Sidebar toolbar layout mismatch | Sidebar used `flex-wrap justify-center gap-2` centering all pills. Home uses `flex items-center` with BgPicker+Share in an `ml-auto` right group. | Changed outer div to `flex items-center`, added `<div className="flex items-center gap-2 ml-auto">` grouping BgPicker and Share. |
| Grid column mismatch | `lg:grid-cols-12` with `col-span-8`/`col-span-4` vs Home's `lg:grid-cols-[1fr_365px]`. | Changed to `lg:grid-cols-[1fr_365px]`, removed explicit col-span classes. |
| BackgroundPickerPanel bar style frozen | Panel was passed `barColor=""`, `barFont=""`, etc. (hardcoded empty), blocking bar style edits in the shared view. | Wired actual `barColor`/`barFont`/`barTextColor`/`barTransparency` state with setter callbacks. |

---

## Files changed

### `artifacts/pack-checklist/src/lib/shareLink.ts`
- Added `barColor?`, `barFont?`, `barTextColor?`, `barTransparency?` to `SharePayload`
- Added same four fields to `SharedLockerFile`

### `artifacts/pack-checklist/src/pages/Checklist.tsx`
- `handleShareLocker` payload: added `barColor`, `barFont`, `barTextColor`, `barTransparency`
- `handleShareCheckableList` payload: added same four fields
- `lockerFiles` mapping: added `barColor: e.barColor ?? ''` etc. from `LockerEntry`

### `artifacts/pack-checklist/src/pages/SharedChecklistPage.tsx`
- **Imports**: Added `BackgroundShowcase`, `BarStyleProvider`, `barCombinedStyle`, `barBgStyle`
- **`TempFileState` type**: Added `barColor`, `barFont`, `barTextColor`, `barTransparency` fields
- **Bar style state**: Initialized from `snapshot.barColor ?? ''` etc.
- **`showcaseActive` state**: Added for Hide button
- **`switchToFile`**: Stashes and restores bar style alongside background state
- **`commitSave`**: Includes bar style in saved `LockerEntry`; updated deps array
- **`handleShareCheckableList`**: Bar style included in outgoing payload
- **Category toolbar**: Replaced "Open / Close" text pills with two separate toolbar rows:
  - Mobile (`flex lg:hidden`): ChevronDown/Up icon buttons + Preview + UnitToggle
  - Desktop (`hidden lg:flex`): styled ChevronDown/Up + ml-auto [Hide][Preview][UnitToggle]
- **Sidebar toolbar**: Changed from `flex-wrap justify-center gap-2 pt-8 pb-3 lg:px-3` to `flex items-center pt-8 pb-3 lg:pl-1 lg:pr-5`; BgPicker + Share wrapped in `ml-auto` group; Print pill removed
- **BackgroundPickerPanel**: All bar style props now use live state + setters (not hardcoded empty strings)
- **Grid**: `lg:grid-cols-12` → `lg:grid-cols-[1fr_365px]`; `lg:col-span-8`/`lg:col-span-4` removed
- **Return**: Wrapped in `<BarStyleProvider value={{ barColor, barFont, barTextColor, barTransparency }}>`; `<BackgroundShowcase>` added before main div; main div gets `opacity`/`transition`/`pointerEvents` for showcase

---

## Items intentionally NOT changed
- CSV/XLSX/PDF/DOCX importers
- Parser/calculation logic
- Authentication or database schema
- `SharedPackListContent` (separate pack-list share mode, different component)
- The `025H` accordion behavior (single-open sidebar, Expand All / Collapse All) — preserved intact

---

## Backward compatibility
- All new `SharePayload` fields are optional — old links decode correctly with `?? ''` / `?? 1` fallbacks
- `SharedLockerFile` additions are optional — old snapshot entries without bar style default to Home defaults
