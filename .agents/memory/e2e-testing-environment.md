---
name: E2E testing environment rules (TrailWeigh/Replit)
description: Durable constraints for running Playwright suites in this workspace, plus Phase 1 defect reclassification
---

- Background (`nohup`) test runs die when the Agent shell session ends; workspace restarts also kill runs. Run suites as foreground chunks ≤ ~4 min each, with a per-chunk result manifest so partial runs can't be mistaken for full completions.
- **Why:** observed twice during Phase 1 — nohup log frozen at header, process gone; one full run lost to a workspace restart.
- Workspace: 4 vCPU / 8 GB cgroup. workers=1 is the standing default; workers=2 benchmarked safe (~27% faster) for quick reruns only. Never run Replit App Testing concurrently with Playwright.
- `/mobile-functional-v3` is a self-contained sandbox (own state/handlers, no usePackData); it shares only presentation/math utils with production. E2E findings there don't transfer to owner/Review routes automatically.
- Phase 1 defect reclassification (capability audit): TW-P1-001 is INTENTIONAL sandbox behavior (comment at handleCatToggle: exit expand-all, tapped cat stays open) → test assumption, needs product decision; TW-P1-002 real sandbox bug (setExpandedItem id:'' never matches new UUID); TW-P1-003 sandbox-only gap — production GearRow/MobileWedgeCategory DO have item name/type editors.
- Playwright quirks learned: getByRole name matching is substring by default ('Back' matches 'Open Backpack category' — use exact:true); fill()/programmatic value set of invalid text on type=number inputs is blanked by the browser — use pressSequentially; full-screen panels cover the bottom nav (visible-in-DOM but unclickable).
- No service worker/polling/analytics in the app; networkidle OK on sandbox route only — prefer UI-state assertions ('LIST SUMMARY' visible, 'Close <cat> category' visible).
