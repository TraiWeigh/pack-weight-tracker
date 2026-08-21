/**
 * R0106 — persistent Photo List foundation
 *
 * Covers:
 * - New → Photo List → Name List → clean Photo List start
 * - Save, refresh, Save As, and Locker reopen retaining Photo List mode
 * - Legacy Locker records without listKind loading as standard lists
 * - The current standard list still starts in standard mode
 */
import { test, expect, expectClean } from '../helpers/trailweigh';

type Page = import('@playwright/test').Page;

const VIEWPORT = { width: 390, height: 844 };

async function gotoMobile(page: Page) {
  await page.setViewportSize(VIEWPORT);
  const response = await page.goto('/mobile-functional-v3');
  expect(response).not.toBeNull();
  expect(response!.ok()).toBe(true);
  await expect(page.getByTestId('main-scroll')).toBeVisible({ timeout: 15_000 });
}

function activeGroup(page: Page) {
  return page.locator('[data-testid="bottom-nav"] [data-group-active="true"]');
}

async function nextGroup(page: Page) {
  await activeGroup(page).getByTestId('bottom-next-chevron').click();
  await page.waitForTimeout(430);
}

async function goToSaveGroup(page: Page) {
  for (let i = 0; i < 3; i++) await nextGroup(page);
  await expect(page.getByRole('button', { name: 'Save — save list to Locker', exact: true })).toBeVisible();
}

async function createPhotoList(page: Page, name: string) {
  await page.getByRole('button', { name: 'Add — add items, categories, or import', exact: true }).click();
  await page.getByRole('button', { name: 'New List — open card', exact: true }).click();
  await expect(page.getByTestId('new-photo-list-option')).toBeVisible();
  await page.getByTestId('new-photo-list-option').click();
  await expect(page.getByTestId('new-list-name-dialog')).toBeVisible();
  await expect(page.getByTestId('new-list-name-create')).toBeDisabled();
  await page.getByTestId('new-list-name-input').fill(name);
  await page.getByTestId('new-list-name-create').click();
  await expect(page.getByTestId('new-list-name-dialog')).not.toBeVisible();
  await expect(page.getByTestId('photo-list-start')).toBeVisible();
  await expect(page.locator('.tw-v3-root')).toHaveAttribute('data-list-kind', 'photo');
  await expect(page.getByTestId('active-list-name')).toHaveText(name);
}

async function savePhotoList(page: Page) {
  await goToSaveGroup(page);
  await page.getByRole('button', { name: 'Save — save list to Locker', exact: true }).click();
  await expect(page.getByTestId('save-chooser-save')).toBeVisible();
  await page.getByTestId('save-chooser-save').click();
}

test.describe('R0106 — Photo List creation and persistence', () => {
  test('New → Photo List → Name List opens a clean Photo List starting state', async ({ page, errors }) => {
    await gotoMobile(page);
    await expect(page.locator('.tw-v3-root')).toHaveAttribute('data-list-kind', 'standard');

    await createPhotoList(page, 'R0106 Trail Photos');

    await expect(page.getByText('Your Photo List is ready', { exact: true })).toBeVisible();
    await expect(page.getByTestId('photo-list-add-photo')).toBeVisible();
    await expect(page.getByText('No list data found.', { exact: true })).not.toBeVisible();
    await expect(page.getByRole('button', { name: /^Open .+ category$/ })).toHaveCount(0);
    await page.screenshot({ path: 'reports/r0106/screenshots/01-photo-list-start-390x844.png', fullPage: false });

    expectClean(errors);
  });

  test('saved Photo List restores after browser refresh', async ({ page, errors }) => {
    await gotoMobile(page);
    await createPhotoList(page, 'R0106 Refresh Photos');
    await savePhotoList(page);

    const stored = await page.evaluate(() => {
      const entries = JSON.parse(localStorage.getItem('trailweigh:locker') ?? '[]');
      return entries.find((entry: { name: string }) => entry.name === 'R0106 Refresh Photos');
    });
    expect(stored).toMatchObject({ name: 'R0106 Refresh Photos', listKind: 'photo' });

    await page.reload();
    await expect(page.getByTestId('main-scroll')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('.tw-v3-root')).toHaveAttribute('data-list-kind', 'photo');
    await expect(page.getByTestId('active-list-name')).toHaveText('R0106 Refresh Photos');
    await expect(page.getByTestId('photo-list-start')).toBeVisible();

    expectClean(errors);
  });

  test('Save As preserves Photo List mode after refresh', async ({ page, errors }) => {
    await gotoMobile(page);
    await createPhotoList(page, 'R0106 Original Photos');
    await savePhotoList(page);

    await page.getByRole('button', { name: 'Save — save list to Locker', exact: true }).click();
    await page.getByTestId('save-chooser-save-as').click();
    await page.getByTestId('save-as-name-input').fill('R0106 Copy Photos');
    await page.getByTestId('save-as-confirm').click();
    await expect(page.getByTestId('active-list-name')).toHaveText('R0106 Copy Photos');

    await page.reload();
    await expect(page.getByTestId('main-scroll')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('.tw-v3-root')).toHaveAttribute('data-list-kind', 'photo');
    await expect(page.getByTestId('active-list-name')).toHaveText('R0106 Copy Photos');
    await expect(page.getByTestId('photo-list-start')).toBeVisible();

    expectClean(errors);
  });

  test('Locker reopen restores Photo List mode', async ({ page, errors }) => {
    const name = 'R0106 Locker Photos';
    await gotoMobile(page);
    await createPhotoList(page, name);
    await savePhotoList(page);

    // Group 4 → Group 1, then open the Locker deck and load the saved entry.
    await nextGroup(page);
    await page.getByRole('button', { name: 'Locker — saved lists', exact: true }).click();
    await page.getByRole('button', { name: `${name} — open card`, exact: true }).click();
    await page.getByRole('button', { name: `Load ${name} into the list`, exact: true }).click();

    await expect(page.locator('.tw-v3-root')).toHaveAttribute('data-list-kind', 'photo');
    await expect(page.getByTestId('active-list-name')).toHaveText(name);
    await expect(page.getByTestId('photo-list-start')).toBeVisible();

    expectClean(errors);
  });

  test('legacy Locker entry with no listKind loads as a standard list', async ({ page, errors }) => {
    await gotoMobile(page);
    await page.evaluate(() => {
      sessionStorage.removeItem('tw-v3-active-photo-list-id');
      localStorage.setItem('trailweigh:locker', JSON.stringify([{
        id: 'r0106-legacy-standard',
        name: 'R0106 Legacy Standard',
        savedAt: Date.now(),
        store: { items: {}, order: [], meta: {} },
        background: null,
        bgFade: 0.3,
        bgTone: 'light',
      }]));
    });

    await page.reload();
    await expect(page.getByTestId('main-scroll')).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: 'Locker — saved lists', exact: true }).click();
    await page.getByRole('button', { name: 'R0106 Legacy Standard — open card', exact: true }).click();
    await page.getByRole('button', { name: 'Load R0106 Legacy Standard into the list', exact: true }).click();

    await expect(page.locator('.tw-v3-root')).toHaveAttribute('data-list-kind', 'standard');
    await expect(page.getByText('No list data found.', { exact: true })).toBeVisible();
    await expect(page.getByTestId('photo-list-start')).not.toBeVisible();

    expectClean(errors);
  });
});