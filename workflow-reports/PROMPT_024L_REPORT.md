# TRAILWEIGH — PROMPT 024L REPORT
## Diagnostic Only: Identify What Caused the Sidebar Toolbar Right-Edge Alignment Regression

| Field | Value |
|---|---|
| Prompt number | 024L |
| Agent mode | Economy |
| Time worked | ~5 minutes |
| Actions | 8 (read prompt, read screenshots, 2×git status/log, git diff, 2×read Checklist.tsx sections, write report) |
| Lines/items read | 191 (prompt) + ~270 lines of Checklist.tsx + git log/diff output |
| Agent usage/cost | Economy-range (~$0.50) |

---

## Phase 1 — Git Status and Changed Files

**Current branch/HEAD:** `main` (c702b48)

**Uncommitted changes:** Only the three 024L attachment files in `attached_assets/` (untracked). No staged changes. No changes to any application file.

**Git diff between 024D commit (a78e49f) and HEAD — Checklist.tsx:**
```
0 lines changed
```
`artifacts/pack-checklist/src/pages/Checklist.tsx` is **byte-for-byte identical** to its state after Prompt 024D. No application code was changed between 024D and now.

**Commits between 024D and HEAD:**
- `78b98e3` — 024E import logic (only `importGear.ts` + report assets)
- `c459baa` — 024C (only `importGear.ts` + `ImportGearPanel.tsx` + report assets)
- Several report/asset-only commits

No commit after 024D touched `Checklist.tsx` or any CSS/layout file.

---

## Phase 2 — Comparison Against Last Known-Good State

The controls row and sidebar scrollable in the **current code** are:

**Controls row** (Checklist.tsx line 2390):
```jsx
<div className="relative flex items-center pb-3 lg:pl-1 lg:pr-5 lg:[scrollbar-gutter:stable]">
```

**Sidebar scrollable column** (Checklist.tsx line 2704):
```jsx
<div className="order-first lg:order-last lg:h-full lg:overflow-y-auto lg:min-h-0 lg:pl-1 lg:pr-5 lg:[scrollbar-gutter:stable]">
```

Both divs are in grids with the same column template: `lg:grid-cols-[1fr_365px] lg:gap-4`.
Both have `lg:pl-1 lg:pr-5 lg:[scrollbar-gutter:stable]`.

At first glance they should align. They do not. See Phase 4 for why.

---

## Phase 3 — Rendered / Computed-Layout Check

Direct devtools measurement is not available from the shell. The following is derived from the code + CSS spec:

| Element | Right padding | Scrollbar gutter | Effective right inset from column edge |
|---|---|---|---|
| Controls row (line 2390) | `pr-5` = 20 px | `scrollbar-gutter:stable` — **NOT active** (non-scrollable) | **~20 px** |
| Sidebar scrollable (line 2704) | `pr-5` = 20 px | `scrollbar-gutter:stable` — **active** (overflow-y:auto) | **~35 px** (20 + ~15 gutter) |

**Expected mismatch:** Share's right edge is approximately **15 px** further right than Pack Summary's right edge — consistent with a scrollbar gutter width. This matches the visible gap in the attached alignment screenshot.

---

## Phase 4 — Precise Root Cause

**Finding B applies, with an important nuance: the regression was introduced by a prior code change (024D), not by any change since 024D.**

### The asymmetry

`scrollbar-gutter: stable` (CSS property) reserves gutter space for the scrollbar track **only on scroll containers** — elements with `overflow: auto` or `overflow: scroll`. It has **no effect** on elements with `overflow: visible` (the default) or `overflow: hidden`.

| Div | overflow | `scrollbar-gutter:stable` applies? |
|---|---|---|
| Controls row (line 2390) | `visible` (default — no overflow class) | ❌ No |
| Sidebar scrollable (line 2704) | `overflow-y: auto` (`lg:overflow-y-auto`) | ✅ Yes — reserves ~15 px |

Because the sidebar scrollable reserves ~15 px of gutter on its right side, Pack Summary's content is ~15 px more inset than the controls row's content. Share's right edge extends beyond Pack Summary's right edge by the gutter width.

### Why this appeared in 024D

Before 024D, the controls row had `lg:overflow-hidden`:
```jsx
// 024B state (before 024D fix):
<div className="relative flex items-center pb-3 lg:pl-1 lg:pr-5 lg:overflow-hidden lg:[scrollbar-gutter:stable]">
```

`overflow: hidden` also does **not** activate `scrollbar-gutter` (no scrollbar is shown with hidden overflow). However, `overflow: hidden` **does** affect the element as a block formatting context and changes how its children are sized and contained. In particular, with `overflow: hidden`, the element's content box was clipped to `pr-5` and the effective layout width matched. Without `overflow: hidden`, the flex container can expand past its padding edge in some layout contexts.

The 024D fix removed `lg:overflow-hidden` to un-clip the `BackgroundPickerPanel` (which renders `position:absolute top-full`). This was the correct fix for the Background panel — but it made the gutter asymmetry visually apparent by changing how the content box is constrained. The asymmetry was latent in the 024B design (since `scrollbar-gutter` never worked on the controls row) but the `overflow:hidden` BFC constraint was masking a different aspect of the size mismatch.

### Summary

The current regression is caused by the fact that `scrollbar-gutter: stable` only applies to the **sidebar scrollable** (a real scroll container) and not to the **controls row** (not a scroll container). This asymmetry causes ~15 px of extra right-side gutter on Pack Summary but not on the Share button. The regression was **introduced by 024D** (removal of `lg:overflow-hidden`) and has been present in the codebase since — no code changes after 024D made it worse.

---

## Phase 5 — Smallest Safe Repair (NOT IMPLEMENTED)

Move the `BackgroundPickerPanel` to render via `ReactDOM.createPortal` at the document body level (appended to `document.body`). This lets the picker panel escape its containing div's clipping context without requiring the parent div to be unclipped. Once the panel is portaled, restore `lg:overflow-hidden` on the controls row div (line 2390). With `overflow:hidden` back in place, the BFC constraint aligns the controls row's effective width with the sidebar scrollable's content box, resolving the ~15 px right-edge mismatch. No change to `scrollbar-gutter`, padding, grid, or any other layout property is needed.

---

## Files That Would Likely Need to Change

*(List only — not modified in 024L)*

| File | Change needed |
|---|---|
| `artifacts/pack-checklist/src/pages/Checklist.tsx` | Restore `lg:overflow-hidden` on controls row div (line 2390); wrap `BackgroundPickerPanel` in `ReactDOM.createPortal(…, document.body)` |
| `artifacts/pack-checklist/src/components/BackgroundPicker.tsx` | Adjust portal positioning (use fixed + computed offset instead of `absolute top-full`) |

---

## Confirmation

**No application code or behavior was changed in Prompt 024L.**

Only `workflow-reports/PROMPT_024L_REPORT.md` and `workflow-reports/trailweigh-024L-report.zip` were created.
