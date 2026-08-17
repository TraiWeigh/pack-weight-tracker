---
name: R0077P2 test infra lessons
description: Key pitfalls discovered while building the P2 test suite for MobileFunctionalV3 accessibility follow-up.
---

## gotoDemo() is broken — do not use for new V3 tests

`gotoDemo()` in `tests/e2e/helpers/trailweigh.ts` waits for `getByText('LIST SUMMARY')`.
That text was replaced by the active list name in a prior revision and no longer renders.
Tests that call gotoDemo() time out at exactly 15s (the default expect timeout).

**Correct pattern** (same as R0077 spec):
```typescript
const BASE = '/mobile-functional-v3';
test.use({ viewport: { width: 390, height: 844 } });
test.beforeEach(async ({ page }) => {
  await page.goto(BASE);
  await page.waitForSelector('[data-testid="main-scroll"]', { timeout: 15000 });
  await page.waitForTimeout(300);
});
```

**Why:** The trailweigh helper predates the list-name redesign. Keep using `openCategory`
and other helpers from it — only `gotoDemo()` and `backToList()` are broken (both reference
the missing LIST SUMMARY text).

## isCatLong threshold at 390×844 viewport

`isCatLong` activates when `itemsEl.scrollHeight > rawAvailH + 4`.
At 390×844 with Desktop Chrome (DPR=1): rawAvailH ≈ 568px, so ~14+ item rows needed.
The default Backpack demo list has 3 items — far below the threshold.

**To force long mode in tests:** add ≥15 items via `cat-add-item-btn` (repair effect
fires 150ms after last add). Wait 500ms after the last add for the repair to complete.
Do NOT close/reopen — the repair mechanism handles the transition automatically.

```typescript
await openCategory(page, 'Backpack');
for (let i = 0; i < 15; i++) {
  await page.getByTestId('cat-add-item-btn').first().click();
  await page.waitForTimeout(100);
}
await page.waitForTimeout(500); // repair: 150ms after last add
```

## Nav carousel — reaching Group 4

The bottom nav starts on Group 1. Groups 2/3/4 are `aria-hidden` when not active
(`visibility: hidden`, not `display: none`). Playwright's `toBeVisible()` fails on them.

To reach Group 4 (Save | Share | More):
```typescript
const nextBtn = page.locator('button[aria-label="Next controls"]');
for (let i = 0; i < 3; i++) {
  await nextBtn.first().evaluate((el) => (el as HTMLElement).click());
  await page.waitForTimeout(350); // animation settle
}
// Now target within the active group:
const saveBtn = page.locator('[data-group-idx="3"] button[aria-label="Save — save list to Locker"]');
```

**Why `.first().evaluate(el => el.click())`:** The chevron buttons use pointer-capture
which can interfere with Playwright `.click()`. Direct DOM click bypasses that.

## Running two test batches simultaneously kills them both

Playwright tests that share the same app server should never run simultaneously.
When two `playwright test` processes share port 80, the server slows under load and
both batches fail with gotoDemo-style timeouts. Always run sequentially with `--grep`.
