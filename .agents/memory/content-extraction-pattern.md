---
name: Content extraction pattern for V3 mobile footer pages
description: How production info-page content components are shared between desktop shells and the V3 mobile FooterPageView
---

# Content Extraction Pattern (established in 027R)

## Rule
Each large info page exports a named `*Content` component alongside its default page shell.
The content component takes navigation callbacks instead of `<Link>` / `useLocation`.

## Files following this pattern
- `AboutPage.tsx` → exports `AboutContent({ onOpenSources, navigate })`
- `HelpPage.tsx` → exports `HelpContent({ navigate })`
- `HowItWorksPage.tsx` → exports `HowItWorksContent({ navigate })`
- `SourcesModal.tsx` → exports `SourcesContent()` (no props needed)

## Navigation prop contract
- `navigate(path: string)` — path like `'/help'`, `'/contact'`. Desktop shell uses `window.location.assign(basePath + path)`; V3 uses `pushScreen({ screen: 'footer-page', footerPageId: path.replace(/^\//, '') })`.
- `onOpenSources(refId?: string)` — desktop opens SourcesModal; V3 calls `pushScreen({ screen: 'sources' })`.

## V3 screen type
`MobileScreen` includes `'sources'` as a full-screen in-app page (not a modal portal).
Sources is reached by: More → Sources row OR About → Sources & References link OR About → [n] citation.

**Why:** SourcesModal is `position:fixed` (portal) — it escapes the 430px phone frame. The stack-push approach keeps everything inside the frame.

## Desktop pages are unchanged in behavior
The `AboutPage`/`HelpPage`/`HowItWorksPage` shells pass their own handlers so desktop routing is identical to before extraction.

## Simple pages (Privacy, Terms, Contact, etc.)
These 7 pages are inlined verbatim in V3's `FooterPageView` switch using local `H2`/`P`/`NavLink` Tailwind helpers. They are NOT extracted into separate components.
