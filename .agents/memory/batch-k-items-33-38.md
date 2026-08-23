---
name: Items 33–38 MoreDeck parity audit
description: Read-only audit findings for MoreDeck backdrop, card header geometry, subtitles, and navigation (Cards 3 & 4).
---

## Item 33 — MoreDeck backdrop colour/opacity

- Native (MoreDeck.tsx line 284): `rgba(0,0,0,0.38)` — neutral black
- v3: `rgba(20,28,24,0.45)` dark forest-green tint + `backdrop-filter: blur(12px)`
- Status: DOES NOT MATCH
- Safe repair: partial — colour+opacity = 1-line change; blur = package install (not safe local)

## Item 34 — MoreDeck card header min-height

- Native (MoreDeck.tsx line 308): `minHeight: 56`
- v3: `BAR_PEEK_H = 68px`
- Status: DOES NOT MATCH — 12px short
- Safe repair: yes — 1 integer in `styles.cardBar`

## Item 35 — MoreDeck card header icon slot

- Native (`styles.cardBarIcon` line 311): `width:34, height:34, borderRadius:9`
- v3: `32×32, borderRadius:8`
- Status: DOES NOT MATCH — 2px over; radius 1 too large
- Note: `styles.deckRowIcon` (line 322) is the CONTENT-row icon, separate concern, not in this audit
- Safe repair: yes — 3 values in `styles.cardBarIcon`

## Item 36 — MoreDeck card header subtitles absent

- Native: `CARD_DEFS` type `{ id, icon, label }` only; cardBar renders `{card.label}` only (line 101)
- v3 exact subtitle strings:
  - actions: "Save, print, or check off your list"
  - settings: "Units and display options"
  - help: "Tutorials, about, and feedback"
  - account: "Your account, privacy, and legal"
- Status: DOES NOT MATCH — all 4 subtitles absent
- Safe repair: yes — add `sub: string` to CARD_DEFS entries; render below label using `deckRowSub` style (line 326: fontSize:12, PlusJakartaSans_400Regular, MUTED)

## Item 37 — MoreDeck Card 3 navigation

- Native (lines 166–200): all 6 rows use `Linking.openURL('https://trailweigh.com/...')`
- v3: in-app `footer-page:`/`screen:'sources'` navigation; HelpContent/AboutContent/HowItWorksContent/SourcesContent components exist in web package only
- Status: DOES NOT MATCH
- Safe repair: NO — requires implementing 6 native content screens; web components not portable

## Item 38 — MoreDeck Card 4 navigation + Delete Account URL bug

- Native (lines 213–246): all 5 rows use `Linking.openURL('https://trailweigh.com/...')`
- Delete Account: `Alert.alert` → "Open Website" → `Linking.openURL('https://trailweigh.com')` (WRONG — root not /delete-account)
- v3: all 5 rows in-app via `footer-page:` route; content is inline Tailwind JSX in web-only FooterPageView (not portable components)
- Status: DOES NOT MATCH
- Safe repair: partial — Delete Account URL `'https://trailweigh.com'` → `'https://trailweigh.com/delete-account'` is 1-line; full in-app screens require new native scope

**Why:** blur can be flagged as platform-acknowledged; colour/opacity+geometry are all safe 1-file changes.
