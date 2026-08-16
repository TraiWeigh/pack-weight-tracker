# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase1d/mobile-v3-sheets.spec.ts >> Transition timing and reduced motion >> MoreSheet: CSS close duration is 300 ms
- Location: tests/e2e/phase1d/mobile-v3-sheets.spec.ts:494:7

# Error details

```
Error: close transition-duration

expect(received).toBe(expected) // Object.is equality

Expected: "0.3s"
Received: "0.5s"
```

# Page snapshot

```yaml
- generic:
  - generic:
    - generic:
      - generic:
        - generic:
          - button
          - generic: TrailWeigh
          - generic:
            - button
        - generic:
          - generic:
            - generic: Demo Pack List
            - generic:
              - generic:
                - generic:
                  - generic: LIST SUMMARY
                  - generic:
                    - generic: "21"
                    - generic: items
                - generic:
                  - generic: 6 categories
                  - generic: 16 Selected
                  - generic: 5 Not Selected
          - generic:
            - generic:
              - generic:
                - button
                - generic:
                  - generic:
                    - button:
                      - generic: Backpack
                    - generic: 3 items · 2 selected
                  - button
                  - generic: 72.50 oz
            - generic:
              - generic:
                - button
                - generic:
                  - generic:
                    - button:
                      - generic: Clothing
                    - generic: 5 items · 4 selected
                  - button
                  - generic: 50.70 oz
            - generic:
              - generic:
                - button
                - generic:
                  - generic:
                    - button:
                      - generic: Toiletries
                    - generic: 4 items · 2 selected
                  - button
                  - generic: 2.60 oz
            - generic:
              - generic:
                - button
                - generic:
                  - generic:
                    - button:
                      - generic: Electronics
                    - generic: 3 items · 3 selected
                  - button
                  - generic: 14.40 oz
            - generic:
              - generic:
                - button
                - generic:
                  - generic:
                    - button:
                      - generic: Shelter
                    - generic: 3 items · 3 selected
                  - button
                  - generic: 90.00 oz
            - generic:
              - generic:
                - button
                - generic:
                  - generic:
                    - button:
                      - generic: Kitchen
                    - generic: 3 items · 2 selected
                  - button
                  - generic: 13.70 oz
            - generic:
              - button: Add Category
        - generic:
          - button:
            - generic: List
          - button:
            - generic: Locker
          - generic: Catalog
          - button:
            - generic: Summary
          - button:
            - generic: More
    - list
  - dialog [ref=e2]:
    - button "Close" [active] [ref=e3]
    - generic [ref=e8]: More
    - generic [ref=e11]:
      - generic [ref=e12]: Actions
      - button "Save — Save current list as new Locker entry" [ref=e13] [cursor=pointer]:
        - generic [ref=e19]:
          - generic [ref=e20]: Save
          - generic [ref=e21]: Save current list as new Locker entry
      - button "Share — Get a review link" [ref=e22] [cursor=pointer]:
        - generic [ref=e30]:
          - generic [ref=e31]: Share
          - generic [ref=e32]: Get a review link
      - button "Undo" [disabled] [ref=e33]
      - button "Redo" [disabled] [ref=e40]
      - button "Reset — Re-load from your saved data" [ref=e47] [cursor=pointer]:
        - generic [ref=e52]:
          - generic [ref=e53]: Reset
          - generic [ref=e54]: Re-load from your saved data
      - button "Expand All" [ref=e55] [cursor=pointer]
      - button "Collapse All" [ref=e63] [cursor=pointer]
      - generic [ref=e70]: TrailWeigh
      - button "About TrailWeigh" [ref=e71] [cursor=pointer]
      - button "How It Works" [ref=e75] [cursor=pointer]
      - button "Sources & References" [ref=e79] [cursor=pointer]
      - generic [ref=e83]: Help
      - button "Help & How-To" [ref=e84] [cursor=pointer]
      - button "Report a Problem" [ref=e88] [cursor=pointer]
      - button "Contact Us" [ref=e92] [cursor=pointer]
      - generic [ref=e96]: Account & Privacy
      - button "Privacy Policy" [ref=e97] [cursor=pointer]
      - button "Terms of Use" [ref=e101] [cursor=pointer]
      - button "Affiliate Disclosure" [ref=e105] [cursor=pointer]
      - button "Accessibility" [ref=e109] [cursor=pointer]
      - paragraph [ref=e114]: © 2026 TrailWeigh · All rights reserved.
```

# Test source

```ts
  403 |     });
  404 | 
  405 |     test('"Delete Account / Data" row absent when unauthenticated', async ({ page }) => {
  406 |       await openMore(page);
  407 |       const dialog = getOpenDialog(page);
  408 |       // Should not be rendered for unauthenticated users
  409 |       await expect(dialog.locator('button').filter({ hasText: 'Delete Account' })).not.toBeVisible();
  410 |     });
  411 | 
  412 |     test('all 10 non-auth link rows are present', async ({ page }) => {
  413 |       await openMore(page);
  414 |       const dialog = getOpenDialog(page);
  415 | 
  416 |       const allLinkLabels = [
  417 |         'About TrailWeigh', 'How It Works', 'Sources & References',
  418 |         'Help & How-To', 'Report a Problem', 'Contact Us',
  419 |         'Privacy Policy', 'Terms of Use', 'Affiliate Disclosure', 'Accessibility',
  420 |       ];
  421 | 
  422 |       for (const label of allLinkLabels) {
  423 |         const btn = dialog.locator('button').filter({ hasText: label }).first();
  424 |         await expect(btn, `link row "${label}" not visible`).toBeVisible();
  425 |       }
  426 |     });
  427 | 
  428 |     test('Share action dismisses sheet and opens share screen', async ({ page }) => {
  429 |       await openMore(page);
  430 |       const dialog = getOpenDialog(page);
  431 |       await dialog.locator('button[aria-label="Share — Get a review link"]').click();
  432 |       await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 2_000 });
  433 |       // Share screen should appear (look for a share-link related heading/button)
  434 |       // The share screen pushes a 'share' ScreenEntry — check for share-specific content
  435 |       // Allow a few seconds for the screen to render
  436 |       await page.waitForTimeout(500);
  437 |       // Minimal check: we're no longer on the base list (no Back btn from footer, but share screen appears)
  438 |       // The share overlay or share view should be visible — check for a recognisable share text
  439 |       const shareVisible = await page.locator('text=Share').first().isVisible();
  440 |       expect(shareVisible).toBe(true);
  441 |     });
  442 |   });
  443 | });
  444 | 
  445 | // ─────────────────────────────────────────────────────────────────────────────
  446 | // TRANSITION TIMING + REDUCED MOTION
  447 | // ─────────────────────────────────────────────────────────────────────────────
  448 | 
  449 | test.describe('Transition timing and reduced motion', () => {
  450 |   test.use({ viewport: { width: 390, height: 844 } });
  451 | 
  452 |   test.beforeEach(async ({ page }) => {
  453 |     await page.goto(ROUTE);
  454 |     await waitForReady(page);
  455 |   });
  456 | 
  457 |   test('NavDrawer: CSS open duration is 500 ms (Tailwind data-[state=open]:duration-500)', async ({ page }) => {
  458 |     await openDrawer(page);
  459 |     const openDuration = await page.evaluate(() => {
  460 |       const dialog = document.querySelector('[role="dialog"][data-state="open"]');
  461 |       if (!dialog) return null;
  462 |       return window.getComputedStyle(dialog).transitionDuration;
  463 |     });
  464 |     // Tailwind data-[state=open]:duration-500 → 0.5s
  465 |     expect(openDuration, 'open transition-duration').toBe('0.5s');
  466 |   });
  467 | 
  468 |   test('NavDrawer: CSS close duration is 300 ms (Tailwind data-[state=closed]:duration-300)', async ({ page }) => {
  469 |     await openDrawer(page);
  470 | 
  471 |     // Start closing, measure before element is removed from DOM
  472 |     const closeDuration = await page.evaluate(async () => {
  473 |       const dialog = document.querySelector('[role="dialog"][data-state="open"]');
  474 |       if (!dialog) return null;
  475 |       // Trigger close by pressing Escape
  476 |       window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  477 |       await new Promise(r => setTimeout(r, 10)); // let Radix flip to data-state=closed
  478 |       return window.getComputedStyle(dialog).transitionDuration;
  479 |     });
  480 |     // Tailwind data-[state=closed]:duration-300 → 0.3s
  481 |     expect(closeDuration, 'close transition-duration').toBe('0.3s');
  482 |   });
  483 | 
  484 |   test('MoreSheet: CSS open duration is 500 ms', async ({ page }) => {
  485 |     await openMore(page);
  486 |     const openDuration = await page.evaluate(() => {
  487 |       const dialog = document.querySelector('[role="dialog"][data-state="open"]');
  488 |       if (!dialog) return null;
  489 |       return window.getComputedStyle(dialog).transitionDuration;
  490 |     });
  491 |     expect(openDuration, 'open transition-duration').toBe('0.5s');
  492 |   });
  493 | 
  494 |   test('MoreSheet: CSS close duration is 300 ms', async ({ page }) => {
  495 |     await openMore(page);
  496 |     const closeDuration = await page.evaluate(async () => {
  497 |       const dialog = document.querySelector('[role="dialog"][data-state="open"]');
  498 |       if (!dialog) return null;
  499 |       window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  500 |       await new Promise(r => setTimeout(r, 10));
  501 |       return window.getComputedStyle(dialog).transitionDuration;
  502 |     });
> 503 |     expect(closeDuration, 'close transition-duration').toBe('0.3s');
      |                                                        ^ Error: close transition-duration
  504 |   });
  505 | 
  506 |   test('sheet.tsx easing is ease-in-out (not linear, no bounce)', async ({ page }) => {
  507 |     await openDrawer(page);
  508 |     const easing = await page.evaluate(() => {
  509 |       const dialog = document.querySelector('[role="dialog"][data-state="open"]');
  510 |       if (!dialog) return null;
  511 |       return window.getComputedStyle(dialog).transitionTimingFunction;
  512 |     });
  513 |     // Tailwind "ease-in-out" → cubic-bezier(0.4, 0, 0.2, 1)
  514 |     // We check it contains the keyword or a smooth bezier (not step(), linear, bounce)
  515 |     expect(easing, 'transition easing').toMatch(/ease-in-out|cubic-bezier/i);
  516 |     // Confirm it does NOT contain steps() (no snap/bounce)
  517 |     expect(easing, 'no step easing').not.toMatch(/steps\(/i);
  518 |   });
  519 | 
  520 |   test('reduced-motion: no @media prefers-reduced-motion rule in sheet.tsx CSS', async ({ page }) => {
  521 |     // Simulate prefers-reduced-motion: reduce
  522 |     await page.emulateMedia({ reducedMotion: 'reduce' });
  523 | 
  524 |     await openDrawer(page);
  525 |     const durationUnderReducedMotion = await page.evaluate(() => {
  526 |       const dialog = document.querySelector('[role="dialog"][data-state="open"]');
  527 |       if (!dialog) return null;
  528 |       return window.getComputedStyle(dialog).transitionDuration;
  529 |     });
  530 | 
  531 |     // If reduced-motion is handled, duration should collapse to ~0ms or a very short value.
  532 |     // If NOT handled, it will still be 0.5s — record whichever we see for reporting.
  533 |     return { reducedMotionDuration: durationUnderReducedMotion };
  534 |     // (result inspected in report, test itself does not fail — this is an audit)
  535 |   });
  536 | });
  537 | 
  538 | // ─────────────────────────────────────────────────────────────────────────────
  539 | // DESKTOP / Checklist.tsx UNCHANGED
  540 | // ─────────────────────────────────────────────────────────────────────────────
  541 | 
  542 | test.describe('Desktop view — no regressions on MobileFunctionalV3 at wide viewport', () => {
  543 |   test.use({ viewport: { width: 1280, height: 800 } });
  544 | 
  545 |   test.beforeEach(async ({ page }) => {
  546 |     await page.goto(ROUTE);
  547 |     await waitForReady(page);
  548 |   });
  549 | 
  550 |   test('hamburger button still present at 1280px (not hidden by CSS)', async ({ page }) => {
  551 |     // MobileFunctionalV3 is a single-layout component; burger is always rendered
  552 |     await expect(page.locator('button[aria-label="Open menu"]')).toBeVisible();
  553 |   });
  554 | 
  555 |   test('NavDrawer opens and works correctly at 1280px', async ({ page }) => {
  556 |     await openDrawer(page);
  557 |     const dialog = getOpenDialog(page);
  558 |     await expect(dialog).toBeVisible();
  559 |     await expect(dialog.locator('text=Menu')).toBeVisible();
  560 |   });
  561 | 
  562 |   test('MoreSheet opens at 1280px', async ({ page }) => {
  563 |     await openMore(page);
  564 |     const dialog = getOpenDialog(page);
  565 |     await expect(dialog).toBeVisible();
  566 |     await expect(dialog.locator('text=More')).toBeVisible();
  567 |   });
  568 | });
  569 | 
  570 | test.describe('Checklist.tsx route — not affected by MobileFunctionalV3 changes', () => {
  571 |   test.use({ viewport: { width: 390, height: 844 } });
  572 | 
  573 |   test('main /pack-checklist route loads without crash', async ({ page }) => {
  574 |     // The main Checklist.tsx is at the root route of pack-checklist
  575 |     await page.goto('/');
  576 |     // Should show the welcome modal or the main list — either way no crash
  577 |     const bodyText = await page.locator('body').innerText();
  578 |     expect(bodyText.length).toBeGreaterThan(20);
  579 |   });
  580 | 
  581 |   test('Checklist.tsx has no hamburger drawer or MoreSheet (no NavDrawer)', async ({ page }) => {
  582 |     await page.goto('/');
  583 |     // Dismiss welcome modal if present
  584 |     const welcomeOkBtn = page.locator('button').filter({ hasText: /get started|continue|ok|dismiss/i });
  585 |     if (await welcomeOkBtn.first().isVisible({ timeout: 3_000 }).catch(() => false)) {
  586 |       await welcomeOkBtn.first().click();
  587 |     }
  588 |     // The MobileFunctionalV3 NavDrawer renders "Menu" heading; main app should not have it
  589 |     // NavDrawer is only in MobileFunctionalV3 — confirm no Sheet dialog with "Menu" text
  590 |     const menuDialog = page.locator('[role="dialog"]').filter({ hasText: 'Menu' });
  591 |     await expect(menuDialog).not.toBeVisible();
  592 |   });
  593 | });
  594 | 
```