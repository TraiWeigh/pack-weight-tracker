# Prompt 022 — Add TrailWeigh Footer, Legal, Help & Support Navigation

**Date:** 2026-08-08  
**Status:** COMPLETE — all tests passing

---

## Files Changed

| File | Change |
|---|---|
| `src/components/Footer.tsx` | **NEW** — always-dark footer component |
| `src/pages/info/AboutPage.tsx` | **NEW** — About TrailWeigh page |
| `src/pages/info/HowItWorksPage.tsx` | **NEW** — How It Works page |
| `src/pages/info/HelpPage.tsx` | **NEW** — Help & How-To page |
| `src/pages/info/ReportProblemPage.tsx` | **NEW** — Report a Problem page |
| `src/pages/info/ContactPage.tsx` | **NEW** — Contact Us page |
| `src/pages/info/PrivacyPolicyPage.tsx` | **NEW** — Privacy Policy page |
| `src/pages/info/TermsPage.tsx` | **NEW** — Terms of Use page |
| `src/pages/info/DeleteAccountPage.tsx` | **NEW** — Delete Account / Data page |
| `src/pages/info/AffiliatePage.tsx` | **NEW** — Affiliate Disclosure page |
| `src/pages/info/AccessibilityPage.tsx` | **NEW** — Accessibility page |
| `src/hooks/footer022.test.mjs` | **NEW** — 44 regression tests |
| `src/App.tsx` | Added 10 imports + 10 routes + sign-up legal text |
| `src/pages/LandingPage.tsx` | Replaced inline footer with `<Footer />` |
| `src/pages/SharedChecklistPage.tsx` | Added `<Footer informationalOnly />` to both SharedChecklistContent and SharedPackListContent |
| `package.json` | Added `footer022.test.mjs` to `test:importer` chain |

---

## Components Created

### `src/components/Footer.tsx`
- Always-dark charcoal footer, `print:hidden`
- Props: `informationalOnly?: boolean` — omits Delete Account / Data for shared-list viewers
- Three section columns: **TrailWeigh**, **Help**, **Account & Privacy**
- Uses Wouter `<Link>` for all internal routes
- Hard-coded `#1e2322` background (not a CSS variable) — stays dark regardless of Light/Dark/System theme

---

## Routes Created

All registered in `App.tsx` via Wouter `<Route>`:

| Path | Component | Page Heading |
|---|---|---|
| `/about` | `AboutPage` | About TrailWeigh |
| `/how-it-works` | `HowItWorksPage` | How It Works |
| `/help` | `HelpPage` | Help & How-To |
| `/report-problem` | `ReportProblemPage` | Report a Problem |
| `/contact` | `ContactPage` | Contact Us |
| `/privacy` | `PrivacyPolicyPage` | Privacy Policy |
| `/terms` | `TermsPage` | Terms of Use |
| `/delete-account` | `DeleteAccountPage` | Delete Account / Data |
| `/affiliate` | `AffiliatePage` | Affiliate Disclosure |
| `/accessibility` | `AccessibilityPage` | Accessibility |

---

## Footer Component Location

`artifacts/pack-checklist/src/components/Footer.tsx`

---

## All Footer Links Added

| Section | Link Text | Route |
|---|---|---|
| TrailWeigh | About TrailWeigh | `/about` |
| TrailWeigh | How It Works | `/how-it-works` |
| Help | Help & How-To | `/help` |
| Help | Report a Problem | `/report-problem` |
| Help | Contact Us | `/contact` |
| Account & Privacy | Privacy Policy | `/privacy` |
| Account & Privacy | Terms of Use | `/terms` |
| Account & Privacy | Delete Account / Data | `/delete-account` (full footer only) |
| Account & Privacy | Affiliate Disclosure | `/affiliate` |
| Account & Privacy | Accessibility | `/accessibility` |

Total: **10 links** (full footer) / **9 links** (informational-only, shared view)

---

## Exact Footer Background Color

`#1e2322` — very dark charcoal with minimal warm-forest cast to harmonise with TrailWeigh's muted forest-green palette.

Applied via `style={{ backgroundColor: BG }}` where `const BG = '#1e2322'`, ensuring it is never overridden by Tailwind theme variables or CSS custom properties.

---

## Typography

| Element | Size | Weight | Color |
|---|---|---|---|
| Section headings | `text-[14px]` = 14 px | `font-semibold` | `text-white/90` |
| Footer links | `text-[14px]` = 14 px | normal | `text-white/70` (hover: `text-white/95`) |
| Copyright line | `text-[12px]` = 12 px | normal | `text-white/45` |
| Link line height | `leading-[21px]` = 21 px | — | — |

---

## Sign-Up Screen Changes

The local `SignUpPage` function in `App.tsx` (the one actually used by the router) was updated to add:

```
By creating an account, you agree to TrailWeigh's Terms of Use and acknowledge the Privacy Policy.
```

- **Terms of Use** is a clickable `<a href="/terms">` link
- **Privacy Policy** is a clickable `<a href="/privacy">` link
- Both route to the same pages used by the footer (no duplicates)
- Text is `text-xs text-muted-foreground`, rendered below the Clerk `<SignUp>` card

**Note:** The standalone `src/pages/SignUpPage.tsx` file exists but is not used by the router (the local function in App.tsx handles sign-up routing). The legal text was added to the router-active function.

---

## Account Deletion — Existing Page or New?

No existing account-deletion page was found. `DeleteAccountPage.tsx` was created as a new route at `/delete-account`.

The page explains:
- What will be permanently deleted (account, gear lists, Locker, shared links)
- That self-service deletion is not yet available
- Users should Contact Us to request deletion

This is informational only — no destructive backend was implemented.

---

## How Report a Problem Was Connected

`ReportProblemPage.tsx` routes to the Contact Us page (`/contact`) for now, with a note that a built-in problem-reporting recorder is coming in a later prompt. The page provides guidance on what information to include when reporting.

---

## Footer Behavior in Shared View

The shared-list view (`SharedChecklistPage`) renders `<Footer informationalOnly />` in **both** rendering paths:
1. **SharedChecklistContent** (full interactive view) — Footer inside `h-[100dvh] overflow-hidden flex flex-col`; it is `flex-shrink-0` so it occupies its natural height at the bottom of the viewport, and the `flex-1 min-h-0` main scrolls above it.
2. **SharedPackListContent** (pack-list / read-only view) — Footer inside `min-h-[100dvh]` wrapper, naturally flows below the pack-list body.

The `informationalOnly` prop suppresses the **Delete Account / Data** link from both shared-view footers. All other public informational links remain accessible.

---

## Footer Placement Decisions

| Page | Footer? | Notes |
|---|---|---|
| LandingPage | ✓ Full footer | Replaced the old inline `<footer>` text element |
| SharedChecklistPage | ✓ Informational-only | Both render paths — no Delete Account link |
| Checklist (main app) | ✗ Not added | Height-constrained `h-[100dvh] overflow-hidden` layout; adding a footer would risk changing 021P/021O/021N geometry. Users access footer from Landing/Shared pages |
| SignInPage | ✗ Not added | Clerk auth UI; legal links added to SignUpPage instead |
| SignUpPage | Legal text only | Terms + Privacy links below Clerk card |
| Info pages | ✓ Full footer | Each of the 10 info pages renders `<Footer />` |

---

## Testing Performed

### Automated tests
- `footer022.test.mjs` — **44 tests, all passing**
- Full `pnpm test:importer` — **all 43 suites, exit 0**

### Verified by source analysis (Playwright blocked in NixOS):

**Footer correctness:**
- Dark charcoal `#1e2322` — hard-coded, not a CSS variable ✓
- Section headings 14 px semibold ✓
- Links 14 px, leading-[21px] ✓
- Copyright 12 px ✓
- `print:hidden` class present ✓
- `flex-shrink-0` so footer doesn't compress ✓

**Routing:**
- All 10 routes registered in App.tsx ✓
- No route leads to NotFound (each route maps to an imported component) ✓
- All info pages have matching `<h1>` headings ✓

**Accessibility / keyboard:**
- All footer links use `<Link>` (Wouter) rendered as `<a>` — keyboard accessible ✓
- `aria-label` on each `<nav>` section in footer ✓
- Visible labels on all links ✓
- No `target="_blank"` on internal links ✓

**Light/Dark/System mode:**
- Footer background is `#1e2322` via inline `style`, not a Tailwind theme variable ✓ — unaffected by `.dark` class or CSS custom property changes ✓

**Desktop layout:**
- Three columns via `grid-cols-1 sm:grid-cols-3` ✓
- `gap-8 sm:gap-6` column spacing ✓
- `py-8 px-6` modest vertical padding ✓

**Mobile layout:**
- Single column (`grid-cols-1`) stacks cleanly ✓
- 14 px links remain tap-friendly ✓
- No horizontal overflow (`max-w-5xl mx-auto` with `px-6`) ✓

**Shared-view protection:**
- `informationalOnly` prop verified to suppress Delete Account / Data ✓
- No raw `/delete-account` link in SharedChecklistPage source ✓

**021P layout:**
- Sidebar inner div: `flex flex-col gap-4 pb-8` (no `py-2`) — confirmed by test ✓
- Toolbar-group: `pt-4 grid grid-cols-1 lg:grid-cols-[1fr_365px]` — confirmed by test ✓
- No changes made to Checklist.tsx ✓

---

## Issues Discovered

None. All 44 tests passed on the first run.

---

## Items Requiring Future Content / Legal Review

1. **Privacy Policy** — placeholder page created. Full policy must be reviewed and written separately, covering: account data, gear lists, uploaded content, cookies/local storage, analytics, service providers, data retention, deletion, user rights, and protection measures.

2. **Terms of Use** — placeholder page created. Full terms must be reviewed and written by qualified legal counsel before publication.

3. **Contact Us** — neutral placeholder: "TrailWeigh support contact information will be available here." Needs a real support email address or contact form before launch.

4. **Affiliate Disclosure** — basic disclosure written: "TrailWeigh may earn a commission from qualifying purchases made through retailer links at no additional cost to you." Must be updated when specific affiliate programs and retailer agreements are confirmed.

5. **Accessibility** — placeholder with planned improvements listed. No formal certification or compliance standard claimed.

6. **Help & How-To** — page structure created, all sections marked "Coming soon." Videos and guides to be added separately.

7. **Sign-up legal text** — "By creating an account, you agree to TrailWeigh's Terms of Use and acknowledge the Privacy Policy." This wording will need review once the final Terms of Use are published.

8. **Delete Account / Data** — self-service deletion not yet implemented. Currently directs users to Contact Us. A backend deletion feature is required before users can self-serve.

9. **Report a Problem** — built-in recorder noted as coming in a later prompt. Currently routes to Contact Us.
