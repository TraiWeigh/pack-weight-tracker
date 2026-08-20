---
name: Fixed-layer row counting
description: Visual-test tolerance for rows abutting fixed headers or navigation.
---

**Rule:** When measuring whether a row is fully visible between fixed layers, allow a one-CSS-pixel edge tolerance.

**Why:** Fixed summary/header geometry can resolve to fractional pixels, so a row border may overlap the layer edge by a fraction (for example, 0.25px) while the row is visibly complete. Strict rectangle comparisons produce false partial-row failures.

**How to apply:** Use the tolerance only for visual-capacity assertions at fixed boundaries. Keep horizontal-overflow and true clipping checks exact, and retain screenshots or geometry output for any unexpectedly large overlap.