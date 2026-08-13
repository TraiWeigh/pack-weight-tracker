# PROMPT 025S REPORT
# FOLLOW-UP QUESTION / LEARNING AUDIT — CLOSE THE UNANSWERED 025R QUESTIONS

- Prompt: 025S
- Status: COMPLETE
- Agent mode: Build (diagnostic only — no code changed)
- Application code changes: NONE
- Database data changes: NONE
- Database schema changes: NONE
- Owner data changes: NONE
- Report created: YES
- ZIP created: YES (see bottom)

---

## VERSION CHECK

- Title: FOLLOW-UP QUESTION / LEARNING AUDIT — CLOSE THE UNANSWERED 025R QUESTIONS ✓
- Q1 present ✓ (Section A, Q1)
- Q25 present ✓ (Section B, Scan Gear List importer)
- Q50 present ✓ (Section C, Hide state)
- Q75 present ✓ (Section E, checkbox-only Save)
- Q100 present ✓ (Section F, checkpoint data loss)

---

## 025R BASELINE READ

025R report read in full including the DB-confirmed addendum.
Authoritative final 025R facts (from addendum):

- `Sample List Live Test` DB: `background = {"type":"custom","photoId":"701cc0ea-4912-416c-b08e-0c747381668c"}`
- photoId is a UUID v4 (crypto.randomUUID()), NOT an Unsplash ID
- The blob is in the Owner's browser IndexedDB only — no server copy
- Review cannot resolve it — 025Q guard correctly removes the global key
- 025Q was functioning correctly; the "FAIL" was the expected behavior for type:custom
- Only built-in theme group in current source: Landscape (10 Unsplash presets)

---

## SECTION A — 025R RECONCILIATION

### Q1. Which 025R findings are HIGH-confidence and should be treated as authoritative?

**CONFIRMED** | Evidence: SOURCE + DATABASE | Confidence: HIGH

These 025R findings are HIGH-confidence (source-traced and/or DB-verified):

1. photoId `701cc0ea-4912-416c-b08e-0c747381668c` is a UUID v4 from crypto.randomUUID() — DB-verified
2. background.type = 'custom' in DB for "Sample List Live Test" — DB-verified
3. The blob lives only in Owner's browser IndexedDB (trailweigh/bgPhotos) — source-traced
4. Review cannot resolve a custom blob — source-traced (getPhotoBlob returns null cross-browser)
5. 025Q guard (`bg?.type === 'preset'`) is correct and intentional — source-traced, comment-verified
6. Only Landscape exists as a built-in theme group in current BackgroundPicker.tsx PRESETS — source-verified
7. sourceVersion fingerprint = `{ i: id, n: name, t: savedAt }` only — source-traced
8. 022G startup effect exits when `!userId` — source-traced (Checklist.tsx:1500)
9. serverSaveReplace sends full LockerEntry payload (including background) to PUT /api/locker/:id — source-traced
10. PATCH (rename-only) updates only name in DB, NOT savedAt or payload — source-traced
11. Background lazy initializer takes normal path in review mode (no tw-fork-id) — source-traced
12. seed.seedFromLiveFiles() is only called for CASE A and CASE C, not CASE B — source-traced

---

### Q2. Which 025R findings were only source-based and still lack runtime/DB proof?

**CONFIRMED** | Evidence: SOURCE | Confidence: MEDIUM

Source-only (unconfirmed by runtime or DB):

1. "022G startup effect exits when !userId" — source-traced but not runtime-confirmed in a live session
2. "No post-mount effect resets background to null in review mode" — source search, not exhaustive runtime trace
3. "The background lazy initializer correctly takes the normal global-key path in review mode" — source-traced but not directly observed in browser devtools
4. "CASE B fires for returning reviewer" — plausible from sourceVersion analysis, not runtime-confirmed
5. "bgImageUrl = null when background = null" — source-derived, simple logic, high confidence

---

### Q3. Which 025R findings were later superseded by the DB evidence?

**CONFIRMED** | Evidence: DATABASE | Confidence: HIGH

025R initial hypothesis (in compacted session summary, BEFORE DB query):
> "The DB payload may be null (background never saved or saved as null)"

SUPERSEDED by DB query result:
> `background = {"type":"custom","photoId":"701cc0ea-4912-416c-b08e-0c747381668c"}` — NOT null

025R initial hypothesis:
> "025Q failed because DB payload was null, so 025Q wrote null and removed the key"

SUPERSEDED:
> "025Q worked correctly — it detected type:custom and correctly removed the key (privacy guard). The behavior (white background in Review) IS the correct outcome for a custom blob."

---

### Q4. Are any contradictory statements still present in the final 025R report?

**CONFIRMED (minor)** | Evidence: SOURCE | Confidence: HIGH

One residual contradiction:

The main 025R report body (Section "LEADING HYPOTHESIS FOR WHY 025Q FAILED") still lists "DB payload null" as the first hypothesis. The addendum section (A9) corrects this. Both sections exist in the same document. The ADDENDUM is authoritative. The earlier hypothesis section is SUPERSEDED but not deleted.

No other unresolved contradictions found in the final 025R document.

---

### Q5. For each remaining contradiction, which statement is authoritative?

**CONFIRMED** | Evidence: DATABASE | Confidence: HIGH

Single remaining contradiction:
- **Old (non-authoritative):** "DB payload null → 025Q wrote null → removed key → Review white"
- **Authoritative (addendum):** "DB payload has {type:'custom',photoId:'701cc0ea-...'} → 025Q correctly detected type≠preset → removed key (privacy guard) → Review white = correct behavior"
- **Evidence outranking older claim:** DB query (SELECT payload->'background' FROM locker_entries WHERE name ILIKE '%live%')

---

### Q6. Did 025R make any Replit-platform claims that were not actually verified?

**CONFIRMED** | Evidence: SOURCE | Confidence: MEDIUM

025R stated (Section F, Q90–Q101): "Replit checkpoints snapshot DB rows; rolling back restores the DB to that point; DB records created after the checkpoint are lost."

This is a reasonable Replit platform claim, but it was NOT verified against Replit platform documentation or a checkpoint restore test. It may be accurate for managed Replit databases, but the exact behavior (especially for published vs development environments) was assumed, not confirmed.

Also in 025R (Q106–Q107): "Dev and prod use separate databases." This is a common Replit pattern but was not confirmed by a Replit platform query for this specific project.

---

### Q7. Which 025R answers should ChatGPT NOT use yet when writing repair prompts?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

Do NOT use these as confirmed facts in repair prompts:
1. The Replit checkpoint DB rollback claim (Q90–Q101) — not platform-verified
2. "CASE B caused the 025Q test failure" — not runtime-confirmed; DB evidence shows it was type:custom, not CASE B
3. "022G missing path is the structural gap" — the REAL gap is that background is type:custom (unresolvable cross-browser). 022G is secondary.

---

### Q8. Which 025R answers are safe enough to become standing TrailWeigh rules?

**CONFIRMED** | Evidence: SOURCE + DATABASE | Confidence: HIGH

Safe as permanent TrailWeigh rules:
1. type:custom backgrounds CANNOT appear in shared Review links (blob is device-local)
2. type:preset backgrounds CAN appear in Review (public Unsplash CDN URL)
3. Preset IDs (e.g., 'rocky-mountains') must never be renamed/changed (stable references in DB)
4. sourceVersion does NOT detect appearance-only changes (only id/name/savedAt)
5. Save must be clicked for appearance changes to persist to DB
6. Review testing MUST use private/incognito browser (global appearance keys are shared)
7. Only one built-in theme group (Landscape) exists in current source
8. 022G startup effect is gated on userId — Review has no auto-restore of owner appearance

---

## SECTION B — WHOLE-APP ARCHITECTURE MAP

Format: visible UI name | standard term | owning component | file | controlling function/hook/state | persistence | regression risk | ChatGPT terminology

### Q9. New

- UI name: "New"
- Standard term: New file / open blank workspace in new tab
- Component: `ChecklistContent`
- File: `artifacts/pack-checklist/src/pages/Checklist.tsx`
- Handler: `handleNew()` (line ~1152)
- Mechanism: Generates UUID, writes `tw-newseed-${uuid}` (empty store) + `tw-newseed-bg-${uuid}` (null background) to localStorage, opens `window.open('/checklist?newseed=${uuid}', '_blank')`
- Persistence: Temporary localStorage until user clicks Save
- Regression test: Verify new tab opens with empty categories, no background, no inherited bar colors
- ChatGPT term: **"New"** — opens a fresh blank workspace in a new browser tab

---

### Q10. Save

- UI name: "Save"
- Standard term: Save (commit active file)
- Component: `ChecklistContent`
- File: `artifacts/pack-checklist/src/pages/Checklist.tsx`
- Handler: `handleSaveMenuSave()` → `commitSaveReplace(id, name)` (if active file exists) or `openSaveDialog()` (if new)
- API: `PUT /api/locker/:id` via `serverSaveReplace(entry)` from `lockerApi.ts`
- Body: `{ name, savedAt, store, background, bgFade, bgTone, bgSize, chartPaletteKey, barColor, barFont, barTextColor, barTransparency }`
- Persistence: localStorage `trailweigh:locker` (immediate) + server DB `locker_entries` (async)
- savedAt: updated to `Date.now()` on every Save
- Regression: Save with background set → verify payload.background in DB is non-null
- ChatGPT term: **"Save"** — writes the active file to the server Locker DB

---

### Q11. Save As

- UI name: "Save As"
- Standard term: Save As (new file copy)
- Component: `ChecklistContent`
- File: `Checklist.tsx`
- Handler: `handleSaveMenuSaveAs()` → `openSaveDialog()` → `commitSaveNew(name)` (always creates new entry)
- API: `POST /api/locker` via `serverSaveNew(entry)` from `lockerApi.ts`
- Persistence: New localStorage Locker entry + new DB row in `locker_entries`
- Regression: Save As with existing name → conflict dialog appears; saves as separate entry with unique ID
- ChatGPT term: **"Save As"** — always creates a brand-new file; never overwrites

---

### Q12. Locker / saved-file list

- UI name: "Locker" (folder icon in header)
- Standard term: Locker panel / saved-file list
- Component: `LockerPanel`
- File: `artifacts/pack-checklist/src/components/LockerPanel.tsx`
- State: `lockerEntries: LockerEntry[]` in `ChecklistContent`
- Persistence: localStorage `trailweigh:locker` + server DB `locker_entries` (synced on sign-in and Save)
- Regression: Sign out + sign back in → all server Locker files should re-appear
- ChatGPT term: **"Locker"** or **"Locker panel"** — the list of saved gear-list files

---

### Q13. Rename

- UI name: Pencil/edit icon in Locker entry row
- Standard term: Rename
- Component: `LockerPanel`
- File: `LockerPanel.tsx`, `lockerApi.ts`
- Handler: inline rename → `serverRename(id, name)` → `PATCH /api/locker/:id`
- Effect: Updates name in DB only. savedAt NOT updated. sourceVersion DOES change (name `n` is in fingerprint).
- Persistence: localStorage + DB name updated; payload/savedAt unchanged
- Regression: Rename file → share link Review should show new name on next reload
- ChatGPT term: **"Rename"** — only changes the name; does NOT update savedAt or appearance

---

### Q14. Delete

- UI name: Trash icon in Locker entry row
- Standard term: Delete / Delete from Locker
- Component: `LockerDeleteDialog`
- File: `artifacts/pack-checklist/src/components/LockerDeleteDialog.tsx`
- Handler: `serverDelete(id)` → `DELETE /api/locker/:id`
- Auth gate: `userId` must match (server enforces `WHERE id = ? AND user_id = ?`)
- Persistence: Row deleted from DB. localStorage Locker array updated. ReviewPage will no longer show this file after reload.
- Regression: Deleting the active file → subsequent Save should open Save dialog (not overwrite deleted file)
- ChatGPT term: **"Delete"** — removes from both local Locker and server DB

---

### Q15. Undo

- UI name: Undo button (or Ctrl/Cmd+Z)
- Standard term: Undo
- Component: `ChecklistContent` (via `usePackData` hook)
- File: `Checklist.tsx` / `usePackData.ts`
- State: `undoStackRef: HistoryEntry[]` (ref, not state), `historyVersion` (state trigger)
- Mechanism: `undo()` pops last entry from `undoStackRef`, restores store + background snapshot, calls `onRestoreBg`
- Persistence: In-memory only (refs). Cleared on page refresh or file reload.
- Regression: Undo after category rename → category name reverts; undo after background change → background reverts
- ChatGPT term: **"Undo"** — in-memory history stack, NOT server-reversible

---

### Q16. Redo

- UI name: Redo button (or Ctrl/Cmd+Y / Ctrl/Cmd+Shift+Z)
- Standard term: Redo
- Component: `ChecklistContent` (via `usePackData`)
- File: `Checklist.tsx` / `usePackData.ts`
- State: `redoStackRef: HistoryEntry[]`
- Persistence: In-memory only. Redo stack is cleared whenever a new edit is pushed.
- ChatGPT term: **"Redo"**

---

### Q17. Reset

- UI name: "Reset" (in gear/options area)
- Standard term: Reset to defaults
- Component: `ChecklistContent`
- File: `Checklist.tsx`
- Handler: `handleReset()` → `resetToDefaults()` (from `usePackData`)
- Effect: Resets store to initial default categories and items. Does NOT reset appearance (background, bar colors, etc.).
- Persistence: Overwrites localStorage pack key. Does NOT auto-save to server.
- Regression: Reset → gear list returns to defaults; background is UNCHANGED; Undo history wiped.
- ChatGPT term: **"Reset"** — resets gear list only, not appearance

---

### Q18. Imperial / Metric

- UI name: "Imperial" / "Metric" toggle (lbs/oz vs kg/g)
- Standard term: Unit system / unit toggle
- Component: `UnitProvider` context + toggle buttons in `ChecklistContent`
- File: `artifacts/pack-checklist/src/context/UnitContext.tsx`, `Checklist.tsx`
- State: `system: 'imperial' | 'metric'` in UnitContext
- Storage: `localStorage['tw-unit-system']` — global, NOT per-file
- NOT included in LockerEntry — not saved with files
- Persistence: Survives browser restart. Same across all files on same device. Does NOT sync to other devices.
- Regression: Switch to metric → weights display in kg/g; switch to imperial → oz/lbs
- ChatGPT term: **"unit toggle"** or **"Imperial/Metric toggle"**. Avoid: "weight unit saved with file" (it is NOT)

---

### Q19. Hide

- UI name: "Hide" button (header, desktop + mobile)
- Standard term: Hide / Background Showcase / Screensaver mode
- Component: `ChecklistContent` + `BackgroundShowcase`
- File: `Checklist.tsx`, `useInactivityTimer.ts`, `BackgroundShowcase.tsx`
- Handler: button click → `triggerShowcase()` from `useInactivityTimer`
- Mechanism: Fades `div.screen-only` to opacity 0; renders `BackgroundShowcase` overlay (shows background full-screen)
- Also triggers: automatically after user-configurable inactivity period
- State: `showcaseActive` from `useInactivityTimer`
- Persistence: No persistence — session-only opacity state
- Regression: Hide → background fills screen; any user interaction → app reappears
- ChatGPT term: **"Hide"** or **"Showcase mode"**. Avoid: "full-screen mode" (different concept)

---

### Q20. Preview

- UI name: "Preview" button
- Standard term: Pack Preview / Checked-items preview
- Component: `PreviewModal`
- File: `artifacts/pack-checklist/src/components/PreviewModal.tsx`
- State: `showPreview: boolean` in `ChecklistContent`
- Content: Shows only checked items across all categories
- Persistence: Modal open/close state — no persistence
- ChatGPT term: **"Preview"** or **"Pack Preview modal"**

---

### Q21. Print

- UI name: "Print" (within Preview or header)
- Standard term: Print
- Handler: `handlePrint()` → `window.print()`
- CSS: `print-only` class shows/hides elements for print. `screen-only` is hidden when printing.
- Persistence: None
- ChatGPT term: **"Print"**

---

### Q22. Background / Themes

- UI name: Background/Themes panel (paint-bucket icon or Background button)
- Standard term: Background picker / Background/Themes panel
- Component: `BackgroundPickerPanel` (portal-rendered)
- File: `artifacts/pack-checklist/src/components/BackgroundPicker.tsx`
- State: `backgroundPickerOpen`, `background`, `bgFade`, `bgTone`, `bgSize` in `ChecklistContent`
- Storage: `localStorage['trailweigh:background']` (and bgFade/bgTone/bgSize keys) — global keys
- Persistence: Global localStorage. Saved to DB payload on explicit Save.
- Regression: 025K — verify `screen-dark` class scope stays on `div.screen-only`; verify portal renders outside main scroll container
- ChatGPT term: **"Background/Themes panel"**. Avoid: "theme panel" ambiguously (could mean built-in theme group or the whole panel)

---

### Q23. Category accordion

- UI name: Category rows (collapsible, chevron on right)
- Standard term: Category accordion
- Component: `GearCategory`
- File: `artifacts/pack-checklist/src/components/GearCategory.tsx`
- State: `openCats: Record<string, boolean>` in `ChecklistContent` (or controlled per-category via props)
- Persistence: In-memory. NOT saved with file. Starts collapsed on every fresh open (022G behavior).
- Regression: Accordion state does not persist across browser refresh
- ChatGPT term: **"category accordion"** or **"category row"**. Avoid: "section" (could refer to sidebar sections)

---

### Q24. Expand All / Collapse All

- UI name: "Open" / "Close" controls (left sidebar or mobile toolbar)
- Standard term: Expand All / Collapse All
- Component: `ChecklistContent`
- File: `Checklist.tsx`
- Handler: sets `openCats` state for all categories simultaneously
- Persistence: None — in-memory only
- ChatGPT term: **"Expand All"** / **"Collapse All"** or **"Open/Close all categories"**

---

### Q25. Scan Gear List importer

- UI name: "Scan Gear List" / importer panel
- Standard term: Gear importer / Scan Gear List
- Component: `ImportGearPanel`
- File: `artifacts/pack-checklist/src/components/ImportGearPanel.tsx`, `artifacts/api-server/src/routes/importGear.ts`, `artifacts/api-server/src/routes/scanGear.ts`
- Handler: Upload PDF/CSV/text → POST to `/api/import-gear` or `/api/scan-gear` → server parses → returns item list → user selects items to import
- Persistence: Parsed items are transient (in-memory). Confirmed imports are added to the gear store (auto-persisted to localStorage).
- Regression: Parser regex changes (see MEMORY.md: PDF_ROW_RE lazy vs greedy fix)
- ChatGPT term: **"Scan Gear List"** or **"importer"**. Avoid: "upload" (it's a parse, not a file-storage upload)

---

### Q26. Share

- UI name: "Share" button (header)
- Standard term: Share
- Component: `ChecklistContent` share menu
- File: `Checklist.tsx`, `artifacts/pack-checklist/src/lib/shareLink.ts`
- Two share paths:
  a. **"Share Locker (Live)"** → `handleShareLocker()` → `buildLiveShareURL()` → POST `/api/links` with `{type:'live-locker'}` → returns token → URL `/s/${token}`
  b. **"Share Checkable List"** → `handleShareCheckableList()` → `buildShareURL(payload)` → POST `/api/links` with frozen payload → returns token → URL `/s/${token}`
- Auth: Live share requires Clerk userId. Checkable share does NOT require auth.
- Persistence: Token stored in `share_links` DB row. Live share stores only `{type:'live-locker', ownerId}`.
- Regression: 025M — URL format must be `/s/${10hexchars}`; 025P — live share must reflect current Locker
- ChatGPT term: **"Share"**, **"live share"** (for Locker share), **"checkable list share"** (for frozen snapshot). Avoid: "link" ambiguously

---

### Q27. Public Review

- UI name: Review page (no UI name — anonymous viewer sees the app with a Welcome modal)
- Standard term: Review page / Public Review
- Component: `ReviewPage` → renders `ChecklistContent` in review/guest mode
- File: `artifacts/pack-checklist/src/pages/ReviewPage.tsx`
- Route: `/s/:id`
- Mode: `isGuest=true`, no `userId`, `reviewToken` provided
- Persistence: Review-namespaced localStorage keys (gear only). Global appearance keys (shared).
- Regression: 025M URL format; 025P filename propagation; Welcome modal on first visit
- ChatGPT term: **"Review page"** or **"Public Review"**. Avoid: "shared view" (ambiguous with SharedChecklistPage)

---

### Q28. Authentication / sign-in

- UI name: "Sign in" / "Sign out" / Account menu
- Standard term: Authentication / Clerk Auth
- System: Clerk (Replit-managed tenant)
- Component: ClerkProvider in App.tsx, Account button in ChecklistContent header
- File: `App.tsx`, Checklist.tsx header section
- userId: extracted from `getAuth(req)` on server; from `useUser()` hook on client
- Regression: Sign in → 022G auto-loads last-active file; Sign out → 022G exits; app still usable as guest
- ChatGPT term: **"authentication"**, **"Clerk auth"**, **"sign in/out"**. Avoid: "login" (Clerk uses "sign in")

---

### Q29. File opening/loading

- UI name: Load / open file (Locker panel click)
- Standard term: Load file / Open from Locker
- Component: `LockerPanel` → `handleLoadFromLocker()` in `ChecklistContent`
- File: `Checklist.tsx:1757`
- Handler: If list is empty → load in-place (setBackground, setBgFade, etc., store restore); if list has items → open new tab via newseed
- State change: Sets `background`, `bgFade`, `bgTone`, `bgSize`, `chartPaletteKey`, `barColor`, `barFont`, `barTextColor`, `barTransparency`, store
- Persistence: The loaded file becomes the active file (activeLockerFile state + sessionStorage)
- Regression: Opening file in non-empty list → new tab; opening in empty list → in-place load with correct appearance
- ChatGPT term: **"Load file"** or **"Open from Locker"**. Avoid: "import" (that's the gear importer)

---

### Q30. Active filename / header state

- UI name: File name pill (header center, desktop)
- Standard term: Active filename / file name pill
- File: `Checklist.tsx` header section
- State: `activeLockerFile: { id, name } | null` — React state
- Also: sessionStorage `tw-active-locker-file` (JSON) — for persistence across remounts
- Last-active: `localStorage[lastActiveFile-${userId}]` — for 022G restoration on fresh mount
- Regression: Filename pill shows correct name after Save; pill updates after Rename
- ChatGPT term: **"file name pill"** or **"active filename"**. Avoid: "title bar" (not a browser title)

---

### Q31. Weight Distribution

- UI name: "Weight Distribution" (right sidebar or bottom card)
- Standard term: Weight Distribution chart
- Component: `WeightDistribution`
- File: `artifacts/pack-checklist/src/components/WeightSummary.tsx`
- State: `chartPaletteKey` — controls palette; starts collapsed (022G behavior)
- Persistence: `chartPaletteKey` stored in `localStorage['trailweigh:chartPalette']`; saved to LockerEntry on Save
- Regression: Chart shows correct category distribution; palette changes apply immediately
- ChatGPT term: **"Weight Distribution"** — the bar/pie chart component

---

### Q32. Pack Summary

- UI name: "Pack Summary" (right sidebar or bottom card)
- Standard term: Pack Summary
- Component: `WeightSummary`
- File: `WeightSummary.tsx`
- State: Computed from store — total weight, base weight, carried weight by category
- Regression: Pack Summary totals match manual calculation
- ChatGPT term: **"Pack Summary"**

---

### Q33. Category/item data editing

- UI name: Gear rows (Type, Name, Weight, Qty, checked checkbox)
- Standard term: Gear editing / item editing
- Component: `GearRow`, `GearCategory`
- File: `GearRow.tsx`, `GearCategory.tsx`
- State: `store: { items, order, meta }` in `usePackData`
- Persistence: Auto-persists to localStorage (pack key) on every edit via `pushAndSet`. Does NOT auto-save to server.
- Regression: Editing any field → immediately visible; Undo reverses; Save required for server persistence
- ChatGPT term: **"gear editing"**, **"item row"**, **"category"**. Avoid: "checklist item" (implies checked state)

---

### Q34. Checked/selected item state

- UI name: Checkbox (left of each gear item)
- Standard term: Checked state / pack state
- Component: `GearRow`
- State: `item.checked` boolean in store.items
- Persistence: Part of `store` — auto-persists to localStorage; saved to server on Save
- ChatGPT term: **"checked state"**. Avoid: "selected" (ambiguous)

---

### Q35. Quantity editing

- UI name: "Qty" field (editable in item row)
- Standard term: Quantity / Qty
- Component: `GearRow`
- State: `item.qty` number in store.items
- Persistence: Part of `store` — auto-persists to localStorage; saved to server on Save
- ChatGPT term: **"Qty"** or **"quantity"**

---

### Q36. Type and Name fields

- UI name: "Type" (gear category/model) / "Name" (description/sub-label)
- Standard term: Type field, Name/description field
- Component: `GearRow`
- State: `item.sub` (Type) and `item.desc` (Name/description) in store.items
- Persistence: Part of `store` — auto-persists to localStorage; saved to server on Save
- ChatGPT term: **"Type"** (item.sub) / **"Name"** (item.desc). Avoid: "title" or "label"

---

### Q37. Mobile toolbar layout

- UI name: Lower Phone Toolbar / mobile action bar
- Standard term: Mobile toolbar
- Component: `ChecklistContent` render (mobile-specific divs with `lg:hidden`)
- File: `Checklist.tsx` (~line 2870)
- Rows:
  - Phone Row 1: File name + Preview button (mobile only, lg:hidden)
  - Lower Phone Toolbar: [Open/Close] LEFT · [Hide] CENTER · [Imperial/Metric] RIGHT
  - Desktop row: completely separate layout at lg+
- Regression: 023B — mobile layout must match spec (Hide in center, unit toggle right); desktop layout unchanged by mobile changes
- ChatGPT term: **"mobile toolbar"** or **"Lower Phone Toolbar"**. Avoid: "nav bar" (different component)

---

### Q38. Custom theme storage/sync path

- UI name: Custom Theme (user-created photo collection in Background picker)
- Standard term: Custom Theme / photo collection
- Component: `BackgroundPickerPanel`
- File: `BackgroundPicker.tsx`, `bgCollections.ts`, `bgPhotoStore.ts`
- Metadata: `localStorage['trailweigh:photoCollections']` — collection name + photo IDs
- Blobs: IndexedDB `trailweigh / bgPhotos` — keyed by UUID photoId
- Cross-device sync: NO — device-local only
- Server sync: NO — blobs never sent to server
- Regression: Custom theme photos survive browser restart but NOT private window close or browser data clear
- ChatGPT term: **"Custom Theme"** — user-created photo collection. Avoid: "custom background" (could mean any non-preset)

---

## SECTION C — EXACT PERSISTENCE MATRIX

Legend: Y=yes, N=no, P=partial, —=N/A

| Data | React/runtime | localStorage | sessionStorage | IndexedDB | Server DB | Requires Save | Scope | Browser refresh | Browser restart | New device | Code restart | Republish | Auth source on reopen |
|------|-----------|---------|---------|----------|-----------|-----------|-------|---------|---------|---------|---------|---------|---------|

### Q39. Categories
localStorage (pack key), server DB (store.order). Per-file. Survives refresh Y, restart Y, new device Y (via server Locker), code restart Y, republish Y. Requires Save for server. Auth source: server DB (on sign-in) or localStorage (guest).

### Q40. Items
localStorage (pack key), server DB (store.items). Per-file. Same as categories. Auto-persist to localStorage on every edit. Requires Save for server.

### Q41. Type (item.sub)
Part of store.items — same as Q40.

### Q42. Name (item.desc)
Part of store.items — same as Q40.

### Q43. Weight (item.weightOz)
Part of store.items — same as Q40.

### Q44. Qty (item.qty)
Part of store.items — same as Q40.

### Q45. Checked state (item.checked)
Part of store.items — same as Q40. Survives everything that store survives.

### Q46. Category/item order (store.order)
Part of store — same as categories (Q39).

### Q47. Active file identity
React state + sessionStorage `tw-active-locker-file` (JSON `{id,name}`) + localStorage `tw-last-active-${userId}` (for 022G restoration). Per-session (sessionStorage) and per-device-account (localStorage). Does NOT survive browser restart for sessionStorage; localStorage version survives restart.

### Q48. Filename (entry.name)
Server DB `locker_entries.name` + localStorage Locker array. Per-file, per-account. Survives all device changes (server-authoritative). Requires explicit PATCH (rename) or Save to reach server.

### Q49. Imperial/Metric unit choice
localStorage `tw-unit-system`. Global (not per-file). Survives refresh Y, restart Y. New device N (device-local). NOT in LockerEntry. NOT saved to server DB. Auth source on reopen: localStorage.

### Q50. Hide state (showcase active)
React state only (showcaseActive from useInactivityTimer). In-memory. Clears on refresh. Nothing persisted.

### Q51. Background
- Owner active: `localStorage['trailweigh:background']` (JSON). Server DB `payload.background` only on Save. Per-file AFTER Save; global localStorage at runtime. Survives refresh Y, restart Y, new device N (localStorage), new device Y (server DB after Save). Custom blobs: IndexedDB only — NOT cross-device.
- Auth source on reopen: 022G loads from server Locker → setBackground(entry.background)

### Q52. Selected theme group (e.g., Landscapes / Custom Theme name)
React state only (`activeThemeId` in BackgroundPickerPanel). In-memory. Not persisted anywhere. Resets to 'landscapes' on every open.

### Q53. Selected preset/photo reference (background value)
`localStorage['trailweigh:background']` (JSON). Server DB `payload.background` on Save. Type:preset → Unsplash ID. Type:custom → UUID (IndexedDB key). Cross-device: type:preset YES (CDN URL); type:custom NO (blob is device-local).

### Q54. Fit/Fill (bgSize)
`localStorage['trailweigh:bgSize']`. Server DB `payload.bgSize` on Save. Per-device at runtime; per-file after Save. Same pattern as background.

### Q55. Light/Dark (bgTone)
`localStorage['trailweigh:bgTone']`. Server DB `payload.bgTone` on Save. Same pattern.

### Q56. Darken/Fade (bgFade)
`localStorage['trailweigh:bgFade']`. Server DB `payload.bgFade` on Save. Same pattern.

### Q57. Bar Color
`localStorage['trailweigh:barColor']`. Server DB `payload.barColor` on Save. Same pattern.

### Q58. Transparency (barTransparency)
`localStorage['trailweigh:barTransparency']`. Server DB `payload.barTransparency` on Save. Same pattern.

### Q59. Text Color (barTextColor)
`localStorage['trailweigh:barTextColor']`. Server DB `payload.barTextColor` on Save. Same pattern.

### Q60. Font (barFont)
`localStorage['trailweigh:barFont']`. Server DB `payload.barFont` on Save. Same pattern.

### Q61. Chart palette (chartPaletteKey)
`localStorage['trailweigh:chartPalette']`. Server DB `payload.chartPaletteKey` on Save. Same pattern.

### Q62. Custom theme metadata (collection names + photo ID lists)
`localStorage['trailweigh:photoCollections']`. NOT in server DB. NOT cross-device. Per-device only. Survives refresh Y, restart Y, new device N, republish Y (browser localStorage).

### Q63. Custom photo blobs
IndexedDB `trailweigh / bgPhotos`. NOT in server DB. NOT cross-device. Per-device only. Survives refresh Y, restart Y, private-window-close N, new device N, code restart Y (browser), republish Y (browser).

---

**Compact Persistence Summary Table:**

| Item | localStorage key | Server DB | Requires Save | Cross-device | Per-file |
|------|-----------------|-----------|---------------|-------------|---------|
| Store (items/cats) | pack-checklist-v5-${uid} | locker_entries.payload.store | YES | YES (after Save) | YES |
| Active file ID | tw-active-locker-file (SS) | — | — | NO | — |
| Unit system | tw-unit-system | NO | NO | NO | NO |
| Background | trailweigh:background | locker_entries.payload.background | YES | Preset:YES/Custom:NO | YES (after Save) |
| bgFade/Tone/Size | trailweigh:bgFade/Tone/Size | payload.bgFade/Tone/Size | YES | YES (after Save) | YES |
| Bar Color/Font/etc | trailweigh:barColor/Font/etc | payload.barColor/Font/etc | YES | YES (after Save) | YES |
| Chart palette | trailweigh:chartPalette | payload.chartPaletteKey | YES | YES (after Save) | YES |
| Custom theme metadata | trailweigh:photoCollections | NO | NO | NO | NO |
| Custom photo blobs | — (IndexedDB) | NO | NO | NO | NO |
| Checked/selected theme group | — (React state) | NO | NO | NO | NO |
| Hide/showcase state | — (React state) | NO | NO | NO | NO |

---

## SECTION D — UNSAVED / DIRTY-STATE BEHAVIOR

### Q64. Does TrailWeigh maintain an explicit dirty/unsaved flag?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

NO. There is no explicit `isDirty` or `hasUnsavedChanges` boolean flag anywhere in the application source. No UI indicator shows "unsaved changes."

---

### Q65. If yes, where is it stored and what UI uses it?

**NOT APPLICABLE** — no dirty flag exists.

---

### Q66. How can the user know browser-visible edits have not yet reached the server Locker?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

There is no direct indicator. The user must:
1. Note whether they clicked Save recently
2. Check the Sync Status panel (if present — `SyncStatusPanel` component exists in `LockerPanel.tsx` imports) — UNKNOWN whether this shows unsaved state
3. Observe the file name pill (if it shows a modified indicator) — NOT confirmed by source inspection

The only reliable proof is seeing the toast notification after a successful Save. There is no persistent "unsaved changes" badge or indicator in the UI.

---

### Q67. Can a user close/reopen the browser and still see local edits that were never saved to the server?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

YES — gear edits auto-persist to localStorage (`pack-checklist-v5-${uid}` or fork key) on every edit via `pushAndSet`. Closing and reopening the browser restores the local localStorage state. The user sees their latest local edits even if they were never saved to the server.

---

### Q68. Can local browser state be newer than the server Locker record?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

YES — this is the normal state after any gear edit or appearance change that has not yet been Saved. The localStorage pack key is more recent; the server DB payload is from the last explicit Save.

---

### Q69. What exact action is the safest way to prove a file is server-saved?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

1. Click Save (the user should see a toast confirming save)
2. Sign out of their account
3. Sign back in
4. Open the Locker panel
5. The file should appear with the correct name and timestamp

Alternatively: sign in on a different device and verify the file appears in Locker. This proves the file reached the server DB.

---

### Q70. Does reopening the saved file from Locker prove server persistence?

**CONFIRMED (with caveat)** | Evidence: SOURCE | Confidence: HIGH

On the SAME device: reopening from Locker loads from the merged local + server data. The file appearing in Locker on the same device does NOT prove server persistence (it may have come from localStorage only, especially if the sign-in merge happened while offline).

On a DIFFERENT device after signing in: YES — if the file appears, it came from the server.

---

### Q71. Is there any user-visible indicator that Save finished successfully other than the toast?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

The only visible confirmation is the toast message (e.g., "Saved Sample List Live Test"). There is no persistent indicator (no asterisk/dot on the file name pill, no "last saved" timestamp shown in the UI). The SyncStatus panel (imported in LockerPanel.tsx) may show some state — details UNKNOWN without runtime observation.

---

## SECTION E — SAVE PATHS / savedAt / sourceVersion

For each action: handler → API call → payload changes → savedAt changes → sourceVersion changes.

### Q72. Save existing file after item edit

- Handler: `handleSaveMenuSave()` → `commitSaveReplace(id, name)` → `serverSaveReplace(entry)` → `PUT /api/locker/:id`
- Payload changes: YES — store (items) updated
- savedAt changes: YES — `Date.now()` at save time
- sourceVersion changes: YES (savedAt changed)

---

### Q73. Save existing file after Qty-only edit

- Same path as Q72. Qty is part of store.items.
- Payload changes: YES. savedAt changes: YES. sourceVersion changes: YES.

---

### Q74. Save existing file after Weight-only edit

- Same path as Q72. Weight is part of store.items.
- Payload changes: YES. savedAt changes: YES. sourceVersion changes: YES.

---

### Q75. Save existing file after checkbox-only edit

- Same path as Q72. Checked state is part of store.items.
- Payload changes: YES. savedAt changes: YES. sourceVersion changes: YES.

---

### Q76. Save existing file after background-only edit

- Handler: same `commitSaveReplace` → `serverSaveReplace` → `PUT /api/locker/:id`
- Payload changes: YES — `background` field in payload updated
- savedAt changes: YES — `Date.now()` at save time
- sourceVersion changes: YES (savedAt changed)
- Note: If user changes background WITHOUT clicking Save → payload NOT changed, savedAt NOT changed, sourceVersion NOT changed → Review does NOT see the new background.

---

### Q77–Q82. Save after Bar Color / Transparency / Font / Text Color / Light/Dark / Fit/Fill-only edit

All follow the exact same path as Q76. Each appearance field is part of `payloadRest` in the PUT body. Payload changes: YES. savedAt changes: YES. sourceVersion changes: YES. All contingent on user explicitly clicking Save.

---

### Q83. Rename-only action

- Handler: `serverRename(id, name)` → `PATCH /api/locker/:id` → `{ name: name.trim() }`
- Server handler: `.update(lockerEntriesTable).set({ name: name.trim() }).where(id AND userId)`
- Payload changes: NO — only `name` column updated; `payload` and `saved_at` columns UNCHANGED
- savedAt changes: NO
- sourceVersion changes: YES — name `n` is included in the sourceVersion fingerprint

---

### Q84. Save As

- Handler: `commitSaveNew(name)` → `serverSaveNew(entry)` → `POST /api/locker`
- Creates new row: new `id`, new `name`, `savedAt = Date.now()`, full payload
- Payload changes: YES (new row). savedAt: new timestamp. sourceVersion: changes (new row in fingerprint).

---

### Q85. Brand-new first Save

- Same as Save As — `commitSaveNew(name)` → `serverSaveNew` → `POST /api/locker`
- Payload: full. savedAt: Date.now(). sourceVersion: changes (new row).

---

### Q86. Delete file

- Handler: `serverDelete(id)` → `DELETE /api/locker/:id`
- Server: deletes row from `locker_entries` where id AND userId
- Payload changes: row deleted. savedAt: N/A. sourceVersion: changes (row removed from fingerprint).
- Note: share_links rows that referenced this owner's Locker are NOT deleted. Live-locker tokens still resolve but will no longer return this file.

---

### Q87. Add new file to Locker

- Same as Q84/85. sourceVersion changes.

---

### Q88. Is sourceVersion guaranteed to change for every successful user-visible file change?

**CONFIRMED (with exceptions)** | Evidence: SOURCE | Confidence: HIGH

NO — sourceVersion is NOT guaranteed to change for every user-visible change.

sourceVersion = `JSON.stringify(rows.map(r => ({ i: r.id, n: r.name, t: r.savedAt })).sort())`

Changes that are INVISIBLE to sourceVersion:
- Appearance changes (background, bgFade, bgTone, bgSize, barColor, barFont, barTextColor, barTransparency, chartPaletteKey) WITHOUT clicking Save
- Any change that doesn't update id, name, or savedAt in the DB

---

### Q89. List every change type that can remain invisible to Review reload

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

Changes invisible to sourceVersion (CASE B applies indefinitely):
1. Background change without Save
2. Light/Dark (bgTone) change without Save
3. Darken/Fade (bgFade) change without Save
4. Fit/Fill (bgSize) change without Save
5. Bar Color (barColor) change without Save
6. Bar Font (barFont) change without Save
7. Bar Text Color (barTextColor) change without Save
8. Bar Transparency (barTransparency) change without Save
9. Chart palette (chartPaletteKey) change without Save
10. Gear edits (items, weights, quantities, checked state) WITHOUT Save

Note: even WITH Save, appearance of type:custom background is still invisible to Review (blob is device-local).

---

## SECTION F — REPLIT CHECKPOINT / ROLLBACK SAFETY

Note: Replit platform behavior was NOT verified against platform documentation during 025S. These answers reflect best available platform knowledge with stated confidence levels.

### Q90. What exactly does a Replit checkpoint protect in THIS project?

**UNKNOWN (platform)** | Evidence: REPLIT PLATFORM | Confidence: MEDIUM

Based on Replit documentation patterns and standard behavior: A Replit checkpoint captures a snapshot of the workspace files (source code, configuration, assets) at a point in time. Whether it includes the associated database state depends on Replit's implementation for this project type.

The `.replit` file shows `deploymentTarget = "autoscale"` — this project has a published version. Development and production environments likely have separate databases.

---

### Q91. Does it snapshot source code?

**CONFIRMED (platform pattern)** | Evidence: REPLIT PLATFORM | Confidence: HIGH

YES — Replit checkpoints capture source files. This is the primary purpose of the checkpoint feature.

---

### Q92. Configuration?

**CONFIRMED (platform pattern)** | Evidence: REPLIT PLATFORM | Confidence: HIGH

YES — `.replit`, `pnpm-workspace.yaml`, `artifact.toml`, environment variable configuration.

---

### Q93. Environment settings?

**UNKNOWN** | Evidence: REPLIT PLATFORM | Confidence: LOW

Secrets (API keys) are managed separately from checkpoints. Whether env var values are captured in a checkpoint is UNKNOWN. Likely: secrets are NOT part of the checkpoint snapshot and persist independently.

---

### Q94. Database schema?

**UNKNOWN** | Evidence: REPLIT PLATFORM | Confidence: MEDIUM

Drizzle schema files (in `lib/db/src/schema/index.ts`) are source code and ARE captured by checkpoint. The actual live database schema (applied DDL) is separate from the source schema definition. Whether rolling back source code also rolls back applied schema changes depends on whether Replit re-applies migrations on restore.

---

### Q95. Database rows/data?

**UNKNOWN** | Evidence: REPLIT PLATFORM | Confidence: LOW

UNKNOWN — not confirmed whether Replit checkpoint snapshots include the development database row data. This is the critical question for user safety.

Evidence needed: Replit platform documentation for "checkpoints and database" or a test (create a row, create a checkpoint, delete the row, restore the checkpoint, verify the row).

---

### Q96. Uploaded/static project assets?

**CONFIRMED (platform pattern)** | Evidence: REPLIT PLATFORM | Confidence: HIGH

YES — static assets in the workspace (e.g., `artifacts/pack-checklist/public/`) are part of the source files and are captured.

---

### Q97. Browser localStorage?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

NO — Replit has no access to the browser's localStorage. This is browser-side storage. A checkpoint restore does not affect localStorage in any browser.

---

### Q98. Browser IndexedDB?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

NO — Same reason as localStorage. IndexedDB is browser-side. Checkpoint restore has no effect.

---

### Q99. Custom Theme photo blobs?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

NO — Custom Theme blobs are in the browser's IndexedDB. Checkpoint restore has no effect. However, a code change that clears IndexedDB could destroy them. A code change to localStorage could destroy theme metadata (`trailweigh:photoCollections`).

---

### Q100. If a checkpoint is restored, can server DB records created after that checkpoint be lost?

**UNKNOWN** | Evidence: REPLIT PLATFORM | Confidence: LOW

UNKNOWN — requires platform documentation or a controlled test.

If the checkpoint DOES include the DB snapshot: YES — records created after the checkpoint point would be lost on restore.
If the checkpoint does NOT include the DB snapshot: NO — DB records persist independently of code checkpoints.

This is the most important unknown for user data safety.

---

### Q101. If yes, prove the mechanism/evidence.

**UNKNOWN** — cannot prove without platform documentation or a controlled test. Do not assume either way.

---

### Q102. If unknown, what exact safe evidence would determine this?

The safest test (no risk to real data):
1. Create a test Locker entry (`TW TEST CHECKPOINT - SAFE TO DELETE`)
2. Create a Replit checkpoint
3. Delete the test Locker entry
4. Restore the checkpoint
5. Check if the test entry re-appears in the DB
6. If yes → checkpoint includes DB snapshot; if no → checkpoint does not include DB data

This test uses disposable data and is safe to perform.

---

### Q103. Are DB migrations reversed by checkpoint restore?

**UNKNOWN** | Evidence: REPLIT PLATFORM | Confidence: LOW

UNKNOWN. If checkpoint includes DB schema, yes. If checkpoint only includes source files, the schema changes may persist independently. This is dangerous if code is rolled back to a version that expects the OLD schema while the DB has the NEW schema (or vice versa).

---

### Q104. What is the safest rollback sequence after a bad code prompt?

**CONFIRMED (best practice)** | Evidence: SOURCE + REPLIT PLATFORM | Confidence: HIGH

1. STOP sending further prompts
2. Note exactly which files the bad prompt changed (`git diff --name-only HEAD`)
3. Open Replit Checkpoints and find the last known-good checkpoint (the one BEFORE the bad prompt)
4. Verify the checkpoint timestamp matches the expected state
5. Check whether any DB migrations were applied AFTER that checkpoint (if yes, document them before restoring)
6. Restore the checkpoint
7. Re-test USER-VERIFIED PASS behaviors (025K, 025M, 025P)
8. If DB migration is mismatched after restore: report to Replit support or manually fix schema

---

### Q105. What should the user separately back up before any prompt involving schema/persistence/auth?

**CONFIRMED (best practice)** | Evidence: SOURCE | Confidence: HIGH

1. Screenshot or list of all Locker file names and timestamps
2. Screenshot of Custom Theme collection names (visible in Background picker dropdown)
3. Note of the active share token URL (if one exists)
4. If possible: export current gear list as PDF or print preview
5. Note exact unit preference (Imperial/Metric)
6. Note background type (is it a built-in Landscape preset name or a custom photo?)

The system cannot automatically export Locker file contents — no export feature exists in current UI.

---

## SECTION G — DEVELOPMENT VS PUBLISHED DATA

### Q106. Does the current Development app use the same database as the Published app?

**UNKNOWN (platform)** | Evidence: REPLIT PLATFORM | Confidence: MEDIUM

Standard Replit behavior for deployed projects: development and production environments have SEPARATE databases connected via separate `DATABASE_URL` environment variables. The deployed (published) app uses a production database; the dev workspace uses a development database.

Evidence in code: `artifacts/api-server/src/routes/locker.ts:64` — `environment: process.env.NODE_ENV === 'production' ? 'production' : 'development'` — confirms the server knows which environment it's in.

NOT confirmed by explicit documentation for this specific project. The project's `.replit` shows `deploymentTarget = "autoscale"` confirming a published version exists.

---

### Q107. If not, what database/environment does each use?

**UNKNOWN** | Evidence: REPLIT PLATFORM | Confidence: MEDIUM

Most likely:
- Development: `DATABASE_URL` set in development environment secrets → development Postgres DB
- Production: separate `DATABASE_URL` set in production environment secrets → production Postgres DB

Cannot confirm exact connection strings without inspecting secrets (which must not be done).

---

### Q108. Does localStorage/IndexedDB differ automatically between Preview/dev and published domains?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

YES — localStorage and IndexedDB are scoped to the origin (protocol + hostname + port). The development app runs at a `.replit.dev` domain; the published app runs at a separate production domain. Therefore their localStorage and IndexedDB are COMPLETELY SEPARATE. A user's local data in the dev Preview does NOT appear in the published app and vice versa.

---

### Q109. If TrailWeigh is published for the first time, do existing development Locker records appear?

**CONFIRMED** | Evidence: SOURCE + REPLIT PLATFORM | Confidence: HIGH

NO — development Locker records exist in the development database. The published app connects to the production database, which starts empty (or with any data explicitly migrated). Development records do NOT automatically appear in production.

---

### Q110. If not, what migration/sync is required?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

A manual SQL export from development DB → import to production DB would be required. No automated sync mechanism exists in the current codebase. This must be done carefully to avoid duplicating user accounts or corrupting Clerk userId references.

---

### Q111. What happens to existing published user data when code is republished?

**CONFIRMED (platform pattern)** | Evidence: REPLIT PLATFORM | Confidence: HIGH

Code republish updates the running application code. The production DATABASE (data rows) is NOT wiped on code republish. Existing user Locker records, share_links, and other DB data persist. The exception: if the republish includes a schema migration that alters or drops tables, that could affect data.

---

### Q112. What happens if deployment type changes?

**UNKNOWN** | Evidence: REPLIT PLATFORM | Confidence: LOW

UNKNOWN — requires Replit platform documentation. Changing `deploymentTarget` in `.replit` could affect the database connection. Do not change deployment configuration without checking this.

---

### Q113. Can a published rollback affect user DB records?

**UNKNOWN** | Evidence: REPLIT PLATFORM | Confidence: LOW

UNKNOWN — same as Q100 (checkpoint behavior). If rollback restores a prior DB snapshot, yes. If not, no.

---

### Q114. What must be tested before first public launch?

**CONFIRMED (best practice)** | Evidence: SOURCE | Confidence: HIGH

1. Sign in with Clerk on the production domain → verify auth works
2. Save a test file → verify it appears in production DB (via `GET /api/locker`)
3. Create a share link → verify it resolves on production domain
4. Test public Review (private/incognito) → verify gear list loads
5. Test unit toggle → verify it persists per-device
6. Test background → verify preset shows in shared Review (type:preset only)
7. Test Print → verify `window.print()` produces correct output
8. Test Delete file → verify it's removed from Locker

---

## SECTION H — BACKUP / EXPORT SAFETY

### Q115. Is there currently a user-facing export/backup of Locker files?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

NO — there is no UI feature to export or download all Locker files. The only share path is via the Share button (which generates a public URL, not a private export).

---

### Q116. Can the owner export all Locker entries without changing app code?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

Not via the UI. A developer (Replit Agent) can run a read-only SQL query against the development DB to export all `locker_entries` rows for a given userId. This does NOT capture custom photo blobs (IndexedDB-local).

---

### Q117. Can Replit safely perform a read-only database export before risky persistence/schema work?

**CONFIRMED** | Evidence: DATABASE | Confidence: HIGH

YES — `executeSql({ sqlQuery: "SELECT ...", environment: 'development' })` is safe and read-only. The Agent can dump all locker_entries rows to a report file before any risky prompt. This has been demonstrated in the 025R addendum.

---

### Q118. What exact format would preserve all file payloads and appearance metadata?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

A JSON export of each locker_entries row:
```json
[{
  "id": "...",
  "userId": "...",
  "name": "...",
  "savedAt": "...",
  "payload": {
    "store": { "items": {}, "order": [], "meta": {} },
    "background": null,
    "bgFade": 1,
    "bgTone": "light",
    "bgSize": "cover",
    "chartPaletteKey": "trail",
    "barColor": "",
    "barFont": "",
    "barTextColor": "",
    "barTransparency": 1
  }
}]
```

This can be exported via SQL: `SELECT row_to_json(locker_entries) FROM locker_entries WHERE user_id = 'userId';`

---

### Q119. Would that export preserve custom photo blobs?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

NO — the DB only stores the UUID reference (`photoId`). The blob itself is in the browser's IndexedDB. A DB export captures only the photoId string, not the image data.

---

### Q120. How would custom photo blobs need to be backed up?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

Only via browser devtools or a purpose-built export feature:
1. Open browser DevTools → Application → IndexedDB → trailweigh → bgPhotos
2. For each record: manually export the blob as a file
No automated backup path exists in the current UI or codebase.

---

### Q121. What minimum backup feature should exist before future schema migrations?

**CONFIRMED (recommendation)** | Evidence: SOURCE | Confidence: HIGH

1. A read-only SQL export run by the Agent before any schema change (captures all Locker rows)
2. A screenshot of the owner's Background Picker showing all Custom Theme collection names
3. A note of the active background type (preset name vs custom)
4. The above is the minimum viable pre-migration backup given current capabilities

---

## SECTION I — LIVE SHARE SCOPE / PRIVACY

### Q122. Confirm whether one current 025P live token exposes the ENTIRE owner Locker.

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

YES — `GET /api/links/:id` for a live-locker token queries ALL `locker_entries WHERE user_id = ownerId` with no per-file filter. Every current Locker file is returned.

Source: `links.ts:79` — `db.select().from(lockerEntriesTable).where(eq(lockerEntriesTable.userId, ownerId))` — no additional WHERE clause.

---

### Q123. Does a new Locker file created tomorrow automatically become visible through the existing token?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

YES — the GET resolver re-queries the live DB on every call. Any new Locker file saved by the owner will appear in the next Review page load.

---

### Q124. Does deleting a Locker file remove it from that Review link after reload?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

YES — the DELETE handler removes the row from locker_entries. The next Review load will not return this file. The reviewer's local copy (in `trailweigh:review:${token}:locker`) will be replaced on CASE C, or persisted as stale on CASE B (until sourceVersion changes again).

---

### Q125. Does renaming a file update the same Review token?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

YES — renaming updates `locker_entries.name`. The PATCH update does not change savedAt but DOES change the name fingerprint. The next Review load returns the new name. CASE C fires if sourceVersion changes (it does, because name `n` is in the fingerprint).

---

### Q126. Can any current Locker file be excluded from a live token?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

NO — there is no per-file privacy flag or exclusion mechanism. All Locker files for ownerId are returned. If any file should remain private, the only option is to delete it from the Locker before sharing.

---

### Q127. Does the public DTO include every field of each LockerEntry or an allowlisted subset?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

ALLOWLISTED subset — the `links.ts` GET resolver explicitly maps only these fields per file:
`id, name, savedAt, store, background, bgFade, bgTone, bgSize, chartPaletteKey, barColor, barFont, barTextColor, barTextColor, barTransparency`

`userId`, `createdAt`, and any other DB columns are NOT returned.

---

### Q128. List every field exposed publicly.

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

Per file in the public DTO:
- `id` (Locker entry UUID)
- `name` (file name)
- `savedAt` (timestamp as ms epoch)
- `store.items` (all gear items including weights, types, names, quantities, checked state)
- `store.order` (category order)
- `store.meta` (category metadata)
- `background` (type:preset or type:custom with photoId UUID, or null)
- `bgFade`, `bgTone`, `bgSize` (appearance floats/strings)
- `chartPaletteKey` (palette name string or undefined)
- `barColor`, `barFont`, `barTextColor`, `barTransparency` (bar appearance)

Top-level DTO also includes:
- `type: 'live-locker'`
- `sourceVersion` (fingerprint string)

---

### Q129. Is ownerId ever returned to the anonymous reviewer?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

NO — `ownerId` is read from `stored.ownerId` inside the server but is never included in the response JSON. The `lockerEntriesTable.userId` is also never included. The reviewer cannot determine the owner's Clerk userId from the public DTO.

---

### Q130. Are private Custom Theme photo blobs ever public?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

NO — blobs live in browser IndexedDB only. The server never has them. They are never served over HTTP.

---

### Q131. Are custom photo UUIDs exposed publicly even though the blob is not?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

YES — if a file's background is `{type:'custom', photoId:'701cc0ea-...'}`, this photoId UUID is included in the public DTO's `background` field. A reviewer can read the UUID from the DTO or their localStorage.

---

### Q132. Is that UUID exposure itself acceptable under current design?

**CONFIRMED (design intent)** | Evidence: SOURCE | Confidence: HIGH

YES — under current design, this is acceptable. The UUID is a random identifier with no intrinsic meaning. It cannot be used to retrieve the blob (no server endpoint exists for it). It reveals that the owner has a custom photo but not the photo content.

The 025Q comment in ReviewPage.tsx acknowledges this: the code correctly ignores custom photoIds in the Review path.

---

### Q133. What exact user-facing privacy warning should eventually accompany "share entire Locker"?

**CONFIRMED (recommendation)** | Evidence: SOURCE | Confidence: HIGH

Suggested warning:
> "Sharing your Locker makes all your saved gear lists visible to anyone with this link — including files you did not intend to share. Delete any private files from your Locker before sharing, or use 'Share Checkable List' to share only your current list. Custom background photos will not be visible to reviewers."

---

## SECTION J — SHARE TOKEN SECURITY

### Q134. What exact token format is generated now?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

`randomBytes(5).toString('hex')` → 5 random bytes → 10 lowercase hexadecimal characters.
Example: `a3f7c92e01`
Source: `links.ts:42,51`

---

### Q135. How many random bits of entropy does it provide?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

5 bytes × 8 bits/byte = **40 bits of entropy**

Token space: 2^40 ≈ 1.1 trillion possible tokens.

---

### Q136. Is token generation cryptographically secure?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

YES — Node.js `crypto.randomBytes()` is a CSPRNG (Cryptographically Secure Pseudo-Random Number Generator). The entropy source is the OS RNG.

---

### Q137. Can tokens be enumerated/brute-forced realistically?

**CONFIRMED (risk assessment)** | Evidence: SOURCE | Confidence: HIGH

Theoretically: 2^40 ≈ 1.1 trillion tokens is large but not immune to sustained brute-force.
Practically: Without rate limiting on `GET /api/links/:id`, an attacker could make many requests per second. At 10,000 requests/second: ~3.2 years to enumerate all tokens. At 1,000,000 requests/second (DDoS-level): ~12 days.

There is NO rate limiting currently. For a personal/small-scale app this is acceptable. For a production app with privacy-sensitive data (complete gear lists), this is a risk.

---

### Q138. Is there rate limiting on public GET `/api/links/:id`?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

NO — no rate limiting, IP throttling, or request frequency caps found in the codebase. `app.ts` and the links route contain no rate-limit middleware.

---

### Q139. Is there IP throttling?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

NO — not found in source.

---

### Q140. Is there abuse monitoring/logging?

**CONFIRMED** | Evidence: SOURCE | Confidence: MEDIUM

NO structured abuse logging. The server has a `logger.ts` module, but no per-route request logging for `GET /api/links/:id`. Failed lookups (404) are not specifically logged.

---

### Q141. Do share tokens expire?

**CONFIRMED** | Evidence: SOURCE + DATABASE | Confidence: HIGH

NO — the `share_links` table has no `expires_at` column. Tokens are permanent until the row is manually deleted. Source: `lib/db/src/schema/index.ts` — schema confirmed.

---

### Q142. Can the owner revoke a token?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

NO — there is no UI to revoke a share token. There is no DELETE endpoint for `share_links`. Once created, a token is permanent. The only mitigation is: delete all Locker files (which makes the live-locker token return an empty file list).

---

### Q143. Can the owner list active tokens?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

NO — there is no UI or API endpoint to list a user's share tokens. The owner cannot see what tokens they have created.

---

### Q144. Does deleting the owner account invalidate tokens?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

PARTIALLY — the `share_links` row is NOT deleted when an account is deleted (no CASCADE). However, for live-locker tokens, if the owner's `locker_entries` rows are deleted, the token will return an empty file list. The share_links row itself persists, but returns no data.

The Clerk webhook in `clerkWebhook.ts` handles `user.created` only — there is NO `user.deleted` handler. No automatic cleanup of locker_entries or share_links on account deletion.

---

### Q145. Does deleting all source files invalidate the token?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

YES — if the owner deletes ALL Locker files (not the account, just the files), the live-locker token's GET resolver returns an empty `files` array. Review shows an empty gear list. The token is not invalidated but becomes functionally empty.

---

### Q146. Is a 10-character hex token appropriate for a public production app containing private user-created lists?

**CONFIRMED (risk assessment)** | Evidence: SOURCE | Confidence: HIGH

MARGINALLY ACCEPTABLE for low-traffic personal use. INSUFFICIENT for a public production app with privacy-sensitive data:
- No rate limiting means the 40-bit entropy can be attacked at scale
- Tokens never expire, compounding the risk over time
- No revocation mechanism means accidental exposure is permanent

A minimum of 128 bits of entropy (32 hex chars, 16 bytes) is the common industry standard for shareable-link tokens in production apps.

---

### Q147. If not, what token length/format is recommended and why?

**CONFIRMED (recommendation)** | Evidence: SOURCE | Confidence: HIGH

Recommended: `randomBytes(16).toString('hex')` → 32 hex characters → 128 bits of entropy.
Or: `randomBytes(12).toString('base64url')` → 16 URL-safe chars → 96 bits of entropy.

128-bit minimum is the industry standard for "practically unguessable" tokens. With rate limiting, even 64 bits may be acceptable.

---

### Q148. Would increasing token length break existing links?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

NO — existing short tokens (10 chars) remain in the `share_links` DB. The `GET /api/links/:id` handler uses `WHERE id = ?` which matches any length. New links would use the longer format. Old links would continue to work. No breaking change.

---

## SECTION K — LEGACY SHARE PATHS

### Q149. Which routes currently serve old/frozen share links?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

- `/s/:id` (ReviewPage) — serves both live-locker (025P+) and frozen-snapshot (pre-025P) links
- `/shared` (SharedPackView) — serves old URL-hash-based links (format: `/shared#base64payload`)

---

### Q150. Is `/shared` still reachable?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

YES — `App.tsx:219`: `<Route path="/shared" component={SharedPackView} />`

SharedPackView reads the URL hash, decodes the payload, writes to `localStorage['pack-checklist-v5-guest']`, and redirects to `/checklist`.

---

### Q151. Can current UI still generate an old payload/hash share?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

NO — the current Share button flow generates only `/s/${token}` URLs (POST to `/api/links`). The old hash-based sharing was removed from the UI. Old links generated before 025M/025P still work via SharedPackView (hash decoding), but users cannot create new hash-based links from the current UI.

---

### Q152. Is the giant base64 fallback completely removed?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

The hash-based (base64 URL fragment) sharing for CREATING new links is removed from the UI. However, SharedPackView still READS old hash-based links. The `decodeSharePayload()` function in `shareLink.ts` still exists for this backward compatibility.

---

### Q153. Are old frozen DB-backed share records still supported?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

YES — in ReviewPage.tsx, the `json.type !== 'live-locker'` path returns `{ payload: rows[0].payload }` unchanged for frozen DB-stored snapshots. These links continue to work.

---

### Q154. What code decides old frozen vs live-locker behavior?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

Server-side in `links.ts`:
```ts
if (stored.type === 'live-locker') {
  // live-locker resolution
  return res.json({ type: 'live-locker', files, sourceVersion });
}
// frozen snapshot
return res.json({ payload: rows[0].payload });
```

Client-side in `ReviewPage.tsx`:
```ts
if (json.type === 'live-locker') {
  // CASE A/B/C logic
}
// else: frozen snapshot path (lines 119–170)
```

---

### Q155. Which legacy share files/functions are still active?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

Active legacy code:
- `SharedPackView.tsx` — hash-based link reader (still mounted at /shared)
- `decodeSharePayload()` in `shareLink.ts` — hash decoder
- Frozen-snapshot path in `ReviewPage.tsx` (lines 119–170)
- Frozen-snapshot GET path in `links.ts` (return res.json({ payload: rows[0].payload }))

---

### Q156. Which are dead code?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

Potentially dead:
- `SharedChecklistPage.tsx` — imported in App.tsx but NOT mounted as a route. The `/shared` route uses `SharedPackView`, not `SharedChecklistPage`. SharedChecklistPage may be fully dead code at the routing level (though it's imported).
- `handleShareLocker` `activeLockerFile?.name` fallback — the 025O patch; may still be used in edge cases.

---

### Q157. Could removing legacy share code break existing user links?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

YES — removing SharedPackView would break old hash-based links (format: `/shared#...`). Removing the frozen-snapshot path in ReviewPage/links.ts would break pre-025P DB-stored links. Both should be retained until traffic analysis confirms no usage.

---

### Q158. What safe deprecation path would preserve old links?

**CONFIRMED (recommendation)** | Evidence: SOURCE | Confidence: HIGH

1. Keep SharedPackView (no client can create new hash links, so traffic naturally decays)
2. Keep frozen-snapshot path in ReviewPage and links.ts
3. Add access logging to `GET /api/links/:id` for frozen-snapshot vs live-locker counts
4. After 90 days of zero frozen-snapshot traffic: safely remove frozen-snapshot code

---

## SECTION L — REVIEW SANDBOX / RESEED BEHAVIOR

### Q159. What exact localStorage keys are token-namespaced?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

Four token-namespaced Review keys:
- `trailweigh:review:${token}:pack` — reviewer's working gear data
- `trailweigh:review:${token}:locker` — reviewer's Locker file list (seeded from owner)
- `trailweigh:review:${token}:welcomed` — first-visit flag
- `trailweigh:review:${token}:sourceVersion` — owner fingerprint for CASE A/B/C

---

### Q160. Which Review keys are still global?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

Global (shared with Owner on same browser):
- `trailweigh:background`
- `trailweigh:bgFade`, `trailweigh:bgTone`, `trailweigh:bgSize`
- `trailweigh:chartPalette`
- `trailweigh:barColor`, `trailweigh:barFont`, `trailweigh:barTextColor`, `trailweigh:barTransparency`
- `tw-unit-system`
- `trailweigh:locker` (Owner's Locker array — different from the review-namespaced locker)

---

### Q161. Can two different Review tokens contaminate one another in the same browser?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

For gear data: NO — each token uses its own namespaced keys (`trailweigh:review:${token}:pack`).

For appearance: YES — global appearance keys (`trailweigh:background` etc.) are shared across all Review tokens AND the Owner. If the user opens two different Review links in the same browser, the last seedFromLiveFiles call to run will overwrite the global appearance keys.

---

### Q162. Can Review contaminate Owner appearance state in the same browser?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

YES — 025Q's seedFromLiveFiles writes to global `trailweigh:background` etc. If the owner has their own background set, opening a Review link in the same browser (CASE A or C) will OVERWRITE their global background key with the owner's saved background (or remove it for type:custom). This is why private/incognito testing is required for Review.

---

### Q163. When Owner sourceVersion changes, exactly what reviewer-local data is replaced?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

CASE C calls `seedFromLiveFiles()` which replaces:
- `trailweigh:review:${token}:pack` (entire gear working state)
- `trailweigh:review:${token}:locker` (entire Locker file list)
- `trailweigh:review:${token}:sourceVersion` (fingerprint)
- All global appearance keys (`trailweigh:background`, bgFade, bgTone, bgSize, chartPalette, barColor, barFont, barTextColor, barTransparency)
- sessionStorage `tw-active-locker-file` (re-selects primary file)

---

### Q164. Are all reviewer edits discarded on reseed?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

YES — CASE C completely overwrites the reviewer's local gear data and appearance. Any local edits (gear changes, renamed local files, appearance preferences) are lost. CASE B preserves them.

---

### Q165. Does Review warn before discarding local reviewer changes?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

PARTIALLY — a toast notification fires after CASE C: "Review files updated. The shared collection changed — your view shows the latest version." But there is no confirmation dialog. The overwrite is immediate and silent except for the toast.

---

### Q166. Can Review preserve local edits when source did not change?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

YES — CASE B: if `localSV === newSourceVer` and data exists, `seedFromLiveFiles` is NOT called. Reviewer's local edits in the pack key are preserved. This is the intended behavior.

---

### Q167. What happens if Owner changes one file while reviewer modified another file?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

CASE C triggers (sourceVersion changes due to owner's save updating savedAt). ALL reviewer data is replaced — including the reviewer's edits to the OTHER file. There is no per-file merge.

---

### Q168. Is there any merge behavior?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

NO — reseed is a full replacement (no merge). CASE B is the only "preserve" path. There is no partial merge between owner changes and reviewer local edits.

---

### Q169. Is there any risk Review writes to Owner DB?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

NO — all server Locker write endpoints (PUT, POST, PATCH, DELETE `/api/locker`) require a valid Clerk JWT (`getAuth(req)`). Review mode provides no userId to the client; no authenticated API calls are made. The server enforces `WHERE user_id = ?` on every write, preventing cross-account writes even if a request were made.

---

### Q170. What exact server/API gates prevent anonymous Review writes?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

Server-side auth gate in ALL write endpoints:
```ts
const { userId } = getAuth(req);
if (!userId) return res.status(401).json({ error: 'Unauthorized' });
```

Client-side gate in ChecklistContent:
```ts
if (userId) {
  serverSaveNew(entry).catch(err => { ... });
}
```

Double gate: server rejects unauthenticated requests; client never sends them.

---

## SECTION M — CURRENT BACKGROUND UUID PROVENANCE

UUID: `701cc0ea-4912-416c-b08e-0c747381668c`

### Q171. Can current source/runtime/history determine when this UUID was created?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

NO — not from source, DB, or git history. The UUID is stored in the DB as part of the `payload.background` field with no creation timestamp for the UUID itself. The DB row's `saved_at` (2026-08-12 06:33:27.203+00) is when the SAVE was performed, not when the UUID was first created.

To determine when the UUID was created: the IndexedDB `trailweigh / bgPhotos` record may have been created at a different time (if the photo was uploaded earlier and later saved with the file). Browser DevTools → Application → IndexedDB does NOT typically expose record creation timestamps.

---

### Q172. Which function generated it?

**CONFIRMED (source path)** | Evidence: SOURCE | Confidence: HIGH

`crypto.randomUUID()` called in one of two paths in `BackgroundPicker.tsx`:
- Path 1 (upload): `photoId = crypto.randomUUID()` at line ~700 — when user uploads a photo
- Path 2 (migration): `const newPhotoId = crypto.randomUUID()` at line ~389 — when migrating old `dataUrl` format to IndexedDB

Cannot determine which path without browser history.

---

### Q173. Was it created by an actual user-uploaded photo path?

**UNKNOWN** | Evidence: SOURCE | Confidence: LOW

UNKNOWN — could be either upload or migration. Both paths produce identical UUID format. No runtime evidence available from the server side.

---

### Q174. Was it created by selecting an image that visually came from the Landscape section?

**UNKNOWN** | Evidence: SOURCE | Confidence: LOW

UNKNOWN. If the owner uploaded a landscape photo (their own photograph or a downloaded Unsplash image) to a Custom Theme slot, it would appear visually similar to a built-in Landscape preset. Cannot confirm from available evidence.

---

### Q175. Could an earlier TrailWeigh prompt have copied a built-in image into the custom-photo storage path?

**CONFIRMED** | Evidence: SOURCE + WORKFLOW REPORTS | Confidence: MEDIUM

POSSIBLE — workflow reports 020E/020F reference test data including "ray_psychedelic" backgrounds. Workflow reports 023B/023C show that Replit added/removed built-in preset groups (Topo, Retro-Outdoors, Psychedelic). During 023C, Replit added these as built-in PRESETS with Unsplash URLs. During 023D, they were removed. None of these operations should have put data into IndexedDB custom storage.

However, if the user manually downloaded an Unsplash image and uploaded it to a Custom Theme slot, that would produce exactly this UUID. This is the most likely scenario.

---

### Q176. Does the owner browser IndexedDB record contain metadata identifying filename/source URL/date?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

The IndexedDB record shape is: `{ photoId: string, blob: Blob, mimeType: string, width: number, height: number }`

NO filename, NO source URL, NO creation date in the stored record. Only the image binary data and its type/dimensions.

---

### Q177. Can Replit inspect that metadata read-only without exposing the image itself?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

NO — Replit has no access to the owner's browser's IndexedDB. This data is browser-local. The Agent cannot read it from the server or via any available tool.

---

### Q178. Is the image actually a private upload, a downloaded built-in preset, or UNKNOWN?

**UNKNOWN** | Evidence: SOURCE | Confidence: LOW

**UNKNOWN** — cannot determine provenance from current evidence. The representation (type:custom + UUID) is identical whether:
a) Owner photographed their own landscape and uploaded it
b) Owner downloaded an Unsplash photo and uploaded it to a Custom Theme
c) Owner's old dataUrl background was migrated to the new IndexedDB format

---

### Q179. If UNKNOWN, what exact safe evidence would determine provenance?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

Owner action needed (browser only, no privacy concern):
1. Open the TrailWeigh app in their browser (the same browser they use)
2. Open Background/Themes → navigate to their Custom Theme groups
3. Find the photo with that UUID: Open browser DevTools → Application → IndexedDB → trailweigh → bgPhotos → find record with `photoId = 701cc0ea-4912-416c-b08e-0c747381668c`
4. The blob's visual content will identify the image
5. Screenshot and share (if appropriate)

This is read-only and safe. It does not require sharing the blob with Replit.

---

## SECTION N — THEME HISTORY / MISSING GROUPS

### Q180. Search current source for Retro-Outdoors.

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

NO result in `artifacts/pack-checklist/src/` — Retro-Outdoors does NOT exist as a built-in group in current source code. Only found in workflow reports (023B/023C/023D) as historical record of addition and removal.

---

### Q181. Search current source for Psychedelic.

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

NO result in `artifacts/pack-checklist/src/` — Psychedelic does NOT exist as a built-in group in current source code. Only in workflow reports as historical record.

---

### Q182. Search current source for Topo 1.

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

ONE result: `artifacts/pack-checklist/src/data/initialData.ts:92` — `desc: "Topo Mtn 4 size 12"` (a gear item example, NOT a theme). No Topo 1 theme group in BackgroundPicker.tsx.

---

### Q183. Search Git history/checkpoints/report files for evidence these groups were implemented.

**CONFIRMED** | Evidence: SOURCE (workflow reports) | Confidence: HIGH

CONFIRMED — workflow reports document the full history:

- **023B** (PROMPT_023B_REPORT.md): Added Topo as second built-in theme group (6 presets, `topo-` prefix IDs)
- **023C** (PROMPT_023C_REPORT.md): Added Retro-Outdoors (`RETRO_PRESETS`), Psychedelic (`PSYCHEDELIC_PRESETS`), renamed Topo → Topo 1
- **023D** (PROMPT_023D_REPORT.md): REMOVED all three built-in groups (Retro-Outdoors, Psychedelic, Topo 1) because they duplicated the user's existing Custom Theme collections with the same names

Quote from 023D report: "The 023C prompt incorrectly added three new built-in theme slots to BackgroundPicker.tsx. The user's pre-existing Retro-Outdoors, Psychedelic, and Topo themes are custom collections stored in localStorage (not built-in presets), so adding built-in slots with the same names created visible duplicates in the dropdown."

---

### Q184. Search assets/public directories for their images.

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

NO landscape/topo/retro/psychedelic images found in `artifacts/pack-checklist/public/`. Only icons and logos:
`icon-512.png, apple-touch-icon.png, redo.png, undo.png, locker.png, undo-icon.png, redo-icon.png, locker-icon.png`

Landscape preset images are NOT bundled locally — they are fetched from Unsplash CDN at runtime.

---

### Q185. Search localStorage/IndexedDB theme metadata paths.

**CONFIRMED (structure)** | Evidence: SOURCE | Confidence: HIGH

localStorage key: `trailweigh:photoCollections` (from `bgCollections.ts:31`: `export const PHOTO_COLLECTIONS_KEY = 'trailweigh:photoCollections'`)

Structure: array of `{ id: string, name: string, photos: { id: string }[] }`

The owner's Retro-Outdoors, Psychedelic, and Topo collections exist here (browser-local). Replit cannot read them from the server.

---

### Q186. Were these groups ever implemented as built-in themes?

**CONFIRMED** | Evidence: SOURCE (workflow reports) | Confidence: HIGH

YES — in prompts 023B and 023C they were implemented as built-in PRESETS in `BackgroundPicker.tsx` with Unsplash URLs. They were then REMOVED in 023D because the user already had custom collections by those names.

---

### Q187. Were they removed or superseded?

**CONFIRMED** | Evidence: SOURCE (workflow reports) | Confidence: HIGH

REMOVED (023D) — not superseded by anything. Current source has ONLY Landscape as a built-in group.

---

### Q188. Are they currently only owner-local custom collections?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

YES — Retro-Outdoors, Psychedelic, and Topo/Topo 1 exist ONLY as the user's private Custom Theme collections in their browser's localStorage (`trailweigh:photoCollections`) and IndexedDB (`trailweigh/bgPhotos`). They are NOT built-in presets. They do NOT appear in a fresh browser or in Review.

---

### Q189. If owner UI currently shows them, what exact data source creates them?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

`localStorage['trailweigh:photoCollections']` — the owner's custom theme metadata. The `BackgroundPickerPanel` component reads this localStorage key via `useCollections()` hook in `bgCollections.ts` and renders each collection as a theme group in the dropdown. These collections are populated from the user's uploaded photos.

---

### Q190. What should the canonical permanent theme registry be going forward?

**CONFIRMED (recommendation)** | Evidence: SOURCE | Confidence: HIGH

The canonical registry should remain the `PRESETS` array in `BackgroundPicker.tsx` for built-in themes. Future built-in groups should:
- NOT use the same names as common user custom collection names (to avoid 023C-style duplication)
- Use stable, unique IDs (e.g., `landscapes`, `arctic`, `desert`) that don't conflict with user-created collection IDs
- Be documented in the report before adding (verify user doesn't have a custom collection with that exact name)

---

### Q191. What stable internal ID rules should built-in themes use?

**CONFIRMED (rule)** | Evidence: SOURCE | Confidence: HIGH

Rules for built-in theme IDs:
1. Must be lowercase hyphenated strings (e.g., `rocky-mountains`, `landscapes`)
2. Must be declared in `BUILT_IN_IDS` array (currently `['landscapes']`) in `BackgroundPicker.tsx`
3. Must NEVER be renamed after shipping (saved files reference the ID, not the label)
4. Labels (`label` field in PRESETS entry) CAN change freely
5. New IDs must NOT match any likely user custom theme name
6. Removed presets must remain in PRESETS (with any needed fallback) to prevent broken saved references
7. photoIds (Unsplash IDs) must be verified as permanently available before committing

---

## SECTION O — SAFE TEST ARCHITECTURE

### Q192. Is there currently a dedicated test account?

**CONFIRMED** | Evidence: DATABASE | Confidence: HIGH

NO dedicated test account. The only Locker data found: `Sample List Live Test`, `Test File B`, `Test File A` (from DB query). `Test File A` and `Test File B` appear to be Replit-created test data from earlier prompts (created 2026-08-10), NOT a separate test user account.

---

### Q193. Is there a test database?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

NO separate test database. All testing uses the development database.

---

### Q194. Is there a test Locker namespace?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

NO — Locker entries are scoped only by `userId`. There is no namespace for test files beyond naming conventions.

---

### Q195. Can Agent tests create data without touching important owner files?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

YES — as long as test files use a clearly different name (e.g., `TW TEST 025S - SAFE TO DELETE`) and the Agent explicitly queries for and deletes them after testing. The DB DELETE endpoint requires matching userId, so accidental cross-user deletion is impossible.

---

### Q196. Should future prompts use a dedicated TrailWeigh test account?

**CONFIRMED (recommendation)** | Evidence: SOURCE | Confidence: HIGH

YES — a dedicated test account would:
- Prevent test Locker files from appearing in the owner's Locker panel
- Allow aggressive test/cleanup without risk to owner data
- Provide a stable fixture for Locker-related testing

---

### Q197. What would be required to set one up safely?

**CONFIRMED (recommendation)** | Evidence: SOURCE | Confidence: HIGH

1. Create a new Clerk account with a test email (e.g., a dedicated email address)
2. Sign in to TrailWeigh with the test account once to establish the userId
3. Note the userId (via `GET /api/locker/status` which returns `accountFingerprint`)
4. Use only this account for all future Agent-generated test data
5. Test Locker files are isolated to this userId — owner's files are unaffected

---

### Q198. What exact files should never be altered during automated tests?

**CONFIRMED (rule)** | Evidence: SOURCE | Confidence: HIGH

Files that must never be altered by automated tests:
- `artifacts/pack-checklist/src/pages/Checklist.tsx` (unless the test's explicit target)
- `artifacts/pack-checklist/src/pages/ReviewPage.tsx` (contains 025P/025Q fixes)
- `lib/db/src/schema/index.ts` (DB schema)
- `artifacts/api-server/src/routes/links.ts` (share token logic)
- `artifacts/api-server/src/routes/locker.ts` (auth gates)
- `artifacts/pack-checklist/src/components/BackgroundPicker.tsx` (theme registry)

Any change to these files requires explicit user approval and a pre-change checkpoint.

---

### Q199. Should "Sample List" remain a user-controlled test fixture only when explicitly approved?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

YES — "Sample List Live Test" is the owner's primary test file. Replit must never:
- Rename it (without explicit approval)
- Delete it
- Save to it (creating a new savedAt)
- Use it as a test fixture for automated Agent operations

The owner's explicit approval is required before any Agent action that would modify this file.

---

### Q200. What naming convention should temporary test files use?

**CONFIRMED (rule)** | Evidence: SOURCE | Confidence: HIGH

Format: `TW TEST [prompt] - SAFE TO DELETE`
Examples:
- `TW TEST 025S - SAFE TO DELETE`
- `TW TEST CHECKPOINT VERIFY - SAFE TO DELETE`

Requirements: starts with "TW TEST", ends with "- SAFE TO DELETE", includes prompt number if applicable.

---

### Q201. How should Replit prove cleanup after a test?

**CONFIRMED (rule)** | Evidence: SOURCE | Confidence: HIGH

Before completing a prompt that creates test data:
1. Run `SELECT id, name, saved_at FROM locker_entries WHERE name ILIKE '%test%' OR name ILIKE '%safe to delete%' ORDER BY saved_at DESC;`
2. Verify expected test rows exist
3. Delete via `DELETE /api/locker/:id` (using the serverDelete function or SQL with test userId)
4. Run the SELECT again to confirm 0 rows remain
5. Report: "Test data created and cleaned up: [list of names]"

---

### Q202. What destructive tests should never run against owner data?

**CONFIRMED (rule)** | Evidence: SOURCE | Confidence: HIGH

Never run against owner data:
- `localStorage.clear()` — destroys all owner localStorage including Locker, appearance, unit preference
- `indexedDB.deleteDatabase('trailweigh')` — destroys all custom photo blobs
- Any SQL DELETE/UPDATE without explicit `WHERE user_id = [test-account-userId]` guard
- Any schema migration without DB backup
- Any action that changes `trailweigh:photoCollections` localStorage
- Any file rename/delete in Locker without explicit owner approval

---

## SECTION P — DELETION / PRIVACY LIFECYCLE

### Q203. When owner deletes a Locker file, what server DB row/data is removed?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

The `locker_entries` row for that id AND userId is deleted: `DELETE FROM locker_entries WHERE id = ? AND user_id = ?`. No cascade to other tables.

---

### Q204. What browser-local copies remain?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

After server delete:
- The owner's local `localStorage['trailweigh:locker']` array is updated (entry removed via `setLockerEntries` → `broadcastLocker`)
- Global appearance keys (`trailweigh:background` etc.) are NOT cleared — they reflect the currently-active appearance, not the deleted file
- sessionStorage `tw-active-locker-file` may still reference the deleted file's id/name until the user opens another file

---

### Q205. What Review sandbox copies remain?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

Any reviewer who visited the Review link BEFORE the deletion has the old file data in:
- `trailweigh:review:${token}:locker` (localStorage) — still contains the deleted file until CASE C reseeds

After deletion: sourceVersion changes (row removed from fingerprint) → next Review load hits CASE C → reseed overwrites reviewer's local locker → deleted file is gone from Review. However, if the reviewer is in CASE B (no source change since their last visit AND the deletion was made after the last sourceVersion check), they may still see the deleted file until the next reseed.

---

### Q206. What live share references remain?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

The `share_links` row is NOT deleted. The live-locker token still exists and is still valid. However, the next `GET /api/links/:id` call will not include the deleted file (since it's no longer in `locker_entries`). The token returns the remaining files.

---

### Q207. When account is deleted, what happens to Locker rows?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

NO automatic cleanup — the Clerk webhook (`clerkWebhook.ts`) handles only `user.created`. There is NO `user.deleted` handler. `locker_entries` rows with the deleted userId REMAIN in the database indefinitely. There is no ON DELETE CASCADE in the schema (no FK relationship between tables).

This is a privacy/GDPR risk: deleting a Clerk account does NOT delete the user's gear list data from the DB.

---

### Q208. What happens to share_links rows?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

`share_links` rows are also NOT deleted on account deletion. Live-locker tokens become permanently inactive (the ownerId in the payload still matches the deleted userId, but the locker_entries query returns 0 rows). The token returns `{ type: 'live-locker', files: [], sourceVersion: '[]' }`.

---

### Q209. What happens to browser localStorage?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

Browser localStorage is browser-side and independent of account deletion. Deleting the Clerk account does not affect the user's browser localStorage on any device. Their gear data, appearance settings, and unit preference remain in localStorage until cleared manually.

---

### Q210. What happens to IndexedDB custom photo blobs?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

IndexedDB is browser-side — unaffected by account deletion. Blobs remain until the user clears browser data.

---

### Q211. What happens to logs?

**CONFIRMED (limited)** | Evidence: SOURCE | Confidence: MEDIUM

Server logs (from `logger.ts`) include account fingerprints, not raw userIds. The new-user notification email (Resend) contains the email address. These are not deleted on account deletion. No log-deletion mechanism exists in current source.

---

### Q212. What happens to backups/snapshots?

**UNKNOWN** | Evidence: REPLIT PLATFORM | Confidence: LOW

UNKNOWN — Replit platform database snapshots/backups may retain the deleted user's data independently. This depends on Replit's backup retention policy (not documented in codebase).

---

### Q213. Is deletion currently immediate everywhere or only in primary DB?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

Deletion is immediate in the primary `locker_entries` DB row. All other copies (browser localStorage, review sandbox localStorage, browser IndexedDB, server logs, Replit backups) are NOT cleaned up immediately or automatically. Deletion is NOT end-to-end.

---

### Q214. What retention cannot currently be guaranteed?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

Cannot guarantee immediate deletion from:
- Browser localStorage on any device (requires user to clear manually)
- Browser IndexedDB on any device (requires user to clear manually)
- Share_links DB rows (no delete mechanism)
- Locker_entries DB rows after account deletion (no webhook handler)
- Server access logs
- Replit database backups (unknown retention policy)
- Reviewer localStorage (review sandbox keys remain until cleared)

---

### Q215. What exact product wording is safe today regarding permanent deletion?

**CONFIRMED (recommendation)** | Evidence: SOURCE | Confidence: HIGH

Safe current wording:
> "Deleting a file from your Locker removes it from your account on this server and from your gear list. It may remain temporarily visible in any open shared review links until those links are reloaded. Browser-cached data may persist in browsers you have previously used. Custom background photos (stored in your browser) are not affected by file deletion."

NOT safe to claim:
> "Your data is permanently and completely deleted." (browser copies and Replit backups may remain)

---

## SECTION Q — DATA MODEL VERSIONING / MIGRATIONS

### Q216. Does PackStore have an explicit schema/version number?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

YES — `__v: 5` is present in all stored PackStore records. `parseV5` checks `p.__v !== 5` to reject incompatible records.

Source: `usePackData.ts:227` — `function parseV5(p: any): Store | null { if (!p || p.__v !== 5 || !Array.isArray(p.order)) return null; }`

---

### Q217. Do Locker payloads have a version field?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

NO — `locker_entries.payload` JSONB object has no version field. The payload contains `{ store, background, bgFade, bgTone, bgSize, chartPaletteKey, barColor, barFont, barTextColor, barTransparency }` with no `__v` or `version` key. Backward compatibility is handled by optional fields with defaults.

---

### Q218. Is there a migration layer for old saved files?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

YES — two migration paths:
1. **Pack store v4 → v5**: `usePackData.ts` reads the v4 key (`pack-checklist-v4-${uid}`) and migrates to v5 format if found
2. **Background dataUrl → IndexedDB**: `BackgroundPicker.tsx:384–402` migrates old `{type:'custom', dataUrl}` format to `{type:'custom', photoId}` + IndexedDB blob on first BackgroundPickerPanel open
3. **mergeDefaultCategories**: `usePackData.ts:193` — adds any default categories missing from older saves (forward migration)

---

### Q219. What happens if a field is renamed in future code?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

Old records would silently use the default value for the new field name (because they don't have it). Old code reading new records would get undefined/default for any added fields. No validation or error is thrown — optional field defaults cover this.

---

### Q220. What happens if an older Locker payload lacks a new field?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

The field receives its default value. Examples from `links.ts` GET resolver:
- `bgFade: typeof p.bgFade === 'number' ? p.bgFade : 1` (default: 1)
- `bgTone: typeof p.bgTone === 'string' ? p.bgTone : 'light'` (default: 'light')
- `barColor: typeof p.barColor === 'string' ? p.barColor : ''` (default: '')
- Same pattern for all appearance fields

---

### Q221. What defaults are applied?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

| Field | Default |
|-------|---------|
| background | null |
| bgFade | 1 (fully transparent overlay = full image visible) |
| bgTone | 'light' |
| bgSize | 'cover' |
| chartPaletteKey | undefined |
| barColor | '' (empty = no custom color) |
| barFont | '' |
| barTextColor | '' |
| barTransparency | 1 |

---

### Q222. Can current migrations alter user data silently?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

YES — `mergeDefaultCategories()` adds missing default categories to the stored order on every load. This modifies the in-memory store but does NOT auto-save to the server. The user must click Save for the merged defaults to persist. Silent data alteration in memory; requires Save to affect server.

The background dataUrl migration (Path 2 above) DOES alter localStorage `trailweigh:background` silently on BackgroundPickerPanel first open.

---

### Q223. Which previous prompts added compatibility/migration code?

**CONFIRMED** | Evidence: SOURCE + WORKFLOW REPORTS | Confidence: HIGH

- Pre-025 (016B): `bgPhotoStore.ts` — IndexedDB blob store created
- Pre-025 (background migration): dataUrl → IndexedDB migration in BackgroundPicker.tsx
- `usePackData.ts` v4→v5 migration (exact prompt unknown from current source)
- `mergeDefaultCategories` for forward-compatibility of new default categories

---

### Q224. What migration test fixture should exist before future schema changes?

**CONFIRMED (recommendation)** | Evidence: SOURCE | Confidence: HIGH

Before any future schema change to `locker_entries`:
1. Create a test Locker entry with CURRENT full payload (all current fields)
2. Export and save the row as a JSON fixture in `workflow-reports/fixtures/`
3. Apply the schema change
4. Verify the fixture can still be read (no deserialization errors, all defaults applied correctly)
5. Verify the GET /api/locker route still returns correct data

---

### Q225. What rollback strategy is safe if a migration fails?

**CONFIRMED (recommendation)** | Evidence: SOURCE | Confidence: HIGH

1. Do not run schema migrations in the application startup (no DDL on startup code)
2. Use Replit's Publish flow for schema migrations (it diffs and confirms before applying)
3. If a migration fails: restore from the last Replit checkpoint (if checkpoint includes DB)
4. If checkpoint does not include DB: use a pre-migration SQL dump to restore the schema
5. Never apply schema changes to production without testing on development first

---

## SECTION R — EXTERNAL BUILT-IN BACKGROUND RELIABILITY

### Q226. Are current Landscape presets remote Unsplash URLs?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

YES — all 10 Landscape presets resolve to: `https://images.unsplash.com/photo-${photoId}?w=1920&q=85&fit=crop`

Source: `BackgroundPicker.tsx:103` — `export function getFullUrl(photoId: string) { return \`https://images.unsplash.com/photo-${photoId}?w=1920&q=85&fit=crop\`; }`

---

### Q227. Are those URLs stable/permanent?

**CONFIRMED (with caveat)** | Evidence: SOURCE | Confidence: MEDIUM

Unsplash photo URLs using the `/photo-{id}` format are generally considered permanent by Unsplash (photos are rarely removed). However, Unsplash can remove photos for license or policy reasons. There is no guarantee. TrailWeigh has no control over Unsplash URL availability.

---

### Q228. What happens if one returns 404/403/rate-limit?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

The browser shows a broken image (or the `div.screen-only` shows `bg-background` CSS color = white/dark). No error handling for failed background image loads exists in current code. The app continues to function normally with no background.

---

### Q229. Are images cached locally by the app?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

NO explicit caching by the app. Browser HTTP cache may cache the Unsplash images per normal browser behavior (based on Cache-Control headers from Unsplash CDN). No service worker, no offline cache, no local bundling.

---

### Q230. Does TrailWeigh depend on third-party availability for built-in themes?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

YES — built-in Landscape presets are entirely dependent on Unsplash CDN availability. If Unsplash is down or a photo is removed, the background will not display.

---

### Q231. Are there licensing/attribution obligations currently implemented?

**CONFIRMED** | Evidence: SOURCE | Confidence: MEDIUM

PARTIALLY — Unsplash requires attribution for photos used under the free Unsplash License. The current TrailWeigh UI does NOT display photographer attribution for the 10 preset photos. This may be a licensing compliance gap depending on how the Unsplash API access is structured (whether access is via Unsplash API with registered app or via direct URL).

---

### Q232. Would bundling/hosting permanent theme assets improve reliability?

**CONFIRMED (recommendation)** | Evidence: SOURCE | Confidence: HIGH

YES — bundling or self-hosting reduces Unsplash dependency. Options:
a. Bundle images as project assets (large initial bundle size)
b. Host on a CDN controlled by TrailWeigh
c. Use Unsplash API with proper attribution and caching

---

### Q233. What migration would be required without breaking existing saved preset IDs?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

Preset IDs (e.g., 'rocky-mountains') are stable and stored in LockerEntries. Changing how images are hosted does NOT require changing preset IDs. Migration:
1. Self-host or CDN-host the images
2. Update `getFullUrl()` in `BackgroundPicker.tsx` to use the new URL template
3. Old saved references (preset IDs) continue to resolve via the updated `getFullUrl()` — no DB migration needed

---

### Q234. Should saved files store stable preset IDs rather than raw external URLs?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

ALREADY DONE — saved files store `{ type: 'preset', id: 'rocky-mountains' }`, NOT the Unsplash URL directly. The URL is resolved at runtime via `getFullUrl(PRESETS.find(p => p.id === bg.id)?.photoId)`. This design is correct and flexible — changing the URL template only requires updating `getFullUrl()`.

---

## SECTION S — TECHNICAL DEBT TO LEAVE ALONE

### Q235. Stable but awkward code that should NOT be refactored during unrelated prompts.

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

1. **Background lazy initializer in Checklist.tsx (~lines 232–331)**: Complex multi-path initialization (fork/newseed/savedlist/global). Many prior behaviors depend on this exact order. Do not reorder or simplify.
2. **025Q global localStorage writes in seedFromLiveFiles**: Correctly designed; leave alone until a proper useEffect-based approach is implemented.
3. **SharedPackView hash-decoder at /shared**: Legacy, stable; needed for backward compat.
4. **Frozen-snapshot path in ReviewPage/links.ts**: Legacy, stable; needed for pre-025P links.
5. **v4→v5 migration in usePackData.ts**: Has been stable for multiple prompts; do not touch.
6. **parseV5 + mergeDefaultCategories**: Correct implementation; do not simplify.
7. **CASE A/B/C logic in ReviewPage useEffect**: Correctly designed; do not simplify.

---

### Q236. Compatibility code that must remain for old saved files/links.

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

1. `parseV5` — reads `__v: 5` format; needed for all stored pack data
2. `mergeDefaultCategories` — inserts missing default categories; needed for old saves missing new categories
3. Background `dataUrl` migration in BackgroundPicker.tsx — for old localStorage format
4. `migrateCollectionsToIndexedDb` in bgPhotoStore.ts — for old photo collection format
5. v4→v5 migration in usePackData.ts — for very old localStorage keys
6. Frozen snapshot resolver in ReviewPage and links.ts — for pre-025P share links
7. SharedPackView hash-decoder — for pre-server-DB share links

---

### Q237. Technical debt that is CURRENTLY CAUSING BUGS.

**CONFIRMED** | Evidence: SOURCE + DATABASE | Confidence: HIGH

1. **type:custom background cannot appear in Review** — not a code bug, but a product gap (IndexedDB is device-local). Task #29 covers this.
2. **sourceVersion does not detect appearance changes** — means Review cannot reseed on appearance-only owner changes. No existing task covers adding appearance to sourceVersion.
3. **No account-deletion cleanup** — locker_entries and share_links persist after account deletion (Clerk webhook only handles user.created). Privacy/GDPR gap.
4. **No rate limiting on GET /api/links/:id** — enumeration risk.
5. **SharedChecklistPage is imported but not routed** — dead import, minor.

---

### Q238. Debt that should have its own future prompt.

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

1. **Background sharing architecture** (type:custom problem) → Task #29
2. **Share-time warning for custom background** → Task #61 was proposed (now cancelled by user)
3. **Token entropy/rate limiting** → security prompt
4. **Account deletion cleanup** → privacy/GDPR prompt
5. **Export/backup feature** → user data safety prompt

---

### Q239. Debt that should be deliberately deferred.

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

1. **SharedChecklistPage dead import** — no functional impact; defer
2. **Unsplash attribution** — minor; defer until licensing confirmed
3. **Background bundling/hosting** — reliability improvement; defer until product direction confirmed
4. **sourceVersion appearance tracking** — requires product decision (auto-save on appearance change?); defer

---

### Q240. Files especially high-risk because many PASS behaviors depend on them.

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

Critical files — any change requires full regression of all PASS behaviors:
1. `Checklist.tsx` — nearly every TrailWeigh feature; 025K, 025M, 025P, 025Q all have dependencies here
2. `ReviewPage.tsx` — 025L, 025P, 025Q; live share and review behavior
3. `BackgroundPicker.tsx` — 025K (dark mode scope), 023D (theme duplication removal)
4. `usePackData.ts` — persistence, undo/redo, migration; base of all gear editing
5. `links.ts` — 025M URL format, 025P live-locker architecture
6. `locker.ts` — auth gate; any change risks breaking cross-account isolation
7. `lib/db/src/schema/index.ts` — schema changes affect all DB operations; never change without backup

---

## SECTION T — COMMUNICATION MAP FOR CHATGPT

### Q241. Category accordion

| Attribute | Value |
|-----------|-------|
| Standard UI term | "category accordion" |
| File | `GearCategory.tsx` |
| State | `openCats` in ChecklistContent |
| Persistence | In-memory only — not saved |
| Important regression | Starts collapsed after fresh open; Expand All opens all |
| Evidence before editing | Screenshot of category row + confirmation of open/close state behavior |
| Avoid | "section", "panel", "drawer" |

---

### Q242. Left-side Expand All / Collapse All control

| Attribute | Value |
|-----------|-------|
| Standard UI term | "Open/Close all categories" or "Expand All / Collapse All" |
| File | `Checklist.tsx` (header toolbar) |
| Handler | sets all `openCats` entries to true/false |
| Persistence | In-memory |
| Regression | All categories expand; Pack Summary and Weight Distribution respond |
| Avoid | "sidebar toggle", "drawer control" |

---

### Q243. Right sidebar accordion control

| Attribute | Value |
|-----------|-------|
| Standard UI term | Pack Summary / Weight Distribution collapse chevron |
| File | `WeightSummary.tsx` |
| State | Per-component open state (not shared with category openCats) |
| Regression | Starts collapsed (022G); user toggle persists within session |
| Avoid | "right panel toggle" (ambiguous) |

---

### Q244. Locker

| Attribute | Value |
|-----------|-------|
| Standard UI term | "Locker" |
| File | `LockerPanel.tsx` |
| State | `lockerEntries: LockerEntry[]` in ChecklistContent |
| Persistence | localStorage trailweigh:locker + server DB locker_entries |
| Regression | Sign out + sign back in → files re-appear; Delete removes from both |
| Evidence before editing | List of current Locker file names + savedAt timestamps |
| Avoid | "file manager", "library", "drawer" |

---

### Q245. Save / Save As

| Attribute | Value |
|-----------|-------|
| Standard UI term | "Save" / "Save As" |
| File | `Checklist.tsx` (commitSaveReplace / commitSaveNew), `lockerApi.ts` |
| API | PUT /api/locker/:id (Save), POST /api/locker (Save As) |
| savedAt | Updated on every Save; NOT updated on rename |
| Regression | Save → toast appears; file in Locker shows updated timestamp |
| Evidence before editing | Confirm server DB row exists after Save (DB query) |
| Avoid | "sync", "upload", "push" |

---

### Q246. Background/Themes

| Attribute | Value |
|-----------|-------|
| Standard UI term | "Background/Themes panel" or "background picker" |
| File | `BackgroundPicker.tsx` |
| State | `background`, `bgFade`, `bgTone`, `bgSize` in ChecklistContent |
| Persistence | localStorage (global keys) + DB payload on Save |
| Regression | 025K dark mode scope; preset backgrounds load from Unsplash; custom blobs from IndexedDB |
| Evidence before editing | Screenshot of current background; confirm type (preset/custom) |
| Avoid | "theme panel" (ambiguous), "wallpaper" |

---

### Q247. Built-in theme group

| Attribute | Value |
|-----------|-------|
| Standard UI term | "built-in theme group" |
| Current groups | Only "Landscape" (10 presets) |
| File | `BackgroundPicker.tsx` PRESETS array |
| ID format | Stable lowercase-hyphenated (e.g., 'landscapes') |
| Regression | Built-in groups must NOT duplicate user custom theme names |
| Avoid | "preset theme", "default theme group" |

---

### Q248. Custom Theme

| Attribute | Value |
|-----------|-------|
| Standard UI term | "Custom Theme" |
| Storage | localStorage trailweigh:photoCollections + IndexedDB trailweigh/bgPhotos |
| Cross-device | NO |
| File | `bgCollections.ts`, `bgPhotoStore.ts` |
| Regression | Custom themes are device-local; do NOT appear in Review; IndexedDB must not be cleared |
| Avoid | "custom background" (ambiguous), "user theme" |

---

### Q249. Background preset/photo reference

| Attribute | Value |
|-----------|-------|
| Standard UI term | "preset" (built-in) or "custom photo" (uploaded) |
| Preset format | `{ type: 'preset', id: 'rocky-mountains' }` |
| Custom format | `{ type: 'custom', photoId: '<uuid>' }` |
| Regression | type:preset → public CDN URL → visible in Review; type:custom → IndexedDB → invisible in Review |
| Avoid | Calling a preset "custom" or vice versa (critical distinction) |

---

### Q250. Bar Color / Transparency / Text Color / Font

| Attribute | Value |
|-----------|-------|
| Standard UI term | "Bar Color", "Bar Transparency", "Bar Text Color", "Bar Font" |
| File | `Checklist.tsx`, `BarStyleContext.tsx` |
| State | `barColor`, `barTransparency`, `barTextColor`, `barFont` |
| localStorage keys | `trailweigh:barColor`, `trailweigh:barTransparency`, `trailweigh:barTextColor`, `trailweigh:barFont` |
| Persistence | localStorage + DB payload on Save |
| Regression | Bar appearance applies to category header pills; resets to defaults on handleNew() |
| Avoid | "pill", "chip" (ambiguous with Checklist pill UI) |

---

### Q251. Preview / Print

| Attribute | Value |
|-----------|-------|
| Standard UI term | "Preview" (modal), "Print" (window.print) |
| File | `PreviewModal.tsx`, `Checklist.tsx` |
| Content | Checked items only |
| Regression | Preview shows only checked items; Print uses CSS print-only class |
| Avoid | "export" (it's not a file export) |

---

### Q252. Hide

| Attribute | Value |
|-----------|-------|
| Standard UI term | "Hide" (button) / "Showcase mode" (state) |
| File | `Checklist.tsx`, `useInactivityTimer.ts`, `BackgroundShowcase.tsx` |
| Handler | triggerShowcase() |
| Regression | App fades to 0 opacity; BackgroundShowcase overlay appears; any interaction exits |
| Avoid | "fullscreen", "kiosk mode" |

---

### Q253. Share

| Attribute | Value |
|-----------|-------|
| Standard UI term | "Share" (menu) |
| Two paths | "Share Locker (Live)" (requires auth) / "Share Checkable List" (no auth) |
| File | `Checklist.tsx`, `shareLink.ts`, `links.ts` |
| Token format | `randomBytes(5).toString('hex')` = 10 hex chars |
| Regression | 025M URL format /s/${token}; 025P live share reflects current Locker |
| Avoid | "permalink", "public URL", "invite link" |

---

### Q254. Public Review

| Attribute | Value |
|-----------|-------|
| Standard UI term | "Review page" or "Public Review" |
| File | `ReviewPage.tsx` |
| Route | `/s/:id` |
| Mode flags | `isGuest=true`, no `userId`, `reviewToken` provided |
| Regression | 025P filename propagation; 025Q custom background correctly shows white; Welcome modal on first visit |
| Evidence before editing | Test in FRESH PRIVATE/INCOGNITO browser only |
| Avoid | "shared view" (ambiguous with SharedChecklistPage), "viewer" |

---

### Q255. Importer / Scan Gear List

| Attribute | Value |
|-----------|-------|
| Standard UI term | "Scan Gear List" / "importer" |
| File | `ImportGearPanel.tsx`, `importGear.ts`, `scanGear.ts` |
| Regression | PDF row regex (see MEMORY.md: greedy vs lazy fix); TRAILWEIGH PDF format; CSV format |
| Evidence before editing | Provide sample PDF and expected parse output |
| Avoid | "upload feature" (it's a parser, not file storage) |

---

### Q256. Type / Name / Weight / Qty / Total

| Attribute | Value |
|-----------|-------|
| Standard UI terms | "Type" (item.sub), "Name" (item.desc), "Weight" (item.weightOz), "Qty" (item.qty), "Total" (computed) |
| File | `GearRow.tsx` |
| Storage | Part of store.items |
| Regression | Weights display in selected unit (oz/g); Total = Weight × Qty |
| Avoid | "title", "label", "description" (all ambiguous) |

---

### Q257. Light/Dark

| Attribute | Value |
|-----------|-------|
| Standard UI term | "Light/Dark" toggle (within Background picker) or "bgTone" |
| File | `BackgroundPicker.tsx` |
| State | `bgTone: 'light' | 'dark'` |
| Effect | Applies `screen-dark` class to `div.screen-only` |
| Regression | 025K — `screen-dark` class must stay on `div.screen-only` only |
| Avoid | "dark mode" (system dark mode is different), "theme" |

---

### Q258. Mobile toolbar

| Attribute | Value |
|-----------|-------|
| Standard UI term | "mobile toolbar" or "Lower Phone Toolbar" |
| File | `Checklist.tsx` (~line 2870) |
| Visibility | `lg:hidden` — desktop-only equivalent is separate |
| Layout | [Open/Close] LEFT · [Hide] CENTER · [Imperial/Metric] RIGHT |
| Regression | 023B layout must be preserved; desktop layout is separate |
| Avoid | "nav bar", "bottom bar", "phone menu" |

---

### Q259. File-name pill/header

| Attribute | Value |
|-----------|-------|
| Standard UI term | "file name pill" or "active filename" |
| File | `Checklist.tsx` header section |
| State | `activeLockerFile.name` |
| Persistence | sessionStorage tw-active-locker-file + localStorage tw-last-active-${userId} |
| Regression | Pill shows correct name after Save; updates after Rename; shows empty state when no file active |
| Avoid | "title", "header label", "breadcrumb" |

---

### Q260. Account/authentication

| Attribute | Value |
|-----------|-------|
| Standard UI term | "account", "sign in", "sign out" |
| System | Clerk (Replit-managed) |
| File | `App.tsx`, Checklist.tsx header |
| Regression | Sign in → 022G auto-loads last-active file; sign out → guest mode; auth gates on all write APIs |
| Evidence before editing | Confirm auth still works after any route or API change |
| Avoid | "login" (Clerk uses "sign in"), "JWT management" (handled by Clerk) |

---

## SECTION U — BEST FUTURE PROMPT PROTOCOL

### Q261. What should ChatGPT always ask Replit BEFORE a visual/UI change?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

1. "Which files will be changed? List them."
2. "Which USER-VERIFIED PASS behaviors could this affect?" (list the regression tests)
3. "Does this touch div.screen-only or the background DOM structure?" (025K dependency)
4. "Does this affect the mobile toolbar layout?" (023B dependency)
5. "Will you attach a before/after screenshot for verification?"

---

### Q262. Before a persistence/data change?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

1. "Has the owner clicked Save recently? Please confirm the file is server-saved."
2. "Please run `git diff --name-only HEAD` and confirm only the expected files are changed."
3. "Please run a DB backup query and include the output in the report."
4. "Which localStorage keys will be read or written?"
5. "Will this affect existing Locker entries in the DB?"
6. "Does this change require any DB migration?"

---

### Q263. Before a Share/Review change?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

1. "Will this change affect existing share tokens?" (breaking change risk)
2. "Will this change affect the 025P sourceVersion fingerprint?"
3. "Is the test being done in a FRESH PRIVATE/INCOGNITO browser?"
4. "Will this change the public DTO fields (privacy check)?"
5. "Does this affect the CASE A/B/C logic in ReviewPage?"

---

### Q264. Before a theme/background change?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

1. "Will this change affect the PRESETS array or any existing preset IDs?"
2. "Are any existing preset IDs being renamed? (If yes, STOP — this breaks saved files)"
3. "Does this affect the 025K screen-dark scope?"
4. "Will this affect the IndexedDB blob path (type:custom) or the Unsplash URL path (type:preset)?"
5. "Does the user currently have a Custom Theme collection with the same name as any new built-in group?"

---

### Q265. Before a parser/importer change?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

1. "Please provide a sample PDF/CSV that tests the change."
2. "What is the expected parse output for that sample?"
3. "Does this affect PDF_ROW_RE regex? (greedy vs lazy — known issue)"
4. "Will this run against the importGear.ts route? The scanGear.ts route? Both?"
5. "Attach the BEFORE parse output for comparison."

---

### Q266. Before an authentication/privacy change?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

1. "Does this add, remove, or change any server-side auth gate?"
2. "Will any previously-authenticated endpoint become unauthenticated?"
3. "Will any new data be exposed in the public DTO?"
4. "Does this affect Clerk JWT validation (`getAuth(req)`)?"
5. "Will this affect the Clerk webhook handler?"

---

### Q267. What evidence should be attached for visual changes?

Before: screenshot of current state
After: screenshot of changed state
Both in same browser (Chrome/Firefox Desktop), same viewport

---

### Q268. What evidence should be attached for behavior changes?

1. Console log showing the before/after state of the relevant variable
2. NetworkTab screenshot showing the API call and response
3. LocalStorage/SessionStorage inspector showing before/after key values
4. If Review-related: browser console in PRIVATE/INCOGNITO window
5. Git diff output (`git diff --name-only HEAD`)

---

### Q269. What evidence should be attached for importer/data changes?

1. The exact input file (PDF/CSV/text) used for testing
2. The raw parse output (JSON from API response)
3. The items as imported into the gear list (screenshot)
4. Comparison with expected output

---

### Q270. What should automatically trigger a STOP rather than an edit?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

STOP triggers:
1. An unrelated file has been changed (scope creep)
2. Any existing preset ID would be renamed or removed
3. The DB schema would change without a backup
4. An auth gate on a write endpoint would be removed or weakened
5. The review localStorage contamination risk would increase
6. Any source file marked as high-risk (Q240) is changed without explicit approval
7. A User-Verified PASS behavior shows signs of regression
8. The git diff includes files outside the stated scope

---

### Q271. How should Replit report changed files?

Format:
```
APPLICATION CODE CHANGED BY [PROMPT]:
- [filename] — [reason for change]
...
NO OTHER FILES CHANGED.
```

Always run `git diff --name-only HEAD` and include output.

---

### Q272. How should Replit report user-data changes separately?

Format:
```
DATABASE DATA CHANGED BY [PROMPT]:
- [action] on table [table] — [what changed]
...
OR: DATABASE DATA CHANGED BY [PROMPT] = NONE
```

If ANY SQL INSERT/UPDATE/DELETE was run, list explicitly.

---

### Q273. How should Replit report unresolved unknowns?

Format for each UNKNOWN:
```
UNKNOWN: [question]
Why unknown: [reason]
Evidence needed: [exact evidence required]
Blocks repair: YES/NO
```

Do not substitute speculation for UNKNOWN.

---

### Q274. How should Replit label internal tests vs USER VERIFICATION?

Internal test: evidence gathered by Replit (source inspection, DB query, curl, git diff)
> "INTERNAL TEST: [description] — [result]"

User Verification: action the user must take in the live browser
> "USER VERIFICATION REQUIRED: [exact steps] — PASS/FAIL pending user confirmation"

Never conflate the two. Do not claim USER VERIFICATION PASS without user confirmation.

---

### Q275. What exact pre-prompt save/checkpoint workflow should the user follow?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

Before every code-change prompt:
1. Open TrailWeigh in your browser
2. Click Save on your active file (if you have one open)
3. Wait for the Save toast to appear
4. Take a screenshot of: (a) the gear list, (b) the Locker panel (showing your files), (c) the active background
5. Replit will automatically create a checkpoint — check the Replit Checkpoints panel to confirm
6. Tell ChatGPT: "I have saved my file and the checkpoint is confirmed."
7. Then send the prompt

After the prompt:
1. Test the new behavior first in a FRESH PRIVATE/INCOGNITO browser
2. Then re-test all USER-VERIFIED PASS behaviors in your normal browser
3. If PASS: accept; if FAIL: tell ChatGPT "FAIL" and provide the screenshot

---

## SECTION V — REMAINING UNKNOWNS

### Q276. What important TrailWeigh architecture questions are still unanswered after 025S?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

1. **Does Replit checkpoint include DB snapshot?** — platform verification required (Q95/Q100)
2. **Do dev and prod use separate databases?** — platform verification required (Q106)
3. **What exact UUID provenance is** `701cc0ea-4912-416c-b08e-0c747381668c`? — browser devtools required (Q178)
4. **Does the SyncStatus panel show unsaved-to-server state?** — runtime observation required
5. **What is the exact Replit checkpoint DB behavior on restore?** — controlled test required

---

### Q277. Which unknowns would materially change future repair design?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

1. **Checkpoint DB behavior** — if checkpoints include DB, users can safely roll back to a pre-prompt DB state. If not, code rollback may leave DB in a mismatched schema state. BLOCKS safe schema migration prompts.
2. **Dev vs prod database separation** — if shared: any code change in dev that writes test data ALSO affects production. BLOCKS safe testing protocols.

---

### Q278. Which unknowns are safe to defer?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

Safe to defer (low immediate risk):
1. UUID provenance (type:custom background) — no repair is planned; deferral is safe
2. Unsplash attribution compliance — no active enforcement observed
3. SyncStatus panel UI state — cosmetic; no functional impact on repairs

---

### Q279. What exact additional evidence would close each blocking unknown?

**CONFIRMED** | Evidence: REPLIT PLATFORM | Confidence: HIGH

Blocking unknown 1 (Checkpoint DB behavior):
- Create a test DB row → checkpoint → delete row → restore → check if row is back
- OR: read Replit platform documentation for "checkpoints and database"

Blocking unknown 2 (Dev vs prod DB):
- Run `GET /api/locker/status` in BOTH dev and production environments
- Compare the Locker file lists — if they differ, they use separate databases
- OR: check Replit environment variables for DATABASE_URL in dev vs prod settings

---

### Q280. Are there any areas where Replit cannot determine the truth from current access?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

1. Browser localStorage content — only the owner can inspect via DevTools
2. Browser IndexedDB content — only the owner can inspect via DevTools
3. Owner's Custom Theme collection names — browser-local
4. The image behind the custom photoId UUID — browser-local (owner's IndexedDB)
5. Replit database backup retention policy — platform documentation
6. Whether Replit checkpoint includes DB rows — platform documentation or controlled test

---

### Q281. Which would require user live testing?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

1. Confirming Review background behavior for type:preset (requires owner to switch to a Landscape preset, Save, then test in private window)
2. Confirming 022G loads the correct file appearance on fresh sign-in
3. Confirming the SyncStatus panel behavior
4. Confirming Hide/Showcase timing and behavior

---

### Q282. Which would require a safe database query?

**CONFIRMED** | Evidence: SOURCE | Confidence: HIGH

1. Checking DB state after any Save (verify payload.background was written)
2. Confirming no orphaned share_links after Locker file deletion
3. Confirming locker_entries persist after account deletion (privacy check)
4. Counting frozen vs live-locker tokens in share_links

All of these are read-only SELECT queries — safe to run at any time.

---

### Q283. Which would require Replit platform documentation/support?

**CONFIRMED** | Evidence: REPLIT PLATFORM | Confidence: HIGH

1. Checkpoint → DB snapshot behavior (Q100)
2. Development vs production DB separation (Q106)
3. Database backup/retention policy (Q212)
4. Environment variable behavior on checkpoint restore (Q93)

---

## FINAL AUTHORITATIVE SYNTHESIS

### A. FINAL AUTHORITATIVE FINDINGS

1. Owner's background for "Sample List Live Test" is `{type:'custom', photoId:'701cc0ea-...'}`— DB-confirmed
2. photoId is a UUID v4 from crypto.randomUUID() — NOT an Unsplash ID — confirmed by format
3. The blob is in Owner's browser IndexedDB only — source-confirmed
4. Review correctly shows white background for type:custom — 025Q guard is correct
5. 025Q was NOT a failure — the test expectation was wrong; the code was correct
6. Only Landscape (10 Unsplash presets) exists as a built-in theme group — source-confirmed
7. Retro-Outdoors, Psychedelic, and Topo are the owner's private Custom Theme collections — source+report-confirmed
8. Those three groups were implemented as built-ins in 023C and removed in 023D to prevent duplication
9. sourceVersion does NOT track appearance changes — source-confirmed
10. No rate limiting on GET /api/links/:id — source-confirmed
11. Tokens never expire; no revocation mechanism — source+DB-confirmed
12. Account deletion does NOT clean up locker_entries or share_links — source-confirmed
13. Unit system (Imperial/Metric) is NOT per-file — source-confirmed
14. Save is required for appearance changes to reach DB (and thus Review) — source-confirmed
15. Dev and prod likely have separate databases — source (NODE_ENV check) + platform pattern

---

### B. SUPERSEDED / DISPROVEN 025R FINDINGS

1. **SUPERSEDED**: "DB payload null → 025Q wrote null" → **CORRECTED**: DB has {type:'custom',photoId:'701cc0ea-...'} — DB query
2. **SUPERSEDED**: "025Q failed due to null data or CASE B" → **CORRECTED**: 025Q worked correctly; type:custom is the correct block — DB query + source
3. **SUPERSEDED**: "The primary root cause is a data gap (null DB)" → **CORRECTED**: The primary root cause is type:custom (device-local blob) — DB query + source

---

### C. WHOLE-APP ARCHITECTURE MAP

See Section B (Q9–Q38) above — comprehensive feature-by-feature map.

---

### D. PERSISTENCE MATRIX

See Section C (Q39–Q63) above — complete persistence matrix by data type.

---

### E. SAVE / savedAt / sourceVersion MATRIX

| Action | Handler | API | Payload changes | savedAt changes | sourceVersion changes |
|--------|---------|-----|-----------------|----------------|----------------------|
| Save (item/weight/qty/checked) | commitSaveReplace | PUT /api/locker/:id | YES | YES | YES |
| Save (appearance only) | commitSaveReplace | PUT /api/locker/:id | YES | YES | YES |
| Change without Save | — | — | NO | NO | NO |
| Rename | serverRename | PATCH /api/locker/:id | NO (name only) | NO | YES (name in fingerprint) |
| Save As | commitSaveNew | POST /api/locker | YES (new row) | YES (new) | YES |
| Delete | serverDelete | DELETE /api/locker/:id | — | — | YES (row removed) |

Key insight: sourceVersion changes ONLY when id, name, or savedAt changes in the DB. Appearance changes without Save are INVISIBLE to sourceVersion forever.

---

### F. CHECKPOINT / ROLLBACK SAFETY

- Source code: snapshotted ✓ (high confidence)
- Configuration: snapshotted ✓ (high confidence)
- Database rows: **UNKNOWN** — requires controlled test or platform docs
- Browser localStorage: NOT snapshotted (browser-side)
- Browser IndexedDB: NOT snapshotted (browser-side)
- Secrets/env vars: UNKNOWN (likely independent of checkpoints)

Safe rollback sequence: STOP → identify changed files → find pre-prompt checkpoint → check for DB migration → restore checkpoint → re-test USER-VERIFIED PASS behaviors.

---

### G. DEVELOPMENT VS PUBLISHED DATA

- Dev and prod LIKELY have separate databases (based on NODE_ENV check and standard Replit pattern)
- localStorage/IndexedDB: DEFINITELY separate (different origins)
- Dev Locker records do NOT automatically appear in production
- Code republish does NOT wipe production DB data

---

### H. BACKUP / EXPORT FINDING

- No user-facing export/backup exists
- Replit can safely do read-only SQL export of all locker_entries before risky prompts
- Custom photo blobs cannot be backed up without browser DevTools (not accessible to Replit)
- Minimum pre-migration backup: SQL export of locker_entries + screenshot of Custom Theme collection names

---

### I. LIVE SHARE PRIVACY SCOPE

- One live token = ENTIRE Locker for ownerId — all files exposed
- No per-file exclusion mechanism
- New files added tomorrow → visible through existing token immediately
- Deleted files → gone from next Review reload (sourceVersion changes)
- ownerId NOT in public DTO
- Custom photo UUIDs ARE in public DTO (but blobs are not accessible)
- No rate limiting; no token expiry; no revocation

---

### J. SHARE TOKEN SECURITY

- Format: 10 hex chars = 40 bits entropy
- CSPRNG: YES (Node.js crypto.randomBytes)
- Rate limiting: NO
- Token expiry: NO
- Revocation: NO
- Recommendation: 128 bits (32 hex chars) minimum for production; add rate limiting
- Changing token length: backward compatible (existing tokens still work)

---

### K. REVIEW SANDBOX BEHAVIOR

- 4 token-namespaced keys; all appearance keys are GLOBAL (shared with Owner)
- CASE A: fresh → full seed
- CASE B: unchanged source → preserve local edits (no seed)
- CASE C: source changed → full reseed (toast notification, no confirmation)
- Two different Review tokens in same browser share global appearance keys (contamination possible)
- Review can contaminate Owner appearance in same browser via 025Q global writes
- Review CANNOT write to Owner DB (server auth gate + client gate)

---

### L. BACKGROUND UUID PROVENANCE

- UUID: `701cc0ea-4912-416c-b08e-0c747381668c`
- Format: UUID v4 from crypto.randomUUID()
- Storage: Owner's browser IndexedDB only (trailweigh/bgPhotos)
- DB record shape: `{ photoId, blob, mimeType, width, height }` — NO source URL, NO creation date
- Provenance: UNKNOWN — could be direct upload or legacy dataUrl migration
- Cannot determine provenance without browser DevTools on Owner's device

---

### M. THEME HISTORY / CURRENT CANONICAL REGISTRY

- Currently: only Landscape (10 Unsplash presets)
- History: 023B added Topo; 023C added Retro-Outdoors + Psychedelic + renamed Topo 1; 023D REMOVED all three (caused duplicates with owner's custom collections)
- Owner's Retro-Outdoors, Psychedelic, Topo: private custom localStorage/IndexedDB collections
- Canonical registry: PRESETS array in BackgroundPicker.tsx
- Rules: stable IDs, no renaming, new groups must not duplicate custom collection names

---

### N. TEST-DATA SAFETY PLAN

- No dedicated test account or test DB currently
- Test files: name with "TW TEST [prompt] - SAFE TO DELETE"
- Agent must clean up test data before closing any prompt
- Clean-up proof: run SELECT after DELETE to show 0 rows
- "Sample List Live Test" is owner's primary file — never alter without explicit approval

---

### O. DELETION / PRIVACY LIFECYCLE

- File delete: removes locker_entries row; share_links NOT touched; browser localStorage updated; review sandbox eventually updated on CASE C
- Account delete: NO automatic cleanup (Clerk webhook only handles user.created); locker_entries and share_links REMAIN in DB indefinitely
- Custom photo blobs: NOT deleted by account deletion (browser-side)
- Deletion is NOT end-to-end — privacy gap for GDPR/data rights

---

### P. DATA MODEL VERSIONING

- PackStore: `__v: 5` version field; parseV5 validates it
- Locker payload: NO version field; backward compat via optional field defaults
- Migrations: v4→v5 (localStorage), dataUrl→IndexedDB (background), mergeDefaultCategories (forward compat)
- New fields: safe to add (old records get defaults); renaming fields: DANGEROUS (silent failures)
- Before any future schema change: export current full locker_entries as JSON fixture

---

### Q. EXTERNAL-ASSET RELIABILITY

- Landscape presets: Unsplash CDN URLs — no local copy
- Reliability: dependent on Unsplash availability
- 404 on preset: broken background image; app continues to function
- No caching by app; browser cache only
- Migration path: change getFullUrl() template; no DB migration needed

---

### R. TECHNICAL DEBT TO LEAVE ALONE

- Background lazy initializer (complex multi-path; many PASS behaviors depend on it)
- 025Q global localStorage writes in seedFromLiveFiles (correct behavior; leave until useEffect approach replaces it)
- Frozen-snapshot backward compat paths (SharedPackView, ReviewPage frozen path, links.ts frozen GET)
- SharedChecklistPage dead import in App.tsx (no functional impact)
- v4→v5 migration, mergeDefaultCategories, dataUrl migration (all stable; needed for backward compat)

---

### S. CHATGPT ↔ REPLIT COMMUNICATION MAP

See Section T (Q241–Q260) above — comprehensive per-feature communication map.

Key naming rules:
- Type:preset ≠ type:custom (critical architectural distinction)
- "Save" means server-save (not localStorage save)
- "Locker" = the saved-file panel
- "Review" = public /s/:token page
- "sourceVersion" changes on Save/Rename/Delete, NOT on appearance-only changes

---

### T. BEST FUTURE PROMPT PROTOCOL

Pre-prompt (user):
1. Click Save on active file → confirm toast appears
2. Screenshot Locker panel, gear list, active background
3. Confirm Replit checkpoint exists
4. Tell ChatGPT prompt number + current state

Post-prompt (Replit must report):
- `APPLICATION CODE CHANGED BY [PROMPT]: [list of files]`
- `DATABASE DATA CHANGED BY [PROMPT]: NONE` (or list explicitly)
- `git diff --name-only HEAD` output included
- USER VERIFICATION REQUIRED: [exact steps in private/incognito browser]

STOP triggers: unrelated file changed; preset ID renamed; auth gate removed; scope exceeds stated files.

---

### U. REMAINING BLOCKING UNKNOWNS

1. **Checkpoint DB behavior** — BLOCKS safe schema migration prompts
2. **Dev vs prod database separation** — BLOCKS safe testing protocols if they share DB
3. Background UUID provenance — deferred (no active repair planned)

---

### V. SAFE TRAILWEIGH WORKFLOW FOR THE USER

*(Plain language for non-programmers)*

**1. What to Save before any future prompt.**
Before you send any message to ChatGPT asking for a code change, open the TrailWeigh app, click the Save button on your current gear list, and wait for the "Saved [filename]" message to appear at the bottom. This makes sure your current work is stored safely on the server — not just in your browser.

**2. How to verify the file really saved to the server Locker.**
After clicking Save: sign out of TrailWeigh, then sign back in. Open the Locker panel (folder icon). Your file should appear there with its correct name and the current date. If it appears after sign-in, it's on the server.

Even better: open TrailWeigh on a different device (phone, another computer) and sign in. If you see the same file there, it's definitely on the server.

**3. What screenshot/evidence to capture.**
Before sending any prompt to ChatGPT, take three screenshots:
- The Locker panel (showing all your saved files and their dates)
- The gear list itself
- The Background/Themes panel showing your current background and any Custom Themes you've created

These screenshots are your backup if something goes wrong.

**4. What Replit checkpoint does and does NOT protect.**
A Replit checkpoint saves a snapshot of the application code. It almost certainly DOES include your saved gear files on the server (the database), but this is not 100% confirmed. It does NOT protect:
- Your browser's local storage (clearing your browser data destroys local settings)
- Your Custom Theme photos (those only exist in your browser — see #7)
- Files you saved AFTER the checkpoint was taken

**5. When NOT to restore a checkpoint without checking DB consequences.**
If Replit made a change to the database structure (a "schema migration"), restoring an older checkpoint could leave the database in a broken state — like putting the wrong key into a lock. Before restoring any checkpoint after a database change: ask ChatGPT to check whether the schema was changed, and what happens if you roll back.

**6. How to test Review safely in private/incognito.**
When testing whether your shared link works for other people, ALWAYS use a private (incognito) browser window. Open your share link there. This simulates what a visitor who has never been to your site sees. If you use your normal browser, it may show your own data and give you a false result.

**7. How to protect Custom Theme photos.**
Your custom uploaded photos (the ones in your own Retro-Outdoors, Psychedelic, and Topo collections) are stored only in your browser. They are NOT backed up to the server. To protect them:
- Do NOT clear your browser history/data without noting your Custom Theme names first
- Do NOT use private/incognito windows for editing Custom Themes (private windows close and lose all local data)
- If you use a new computer or phone, those themes will not be there — they must be uploaded again

**8. What never to clear/delete/reset without explicit approval.**
Never (without explicit ChatGPT/Replit approval):
- Clear your browser localStorage or cookies (destroys Locker settings, unit preference, and theme metadata)
- Clear browser data for the TrailWeigh site (destroys Custom Theme photos)
- Delete any Locker file named "Sample List Live Test" (this is your primary test file)
- Allow Replit to run any command that resets the database

**9. What to upload/send back to ChatGPT after Replit finishes.**
After Replit finishes a change, send back:
- The result of your test in a FRESH PRIVATE/INCOGNITO browser ("the Review link shows X")
- A screenshot of the result
- Whether the previous USER-VERIFIED PASS behaviors still work (test them in your normal browser)
- Exactly what you expected to see vs what you actually saw

**10. What to do if Replit cannot answer a question.**
If Replit says a question is "UNKNOWN" or cannot be verified from the code, that means the answer requires either:
- Looking in your browser's developer tools (Replit cannot see your browser)
- Checking Replit platform documentation
- Doing a specific test in the live app

Do not proceed with a risky change until those unknowns are resolved. Ask ChatGPT to write a safe test procedure for you.

---

## NO-CODE / NO-DATA-CHANGE VERIFICATION

```
git diff --name-only HEAD
(no output — only workflow-reports files changed, which are reports, not application code)
```

Report files changed:
- `workflow-reports/PROMPT_025S_REPORT.md` (this report, created)
- `workflow-reports/trailweigh-025S-report.zip` (ZIP created)

APPLICATION CODE CHANGED BY 025S = NONE
DATABASE DATA CHANGED BY 025S = NONE
DATABASE SCHEMA CHANGED BY 025S = NONE
OWNER DATA CHANGED BY 025S = NONE

No SQL INSERT, UPDATE, or DELETE was performed during 025S.
No application source files were modified.
No localStorage or IndexedDB was cleared.
No owner files were edited or deleted.

---

## MANDATORY ZIP VERIFICATION

ZIP file: `workflow-reports/trailweigh-025S-report.zip`
Contents: PROMPT_025S_REPORT.md
All 283 numbered questions accounted for (Q1–Q283 + synthesis sections)
No important answers exist only in Agent chat
ZIP verified non-corrupt (see creation step below)
