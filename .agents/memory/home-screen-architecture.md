---
name: Home screen architecture
description: How the R0086 Home screen overlay is structured and navigated within MobileFunctionalV3.
---

## Rule
The Home screen is a `position: absolute; top: 52; left/right: 0; bottom: 0; zIndex: 35` overlay inside `tw-v3-root`. It sits ABOVE the list (zIndex unset) but BELOW the bottom bar (zIndex: 40), so the bottom tab bar and its top-edge shadow remain visible and the tab bar renders on top of it naturally.

**Why:** The list + all its refs stay mounted behind the overlay — no checklist state is lost. The absolute overlay approach avoids conditional unmounting of `mainScrollRef`, `summaryRef`, and other live refs.

**How to apply:**
- `MobileScreen` type: `'list' | 'home' | 'footer-page' | 'share' | 'sources'`
- `handleDrawerHome` sets `screenStack` to `[{ screen: 'list' }, { screen: 'home' }]` (resets stack to prevent sub-screen leakage)
- Guard: if top of stack is already `'home'`, don't double-push
- Navigation back to checklist: `setScreenStack([{ screen: 'list' }])` — never call `popScreen()` from Home buttons because intermediate screens could be in the stack
- App bar gets conditional `boxShadow: '0 2px 10px rgba(0,0,0,0.10)'` when `currentScreen.screen === 'home'` (both bar and page are white; borderBottom alone is too faint)
- `Clock` and `Sparkles` are now imported from lucide-react (added in R0086)

## Placeholders (coming-later state)
- "AI Help Me Create" — `disabled` button, `opacity: 0.8`, "Soon" badge
- "Recent Lists" — `disabled` row, `opacity: 0.5`, "Soon" badge
- "Master List" — `disabled` row, `opacity: 0.5`, "Soon" badge

## Routed actions
- "Build It Myself" → `setScreenStack([{ screen: 'list' }])`
- "Import / Scan a List" → `setScreenStack([{ screen: 'list' }]); openDeck('add')`
- "Continue Current List" → `setScreenStack([{ screen: 'list' }])`
- "My Lists" → `setScreenStack([{ screen: 'list' }]); openDeck('locker')`
