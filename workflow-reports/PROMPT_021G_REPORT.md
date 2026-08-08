# Prompt 021G — Fix Shared File Open + Scan Gear List Chevron

**Date:** 2026-08-08  
**Status:** NOT USER-VERIFIED  
**Full regression:** 36 suites, 1,387 checks passing (exit 0)

---

## Starting State

| Prompt | Status at 021G start |
|--------|---------------------|
| 020F | USER-TESTED PASS |
| 021–021A | USER-TESTED PASS |
| 021B | USER-TESTED PASS |
| 021C | USER-TESTED FAIL (old links pre-date lockerFiles) |
| 021D | USER-TESTED FAIL (old links pre-date lockerFiles) |
| 021F menu/labels/layout | USER-TESTED PASS |
| 021F Shared File open | USER-TESTED FAIL |
| 021G | NOT USER-VERIFIED |

Two bugs reported:
1. Files in the Shared Files panel do NOT open when selected
2. Scan Gear List chevron points RIGHT; must point DOWN

---

## Bug 1 — Shared Files Won't Open

### Root Cause

**SharedLockerPanel had no `onClick` on the file row div — only the tiny FolderOpen icon button (3.5×3.5px icon, `p-1.5` padding, `opacity-60`) responded to clicks.**

Users naturally click the **file name text** to open a file. The name text sits inside a `flex-1` div with no event handler. Nothing happens. The FolderOpen button is:
- Small (10.5px total click target)
- At 60% opacity normally (hard to see)
- Only visible at full opacity on `group-hover`

When the user "clicks" a file in the panel, they click the name area (no handler) → nothing loads → they believe the feature is broken.

### Trace of the broken flow

```
Click on file row (name area)
→ div has no onClick
→ event fires on file name <p> element
→ <p> has no handler
→ click consumed, nothing happens
→ switchToFile never called
→ store never updated
→ gear list unchanged
→ user sees: file did not open
```

### Trace of the fixed flow

```
Click anywhere on file row (name, padding, icon area)
→ row div has onClick={() => onOpen(file)}
→ onOpen(file) = f => switchToFile(f.id)
→ switchToFile stashes current state
→ finds file in snapshot.lockerFiles
→ setStore(file.store) — new object, React re-renders
→ setActiveFileId(fileId) — banner updates
→ setBackground / setBgFade / setBgTone / setBgSize
→ gear list shows new file's categories and items
→ banner shows new file's name
→ user sees: file opened ✓
```

### What switchToFile does correctly (confirmed)

`switchToFile` was already implemented correctly. The bug was entirely in the UI:
- State stashing (per-file temp edit isolation via `tempEditsRef` Map) ✓
- `snapshot.lockerFiles.find(f => f.id === fileId)` lookup ✓
- `setStore(file.store)` — file.store is a new object (from normalizeLockerFile) ✓
- React re-render with new store, categories, items ✓
- Undo/redo stack reset on switch ✓
- Stash → restore for revisited files ✓

The state management was correct from day one. Only the click surface was missing.

### Fix Applied

**`SharedChecklistPage.tsx` — SharedLockerPanel:**

```diff
-<div
-  key={file.id}
-  className={`px-4 py-3 flex items-center gap-3 hover:bg-muted/20 transition-colors group${
-    activeId === file.id ? ' bg-primary/5' : ''
-  }`}
->
-  <div className="flex-1 min-w-0">
-    <p className={...}>{file.name}</p>
-  </div>
-  {/* Open only — rename and delete controls are intentionally absent */}
-  <button
-    onClick={() => onOpen(file)}
-    title={`Open "${file.name}"`}
-    className="p-1.5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors flex-shrink-0 opacity-60 group-hover:opacity-100"
-  >
-    <FolderOpen className="w-3.5 h-3.5" />
-  </button>
-</div>
+<div
+  key={file.id}
+  role="button"
+  tabIndex={0}
+  onClick={() => onOpen(file)}
+  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(file); } }}
+  title={`Open "${file.name}"`}
+  className={`px-4 py-3 flex items-center gap-3 hover:bg-muted/20 transition-colors group cursor-pointer${
+    activeId === file.id ? ' bg-primary/5' : ''
+  }`}
+>
+  <div className="flex-1 min-w-0">
+    <p className={...}>{file.name}</p>
+  </div>
+  {/* Folder icon — visual affordance only; the whole row is the click target */}
+  <span
+    aria-hidden="true"
+    className="p-1.5 rounded text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 opacity-60 group-hover:opacity-100"
+  >
+    <FolderOpen className="w-3.5 h-3.5" />
+  </span>
+</div>
```

**Key changes:**
- Row div gains `role="button"`, `tabIndex={0}`, `onClick`, `onKeyDown`, `cursor-pointer`
- `<button onClick>` → `<span aria-hidden="true">` (FolderOpen becomes visual affordance only)
- Keyboard navigation: Enter and Space open the file
- The click target is now the full row width × height (~48px height, full panel width)

---

## Bug 2 — Scan Gear List Chevron Points Right

### Root Cause

`ImportGearPanel.tsx` used `ChevronRight` as the closed-state icon:
```tsx
{open ? <ChevronDown .../>
       : <ChevronRight .../>}
```

When the panel is in the closed state (collapsed), the chevron shows `ChevronRight` (→). The user wants it to point DOWN (↓) in all states.

### Fix Applied

**`ImportGearPanel.tsx` — visual-only:**

```diff
-{open ? <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
-       : <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
+{/* Chevron always points down (visual-only; open/close behaviour unchanged) */}
+<ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
```

Also removed `ChevronRight` from the import statement (was unused after this change).

**Behaviour unchanged:** `useState(true)` open state, `setOpen(o => !o)` toggle, import/upload handlers — all unchanged. Only the chevron direction changes.

---

## Files Changed

| File | Change |
|------|--------|
| `artifacts/pack-checklist/src/pages/SharedChecklistPage.tsx` | SharedLockerPanel: row div clickable (role=button, onClick, onKeyDown, cursor-pointer); FolderOpen demoted to decorative `<span aria-hidden>` |
| `artifacts/pack-checklist/src/components/ImportGearPanel.tsx` | Replaced `{open ? ChevronDown : ChevronRight}` with `<ChevronDown>` always; removed ChevronRight from import |
| `artifacts/pack-checklist/src/hooks/sharedFileOpen021G.test.mjs` | New — 48 tests (groups A–H) |
| `package.json` | test:importer: 35 → 36 suites |
| `TESTING.md` | Added 021G row |

---

## Protected Features Confirmed

| Feature | Status |
|---------|--------|
| Shared file switching (switchToFile logic) | ✓ correct — bug was in click target, not logic |
| Per-file temp state isolation (tempEditsRef Map) | ✓ preserved |
| Sender originals never written (no localStorage.setItem in switchToFile) | ✓ confirmed |
| Shared Rename/Delete absent | ✓ preserved |
| Save Your Own Copy → new UUID | ✓ preserved |
| File name banner updates on switch | ✓ (uses activeFileId lookup) |
| Share menu labels (021F) | ✓ preserved |
| Panel order (021F) | ✓ preserved |
| /checklist auth protection (021A) | ✓ preserved |
| Private Rename/Delete (021B) | ✓ preserved |
| 020F LOCKER_KEY, newseed | ✓ preserved |
| Scan Gear List import behavior | ✓ unchanged (visual-only fix) |
| Preview / Share Pack List | ✓ preserved |

---

## Real-Browser Evidence

### Screenshot — `/s/d2211a8c96` (4-file Shared Locker link)

✅ Banner shows "Viewing 'Seirra/Dutch/0826'" — correct file name display  
✅ Pack Summary, Scan Gear List, Shared Files in correct panel order  
✅ Scan Gear List chevron visible (points down, panel open)  
✅ 4 lockerFiles confirmed in console log: `[TrailWeigh] Share snapshot raw.lockerFiles count: 4`  
✅ No JavaScript errors

### File switching

**Shared file rows are now full-width clickable areas.** The FolderOpen icon remains visible as a visual affordance. Clicking anywhere on a row (file name, padding, or icon) calls `onOpen(file)` → `switchToFile(f.id)`.

---

## Automated Test Results

```
Suite                                      Tests  Status
────────────────────────────────────────────────────────
sharedFileOpen021G.test.mjs                   48  ✅ all pass  (NEW)
shareMenuConsistency021F.test.mjs             31  ✅ all pass
sharePillMenu021E.test.mjs                    45  ✅ all pass
shareLink021.test.mjs                         27  ✅ all pass
sharedLocker021D.test.mjs                     32  ✅ all pass
sharedLocker021C.test.mjs                     70  ✅ all pass
(all prior 30 suites)                        ...  ✅ all pass
────────────────────────────────────────────────────────
Total: 36 suites, 1,387 checks, exit 0
```

---

## Acceptance Checklist

| Item | Status |
|------|--------|
| Shared Files rows respond to click on file name/row | NOT USER-VERIFIED |
| Opening File A shows File A's gear and name | NOT USER-VERIFIED |
| Opening File B replaces File A's content | NOT USER-VERIFIED |
| Returning to File A restores File A (with temp edits) | NOT USER-VERIFIED |
| Repeat switching works reliably | NOT USER-VERIFIED |
| Temp edits are file-specific, don't contaminate other files | NOT USER-VERIFIED |
| Refresh restores original snapshot | NOT USER-VERIFIED |
| Sender originals unchanged | NOT USER-VERIFIED |
| No Rename/Delete in shared view | ✅ code-verified |
| Share menu labels correct (021F) | ✅ code-verified |
| Scan Gear List chevron points down | ✅ code-verified |
| Scan Gear List import still works | NOT USER-VERIFIED |

---

## Status

**021G = NOT USER-VERIFIED**

To verify:
1. Generate a NEW Share Link (owner: click Share → Share Link → copy)
2. Open the shared link in a private/incognito tab
3. In Shared Files panel, click on a file name row → file should open in one click
4. Click another file → content + filename in banner must change
5. Click back to first file → content must restore
6. Repeat switching several times — should be reliable
7. Confirm Scan Gear List chevron points ↓ (not →) in shared view and owner view
