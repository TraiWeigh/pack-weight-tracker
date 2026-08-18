---
name: R0080 nav-wrap + frosted glass
description: How Next-wrap navigation and the matte-frosted List Summary were implemented; architectural constraints to keep for future changes.
---

## Next-wrap navigation

**Rule:** Only Next wraps (Group 4 → Group 1). Back always clamps — Group 1 has no Previous chevron and `goLeft` uses `Math.max(0, cur - 1)`.

**Implementation:** `goRight` uses `(cur + 1) % NUM_BOX_GROUPS`. Swipe-forward threshold also uses modular: `settleRef.current((cur + 1) % NUM_BOX_GROUPS)` with no endpoint guard.

**Why:** Live-drag visual clamp at Group 4's right edge is intentionally preserved (no visual preview of the wrap during finger-down). Removing that clamp would show empty track space to the right of Group 4 in the CSS translate system. The wrap commits instantly on finger-lift.

**How to apply:** Any future "wrap" requirement on Back would require: (a) adding a Previous chevron to Group 1, (b) changing `goLeft` to modular arithmetic, (c) updating the left-endpoint drag clamp at the old `cur === 0 && dx > 0 ? 0` line.

## Matte-frosted List Summary

**Rule:** Transparent outer wrapper + semi-transparent inner panel + backdrop-filter. Never put `background` on the outer sticky wrapper if you want blur to show through.

**Implementation:**
- Outer `[data-testid="list-summary-bar"]`: no `background`, `backdropFilter: 'blur(14px) saturate(1.25)'`, `WebkitBackdropFilter` same.
- Inner content div: `background: 'rgba(42, 87, 64, 0.82)'` (was `SUMMARY_BG = '#2A5740'`).

**Why:** `backdrop-filter` blurs what is behind the element, but the blur only shows through where the element itself is transparent. If the outer wrapper had `background: PAGE_BG` (opaque cream), the blur would composite against cream, not the scrolling categories.

**How to apply:** If the Summary BG colour ever changes, update both the SUMMARY_BG constant AND the hardcoded `rgba(r,g,b,0.82)` in the inner div to match. Do not add `background` back to the outer wrapper without removing backdrop-filter, or the effect breaks.

## geometry preservation

`summaryRef.getBoundingClientRect().bottom` is read by R0076P3 long-category positioning. The outer wrapper size/position is unchanged by backdrop-filter. Safe to add visual effects to the wrapper as long as `height`, `top`, and `margin` are not altered.

## P2-16 flake note

`P2-16 — Delete row auto-reveals in long mode` (r0077p2.spec.ts:521) fails intermittently when run in a full suite but passes in isolation. Pre-existing — not caused by nav or frosted changes.
