# PROMPT_026X_REPORT.md
## TRAILWEIGH — CREATE NEW LIST FLOW + TOOLTIP/HELP ARCHITECTURE
### READ-ONLY DIAGNOSTIC

---

**Internal version:** 026X-CREATE-NEW-LIST-TOOLTIP-DIAGNOSTIC-2026-08-14-R1  
**Date:** 2026-08-14  
**Mode:** READ-ONLY — NO APPLICATION CODE CHANGED

---

## Preflight Git Status

```
HEAD: b7d169a — Update checklist page and add mobile toolbar design asset
Untracked: attached_assets/TrailWeigh-Prompt-026X-GOLD-STANDARD-...txt
No application-file changes before or after this diagnostic.
```

---

## Files Inspected

| File | Purpose |
|------|---------|
| `src/pages/Checklist.tsx` | New button UI (lines 2162-2188), handleNew (1212-1253), commitSaveNew (1700-1736), handleSaveToLocker (1787-1806) |
| `src/hooks/usePackData.ts` | Store schema, seedInitialData, emptyData, parseV5 |
| `src/components/LockerPanel.tsx` | LockerEntry interface |
| `src/lib/lockerApi.ts` | Server-side Locker API helpers |
| `src/components/ui/tooltip.tsx` | Radix UI Tooltip component |
| `src/data/initialData.ts` | INITIAL_DATA sample gear |
| `src/pages/info/HelpPage.tsx` | Existing help-page references to "New" / "Create New List" |

---

## A. CURRENT NEW CONTROL

### Desktop
- **File/component:** `src/pages/Checklist.tsx` lines 2162-2188 (inside `<header>` actions row)
- **Visible label:** Plus icon (`<Plus className="w-3.5 h-3.5" />`) always visible; `"New"` text visible only at `≥md` (768px) via `<span className="hidden md:inline">New</span>`
- **Click handler (step 1):** `onClick={() => setShowNewConfirm(true)}` — replaces the button inline with a confirm step
- **Click handler (step 2 — Create New List button):** `onClick={() => { handleNew(); setShowNewConfirm(false); }}`
- **Current tooltip/help:** `title="Create a new pack list as an exact copy of the current file? All gear-item checkboxes in the new file will be unchecked. The original file will not be changed."` — on the step-1 trigger button only; the step-2 "Create New List" confirm button has **no title/tooltip**
- **Note:** The `title` tooltip text is inaccurate as of now — `handleNew()` creates a **blank** list (0 categories, 0 items), not a copy of the current file. This is a documentation gap.

### Mobile
- **Same render path** — the header `<header>` and its actions row render at all viewport sizes
- **Portrait mobile (<sm / <640px):** actions row drops below the logo row (`flex-col` layout on the header); the "New" button is still present
- **Phones (<md / <768px):** text is hidden (`hidden md:inline`); icon-only (Plus)
- **Same click handler and title attribute as desktop**
- **The `title` attribute is unreliable on touch devices** — it does not trigger on tap in mobile Safari or Chrome Android

### Shared?
**YES — fully shared.** The "New" button and its two-step confirm render on all viewport sizes from the same code block. There is no separate mobile render branch for this control. Changing it affects all viewports simultaneously.

---

## B. CURRENT NEW-LIST FLOW

**Component:** No dedicated component. Entirely inline in `Checklist.tsx` header actions row (lines 2162-2188).

**First screen:** Inline confirm. Clicking the "New" trigger sets `showNewConfirm=true`. The button is replaced in-place (same DOM position) with:
```
[Create New List]  [Cancel]
```
No heading. No modal overlay. No guided questions.

**Heading:** None — there is no "Create New List" heading displayed during the confirm step. The label "Create New List" is used only as the confirm button's text.

**Current fields/options:** None. No list name, no list type, no Track Weight.

**Default list/category creation:** `__blank: true` is written to the newseed store. `parseV5` in `usePackData.ts` sees this flag and skips `mergeDefaultCategories()`, so the new list opens with **zero categories and zero items**. `INITIAL_DATA` is only used by `seedInitialData()` which runs on the very first-ever app load (no saved state); it is **not** called by `handleNew()`.

**When data is committed:** Not during the "New" flow. The new tab opens immediately with an empty list. Data is first committed to the Locker only when the user clicks Save in the new tab, enters a name, and calls `commitSaveNew()`.

**When the list gets a Locker identity:** Inside `commitSaveNew()` — a `crypto.randomUUID()` is assigned at that moment. Before that, the list has no Locker identity (no id, no name).

**Save/Save As relationship:** A new list has no active Locker file. The first Save opens an inline name-entry input. `handleSaveToLocker()` checks for name conflicts:
- No conflict → `commitSaveNew(name)` → new entry
- Conflict → shows Replace | Save as New | Back buttons
- "Save as New" calls `commitSaveNew(name)` → second separate entry

**Cancel/back behavior:** Clicking "Cancel" in the confirm step calls `setShowNewConfirm(false)` — the original "New" button is restored. No tab is opened, no state is changed.

**Keyboard / focus trap:** `showNewConfirm` is tracked in `isDialogOpen` (line 1049) which gates the background inactivity showcase timer, but there is **no focus trap** on the confirm step — it is an inline expansion, not a modal. Escape key is not wired to close `showNewConfirm`. Tab order is natural (document order in the actions row).

**`handleNew()` mechanics:**
1. Clears `activeLockerFile` and sessionStorage reference — detaches from any current Locker entry
2. Generates a `uuid`
3. Writes blank newseed to `localStorage['tw-newseed-<uuid>']` with `{ __v: 5, __blank: true, items: {}, order: [], meta: {} }`
4. Writes fresh background settings to `localStorage['tw-newseed-bg-<uuid>']` — background: null, bgTone: 'light', barColor: '' (all default)
5. Opens `window.open(origin + base + '/checklist?newseed=<uuid>', '_blank')`

---

## C. TEMPLATE / LIST-TYPE SUPPORT

**Exists? NO**

| Capability | Present? | Notes |
|-----------|---------|-------|
| Backpacking template | NO | — |
| Travel template | NO | — |
| Business Trip template | NO | — |
| Road Trip template | NO | — |
| Emergency Kit template | NO | — |
| Blank/Custom template | NO (by behavior only) | `__blank: true` newseed is the de-facto blank start |
| Template registry/config | NO | — |
| Default category sets per type | NO | `DEFAULT_CATEGORY_ORDER` is a single global order (13 categories), not per-type |
| List-purpose/type field | NO | Neither in the newseed, v5 store, nor LockerEntry |
| Per-list metadata describing type | NO | — |

**`INITIAL_DATA` clarification:** `data/initialData.ts` is a hardcoded sample of backpacking gear. It is loaded ONLY by `seedInitialData()` in `usePackData.ts`, which runs only on the very first app load when no saved state exists in `localStorage`. It is explicitly bypassed by `handleNew()` via the `__blank: true` flag. It is not a template system and cannot currently be selected by the user.

**v5 store `meta` field:** `meta: Record<string, CategoryMeta>` where `CategoryMeta = { countsToBase: boolean }`. This is per-**category** metadata (whether that category's weight counts toward base weight). It is NOT per-list metadata and cannot hold a `listType` or `trackWeight` flag in its current shape.

---

## D. TRACK WEIGHT SUPPORT

**Exists? NO**

| Capability | Present? | Notes |
|-----------|---------|-------|
| List-level Track Weight yes/no | NO | — |
| Weight hidden/disabled mode | NO | — |
| Optional weight display | NO | — |
| List-level weight preference | NO | — |

**Current weight assumptions:**
- Every `GearItem` has `weightOz: number`. Items with `weightOz: 0` display as 0 / blank.
- `WeightSummary` always computes and displays weight totals.
- `GearRow` and `MobileWedgeCategory` always render weight columns/rows.
- No conditional rendering gated on a "show weight" flag exists anywhere.

**Can weight data remain stored while hidden?**  
Yes — items with `weightOz: 0` are already stored and summaries compute correctly (summing zeros produces zero). If a `trackWeight: false` mode is implemented, the safest path would be rendering weight UI conditionally without clearing the stored values. The data model supports this without schema changes at the item level.

**Adding `trackWeight` to LockerEntry:**  
`LockerEntry` (in `LockerPanel.tsx`) is the persisted structure. Adding optional `trackWeight?: boolean` would be backwards-compatible (older entries would `undefined`-fallback to `true`). However, this field is also persisted server-side via `/api/locker` POST. The server-side Locker table schema would need a column addition (migration required) to persist it. Without a server migration it would only persist on the current device.

---

## E. TOOLTIP / HELP ARCHITECTURE

### System
Three distinct mechanisms exist, none unified:

**1. HTML `title` attribute (primary — used throughout)**
- 14 instances in `Checklist.tsx` toolbar buttons
- Exact text is inline at each button
- Browser-native presentation
- No shared registry or centralization
- No `aria-describedby`

**2. CSS class-based hover/focus tooltip (one instance — Share disabled state)**
- `Checklist.tsx` lines 2655-2664
- An absolutely-positioned `<div>` adjacent to the trigger
- Desktop: `opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 hidden md:block`
- Mobile: a separate `showEmptyShareMsg` boolean state toggled by click (`onClick`) and closed by blur (`onBlur`). Rendered when true via `md:hidden` wrapper.
- Text: `"Add some gear items before creating a share link."`
- This is the only touch-disclosure pattern in the codebase.

**3. Radix UI `Tooltip` component (`components/ui/tooltip.tsx`)**
- A properly-built Radix tooltip component exists (TooltipProvider, Tooltip, TooltipTrigger, TooltipContent)
- **NOT used in `Checklist.tsx` or any main app page**
- Used only inside `components/ui/sidebar.tsx` (ShadCN UI sidebar, not the TrailWeigh app sidebar)
- `TooltipContent` renders with `bg-primary px-3 py-1.5 text-xs text-primary-foreground`, animated, portaled

### Hover
`title` attributes → browser-native hover tooltip. CSS `group-hover:opacity-100` for the Share disabled case.

### Keyboard
`title` attributes — shown on keyboard focus in Firefox; **not reliably shown in Chrome or Safari**. The CSS share-tooltip uses `group-focus-within:opacity-100` which works on keyboard focus in all browsers. The Radix Tooltip component works on focus by default but is not used in the main app.

### Touch
Only the Share-disabled case has a touch mechanism (click-toggle boolean state + onBlur dismiss). No reusable touch help mechanism exists for the toolbar buttons or any other context.

### Centralized / inline
**Inline only.** All `title` text is hardcoded at each element. No tooltip text registry, no shared constants.

---

## F. CURRENT CREATE-FLOW TOOLTIP GAPS

| Control | Exists? | Current help |
|---------|---------|-------------|
| "New" trigger button (step 1) | EXISTS | `title="Create a new pack list as an exact copy of the current file? All gear-item checkboxes in the new file will be unchecked. The original file will not be changed."` _(text is inaccurate — handleNew creates blank list, not copy)_ |
| "Create New List" confirm button (step 2) | EXISTS (button) | **NO title/tooltip** |
| "Cancel" confirm button (step 2) | EXISTS (button) | **NO title/tooltip** |
| List-purpose cards / template chooser | DOES NOT EXIST | — |
| "View all templates" | DOES NOT EXIST | — |
| Track Weight Yes/No | DOES NOT EXIST | — |
| Create/continue/confirm in guided flow | DOES NOT EXIST | — |
| Close / Escape button for guided flow | DOES NOT EXIST | — |

**Additional gap:** The `title` text on the step-1 trigger claims the new list is "a copy of the current file" with unchecked boxes. This is wrong — `handleNew()` creates a blank list. This should be corrected when the feature is renamed/restructured.

---

## G. RESPONSIVE ARCHITECTURE

### Mobile branch
No separate mobile render branch for the New control or the new-list flow. All code is shared.

### Desktop branch
No separate desktop render branch for the New control or the new-list flow. All code is shared.

### Breakpoint
- `sm` (640px): header switches from `flex-col` (logo row + actions row stacked) to `flex-row` (single row)
- `md` (768px): "New" button text (`hidden md:inline`) appears; below 768px the button is icon-only

### Leakage risks
**HIGH.** The New button and its confirm step are in the `<header>` which renders at all viewport sizes from a single code path. Any change — rename, visual change, behavior change — immediately affects all viewports. There is no breakpoint-isolated branch to make safe mobile changes.

### Future Create New List responsive isolation
The recommended pattern (matching the rest of the app): create a `CreateNewListModal.tsx` component that is triggered by the header button but renders as a modal overlay. The modal itself can have responsive internal layout (`flex-col` on mobile, more spacious on desktop). The trigger button in the header can be renamed without viewport risk. The modal's internal layout is isolated by its own responsive classes.

---

## H. MINIMUM SAFE IMPLEMENTATION SEQUENCE

### Prompt 1 — Rename trigger + guided-flow shell
**Scope:** Replace the inline two-step confirm with a proper modal component. Rename visible label.

Actions:
- Change `setShowNewConfirm(true)` to `setShowNewListModal(true)` (or similar)
- Remove the `showNewConfirm` inline expand from the header actions row
- Create `CreateNewListModal.tsx` — modal with: list-name input + "Create" button + "Cancel" button + Escape close + focus trap
- This modal calls `handleNew()` (or an improved version) on confirm
- Rename the visible button label: `<span className="hidden md:inline">Create New List</span>` (or abbreviated)
- Fix the `title` tooltip text to accurately describe behavior
- **No template selection yet. No Track Weight yet.**

Expected files: `Checklist.tsx`, new `CreateNewListModal.tsx`

### Prompt 2 — List-type cards
**Scope:** Add purpose chooser inside the modal.

Actions:
- Add list-type selection step inside `CreateNewListModal.tsx`: Backpacking / Travel / Business Trip / Road Trip / Emergency Kit / Blank
- Create `data/listTemplates.ts` with default category sets per type
- Pass selected type to `handleNew()` (or a new `handleNewWithType(type)`)
- Store type in the newseed so `parseV5` can pre-populate categories
- No DB/schema changes needed yet (type is only used to seed the initial category order; not persisted in LockerEntry)

Expected files: `CreateNewListModal.tsx`, new `data/listTemplates.ts`, `Checklist.tsx` / `usePackData.ts` (minor newseed parsing)

### Prompt 3 — Track Weight choice
**Scope:** Add Track Weight step to the modal.

⚠️ **DB migration gating decision required before this prompt:**
- Adding `trackWeight` to `LockerEntry` persists per-device without a migration
- Server-side persistence of `trackWeight` requires a new column in the locker table (Drizzle migration)
- The user/product owner must decide: device-local only (no migration) vs fully synced (migration required)

Actions (post-decision):
- Add Track Weight Yes/No step to `CreateNewListModal.tsx`
- Store `trackWeight` in newseed; on load, apply to rendering
- Conditionally suppress weight UI (`WeightSummary`, `GearRow` weight columns, `MobileWedgeCategory` weight rows)

Expected files: `CreateNewListModal.tsx`, `WeightSummary.tsx`, `GearRow.tsx`, `MobileWedgeCategory.tsx`, migration if server-sync needed

### Prompt 4 — Tooltip gap fill + touch-help support
**Scope:** Fill help gaps; build reusable touch mechanism.

Actions:
- Add tooltips to all new modal controls (using Radix `Tooltip` or the existing CSS pattern)
- Build a reusable `<HelpTip>` component wrapping Radix Popover for touch-safe help (click-open, Escape/blur close)
- Fill the two existing gaps: "Create New List" confirm button + "Cancel" confirm button
- Do NOT rewrite any existing `title` text

Expected files: new `components/HelpTip.tsx`, `CreateNewListModal.tsx`, `Checklist.tsx`

---

## I. FIRST IMPLEMENTATION FILE SCOPE

For Prompt 1 (rename + guided-flow shell):

| File | Change |
|------|--------|
| `artifacts/pack-checklist/src/pages/Checklist.tsx` | Remove inline `showNewConfirm` confirm step; add `showNewListModal` state; import and render `CreateNewListModal`; rename button label |
| `artifacts/pack-checklist/src/components/CreateNewListModal.tsx` | NEW — modal with list-name input, Create + Cancel buttons, Escape close, focus trap; calls existing `handleNew()` |

**No other files need to change for Prompt 1.**

---

## J. MATERIAL UNCERTAINTY

**YES — two items:**

**1. `handleNew()` title text is currently wrong.**
The existing `title` on the step-1 trigger says "a copy of the current file? All gear-item checkboxes in the new file will be unchecked." This is factually wrong — `handleNew()` creates a blank list, not a copy. It was probably written when New originally did copy the current file. This incorrect text is preserved today and must be corrected in Prompt 1 without rewriting any intentional existing tooltip text.

**2. Track Weight server persistence requires a decision before Prompt 3.**
Adding `trackWeight?: boolean` to `LockerEntry` works client-side without any breaking change (optional field, backwards compatible). But persisting it server-side requires a Drizzle migration to the locker table. The product owner must decide before Prompt 3 whether Track Weight is device-local (no migration, works today) or fully synced across devices (requires migration). This does not block Prompts 1 or 2.

---

## Confirmation: NO Application Code Changed

```
git status --short: only untracked attached_assets/ file
git diff HEAD: (no output)
```

Zero application files were created, modified, or deleted during this diagnostic.
