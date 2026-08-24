---
name: Items 39–56 parity audit
description: Per-item findings for the native vs v3 parity audit, recovered from the blanket "EQUIVALENT BY DESIGN" claim in batch-k-parity-repairs.md. Numbers are this session's sequential continuation; not in any pre-existing written record.
---

## Coverage note

batch-k-parity-repairs.md made a blanket claim: "Items 39–56: EQUIVALENT BY DESIGN (no changes needed)."
This audit recovered them individually. Two mismatches were found in 39–47; two in 48–56.

---

## Items 39–47

| Item | Feature | v3 exact | Native exact | Classification | Safe fix? |
|---|---|---|---|---|---|
| 39 | Toast duration | 3000 ms | 3000 ms (index.tsx line 841) | MATCHES | — |
| 40 | Add Deck 4-card structure | 4 cards matching §12.3 | 4 cards; file header cross-references v3 | MATCHES | — |
| 41 | Nav Drawer "Home" action | setScreenStack([]) | onResetScreen (250ms delay then reset) | MATCHES | — |
| 42 | Nav Drawer "My Lists" action | openDeck('locker') | onMyLists → opens Locker | MATCHES | — |
| 43 | Nav Drawer "Settings" action | openDeck('more') | onOpenMore → opens More deck | MATCHES | — |
| 44 | Nav Drawer "Help & Tutorials" | footer-page:'help' (in-app) | `onOpenHelp` opens the native in-app Help screen | MATCHES | — |
| 45 | Handedness toggle | Two-state toggle, persists localStorage | handedness prop + onToggleHandedness; AsyncStorage | MATCHES (platform-equivalent) | — |
| 46 | Save toast — direct Save | "List saved" | showToast('List saved') | MATCHES | — |
| 47 | Save As toast text | "Saved as '[name]'" | `Saved as '[name]'` | MATCHES | — |

---

## Items 48–56

| Item | Feature | v3 exact | Native exact | Classification | Safe fix? |
|---|---|---|---|---|---|
| 48 | Locker empty-state text | "No saved lists yet. Use More → List Actions → Save to add one." | Title "No saved lists" + Body "Tap Save to save your current list here." | DIFFERENT INTERNALLY BUT EQUIVALENT BY DESIGN | No — native instruction suits native navigation |
| 49 | Search deck | 3 disabled cards ("Not available yet") | 3 disabled cards with the same labels and unavailable/future wording | MATCHES | — |
| 50 | Locker Delete Confirmation | Title "Delete Saved List?", Body "…This removes the saved list only. Items in your Master Library will not be deleted.", Button "Delete List" (destructive), Toast "List deleted" | Same title/body/button meaning and `List deleted` toast | MATCHES | — |
| 51 | Load entry flow | Direct load (no confirm dialog), toast "Loaded '[name]'" | Alert.alert confirmation; toast `"[name]" loaded` | DIFFERENT INTERNALLY BUT EQUIVALENT BY DESIGN | Optional (minor toast word order) |
| 52 | New List Name — Photo List path | "Create List" disabled until non-empty; no fallback name | Native name sheet disables creation until a non-whitespace name is supplied | MATCHES | — |
| 53 | New List Name — Standard List path | Title "Name your new list", Body "Start with a clean, empty gear list.", name input required, Button "Create List" | Same shared native name sheet and required-name behavior | MATCHES | — |
| 54 | Home screen disabled rows | 7 rows; Tutorials/Controls/Locations disabled ("Soon") | Nav Drawer 5 rows; Tutorials/Controls/Locations absent (not disabled, just not present) | DIFFERENT INTERNALLY BUT EQUIVALENT BY DESIGN | No — platform-adapted scope |
| 55 | Add Deck Card 3 Scan/Import | Opens Scanner overlay (ImportGearPanel) | Alert.alert "coming soon for mobile" | DOES NOT MATCH | No — requires full scanner port |
| 56 | Save Chooser sheet | Separate 3-button bottom sheet (Save / Save As / Cancel) | Integrated into Locker modal; no separate gating sheet | DIFFERENT INTERNALLY BUT EQUIVALENT BY DESIGN | No — architectural decision |

**Why:** the earlier recovery audit became stale after later parity repairs. The remaining confirmed mismatch in this range is Item 55 (the mobile Scan / Import card remains a coming-soon alert rather than the V3 scanner flow); the account/report routing surface warrants separate review because it is broader than the Drawer Help item itself.
