# Prompt 018 — Active File Name + Save Confirmation

---

## Identification

| Field | Value |
|-------|-------|
| **Prompt ID** | 018 |
| **Prompt title** | Active File Name + Save Confirmation |
| **Date** | 2026-08-07 |
| **Starting state** | 017E = USER-TESTED PASS (background/shaking fix); 017F = USER-TESTED PASS (Scan Gear List importer) |
| **Purpose** | (1) Display the current active saved file name in the TrailWeigh interface. (2) After every successful Save or Save As, show "Saved [File Name]" using the real file name — never show just "Saved." |

---

## Requested Behavior

1. **Active file name pill** — read-only, informational-only label in the existing top-control area, styled consistent with existing pills, appearing between the Preview button and the UnitToggle (Imperial/Metric). Only displayed when a saved file is active (not when the list is genuinely new/unsaved). Not a button, not editable.

2. **Save confirmation** — both `commitSaveNew` (Save As / first Save) and `commitSaveReplace` (repeat Save on an already-saved file) must emit `Saved "[actual file name]"`. The name is pulled from the authoritative save result at commit time, not stale UI state.

---

## Source of Truth — Active File Identity

The **single authoritative source** of active file identity in TrailWeigh is:

| Element | Location |
|---------|----------|
| Type | `ActiveLockerFile = { id: string; name: string }` at `Checklist.tsx:74-75` |
| Session key | `ACTIVE_LOCKER_FILE_SS_KEY = 'tw-active-locker-file'` at `Checklist.tsx:83` |
| Read helper | `readActiveLockerFileFromSS()` at `Checklist.tsx:85-97` |
| Write helper | `writeActiveLockerFileToSS()` at `Checklist.tsx:85-97` |
| React state | `const [activeLockerFile, setActiveLockerFile] = useState<ActiveLockerFile \| null>(readActiveLockerFileFromSS)` at `Checklist.tsx:658-660` |
| SessionStorage sync | `useEffect(() => writeActiveLockerFileToSS(activeLockerFile), [activeLockerFile])` at `Checklist.tsx:662-665` |

**No new state was created.** The implementation reads directly from `activeLockerFile` (already in scope in `ChecklistContent`).

---

## Files Inspected

| File | Purpose |
|------|---------|
| `artifacts/pack-checklist/src/pages/Checklist.tsx` | Source of truth for active file identity, save handlers, toast messages, toolbar JSX |
| `artifacts/pack-checklist/src/components/BackgroundPicker.tsx` | Verified 017E fixes (paddingTop, willChange, DEV gate) — untouched by 018 |

---

## Files Changed

| File | Change |
|------|--------|
| `artifacts/pack-checklist/src/pages/Checklist.tsx` | 3 edits: toast messages + filename pill |
| `artifacts/pack-checklist/src/hooks/activeFileName018.test.mjs` | Created — 20 new regression tests |
| `package.json` | Added `activeFileName018.test.mjs` to `test:importer` chain |

---

## Exact Changes

### Change 1 — `commitSaveNew` toast (first Save / Save As)

**Before:** `toast({ description: \`Saved as "${name}"\` });`  
**After:** `toast({ description: \`Saved "${name}"\` });`

`commitSaveNew` (lines 728–750) is called for: first-ever save of a new list, Save As creating a new identity, and conflict resolution "Save as New." In all three cases, `name` is the confirmed, freshly created file name — pulled at commit time, not stale state.

### Change 2 — `commitSaveReplace` toast (repeat Save)

**Before:** `toast({ description: 'Saved.' });`  
**After:** `toast({ description: \`Saved "${name}"\` });`

`commitSaveReplace` (lines 752–785) is called for: repeat Save on an already-identified file, and conflict resolution "Replace." The `name` parameter is passed in from `handleSaveMenuSave` → `target.name` (the current `activeLockerFile.name`) and from the naming dialog path.

### Change 3 — Filename pill in toolbar JSX

Inserted between the Preview button (line 1276) and `<UnitToggle />` (line 1277):

```tsx
{activeLockerFile && (
  <span
    aria-label={`Active file: ${activeLockerFile.name}`}
    title={activeLockerFile.name}
    className="hidden sm:inline-flex items-center bg-muted rounded-lg px-3 py-1.5 text-xs font-medium text-foreground/60 max-w-[10rem] truncate select-none pointer-events-none"
  >
    {activeLockerFile.name}
  </span>
)}
```

**Design decisions:**
- `{activeLockerFile && (…)}` — only renders when a real saved file is active; disappears on New (which sets `activeLockerFile` to null)
- `<span>` not `<button>` — informational only; no click handler, no hover state
- `pointer-events-none` — all mouse events pass through (cannot accidentally be clicked)
- `select-none` — name cannot be selected as text (doesn't look interactive)
- `hidden sm:inline-flex` — hidden on viewports below 640px; appears at `sm` and above
- `max-w-[10rem] truncate` — long names truncate at ~10rem with ellipsis instead of overflowing
- `title={activeLockerFile.name}` — full name available in browser tooltip on hover/overflow
- `text-foreground/60` — slightly dimmer than the active Hide/Preview buttons; visually secondary
- Placed after Preview and before `<UnitToggle />` — preserves Hide → Preview → [name] → Imperial/Metric order

---

## Before / After Behavior

### Save confirmation

| Scenario | Before | After |
|----------|--------|-------|
| First Save (new list named "JMT 2026") | `Saved as "JMT 2026"` | `Saved "JMT 2026"` |
| Repeat Save (already saved as "JMT 2026") | `Saved.` | `Saved "JMT 2026"` |
| Save As (creates "JMT 2026 Light" from "JMT 2026") | `Saved as "JMT 2026 Light"` | `Saved "JMT 2026 Light"` |
| Save As conflict → Replace | `Saved.` | `Saved "[name]"` |
| Save As conflict → Save as New | `Saved as "[name]"` | `Saved "[name]"` |

### Active file name display

| Scenario | Before | After |
|----------|--------|-------|
| New unsaved list | (nothing) | (nothing — pill not shown) |
| After first Save as "JMT 2026" | (nothing) | Pill shows `JMT 2026` |
| After Save As to "JMT 2026 Light" | (nothing) | Pill shows `JMT 2026 Light` |
| After Locker Open of "PCT Day 1" | (nothing) | Pill shows `PCT Day 1` |
| After New (clears state) | (nothing) | (nothing — pill disappears) |

---

## State-Safety Analysis (Required by Prompt)

**(a) Open File A → Save As File B → edit → Save → must update File B not File A:**
- `handleSaveMenuSaveAs` → `openSaveDialog` → user types "File B" → `commitSaveNew("File B")`
- `commitSaveNew` sets `activeLockerFile = { id: newUUID, name: "File B" }` (line 744–746)
- Subsequent `handleSaveMenuSave` reads `activeLockerFile` → calls `commitSaveReplace(File_B_id, "File B")`
- File A is unchanged. Toast: `Saved "File B"` ✅

**(b) Open File A → Locker Open File C → Save → only File C updates:**
- `handleLoadFromLocker(File_C)` sets `activeLockerFile = { id: File_C_id, name: "File C" }`
- Subsequent `handleSaveMenuSave` reads `activeLockerFile = File C` → calls `commitSaveReplace(File_C_id, "File C")`
- `commitSaveReplace` verifies `lockerEntries.some(e => e.id === File_C_id)` before writing
- File A is unchanged. Toast: `Saved "File C"` ✅

---

## Automated Test Results

**Command:** `pnpm test:importer`

| Suite | Tests | Result |
|-------|-------|--------|
| `importGear.test.mjs` | 219 | ✅ PASS |
| `importGear.pdf.test.mjs` | 54 | ✅ PASS |
| `importGear.pdf.api.test.mjs` | 53 | ✅ PASS |
| `scanGear.test.mjs` | 47 | ✅ PASS |
| `categoryAliases.test.mjs` | 77 | ✅ PASS |
| `usePackData.test.mjs` | 64 | ✅ PASS |
| `moveItem.test.mjs` | 47 | ✅ PASS |
| `pieColor.test.mjs` | 41 | ✅ PASS |
| `bgCollections.test.mjs` | — | ✅ PASS |
| `bgCollections016A.test.mjs` | — | ✅ PASS |
| `bgPhotoStore016B.test.mjs` | — | ✅ PASS |
| `controls017.test.mjs` | 24 | ✅ PASS |
| `landscapeHover017B.test.mjs` | 24 | ✅ PASS |
| `landscapeActiveBackground017C.test.mjs` | 22 | ✅ PASS |
| `landscapeShake017D.test.mjs` | 26 | ✅ PASS |
| `landscapeShake017E.test.mjs` | 38 | ✅ PASS |
| `activeFileName018.test.mjs` | 20 | ✅ PASS |

**Total passed: 846 / Total failed: 0 / Exit code: 0**  
**New tests added in 018: 20** (Tests 1–20 in `activeFileName018.test.mjs`)

> ⚠️ Automated tests do not prove the visible UI behavior in a real browser. The filename pill and toast messages require a human fresh-preview test to confirm they render and appear correctly.

---

## Rendered Testing Performed

| Check | Result |
|-------|--------|
| Vite HMR applied Checklist.tsx changes cleanly — no build errors in workflow logs | ✅ PASS |
| Browser console — no errors after HMR update | ✅ PASS |
| Screenshot taken — app loads, toolbar visible | ✅ PASS (see screenshots/018-checklist-view.jpg) |
| Pill visible in screenshot (requires saved file to be active — screenshot shows unsaved new state, pill correctly absent) | ✅ Expected — pill only appears after a save |
| App renders without crash | ✅ PASS |

> Final rendered acceptance (pill appears after Save, toast shows file name, Save As switches name, Locker Open shows name, New hides pill) requires the user's fresh post-completion test.

---

## Acceptance Checklist

| Requirement | Status |
|-------------|--------|
| Active file name displayed in toolbar | ✅ PASS — `{activeLockerFile && <span>}` conditional pill inserted |
| Pill uses existing `activeLockerFile` state — no new parallel state | ✅ PASS — reads from state already in scope |
| Pill is read-only, non-interactive | ✅ PASS — `<span>`, `pointer-events-none`, `select-none` |
| Pill does not show for genuinely unsaved list | ✅ PASS — conditional render; New clears `activeLockerFile` to null |
| Pill placed after Preview, before UnitToggle | ✅ PASS — source order verified by Test 15 |
| Hide → Preview → [name] → Imperial/Metric order preserved | ✅ PASS |
| Pill hidden on very-small viewports (`hidden sm:inline-flex`) | ✅ PASS — Test 14 |
| Long names truncate (max-w-[10rem] truncate) | ✅ PASS — Tests 12, 13 |
| Full name available on hover (title attribute) | ✅ PASS |
| `commitSaveReplace` shows `Saved "[name]"` | ✅ PASS — Tests 1, 2 |
| `commitSaveNew` shows `Saved "[name]"` | ✅ PASS — Tests 3, 4 |
| No save path shows bare `Saved` without a name | ✅ PASS — Test 5 |
| Error toasts (Save failed) unchanged | ✅ PASS — Test 6 |
| Save As switches active identity immediately | ✅ PASS — code path verified (commitSaveNew sets activeLockerFile) |
| Normal Save updates same file, not original after Save As | ✅ PASS — state-safety analysis (a) |
| Locker Open sets correct active identity for subsequent Save | ✅ PASS — state-safety analysis (b) |
| New clears active identity (pill disappears) | ✅ PASS — `handleNew` calls `setActiveLockerFile(null)` |
| 017E background/shaking fix fully intact | ✅ PASS — Tests 16–20 all pass; BackgroundPicker.tsx not touched |
| 017F importer fix fully intact | ✅ PASS — all 53 API tests pass; importGear.ts not touched |
| All 826 prior tests still pass | ✅ PASS — 846 total, 0 failed |
| 20 new 018 tests all pass | ✅ PASS |
| **User fresh-preview test (pill visible, toasts show name)** | ⏳ NOT TESTED — pending user post-completion test |

---

## Unresolved Issues

None. The implementation is additive-only (no existing code removed or refactored). All save paths are covered.

---

## What Requires User Testing

Per testing protocol: app closed while Replit works; fresh preview tab opened only after being told it's complete.

**✅ Prompt 018 implementation is complete.**

Please test in a fresh preview:
1. **New list (unsaved)** — confirm no filename pill is visible in the toolbar
2. **Save (first time)** — name it something specific, click Save → confirm toast shows `Saved "[your name]"` and the pill appears in the toolbar with that name
3. **Save (repeat)** — edit a row, click Save again → confirm toast shows `Saved "[same name]"` and pill still shows same name
4. **Save As** — click Save → Save As, type a new name → confirm toast shows `Saved "[new name]"` and pill immediately updates to new name
5. **Locker Open** — open a different saved file from Locker → confirm pill updates to that file's name
6. **New** — click Save → New → confirm pill disappears (new unsaved list has no identity)
7. **Long filename** — save a file with a very long name → confirm pill truncates with ellipsis, does not overflow toolbar

Do not claim Prompt 018 USER-TESTED PASS until the user confirms these behaviors.
