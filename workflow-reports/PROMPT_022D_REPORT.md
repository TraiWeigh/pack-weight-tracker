# Prompt 022D — Build About TrailWeigh Accordion Content

**Date:** 2026-08-08  
**Status:** COMPLETE — all tests passing (106 new tests, full suite exit 0)

---

## Files Changed

| File | Change |
|---|---|
| `src/pages/info/AboutPage.tsx` | Complete rewrite — visible intro + 12-section accordion (32,227 bytes) |
| `src/hooks/about022D.test.mjs` | **NEW** — 106 regression tests for 022D structure and content |
| `package.json` | Added `about022D.test.mjs` to `test:importer` chain |

**No application code changed.** Checklist, weight calculations, undo/redo, save/locker, preview, print, share, backgrounds, showcase, file import, authentication, and existing saved lists are all untouched. Help & How-To from Prompt 022C is untouched.

---

## About Page Structure: Before and After

### Before (022C baseline)

The old AboutPage was a flat, non-accordion page:
- A header with TrailWeigh logo and Back link
- 2 intro paragraphs
- An `h2` section: "What TrailWeigh lets you do"
- 7 feature cards (icon + label + desc): Organize gear by category, Enter quantities and weights, Track Base Weight, Save and open gear lists, Scan Gear List, Preview your list, Share your list
- A single "actively developed" footer note with links to Help and Contact

No ultralight philosophy. No accordion. No educational content.

### After (022D)

**Always-visible introduction:**
- Heading: "About TrailWeigh"
- 8 intro paragraphs covering: what TrailWeigh does, gear list as packing checklist, printing the list, trailhead scenario, TrailWeigh doesn't tell you what to carry
- Philosophy callout (prominent, always visible): "Carry what you need. / Understand why you carry it. / Make each item earn its place."

**12 accordion sections (all collapsed by default):**

| # | Section ID | Title |
|---|---|---|
| 1 | `ultralight` | What Is Ultralight? |
| 2 | `ray-way` | Ray-Way |
| 3 | `minimalist` | The Minimalist Mindset |
| 4 | `multi-use` | One Tool, Many Uses |
| 5 | `systems` | Think in Systems |
| 6 | `knowledge` | Knowledge Weighs Nothing |
| 7 | `trail-or-camp` | Do You Hike for the Trail or the Camp? |
| 8 | `hyoh` | Hike Your Own Hike — HYOH |
| 9 | `tool-not-contest` | Ultralight Is a Tool, Not a Contest |
| 10 | `why-here` | Remember Why We're Here |
| 11 | `respect` | Respect the Trail—and Each Other |
| 12 | `trailweigh-fits` | Where TrailWeigh Fits In |

**Footer nav note:** Links to Help & How-To and Contact Us.

---

## Accordion Implementation

Identical pattern to Prompt 022C's Help accordion:

- `useAccordion()` hook — `useState<Set<string>>(new Set())` (empty — all collapsed)
- `Set<string>` toggle — multiple sections open simultaneously; no auto-close
- `Section` component: `<button>` spans the full title row (`w-full`)
- `aria-expanded`, `aria-controls`, `role="region"`, `aria-labelledby`
- `ChevronDown` / `ChevronUp` disclosure indicator from lucide-react
- `hover:bg-muted/40` hover state; `focus-visible:ring-2 focus-visible:ring-primary` keyboard focus
- Standard HTML `<button>` handles Enter and Space natively
- No "Expand All" button

---

## Section Content Summary

### §1 What Is Ultralight?
- Thoughtful weight reduction approach; not about buying lighter gear
- Commonly used base-weight categories exist but ultralight is also a mindset
- Key questions: Do I need this? Will I actually use it? Does something I already carry do this job? Is there a simpler way?
- Goal: thoughtful, efficient system for the individual hiker and specific trip

### §2 Ray-Way
- Traveling light predated Ray Jardine (historical accuracy guardrail)
- Brief Friend/cam paragraph: engineer/inventor, 1970s, spring-loaded camming device, influential in modern climbing protection
- Focus primarily on ultralight contributions:
  - Ray and Jenny Jardine: 15,000+ miles, 1987–1994
  - 1993 AT thru-hike: base packs below 10 lbs excluding food/water
  - *The PCT Hiker's Handbook* (1991/1992), *Beyond Backpacking*, *Trail Life*
  - Approach: Why am I carrying this? What job does it perform? Can something else do it? Can several pieces work as a system?
  - Influence: lightweight shelters, quilts, frameless packs, homemade gear, multi-use, simpler systems, pack-as-system thinking
- Closing: did not invent traveling light; experimentation, mileage, gear design, and writing shaped modern UL backpacking

### §3 The Minimalist Mindset
- Intentionality, not deprivation
- How gear lists grow (might need it, extra comfort, backup, habit)
- Start with what's needed; choose deliberately; eliminate duplication; question habit
- "The goal isn't deprivation. The goal is simplicity with purpose."
- Philosophy: "Carry what you need. Understand why you carry it. Make each item earn its place."

### §4 One Tool, Many Uses
- "Can something I already carry do this job too?"
- Examples: trekking pole + shelter, stuff sack pillow, bandana, clothing layers, smartphone
- Safety-critical gear clarification: one important job is sufficient justification
- "Carry less by asking more of the things you choose to carry—not by giving up what you truly need."

### §5 Think in Systems
- Shelter ↔ stakes/poles; sleeping gear ↔ shelter and clothing; water capacity ↔ route/conditions
- Smaller gear system → smaller/lighter backpack
- "Do I need this item at all, or can the rest of my system already perform its job?"

### §6 Knowledge Weighs Nothing
- Experience/skills influence what equipment is needed
- Weather, campsite, layering, water, navigation, food, terrain, equipment, personal limits
- Qualifier: doesn't eliminate reasonable safety gear; weather changes, equipment fails, water sources vary
- "Good judgment matters more than a number on a scale."

### §7 Do You Hike for the Trail or the Camp?
- Trail-focused: miles, passes, exploration, lighter pack makes walking more enjoyable
- Camp-focused: arrive early, cook, chair, fish, read, photograph, relax
- Many hikers fall between; same hiker may approach trips differently
- "Neither approach is wrong."
- The question: "What makes this trip enjoyable for me?"

### §8 Hike Your Own Hike — HYOH
- No single correct way to experience a trail
- Gear reflects: trip, experience, abilities, conditions, personal needs, enjoyment
- Examples: foam pad vs inflatable; no-cook vs hot meals; high-mileage vs lakeside day
- "There is the gear that works for you, on this trip, under these conditions."
- HYOH does NOT mean ignoring safety, regulations, wildlife, environmental impact, other users
- "Your hike is your own. The trail is shared."

### §9 Ultralight Is a Tool, Not a Contest
- Benefits: reduced burden, improved comfort, easier movement, farther travel, more enjoyable hiking
- Weight should not become the purpose
- "Ultralight is a tool, not a contest."
- Another person's base weight doesn't determine your list; lighter doesn't automatically mean better
- Best choice: equipment that safely and reliably performs the job for this hiker on this trip

### §10 Remember Why We're Here
- Ounces, grams, spreadsheets — useful but not the reason people go outside
- Nature imagery: sunrise over a ridge, water through a canyon, old trees, mountain passes, sleeping under stars, solitude, friends/family/strangers/four-legged partners, what's around the next bend
- "We go outside to be outside."
- Gear enables experiences; shouldn't feel more important than experiences

### §11 Respect the Trail—and Each Other
- Shared spaces: different backgrounds, abilities, equipment, experience, speeds, goals
- Respect for land, wildlife, rules/regulations, waste disposal, leaving what you find, minimizing impact, consideration for other visitors
- "We don't all need to hike the same way to appreciate the same trail."
- "Hike your own hike—and respect everyone else's opportunity to hike theirs."

### §12 Where TrailWeigh Fits In
- TrailWeigh not here to decide what's in your pack — gives information for your decision
- Organizing/seeing weights reveals: no-longer-needed items, duplication, potential consolidation, system changes, deliberate heavy choices
- "Maybe a heavier piece of equipment is important enough that, after seeing exactly what it weighs, you decide: It's worth it."
- "Because the goal isn't the lightest possible pack. The goal is a pack that works for you and helps you enjoy whatever brought you to the trail."
- Philosophy: "Carry what you need. Understand why you carry it. Make each item earn its place."
- **"Then go outside."** (final line)

---

## Historical Accuracy / Fact-Checking Decisions

| Claim | Decision |
|---|---|
| Ray Jardine invented traveling light | ✗ NOT included. First paragraph of §2 explicitly states traveling light predated him |
| Jardine single-handedly invented ultralight | ✗ NOT included. Described as "one of the most influential" and major pioneer/popularizer |
| Jardine created the cottage gear industry | ✗ NOT included per prompt guardrail |
| The Friend was the first camming concept | ✗ NOT included. Described as "highly influential" and "important predecessor to modern climbing cams" without claiming it was the first camming concept ever |
| 15,000 miles, 1987–1994 | ✓ Included as stated in prompt |
| 1993 AT thru-hike, base packs below 10 lbs | ✓ Included as stated in prompt |
| PCT Hiker's Handbook, 1991/1992 | ✓ Included as stated in prompt |
| Beyond Backpacking, Trail Life | ✓ Included |
| Approach known as "Ray-Way" | ✓ Included |
| Ray Jardine described as: | ✓ "few people have had more influence… than Ray Jardine" + "played a major role in shaping how modern lightweight and ultralight backpacking is understood and practiced" |
| Copyright: no substantial passages from books | ✓ All prose is original |

---

## Reusable Components

Two shared components added within AboutPage.tsx:

**`PullQuote`** — blockquote with a left border in primary color, italic, muted foreground:
```tsx
<blockquote className="border-l-2 border-primary/40 pl-4 italic text-foreground/70 leading-relaxed">
```

**`PhilosophyCallout`** — prominent green-tinted card with the three-line philosophy:
```tsx
<div className="bg-primary/5 border border-primary/20 rounded-xl px-5 py-4 ...">
```
Appears twice: once in the always-visible intro area, once at the end of "Where TrailWeigh Fits In".

---

## Test Development Notes

### Template-literal ID pattern
The 022C `MainSection` component and the 022D `Section` component both use:
```tsx
id={`sec-btn-${id}`}
```
This means literal strings like `sec-btn-ultralight` never appear in the source. Initial 022D test attempts checked for `sec-btn-ultralight` (16 failures). Fixed to check for:
- The prop value: `id="ultralight"` (appears in the JSX call site)
- The section title text: `'What Is Ultralight?'`
- Section order: checked via `indexOf(title)` comparisons

### Philosophy-before-accordion test
Initial version searched for `sec-btn-` to find accordion start, but the component definition also contains `sec-btn-${id}` (earlier in the file). Fixed to search for `id="ultralight"` (the first actual section call) as the accordion start marker.

### `Lighter doesn't automatically` capitalization
Test initially checked for `'Lighter does not automatically'` (formal), but the AboutPage uses the contraction `"Lighter doesn't automatically mean better."` Fixed test to accept both `'Lighter does not automatically'` and `"Lighter doesn't automatically"`.

---

## Verification Results

### §1: Visible Introduction

| Check | Status |
|---|---|
| Introduction visible without opening accordion | PASS |
| Explains TrailWeigh: plan, organize, understand | PASS |
| Gear list is also a checklist | PASS |
| Packing checklist usefulness explained | PASS |
| Printing the list mentioned | PASS |
| Trailhead / forgot gear scenario | PASS |
| TrailWeigh doesn't tell you what to carry | PASS |

### §2: Philosophy Callout

| Check | Status |
|---|---|
| "Carry what you need." | PASS |
| "Understand why you carry it." | PASS |
| "Make each item earn its place." | PASS |
| Philosophy appears before accordion (in intro) | PASS |
| Philosophy also appears at end of §12 | PASS |

### §3: Accordion — 12 Required Sections

| # | Section | Status |
|---|---|---|
| 1 | What Is Ultralight? | PASS |
| 2 | Ray-Way | PASS |
| 3 | The Minimalist Mindset | PASS |
| 4 | One Tool, Many Uses | PASS |
| 5 | Think in Systems | PASS |
| 6 | Knowledge Weighs Nothing | PASS |
| 7 | Do You Hike for the Trail or the Camp? | PASS |
| 8 | Hike Your Own Hike — HYOH | PASS |
| 9 | Ultralight Is a Tool, Not a Contest | PASS |
| 10 | Remember Why We're Here | PASS |
| 11 | Respect the Trail—and Each Other | PASS |
| 12 | Where TrailWeigh Fits In | PASS |

### §4: Section Order

| Check | Status |
|---|---|
| All 12 section titles appear in required order | PASS |

### §5: Accordion Mechanics

| Check | Status |
|---|---|
| aria-expanded present | PASS |
| aria-controls present | PASS |
| role="region" present | PASS |
| aria-labelledby present | PASS |
| Sections collapsed by default (empty Set) | PASS |
| Full title row is button (w-full) | PASS |
| ChevronDown / ChevronUp disclosure indicator | PASS |
| No "Expand All" button | PASS |

### §6: Ray-Way Content

| Check | Status |
|---|---|
| "Ray-Way" is the section title | PASS |
| Ray Jardine described as major pioneer/influence | PASS |
| Friend / camming device mentioned briefly | PASS |
| 15,000 miles figure present | PASS |
| 1993 AT thru-hike + base pack below 10 lbs | PASS |
| PCT Hiker's Handbook mentioned | PASS |
| Beyond Backpacking or Trail Life mentioned | PASS |
| Did NOT claim Jardine invented traveling light | PASS |
| Traveling light predated Jardine acknowledged | PASS |
| Questions for evaluating gear present | PASS |

### §7: Minimalist Mindset

| Check | Status |
|---|---|
| Intentionality not deprivation | PASS |
| "Simplicity with purpose" | PASS |
| Philosophy quote present | PASS |

### §8: One Tool, Many Uses

| Check | Status |
|---|---|
| "Can something I already carry do this job" | PASS |
| Trekking pole example | PASS |
| Stuff sack / pillow example | PASS |
| Bandana example | PASS |
| "Carry less by asking more" quote | PASS |
| Safety-critical gear clarification | PASS |

### §9: Think in Systems

| Check | Status |
|---|---|
| Shelter and sleeping gear interaction | PASS |
| "Do I need this item at all" question | PASS |

### §10: Knowledge Weighs Nothing

| Check | Status |
|---|---|
| Experience and skills influence gear | PASS |
| Does not imply safety gear can be eliminated | PASS |
| "Good judgment matters more than a number" | PASS |

### §11: Trail or Camp

| Check | Status |
|---|---|
| Both approaches described | PASS |
| "Neither approach is wrong" | PASS |
| What makes trip enjoyable framing | PASS |

### §12: HYOH

| Check | Status |
|---|---|
| "Your hike is your own. The trail is shared." | PASS |
| No single perfect gear list | PASS |
| HYOH doesn't mean ignoring safety/regulations | PASS |
| Gear that works for you on this trip | PASS |

### §13: Ultralight Is a Tool, Not a Contest

| Check | Status |
|---|---|
| "Ultralight is a tool, not a contest." | PASS |
| Another person's base weight doesn't determine your list | PASS |
| Lighter doesn't automatically mean better | PASS |

### §14: Remember Why We're Here

| Check | Status |
|---|---|
| "We go outside to be outside." | PASS |
| Nature imagery (≥3 examples) | PASS — sunrise, ridge, stars, mountain, canyon, trees, solitude, trail |
| Gear enables experiences, not surpasses them | PASS |

### §15: Respect the Trail—and Each Other

| Check | Status |
|---|---|
| Respect for wildlife and land | PASS |
| Waste disposal / LNT principles | PASS |
| "We don't all need to hike the same way" | PASS |
| "Hike your own hike—and respect everyone else's opportunity" | PASS |

### §16: Where TrailWeigh Fits In

| Check | Status |
|---|---|
| TrailWeigh not here to decide what's in pack | PASS |
| "It's worth it" quote | PASS |
| Goal is not the lightest possible pack | PASS |
| "A pack that works for you" | PASS |
| Philosophy quote in this section | PASS |
| "Then go outside." final line | PASS |
| "Then go outside." appears after philosophy | PASS |

### §17: No Video or Animation

| Check | Status |
|---|---|
| No `<video` element | PASS |
| No animation / Lottie references | PASS |

### §18: Regression — Help & How-To from 022C

| Check | Status |
|---|---|
| HelpPage six main sections still present | PASS |
| 022C structure unchanged (Scan Gear List under Building) | PASS |

### §19: Regression — Footer

| Check | Status |
|---|---|
| Footer dark color (#1e2322) unchanged | PASS |
| Footer informationalOnly prop still present | PASS |

### §20: Regression — Routing

| Check | Status |
|---|---|
| About route still registered in App.tsx | PASS |
| Help route still registered in App.tsx | PASS |
| All 10 footer routes still in App.tsx | PASS |

### §21: Regression — Checklist and Shared View

| Check | Status |
|---|---|
| Checklist page not affected | PASS |
| SharedChecklistPage not affected | PASS |

---

## Light / Dark Mode

All styling uses Tailwind semantic tokens only — no hardcoded colors in the new content:
- `bg-background`, `bg-card`, `bg-muted/50`, `bg-primary/5`, `bg-primary/10`
- `text-foreground`, `text-foreground/70`, `text-foreground/80`, `text-muted-foreground`
- `border-border`, `border-card-border`, `border-primary/20`, `border-primary/40`

Both light and dark modes should render correctly without any additional changes.

---

## Mobile / Narrow Layout

- `max-w-3xl mx-auto px-6` — same responsive container as all other info pages
- Accordion buttons: `px-5 py-4` — adequate tap target on mobile
- No horizontal overflow introduced
- PullQuote blockquotes: left-bordered, readable at narrow widths

---

## Automated Test Results

```
about022D.test.mjs:
  022D Visible Introduction:            7 passed, 0 failed
  022D Philosophy Callout:              4 passed, 0 failed
  022D 12 Required Accordion Sections: 24 passed, 0 failed   (2 per section × 12)
  022D Section Order:                   1 passed, 0 failed
  022D Accordion Mechanics:             8 passed, 0 failed
  022D What Is Ultralight?:             4 passed, 0 failed
  022D Ray-Way Content:                10 passed, 0 failed
  022D Minimalist Mindset:              3 passed, 0 failed
  022D One Tool Many Uses:              5 passed, 0 failed
  022D Think in Systems:                2 passed, 0 failed
  022D Knowledge Weighs Nothing:        3 passed, 0 failed
  022D Trail or Camp:                   3 passed, 0 failed
  022D HYOH:                            4 passed, 0 failed
  022D Ultralight Tool Not Contest:     3 passed, 0 failed
  022D Remember Why We Are Here:        3 passed, 0 failed
  022D Respect the Trail and Each Other:4 passed, 0 failed
  022D Where TrailWeigh Fits In:        7 passed, 0 failed
  022D No Video or Animation:           2 passed, 0 failed
  022D Help 022C Regression:            2 passed, 0 failed
  022D Footer Regression:               2 passed, 0 failed
  022D Routing Regression:              3 passed, 0 failed
  022D Checklist Regression:            2 passed, 0 failed

Total 022D:                           106 passed, 0 failed

Full pnpm test:importer:              EXIT 0 (all suites)
```

---

## Failed Attempts

**Test pattern issue — IDs vs template literals:**
Initial 022D test suite checked for `sec-btn-ultralight`, `sec-btn-ray-way`, etc. as literal strings in the source. These don't exist because the `Section` component constructs them at runtime via template literals (`id={`sec-btn-${id}`}`). 16 test failures were caused by this. Fixed by checking the id prop value (`id="ultralight"`) and section title text instead.

**Philosophy-before-accordion test:**
Initial version searched for `sec-btn-` as the accordion start marker, but the component definition also contains this template literal pattern (earlier in the file, inside the `Section` function body). Fixed to search for `id="ultralight"` (the first actual Section call) as the accordion start.

**`Lighter doesn't` capitalization:**
Test initially checked for `'Lighter does not automatically'` (formal). AboutPage uses the contraction `"Lighter doesn't automatically mean better."` Added the contraction form to the test's OR conditions.

---

## Items Requiring User Verification

1. **Visual appearance in browser** — the philosophy callout style (green-tinted card), PullQuote (left-border italic), section header hover state, and overall reading experience should be verified visually in both Light and Dark mode.
2. **Accordion interaction** — click any section title to expand; click again to collapse; verify multiple sections can be open simultaneously. Verify the full title row is the click target (clicking next to the chevron also works).
3. **Keyboard navigation** — Tab to a section header → Enter or Space to open/close.
4. **Mobile layout** — tap targets on the accordion headers; overall reading flow on a narrow screen.
5. **Ray-Way content accuracy** — the historical content is conservative and fact-checked against the prompt guardrails, but subject-matter review by the user is recommended before publication.
6. **Philosophy callout prominence** — verify the three-line callout above the accordion feels prominent and inviting on the page.
7. **"Then go outside." final line** — verify the final line reads as intended (centered, bold, slightly larger) within the last accordion section.

---

## Confirmation: Unrelated Functionality Preserved

- `HelpPage.tsx` (022C) — not changed
- `Checklist.tsx` — not changed
- `usePackData.ts` — not changed
- `BackgroundPicker.tsx` — not changed
- `SharedChecklistPage.tsx` — not changed
- `LockerPanel.tsx` — not changed
- `PreviewModal.tsx` — not changed
- `ImportGearPanel.tsx` — not changed
- `Footer.tsx` — not changed
- All other 9 footer pages — not changed
- All API server routes — not changed
- All routes in `App.tsx` — not changed (only AboutPage component content changed)
