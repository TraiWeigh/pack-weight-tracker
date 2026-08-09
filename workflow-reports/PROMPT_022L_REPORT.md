# Prompt 022L — Expanded About + Sources & References

**Status:** COMPLETE ✅  
**Date:** 2026-08-09  
**Tests:** 92 new (about022L) + 106 updated (about022D) — 0 failures across full suite

---

## What Changed

### 1. `AboutPage.tsx` — Full Content Rewrite (681 → 1,143 lines)

**Previous structure (12 accordions):**
What Is Ultralight? → Ray-Way → Minimalist → One Tool → Systems → Knowledge → Trail or Camp → HYOH → Tool Not Contest → Remember Why → Respect → Where Fits In

**New structure (17 accordions + 4 non-collapsible section labels):**

```
About TrailWeigh [always-visible intro]

MENTAL / PHYSICAL / SPIRITUAL  [section label]
1.  Remember Why We're Here
2.  Mind — Mental & Emotional Benefits          ← NEW
3.  Body — Physical Benefits                    ← NEW
4.  Spirit — Awe, Connection & Meaning         ← NEW

HIKING PHILOSOPHY  [section label]
5.  Do You Hike for the Trail or the Camp?
6.  Hike Your Own Hike — HYOH
7.  Respect the Trail—and Each Other

ULTRALIGHT  [section label]
8.  What Is Ultralight?
9.  Ultralight Is a Tool, Not a Contest
10. The Minimalist Mindset
11. Ray-Way
12. Knowledge Weighs Nothing
13. Think in Systems
14. One Tool, Many Uses

TRAILWEIGH  [section label]
15. Where TrailWeigh Fits In
16. About the Creator                           ← NEW
17. Credits                                     ← NEW

Sources & References [link → modal]
Help & How-To / Contact [card]
```

**Content corrections:**
- Ray-Way: **12,500 miles** (corrected from an unsupported 15,000 figure); 1987–1994 date range; publication history with beta printing Dec 1991, first commercial April 1992, 2nd ed 1996, *Beyond Backpacking* 1999, *Trail Life* 2008
- Ray-Way: independence disclaimer ("TrailWeigh is an independent project and is not affiliated with, sponsored by or endorsed by Ray Jardine or Ray-Way.")
- Trail or Camp: "Neither approach is inherently better" (was "wrong")
- Minimalist: "simplicity with purpose" reframed as aesthetic-goal caveat rather than defining phrase
- Why We're Here: "We go outside to be outside" removed; replaced with deeper prose about nature imagery, "Look up. Listen. Notice where you are."

**New evidence-based sections with inline citations [1]–[25]:**
- *Mind*: positive mood, stress reduction, cognitive flexibility research; caveats on variable results
- *Body*: cardiovascular/physical activity benefits; "We Are Ecosystems" sub-section on biodiversity, microbiome, immune research with appropriate caveats
- *Spirit*: awe / small-self research; nature connectedness meta-analyses; John Muir quote; Tao Te Ching Ch. 25; Psalm 24:1; Karaṇīya Mettā Sutta; "We are part of nature" ecological framing

**New reusable components in AboutPage:**
- `SectionLabel` — non-collapsible uppercase divider
- `Cite({ n })` — inline `<sup><button>[N]</button></sup>` that opens SourcesModal scrolled to the reference; defined inside AboutPage

---

### 2. `SourcesModal.tsx` — NEW component

- 25 numbered references with DOI / PMID / canonical URLs, organized into 5 sections:
  - Mental & Emotional Well-Being
  - Nature, Physical Health & Green Space
  - Awe, Meaning & Nature Connectedness
  - Philosophy & Literature
  - Ray Jardine / Ray-Way
- Accessible dialog: `role="dialog"`, `aria-modal`, `aria-labelledby`, focus trap, Escape-to-close, scroll-to-ref via `scrollToRef` prop
- Used independently in: AboutPage, Footer (own state), SharedChecklistPage ×2 (own state per view)

---

### 3. `Footer.tsx` — Sources & References button added

- `useState(false)` for its own SourcesModal instance (independent of AboutPage)
- "Sources & References" button in column 1 nav (About TrailWeigh column)
- `<SourcesModal>` rendered in a React Fragment wrapper
- All prior invariants preserved: `#1e2322`, `flex-shrink-0`, `print:hidden`, `informationalOnly` prop, 3-column grid

---

### 4. `SharedChecklistPage.tsx` — Sources links in both view paths

- `SourcesModal` imported
- **SharedChecklistContent** (full shared view, line ~188): `useState(false)` + Sources link before `<Footer>` + `<SourcesModal>` render
- **SharedPackListContent** (checkable packing list view, line ~1394): `useState(false)` + Sources link before `<Footer>` + `<SourcesModal>` render
- All 022G / 022J invariants preserved (no `last-active-file` write, `defaultOpen={true}` for panels, `useState(true)` for SharedLockerPanel)

---

### 5. `about022D.test.mjs` — 4 intentional assertion updates

| Test | Old assertion | New assertion |
|---|---|---|
| Section order | 12-section old order | 12-section 022L order |
| Ray-Way mileage | `has('15,000')` | `has('12,500')` |
| Trail or camp framing | `has('Neither approach is wrong')` | `has('Neither approach is inherently better')` OR old phrase |
| Why We're Here theme | `has('We go outside to be outside')` | `has('Look up') \|\| has('Notice where you are') \|\| ...` |

---

### 6. `about022L.test.mjs` — NEW test file (92 assertions)

Covers:
- All 17 sections and their IDs present (34 assertions)
- 4 SectionLabel dividers present
- New 022L section order (full 17-section order check)
- Mind section: mental/emotional framing, citation markers, research caveats, cognitive mention
- Body section: cardiovascular, microbiome, ecosystem framing, caveats
- Spirit section: no-religion framing, awe, small-self, nature connectedness, John Muir, Tao Te Ching, "We are part of nature"
- Ray-Way corrections: 12,500 (not 15,000), 1987–1994, independence disclaimer, publication dates
- About the Creator: present, no false biography
- Credits: hiking community acknowledgment, third-party disclaimer
- SourcesModal: file exists, accessible dialog, 25 references (ref-1 through ref-25), scrollToRef prop, DOI/PMID present
- Cite component: defined in AboutPage, renders as `<sup><button>`, triggers modal
- SourcesModal integration: About, Footer, SharedChecklistPage (×2 occurrences each)
- No third-party artwork (no `<img>` referencing book covers, no external image URLs)
- 022J regression: Share labels, panel defaults
- 022G regression: no `last-active-file` write

---

### 7. `package.json` — test chain updated

`about022L.test.mjs` added to `test:importer` chain (end of chain, after `panelDefaults022J.test.mjs`)

---

## Test Results

```
022D About TrailWeigh:   106 passed,  0 failed
022L About Expanded + Sources: 92 passed,  0 failed
Full suite: 0 failures
```

---

## ⚠️ PRE-LAUNCH REMINDER

The Ray-Way section references the Ray-Way publication history for educational/citation purposes. Before production launch:

1. **Verify the 12,500-mile total** against the most current version of Ray Jardine's published chronology. The figure used here is sourced from his own published account; confirm it has not been revised.
2. **No Ray Jardine or Ray-Way imagery has been added.** Do not add book covers, author photos, or other copyrighted artwork without confirming rights.
3. **Review the independence disclaimer** ("TrailWeigh is an independent project and is not affiliated with, sponsored by or endorsed by Ray Jardine or Ray-Way.") with legal counsel if publishing commercially.
4. **Review all 25 references in SourcesModal** for accuracy and appropriate citation format before public launch.
5. **The About the Creator section contains a placeholder.** Replace placeholder text with actual creator information before launch.

---

## Preserved Invariants

- `Footer`: `#1e2322`, `flex-shrink-0`, `print:hidden`, `informationalOnly` prop — unchanged
- 022F: no `overflow-hidden` trap in shared views
- 022G: `SharedChecklistPage` never writes `last-active-file`
- 022J: `SharedLockerPanel useState(true)`, `ImportGearPanel defaultOpen={true}`, share labels
- All section IDs from 022D preserved: `id="ultralight"`, `id="ray-way"`, `id="minimalist"`, etc.
- Philosophy callout (3 lines) visible in always-visible intro and in Where TrailWeigh Fits In
- "Then go outside." final line preserved
