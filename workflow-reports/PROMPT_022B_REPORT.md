# Prompt 022B — Complete Footer Page Content and Detailed Help & How-To Instructions

**Date:** 2026-08-08  
**Status:** COMPLETE — all tests passing

---

## Files Changed

| File | Change |
|---|---|
| `src/pages/info/AboutPage.tsx` | Replaced placeholder with substantive content |
| `src/pages/info/HowItWorksPage.tsx` | Replaced placeholder with full workflow overview + /help link |
| `src/pages/info/HelpPage.tsx` | Complete rewrite — full accordion help system (42,929 bytes) |
| `src/pages/info/ReportProblemPage.tsx` | Replaced placeholder with structured reporting guidance |
| `src/pages/info/ContactPage.tsx` | Completed with neutral contact placeholder + cross-links |
| `src/pages/info/PrivacyPolicyPage.tsx` | Replaced placeholder with verified-data-practices draft policy |
| `src/pages/info/TermsPage.tsx` | Replaced placeholder with practical plain-language draft terms |
| `src/pages/info/DeleteAccountPage.tsx` | Completed with verified deletion scope and process |
| `src/pages/info/AffiliatePage.tsx` | Completed with accurate disclosure language |
| `src/pages/info/AccessibilityPage.tsx` | Completed with verified current features + improvement commitment |
| `src/hooks/help022B.test.mjs` | **NEW** — 70 regression tests |
| `package.json` | Added `help022B.test.mjs` to `test:importer` chain |

---

## Pages Updated (10 of 10)

All 10 footer destination pages updated from placeholder to substantive content.

---

## Help Topics Created (by section)

### Getting Started
- Getting Started with TrailWeigh

### Building Your Gear List
- Adding Gear
- Item Checkboxes — Selecting Gear
- Quantity (Qty)

### Organizing Gear
- Categories (expand/collapse, rename, reorder, Base Weight setting, add, delete)
- Moving Gear Between Categories (MOVE control)

### Editing History
- Undo (Ctrl+Z / ⌘Z)
- Redo (Ctrl+Y / ⌘Y)

### Saving & Locker
- New — Starting a New List
- Save
- Save As
- Reset
- Locker (load, rename, delete)

### Preview & Display
- Preview (with print)
- Hide

### Background
- Background Edit (Fill Screen/Fit Image, Light/Dark tone, Lighten/Darken slider, preset photos)

### Sharing
- Share (creating link, what recipients see/cannot do)

### Importing / Scan Gear List
- Scan Gear List (PDF, Word, Excel, Numbers)

### Pack Weight & Summaries
- Pack Summary
- Weight Distribution
- Imperial / Metric
- File Name

### Frequently Asked Questions (8 questions)
- Do unchecked items stay in my gear list?
- What is Base Weight?
- What is the difference between Save and Save As?
- Where are my saved lists?
- Can another person change my original gear list through a Share Link?
- Can I switch between Imperial and Metric?
- Can I undo a change?
- What file types can I import?

### Troubleshooting
- General troubleshooting steps (6 steps)

---

## Complete Inventory of Current TrailWeigh Tools/Features Documented

The following were verified in `Checklist.tsx`, `GearCategory.tsx`, `GearRow.tsx`, `LockerPanel.tsx`, `ImportGearPanel.tsx`, `WeightSummary.tsx`, and related files before writing instructions:

| Feature | UI Label (verified) | Documented |
|---|---|---|
| New list | "New" / "Create New List" | ✓ |
| Undo | "Undo" / Ctrl+Z | ✓ |
| Redo | "Redo" / Ctrl+Y | ✓ |
| Save | "Save" dropdown | ✓ |
| Save As | "Save As" (dropdown option) | ✓ |
| Save confirmation | "Saved [name]" toast | ✓ |
| Reset | "Reset" / "Confirm" / "Cancel" | ✓ |
| Locker | "Locker" panel (load, rename, delete) | ✓ |
| Open/Close All | "Open" / "Close" pills | ✓ |
| Hide | "Hide interface and show background view" | ✓ |
| Preview | "Preview" with print | ✓ |
| Share | "Share" button | ✓ |
| Background Edit | "Background Edit" | ✓ |
| Imperial/Metric toggle | "Imperial" / "Metric" | ✓ |
| Categories | expand/collapse chevron, rename, reorder, + Base / — Base, Add Item, delete | ✓ |
| Gear items | checkbox, Type, Description, Weight, Qty (1–20), Total, Remove | ✓ |
| MOVE | "Move to…" select per item | ✓ |
| Scan Gear List | "Scan Gear List" panel | ✓ |
| Pack Summary | Base Weight, non-base categories, Grand Total | ✓ |
| Weight Distribution | chart by category | ✓ |
| File name display | pill overlay | ✓ |

---

## Controls Intentionally Excluded

None of the features above were omitted. No removed/nonexistent controls were documented. Specifically:
- No "How-To Videos" section (per prompt requirement)
- No "Video Tutorials" section
- No custom photo upload instructions (per prompt: "TrailWeigh is not using custom user photo uploads for now")

---

## Confirmation: How-To Videos — Not Added / Removed

- HelpPage.tsx contains no mention of "How-To Videos," "Video Tutorials," or similar.
- The old placeholder `HelpPage.tsx` had sections for videos; these were replaced entirely.
- Confirmed by automated test. ✓

---

## Confirmation: Instructional Animations — Not Added

- No animation placeholders, autoplay walkthroughs, or click demonstrations were added.
- Confirmed by automated test. ✓

---

## Confirmation: Custom Photo Upload — Not Documented

- HelpPage.tsx does not instruct users to upload custom background photos.
- Background Edit instructions cover only: selecting built-in preset photos (Landscapes/custom themes), Fill Screen/Fit Image sizing, Light/Dark tone, Lighten/Darken slider.
- Confirmed by automated test. ✓

---

## Privacy Policy — Implementation Inspected

Data practices verified by reading `usePackData.ts`, `api-server/src/`, `bgPhotoStore.ts`, `shareLink.ts`, `App.tsx`, and `clerkWebhook.ts`.

| Data item | Verified practice | Documented |
|---|---|---|
| Authentication | Clerk manages email, credentials, sessions | ✓ |
| Gear list data | localStorage, keyed by user ID | ✓ |
| Background photos | IndexedDB (`trailweigh` db, `bgPhotos` store) | ✓ |
| Preset background photos | Unsplash CDN (loaded over network) | ✓ |
| Saved lists (Locker) | localStorage, same browser/device | ✓ |
| Shared links | Server DB: `share_links(id, payload, created_at)` — no user ID association | ✓ |
| Scan credits | localStorage only | ✓ |
| Analytics/tracking | None found (no GA, Sentry, PostHog, etc.) | ✓ — "does not use advertising networks" |
| External services | Clerk, OpenAI (scan), Unsplash, Resend (internal owner notification only) | ✓ |
| Server logs | Pino HTTP (method, path, status) — no gear content | ✓ |
| Sign-out behavior | Does NOT clear localStorage | ✓ (noted in deletion section) |

---

## Terms of Use — Sections Added

1. Using TrailWeigh  
2. Account responsibility  
3. Acceptable use  
4. Your gear-list content  
5. TrailWeigh intellectual property  
6. Shared links  
7. Service availability  
8. Changes to features  
9. Account termination  
10. Disclaimers  
11. Limitation of liability  
12. Changes to these Terms  
13. Contact  

---

## Legal / Business Details That Could Not Be Verified

The following items are required for the final legally-reviewed Terms of Use and Privacy Policy but are not currently available:

1. **Legal entity name** — the formal registered business name (e.g. "TrailWeigh LLC," "TrailWeigh Inc.") that will appear in the binding legal documents.
2. **Governing law / jurisdiction** — the state/country whose laws govern the Terms. Both documents note this is pending legal review.
3. **Arbitration / dispute resolution** — whether binding arbitration, small claims, or litigation applies.
4. **Specific liability limits** — the dollar cap or scope of liability limitation.
5. **Official support/contact email address** — required for the Privacy Policy contact section and the Contact Us page.
6. **Share-link deletion capability** — share-link snapshots are stored with a random ID and no user account association; deleting "your" share links server-side is not currently implementable. This is noted in DeleteAccountPage and will require a future backend change.

---

## Contact Us Information Status

No official TrailWeigh support email or contact form exists yet. The Contact Us page retains the neutral placeholder: "TrailWeigh support contact information will be available here." Cross-links to Report a Problem and Privacy Policy are provided.

---

## Delete Account — Behavior Documented

Documented based on verified current behavior:
- What is deleted: account, Locker lists, associated server data
- What is NOT automatically deleted: browser-local data (localStorage, IndexedDB) — user must clear browser site data manually
- Shared links: noted as stored without user ID association; actual per-user link deletion is not yet implementable
- Self-service deletion: not yet implemented — users must Contact Us
- Deletion is permanent and unrecoverable

---

## Affiliate Disclosure Wording Used

> "TrailWeigh may earn a commission from qualifying purchases made through retailer links at no additional cost to you."

No specific affiliate programs named. Update notice included for when specific arrangements are established.

---

## Accessibility Claims Used

- Keyboard-accessible controls: ✓ (verified in codebase — aria labels, button semantics)
- Readable text sizes: ✓ (verified in CSS)
- Colour contrast: ✓ (verified in design tokens)
- Labels and titles: ✓ (verified — icon-only buttons have title attributes)
- Responsive layout: ✓ (verified — responsive grid/flex layout)
- No WCAG certification claimed ✓
- No ADA compliance claimed ✓
- No formal audit claimed ✓

---

## Desktop Testing (source-derived)

| Test | Result |
|---|---|
| All 10 pages have substantive content | ✓ |
| No "Coming soon" placeholders remain | ✓ — confirmed by test |
| Help accordion uses aria-expanded | ✓ |
| Help topics independently expandable | ✓ — uses Set<string> state, toggling one doesn't affect others |
| HowItWorksPage links to /help | ✓ |
| Privacy Policy has draft disclaimer | ✓ |
| Terms has draft disclaimer | ✓ |
| All routes still registered | ✓ — 10/10 confirmed by test |
| Footer dark charcoal unchanged | ✓ — #1e2322 |
| 022A Checklist footer present | ✓ |
| 021P layout unchanged | ✓ |

---

## Mobile Testing (source-derived)

| Test | Result |
|---|---|
| All info pages use `min-h-[100dvh] flex flex-col` | ✓ — responsive layout |
| Help accordion topics have sufficient tap area | ✓ — `px-5 py-4` button |
| No horizontal scroll introduced | ✓ — `max-w-3xl mx-auto px-6` |
| 14px link text retained | ✓ — unchanged Footer component |
| Help topics remain independently expandable on mobile | ✓ — pure React state, no layout dependency |

---

## Keyboard / Accessibility Testing

| Test | Result |
|---|---|
| Help accordion buttons use `aria-expanded` | ✓ |
| Each topic button has `aria-controls` pointing to panel | ✓ |
| Each topic panel has `role="region"` + `aria-labelledby` | ✓ |
| Focus ring visible on accordion buttons | ✓ — `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset` |
| All footer links render as `<a>` tags | ✓ — Wouter `<Link>` |
| All `<Link>` navigation uses keyboard-accessible anchor role | ✓ |

---

## Automated Test Results

```
help022B.test.mjs:
  022B No Video/Animation Placeholders:   5 passed, 0 failed
  022B Help Page Structure:              12 passed, 0 failed
  022B UI Label Accuracy:                13 passed, 0 failed
  022B About & How It Works:              4 passed, 0 failed
  022B Privacy Policy:                    5 passed, 0 failed
  022B Terms of Use:                      5 passed, 0 failed
  022B Affiliate Disclosure:              3 passed, 0 failed
  022B Accessibility:                     2 passed, 0 failed
  022B Routes Integrity:                 10 passed, 0 failed
  022B Footer Unchanged:                  4 passed, 0 failed
  022B 022A Checklist Footer:             3 passed, 0 failed
  022B Shared View Footer:                1 passed, 0 failed
  022B 021P Layout Invariants:            3 passed, 0 failed

Total 022B:                              70 passed, 0 failed

Full pnpm test:importer:                 EXIT 0 (all suites)
```

---

## Confirmation: Footer Appearance Unchanged

- `#1e2322` background: ✓
- `text-[14px]` link size: ✓
- `text-[12px]` copyright size: ✓
- `print:hidden`: ✓
- All 10 footer links: ✓
- Three-column layout: ✓
- Confirmed by automated test. ✓

---

## Confirmation: 022A Scrolling Unchanged

- `h-[100dvh] overflow-y-auto` scroll container: ✓ in Checklist.tsx
- Checklist renders `<Footer />` (full, not informationalOnly): ✓
- No changes to Checklist.tsx in 022B ✓

---

## Confirmation: 021P Alignment Unchanged

- Sidebar inner div: `flex flex-col gap-4 pb-8` (no `py-2`): ✓
- Toolbar-group parent: `pt-4 grid grid-cols-1 lg:grid-cols-[1fr_365px]`: ✓
- No changes to Checklist.tsx in 022B ✓

---

## Issues Discovered

None. All 70 tests passed on the first run.

---

## Items Requiring Future Action

1. Legal review of Privacy Policy and Terms of Use before publication.
2. Official support contact information for the Contact Us page.
3. Legal entity name and jurisdiction for the Terms of Use.
4. Server-side share-link deletion tied to user account (requires backend change before self-service deletion can be offered).
5. Self-service account deletion UI (future prompt planned per DeleteAccountPage notice).
