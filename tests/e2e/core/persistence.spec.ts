import { test, expect, expectClean, gotoDemo, summary, addCategory, menuAction, SEED } from '../helpers/trailweigh';

test.describe('I. Reload / in-session persistence (demo sandbox)', () => {
  test('demo edits are disposable: reload restores the seed', async ({ page, errors }) => {
    await gotoDemo(page);
    await addCategory(page, 'Ephemeral');
    expect((await summary(page)).categories).toBe(7);
    await page.reload();
    await expect(page.getByText('LIST SUMMARY')).toBeVisible();
    const s = await summary(page);
    expect(s.categories, 'demo sandbox edits should not persist across reload').toBe(6);
    expect(s.items).toBe(SEED.items);
    expectClean(errors);
  });

  test('unit preference persists across reload within the same context', async ({ page, errors }) => {
    await gotoDemo(page);
    await menuAction(page, 'Metric');
    await expect(page.getByText(/\d[\d,.]* g\b/).first()).toBeVisible();
    await page.reload();
    await expect(page.getByText('LIST SUMMARY')).toBeVisible();
    await expect(page.getByText(/\d[\d,.]* g\b/).first(), 'unit choice should persist (localStorage)').toBeVisible();
    expectClean(errors);
  });

  test('fresh context does not inherit state from other tests', async ({ browser }) => {
    const context = await browser.newContext({ baseURL: 'http://localhost:80/pack-checklist' });
    const page = await context.newPage();
    const errs: string[] = [];
    page.on('pageerror', (e) => errs.push(`pageerror: ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error') errs.push(`console.error: ${m.text()}`); });
    page.on('response', (r) => { if (r.status() >= 500) errs.push(`5xx: ${r.status()} ${r.url()}`); });
    await page.goto('/mobile-functional-v3');
    await expect(page.getByText('LIST SUMMARY')).toBeVisible();
    await expect(page.getByText(SEED.backpackSelectedOz)).toBeVisible(); // imperial default, seed data
    await expect(page.getByText('Demo Pack List')).toBeVisible();
    expect(errs).toEqual([]);
    await context.close();
  });

  test('Locker save persists across reload in the same context (browser-local)', async ({ page, errors }) => {
    await gotoDemo(page);
    await page.getByRole('button', { name: 'Locker — browse and load saved lists' }).click();
    await page.getByRole('button', { name: 'Save current list to Locker' }).click();
    await expect(page.getByRole('button', { name: /^Load .+ into preview$/ })).toBeVisible();
    await page.reload();
    await expect(page.getByText('LIST SUMMARY')).toBeVisible();
    await page.getByRole('button', { name: 'Locker — browse and load saved lists' }).click();
    await expect(page.getByRole('button', { name: /^Load .+ into preview$/ }).first()).toBeVisible();
    expectClean(errors);
  });
});
