---
name: Bottom card-deck navigation (V3)
description: R002 architecture that replaced the three-slider model in MobileFunctionalV3 — deck components, interaction rules, test selectors.
---

# Bottom card-deck navigation (replaced three-slider model)

The V3 mobile page uses a 5-tab bottom bar (List, Locker, +, Search, More) plus a
rising "card deck" per tab instead of edge sliders/drag handles.

**Rules baked into the design:**
- Decks are conditionally rendered — a closed deck has no DOM presence, so it can
  never intercept pointers. Backdrop sits below the nav bar (tabs stay usable).
- Deck container is a NON-modal `role="dialog"` (no `aria-modal`); focus moves to
  the Close button on open; cards get a visible focus outline via focus state.
- Card activation: tap (<8px movement) OR upward drag ≥48px; short drags spring
  back; downward drag scrolls the deck. `onPointerCancel` must ONLY reset drag
  state — never activate (a review-caught bug pattern).
- Playwright treats `aria-disabled` elements as non-actionable: tests must use
  `click({ force: true })` to prove a disabled card does nothing.
- Deck test selectors: `getByRole('dialog', { name: <Deck> })`, cards
  `getByRole('button', { name: /^<Title> — open card/ })`, active card
  `getByRole('group', { name: '<Title> — active card' })`, backdrop testid
  `deck-backdrop`.
- Checklist + Summary overlays survived the redesign; they're reached via
  More deck → List Actions. Search deck is honestly all-disabled (no search exists).
- Before mouse-drag tests, wait ~450ms for the deck rise animation or the
  boundingBox is measured mid-flight.

**Why:** R002 spec retired the slider model after gesture audits showed poor
discoverability; the deck keeps all functionality reachable by tap alone.
