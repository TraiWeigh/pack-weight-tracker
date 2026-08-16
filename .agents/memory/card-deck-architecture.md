---
name: Bottom card-deck navigation
description: DeckInactiveCard gesture rules, stacked-bar tap-only enforcement, PreviewBody filter patterns, and test selector conventions.
---

## Deck architecture (R002+)
- 5-tab bottom box-group bar; non-modal rising decks per button.
- `DeckInactiveCard` renders inactive cards as stacked bars with `role="button"`, `aria-label="${title} — open card"` (enabled) or `"${title} — not available yet"` (disabled).
- Active card = expanded content; inactive cards = compact stacked bars below it.

## Stacked-bar tap-only rule (R0073)
`DeckInactiveCard.onPointerMove` mode-lock MUST always be `d.mode = 'scroll'`.
- **Why:** The previous conditional `canDeckScroll() ? 'scroll' : (upward + enabled ? 'lift' : 'scroll')` caused enabled bars on non-overflowing decks to physically follow the finger (translateY) and activate on drag ≥ 48 px. This was confirmed by Playwright: 80 px drag → translateY(−80px); 110 px drag → activation.
- **How to apply:** Never re-introduce a `'lift'` mode branch in `DeckInactiveCard` without an explicit spec requirement and a new diagnostic test. Tap + keyboard = the only activation paths.

## PreviewBody filter pattern
- `filterToChecked={true}` with no `checklistUse` → legacy mode → filters to `item.checked === true`. Use for any selected-items-only / print preview.
- `filterToChecked={false}` → all items, unchecked at 0.5 opacity. Use for interactive checklists only.
- **Why:** R0073 confirmed that `PreviewOverlay` was written with `filterToChecked={false}` (show-all) when the requirement was selected-only. The correct pattern was already present in `showChecklist` (line 425) with `filterToChecked={true}`.

## Duplicate-control audit rule (R0073)
When a function gets a dedicated bottom-box launcher, search the full file for every other invocation path (accordion body, overlay, contextual inline button). Remove all non-canonical launchers simultaneously.
- **Why:** The category "+ Add Item" button predated the Group 1 Add box and was missed in the R0072 no-duplicate audit because it lived inside the accordion body, not in a deck card.

## Test selector conventions
- Stacked bars: `getByRole('button', { name: 'CardTitle — open card', exact: true })`
- Disabled bars: `getByRole('button', { name: 'CardTitle — not available yet', exact: true })`
- Deck scrollable container: `getByTestId('deck-scroll')`
- Deck panel: `getByTestId('deck-panel')`
- Bottom nav: `getByTestId('bottom-nav')`
- Category bars: `locator('[data-swipe-key]')`
- Active list name (readiness signal): `getByTestId('active-list-name')`
- pointer-cancel must never activate: `onPointerCancel` → `cancelDrag` (clears state, does NOT call `onActivate`)
