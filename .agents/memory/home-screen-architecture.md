---
name: Home screen architecture
description: How the R0087/R0088 Home screen overlay is structured, navigated, and hero-pinned in MobileFunctionalV3.
---

## Rule
The Home screen is a `position: absolute; top: 52; left/right: 0; bottom: 0; zIndex: 35` overlay inside `tw-v3-root`. It sits ABOVE the list (zIndex unset) but BELOW the bottom bar (zIndex: 40), so the bottom tab bar and its top-edge shadow remain visible and the tab bar renders on top of it naturally.

**Why:** The list + all its refs stay mounted behind the overlay — no checklist state is lost. The absolute overlay approach avoids conditional unmounting of `mainScrollRef`, `summaryRef`, and other live refs.

## R0088 iOS hero-pinning rule (critical)
The Home overlay is a **flex column, NOT a scroll container**. The green hero must be a `flexShrink: 0` child of the outer flex div, NOT inside any `overflowY: auto` container. A separate inner div with `flex: 1; overflowY: auto; overscrollBehavior: contain` wraps only the scrollable content (use-case grid + 7 bars).

**Why:** iOS Safari applies a physics-based rubber-band bounce to every `overflow: auto` container. Any child inside that container — including `position: sticky` — is physically displaced during bounce. The hero must live entirely outside the scroll layer so iOS bounce cannot reach it.

**Structure:**
```
outer overlay div  [position:absolute, top:52, display:flex, flexDirection:column — NO overflowY]
  hero div         [flexShrink:0, zIndex:1 — never inside a scroll container]
  inner scroll div [flex:1, overflowY:auto, overscrollBehavior:contain]
    use-case grid
    divider
    7 wedge bars (with bottom padding for nav bar)
```

**How to apply:**
- `MobileScreen` type: `'list' | 'home' | 'footer-page' | 'share' | 'sources'`
- `handleDrawerHome` sets `screenStack` to `[{ screen: 'list' }, { screen: 'home' }]` (resets stack to prevent sub-screen leakage)
- Guard: if top of stack is already `'home'`, don't double-push
- Navigation back to checklist: `setScreenStack([{ screen: 'list' }])` — never call `popScreen()` from Home buttons because intermediate screens could be in the stack
- App bar gets conditional `boxShadow: '0 2px 10px rgba(0,0,0,0.10)'` when `currentScreen.screen === 'home'`

## R0087 Home content (current)
Three sections inside the inner scroll div:
1. **Use-case grid** — 2-column, 6 chips (Backpacking, Travel, Camping, Cargo, Moving, Inventory)
2. **Divider** — 1px
3. **Seven wedge bars** (WEDGE_W=72, WEDGE_POINT=17, CARD_H=68, same clipPath as pack-list categories):
   - Start Here → `openDeck('add')` — `#2A7A5A`
   - Tutorials → disabled "Soon" — `#5C6BC0`
   - Controls → disabled "Soon" — `#7B5D87`
   - My Lists → `openDeck('locker')` — `#3B6978`
   - Master List → disabled "Soon" — `#6B6B3A`
   - Locations → disabled "Soon" — `#1B7A8A`
   - Settings → `openDeck('more')` — `#4A5568`

## Hero styling (do not change)
```
background: SUMMARY_BG (#2A5740)
padding: 24px 20px 28px
boxShadow: 0 4px 16px rgba(0,0,0,0.22)
flexShrink: 0, zIndex: 1
```
Eyebrow: "TrailWeigh" (11px, 700, rgba(255,255,255,0.60), uppercase)
H1: "Checklist Engine" (26px, 800, #FFFFFF, uppercase)
Subtitle: "Create your own custom checklist or let AI do it for you!" (14px, rgba(255,255,255,0.82))
