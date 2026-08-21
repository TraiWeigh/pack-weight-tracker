---
name: R0104 photo row tap fix
description: Root causes and fix pattern for unresponsive camera/photo row in mobile expanded item detail panel.
---

# R0104 — Photo Row Full-Width Tap

## The rule
Any 44 px detail-panel row that *looks* tappable (icon + label + small right-side button) must have `onClick` on its **outer container div**, not just on the small inner button. Users tap the icon or label, not the button.

**Why:** The expanded item detail Photo row had a Camera icon and "Photo" label with no handler; only the 36 px "Add Photo" button on the right responded. On iPhone, users tap the icon/label area and nothing happens.

**How to apply:** When adding a new detail-panel row with a primary action, put `onClick` + `cursor:pointer` on the outer div from the start. The inner button keeps its own `onClick` + `e.stopPropagation()` so direct button clicks don't double-fire the outer handler.

---

## iOS Safari bare-img click reliability

Wrap any tappable `<img>` in a `<button>` with `stopPropagation`. iOS Safari can silently drop click events on `<img>` and `<div>` elements even with `cursor:pointer` set.

**Pattern used in R0104:**
```tsx
<button type="button" data-testid="photo-mode-img-btn"
  onClick={e => { e.stopPropagation(); setPhotoEditFor({cat, id}); }}
  aria-label="Edit photo of …"
  style={{ display:'block', width:'100%', padding:0, border:'none', background:'none', cursor:'pointer', borderRadius:8 }}>
  <img data-testid="photo-mode-img" src={…} alt={…} style={{ … }} />
</button>
```

---

## data-testid conventions added in R0104
- `item-photo-row` — outer Photo row div in expanded item detail; **only present when item has no photo**
- `photo-mode-img-btn` — button wrapping the photo-mode card image
- `photo-mode-img` — the img inside that button (satisfies `img[data-testid]` selector in R0103 test 8)

---

## Stoppage pattern (outer div + inner button, no double-fire)
- User taps outer area (icon/label): outer div `onClick` fires → `setPhotoEditFor`
- User taps inner button: button `onClick` fires → `setPhotoEditFor` + `e.stopPropagation()` → outer div handler does NOT fire
- Result: exactly one `setPhotoEditFor` call regardless of tap location ✓
