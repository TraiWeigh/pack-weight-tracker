/**
 * R002 — Bottom Card-Deck Navigation System tests
 * ─────────────────────────────────────────────────
 * Verifies the finalized V3 phone UI navigation:
 *  - five-tab bottom bar (List, Locker, +, Search, More)
 *  - side sliders / gutters / bottom handle removed; full-width content
 *  - decks rise on tab tap; card tap docks a card; deck closes via List tab,
 *    backdrop, close button, and Escape
 *  - card switching without closing the deck
 *  - state preservation across deck open/close
 *  - no horizontal overflow at 320 / 375 / 390 / 430 px
 *  - closed decks intercept no pointer events (list interactive after close)
 *  - reduced-motion still functions
 *
 * Lessons from R001 applied: every test asserts; tap-based activation is the
 * canonical interaction (drag is optional and covered via mouse drag).
 */
import { test, expect, Page } from '@playwright/test';

const ROUTE = '/mobile-functional-v3';

async function gotoV3(page: Page) {
  await page.goto(ROUTE);
  // Demo seed renders the summary card; wait for the list to be ready.
  await expect(page.getByText('LIST SUMMARY')).toBeVisible({ timeout: 15000 });
}

test.describe('R002 bottom tab bar', () => {
  test('shows exactly the five tabs: List, Locker, Add, Search, More', async ({ page }) => {
    await gotoV3(page);
    await expect(page.getByRole('button', { name: /^List — current gear list/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Locker — saved lists/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Add — add items/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Search — find gear/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^More — settings and tools/ })).toBeVisible();
    // Retired controls are gone
    await expect(page.getByRole('button', { name: /Summary — pack weight/ })).toHaveCount(0);
    await expect(page.getByLabel(/Catalog/)).toHaveCount(0);
    await expect(page.getByLabel(/Open More panel|Close More panel/)).toHaveCount(0);
  });

  test('sliders and gutters are gone — content is full width', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 720 });
    await gotoV3(page);
    // No slider rails / hamburger caps
    await expect(page.getByLabel(/drawer|slider/i)).toHaveCount(0);
    // Summary card spans nearly the full frame (16px margins, no 28px gutters)
    const card = page.getByText('LIST SUMMARY').locator('..').locator('..');
    const box = await card.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(375 - 2 * 16 - 4); // > ~339px
  });
});

test.describe('R002 deck open/close', () => {
  test('More tab raises the deck; List tab closes it', async ({ page }) => {
    await gotoV3(page);
    await page.getByRole('button', { name: /^More — settings/ }).click();
    const deck = page.getByRole('dialog', { name: 'More' });
    await expect(deck).toBeVisible();
    await expect(deck.getByRole('button', { name: /^List Actions — open card/ })).toBeVisible();
    await page.getByRole('button', { name: /^List — current gear list/ }).click();
    await expect(deck).toHaveCount(0);
  });

  test('re-tapping the same tab toggles the deck closed', async ({ page }) => {
    await gotoV3(page);
    const more = page.getByRole('button', { name: /^More — settings/ });
    await more.click();
    await expect(page.getByRole('dialog', { name: 'More' })).toBeVisible();
    await more.click();
    await expect(page.getByRole('dialog', { name: 'More' })).toHaveCount(0);
  });

  test('backdrop tap, close button, and Escape all close the deck', async ({ page }) => {
    await gotoV3(page);
    // Backdrop
    await page.getByRole('button', { name: /^More — settings/ }).click();
    await page.getByTestId('deck-backdrop').click({ position: { x: 10, y: 10 } });
    await expect(page.getByRole('dialog', { name: 'More' })).toHaveCount(0);
    // Close button
    await page.getByRole('button', { name: /^More — settings/ }).click();
    await page.getByRole('button', { name: 'Close More' }).click();
    await expect(page.getByRole('dialog', { name: 'More' })).toHaveCount(0);
    // Escape
    await page.getByRole('button', { name: /^More — settings/ }).click();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'More' })).toHaveCount(0);
  });

  test('switching decks does not require closing first', async ({ page }) => {
    await gotoV3(page);
    await page.getByRole('button', { name: /^More — settings/ }).click();
    await expect(page.getByRole('dialog', { name: 'More' })).toBeVisible();
    await page.getByRole('button', { name: /^Add — add items/ }).click();
    await expect(page.getByRole('dialog', { name: 'More' })).toHaveCount(0);
    await expect(page.getByRole('dialog', { name: 'Add' })).toBeVisible();
  });
});

test.describe('R002 card activation', () => {
  test('tapping a More card docks it and shows its actions', async ({ page }) => {
    await gotoV3(page);
    await page.getByRole('button', { name: /^More — settings/ }).click();
    await page.getByRole('button', { name: /^List Actions — open card/ }).click();
    const activeCard = page.getByRole('group', { name: 'List Actions — active card' });
    await expect(activeCard).toBeVisible();
    await expect(page.getByRole('button', { name: /^Save — Save current list/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Summary — Pack weight/ })).toBeVisible();
    // Undo starts disabled (no edits yet)
    await expect(page.getByRole('button', { name: 'Undo', exact: true })).toBeDisabled();
  });

  test('switching active cards transfers the dock without closing the deck', async ({ page }) => {
    await gotoV3(page);
    await page.getByRole('button', { name: /^More — settings/ }).click();
    await page.getByRole('button', { name: /^List Actions — open card/ }).click();
    await expect(page.getByRole('group', { name: 'List Actions — active card' })).toBeVisible();
    await page.getByRole('button', { name: /^Share & Print — open card/ }).click();
    await expect(page.getByRole('group', { name: 'Share & Print — active card' })).toBeVisible();
    await expect(page.getByRole('group', { name: 'List Actions — active card' })).toHaveCount(0);
    // Deck still open
    await expect(page.getByRole('dialog', { name: 'More' })).toBeVisible();
  });

  test('upward drag on a card also docks it (drag is optional, tap-equivalent)', async ({ page }) => {
    await gotoV3(page);
    await page.getByRole('button', { name: /^More — settings/ }).click();
    const card = page.getByRole('button', { name: /^Share & Print — open card/ });
    await expect(card).toBeVisible();
    await page.waitForTimeout(450); // let the deck rise animation settle before measuring
    const box = await card.boundingBox();
    expect(box).not.toBeNull();
    const cx = box!.x + box!.width / 2;
    const cy = box!.y + box!.height / 2;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx, cy - 80, { steps: 8 }); // > DRAG_ACTIVATE (48px)
    await page.mouse.up();
    await expect(page.getByRole('group', { name: 'Share & Print — active card' })).toBeVisible();
  });

  test('short upward drag springs back without docking', async ({ page }) => {
    await gotoV3(page);
    await page.getByRole('button', { name: /^More — settings/ }).click();
    const card = page.getByRole('button', { name: /^Share & Print — open card/ });
    await expect(card).toBeVisible();
    await page.waitForTimeout(450);
    const box = await card.boundingBox();
    const cx = box!.x + box!.width / 2;
    const cy = box!.y + box!.height / 2;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx, cy - 20, { steps: 4 }); // < 48px threshold, > tap threshold
    await page.mouse.up();
    await expect(page.getByRole('group', { name: 'Share & Print — active card' })).toHaveCount(0);
    await expect(page.getByRole('dialog', { name: 'More' })).toBeVisible();
  });

  test('disabled cards do not activate', async ({ page }) => {
    await gotoV3(page);
    await page.getByRole('button', { name: /^Add — add items/ }).click();
    const disabledCard = page.getByRole('button', { name: /Create New List — not available yet/ });
    await expect(disabledCard).toBeVisible();
    await expect(disabledCard).toHaveAttribute('aria-disabled', 'true');
    // force: Playwright treats aria-disabled as non-actionable; we want to prove
    // the click lands and still does nothing.
    await disabledCard.click({ force: true });
    await expect(page.getByRole('group', { name: /Create New List — active card/ })).toHaveCount(0);
  });
});

test.describe('R002 deck contents wire real functionality', () => {
  test('Add deck: Add Category creates a category on the list', async ({ page }) => {
    await gotoV3(page);
    await page.getByRole('button', { name: /^Add — add items/ }).click();
    await page.getByRole('button', { name: /^Add Category — open card/ }).click();
    await page.getByLabel('New category name').fill('R002 Test Cat');
    await page.getByRole('button', { name: 'Confirm add category' }).click();
    // Deck closes; category appears in the list
    await expect(page.getByRole('dialog', { name: 'Add' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Open R002 Test Cat category' })).toBeVisible();
  });

  test('Search deck presents only honestly-disabled future search families', async ({ page }) => {
    await gotoV3(page);
    await page.getByRole('button', { name: /^Search — find gear/ }).click();
    const deck = page.getByRole('dialog', { name: 'Search' });
    await expect(deck).toBeVisible();
    const cards = deck.getByRole('button', { name: /not available yet/ });
    await expect(cards).toHaveCount(3);
    for (const c of await cards.all()) {
      await expect(c).toHaveAttribute('aria-disabled', 'true');
    }
  });

  test('Locker deck shows empty state when no lists are saved', async ({ page }) => {
    await gotoV3(page);
    await page.getByRole('button', { name: /^Locker — saved lists/ }).click();
    const deck = page.getByRole('dialog', { name: 'Locker' });
    await expect(deck).toBeVisible();
    await expect(deck.getByText(/No saved lists yet/)).toBeVisible();
  });

  test('Save via More then Locker deck lists the saved entry with metadata and Load works', async ({ page }) => {
    await gotoV3(page);
    // Save current list
    await page.getByRole('button', { name: /^More — settings/ }).click();
    await page.getByRole('button', { name: /^List Actions — open card/ }).click();
    await page.getByRole('button', { name: /^Save — Save current list/ }).click();
    // Open Locker deck — saved entry card should exist
    await page.getByRole('button', { name: /^Locker — saved lists/ }).click();
    const deck = page.getByRole('dialog', { name: 'Locker' });
    await expect(deck).toBeVisible();
    const entryCard = deck.getByRole('button', { name: /open card/ }).first();
    await expect(entryCard).toBeVisible();
    await entryCard.click();
    // Active card shows metadata and a Load button
    await expect(deck.getByText(/Saved: /)).toBeVisible();
    await expect(deck.getByText(/categor/)).toBeVisible();
    const load = deck.getByRole('button', { name: /^Load .* into the list/ });
    await expect(load).toBeVisible();
    await load.click();
    await expect(page.getByRole('dialog', { name: 'Locker' })).toHaveCount(0);
    await expect(page.getByText(/^Loaded "/)).toBeVisible();
  });

  test('More deck routes to an existing footer page (Help & TrailWeigh → About)', async ({ page }) => {
    await gotoV3(page);
    await page.getByRole('button', { name: /^More — settings/ }).click();
    await page.getByRole('button', { name: /^Help & TrailWeigh — open card/ }).click();
    await page.getByRole('button', { name: 'About TrailWeigh' }).click();
    await expect(page.getByRole('dialog', { name: 'More' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Back', exact: true })).toBeVisible();
  });

  test('List Settings switches units and the summary reflects it', async ({ page }) => {
    await gotoV3(page);
    await page.getByRole('button', { name: /^More — settings/ }).click();
    await page.getByRole('button', { name: /^List Settings — open card/ }).click();
    await page.getByRole('button', { name: 'Use metric units' }).click();
    await expect(page.getByRole('button', { name: 'Use metric units' })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: /^List — current gear list/ }).click();
    await expect(page.getByText(/kg|g/).first()).toBeVisible();
  });
});

test.describe('R002 state preservation & pointer hygiene', () => {
  test('open category accordion survives deck open/close', async ({ page }) => {
    await gotoV3(page);
    // Open the first category
    const firstCat = page.locator('[aria-expanded]').first();
    await firstCat.click();
    await expect(firstCat).toHaveAttribute('aria-expanded', 'true');
    // Open + close a deck
    await page.getByRole('button', { name: /^More — settings/ }).click();
    await page.getByRole('button', { name: /^List — current gear list/ }).click();
    // Accordion state preserved
    await expect(firstCat).toHaveAttribute('aria-expanded', 'true');
  });

  test('after closing a deck the list is fully interactive (no invisible overlay)', async ({ page }) => {
    await gotoV3(page);
    await page.getByRole('button', { name: /^Search — find gear/ }).click();
    await page.getByRole('button', { name: /^List — current gear list/ }).click();
    // No backdrop or dialog remains in the DOM
    await expect(page.getByTestId('deck-backdrop')).toHaveCount(0);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    // A category header can be clicked and expands
    const firstCat = page.locator('[aria-expanded]').first();
    await firstCat.click();
    await expect(firstCat).toHaveAttribute('aria-expanded', 'true');
  });

  test('reduced motion: decks still open and close correctly', async ({ page }) => {
    await gotoV3(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.getByRole('button', { name: /^More — settings/ }).click();
    await expect(page.getByRole('dialog', { name: 'More' })).toBeVisible();
    await page.getByRole('button', { name: /^List Actions — open card/ }).click();
    await expect(page.getByRole('group', { name: 'List Actions — active card' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'More' })).toHaveCount(0);
  });
});

test.describe('R002 viewport sweep — no horizontal overflow', () => {
  for (const width of [320, 375, 390, 430]) {
    test(`at ${width}px: list full width, decks open, no horizontal scroll`, async ({ page }) => {
      await page.setViewportSize({ width, height: 720 });
      await gotoV3(page);
      const noHOverflow = async () => {
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow).toBeLessThanOrEqual(0);
      };
      await noHOverflow();
      // Each deck opens without overflow
      for (const [label, deckName] of [
        [/^Locker — saved lists/, 'Locker'],
        [/^Add — add items/, 'Add'],
        [/^Search — find gear/, 'Search'],
        [/^More — settings/, 'More'],
      ] as const) {
        await page.getByRole('button', { name: label }).click();
        await expect(page.getByRole('dialog', { name: deckName })).toBeVisible();
        await noHOverflow();
        await page.getByRole('button', { name: /^List — current gear list/ }).click();
      }
    });
  }
});
