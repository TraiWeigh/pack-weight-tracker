import { test, expect, expectClean, gotoDemo, summary, backToList, menuAction, itemCheckboxes, openCategory, SEED } from '../helpers/trailweigh';

test.describe('B. List / file core behavior', () => {
  test('current list name is displayed', async ({ page, errors }) => {
    await gotoDemo(page);
    await expect(page.getByText(SEED.listName)).toBeVisible();
    expectClean(errors);
  });

  test('Create New List is present but disabled (documented, not a defect)', async ({ page, errors }) => {
    await gotoDemo(page);
    await page.getByRole('button', { name: /Create or import/ }).click();
    await expect(page.getByText('Start / Create')).toBeVisible();
    await expect(page.getByText('Create New List')).toBeVisible();
    // TESTABILITY NOTE: rendered as a non-interactive div with aria-disabled.
    await expect(page.locator('[aria-disabled="true"]', { hasText: 'Create New List' }).first()).toBeVisible();
    await page.keyboard.press('Escape');
    expectClean(errors);
  });

  test('Locker: save current list creates a loadable entry (browser-local only)', async ({ page, errors }) => {
    await gotoDemo(page);
    await page.getByRole('button', { name: 'Locker — browse and load saved lists' }).click();
    await page.getByRole('button', { name: 'Save current list to Locker' }).click();
    await expect(page.getByRole('button', { name: /^Load .+ into preview$/ })).toBeVisible();
    await page.getByRole('button', { name: /^Load .+ into preview$/ }).first().click();
    await expect(page.getByText('LIST SUMMARY')).toBeVisible();
    const s = await summary(page);
    expect(s.items).toBe(SEED.items);
    expectClean(errors);
  });

  test('Reset restores the seed after a mutation', async ({ page, errors }) => {
    await gotoDemo(page);
    await openCategory(page, 'Backpack');
    await itemCheckboxes(page).first().click();
    const changed = await summary(page);
    expect(changed.selected).not.toBe(SEED.selected);
    await menuAction(page, /^Reset — /);
    const s = await summary(page);
    expect(s.selected).toBe(SEED.selected);
    expect(s.items).toBe(SEED.items);
    expectClean(errors);
  });

  test('Share handles a blocked/denied share request gracefully (no crash, no link created)', async ({ page, errors }) => {
    await gotoDemo(page);
    // DATA SAFETY: block every mutating API request so no share link or other
    // server-side record can be created by this suite. The app must handle the
    // denial without an uncaught error.
    const blocked: string[] = [];
    await page.route('**/api/**', async (route) => {
      if (route.request().method() === 'GET') return route.continue();
      blocked.push(`${route.request().method()} ${route.request().url()}`);
      await route.fulfill({ status: 403, contentType: 'application/json', body: '{"error":"blocked by test"}' });
    });
    await menuAction(page, /^Share \(get review link\)$/);
    // Wait for the UI to settle in an observable state: the list must remain reachable.
    await backToList(page);
    await expect(page.getByText('LIST SUMMARY')).toBeVisible();
    expect(errors.pageErrors, 'uncaught page errors during blocked share attempt').toEqual([]);
    expect(errors.serverErrors, 'unexpected 5xx during share attempt').toEqual([]);
    // Proof of isolation: any mutating call was intercepted, never reached the server.
    // (blocked may be empty if the unauthenticated demo short-circuits before calling the API.)
  });
});
