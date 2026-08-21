/**
 * R0108 — classify Photo List captures as visual Locations or assigned Items.
 *
 * Items remain in the structural "Items" category, while photo locations are the
 * user-visible organisation surface.
 */
import { test, expect, expectClean } from '../helpers/trailweigh';

type Page = import('@playwright/test').Page;

const VIEWPORT = { width: 390, height: 844 };
const ONE_PIXEL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL4swAAAABJRU5ErkJggg==',
  'base64'
);

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

async function createPhotoList(page: Page, name: string) {
  await page.getByRole('button', { name: 'Add — add items, categories, or import', exact: true }).click();
  await page.getByRole('button', { name: 'New List — open card', exact: true }).click();
  await page.getByTestId('new-photo-list-option').click();
  await page.getByTestId('new-list-name-input').fill(name);
  await page.getByTestId('new-list-name-create').click();
  await expect(page.getByTestId('photo-list-start')).toBeVisible();
}

async function capturePhoto(page: Page, addButton = 'photo-list-add-photo') {
  await page.getByTestId(addButton).click();
  const chooserPromise = page.waitForEvent('filechooser');
  await page.getByTestId('photo-list-source-photos').click();
  const chooser = await chooserPromise;
  await chooser.setFiles({ name: 'r0108-trail-photo.png', mimeType: 'image/png', buffer: ONE_PIXEL_PNG });
  await expect(page.getByTestId('photo-list-assignment-sheet')).toBeVisible({ timeout: 5_000 });
}

async function createPhotoLocation(page: Page, name: string) {
  await page.getByTestId('photo-list-assign-location').click();
  await page.getByTestId('photo-list-location-name-input').fill(name);
  await page.getByTestId('photo-list-location-name-save').click();
  await expect(page.getByTestId('photo-list-visual-locations')).toBeVisible();
}

async function saveCurrentPhotoList(page: Page) {
  for (let i = 0; i < 3; i++) await nextGroup(page);
  await page.getByRole('button', { name: 'Save — save list to Locker', exact: true }).click();
  await page.getByTestId('save-chooser-save').click();
}

test.describe('R0108 — Photo List location and item assignment', () => {
  test.use({ viewport: VIEWPORT });

  test('a captured Location is named, saved with its photo, and visible before it contains items', async ({ page, errors }) => {
    await gotoMobile(page);
    await createPhotoList(page, 'R0108 Visual Locations');
    await capturePhoto(page);
    await createPhotoLocation(page, 'Top lid');

    await expect(page.getByText('Top lid', { exact: true }).first()).toBeVisible();
    await expect(page.locator('[data-testid^="photo-location-thumbnail-"]')).toHaveCount(1);
    await expect(page.getByText('No items assigned to this location.', { exact: true })).toBeVisible();
    await expect(page.locator('[data-cat]')).toHaveCount(0);
    await page.screenshot({ path: 'reports/r0108/screenshots/01-photo-location-390x844.png', fullPage: false });

    expectClean(errors);
  });

  test('the classification sheet traps keyboard focus and Escape retains the pending photo', async ({ page, errors }) => {
    await gotoMobile(page);
    await createPhotoList(page, 'R0108 Keyboard Sheet');
    await capturePhoto(page);

    const locationChoice = page.getByTestId('photo-list-assign-location');
    await expect(locationChoice).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(page.getByTestId('photo-list-assignment-cancel')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(locationChoice).toBeFocused();
    await page.keyboard.press('Escape');

    await expect(page.getByTestId('photo-list-assignment-sheet')).toBeHidden();
    await expect(page.getByTestId('photo-list-pending-photo')).toBeVisible();
    await expect(page.getByTestId('photo-list-add-photo')).toBeFocused();

    expectClean(errors);
  });

  test('an Item offers photographed locations and Unassigned, then creates one focused photo item', async ({ page, errors }) => {
    await gotoMobile(page);
    await createPhotoList(page, 'R0108 Item Assignment');
    await capturePhoto(page);
    await createPhotoLocation(page, 'Hip belt pocket');

    await capturePhoto(page);
    await page.getByTestId('photo-list-assign-item').click();
    const destinationSheet = page.getByTestId('photo-list-item-location-sheet');
    await expect(destinationSheet).toBeVisible();
    await expect(destinationSheet.getByText(/Master List/i)).toHaveCount(0);
    const destination = destinationSheet.locator('button[aria-label^="Assign photo item to "]');
    await expect(destination).toHaveCount(1);
    await page.screenshot({ path: 'reports/r0108/screenshots/02-photo-item-destination-390x844.png', fullPage: false });
    const destinationId = (await destination.getAttribute('data-testid'))!.replace('photo-list-item-location-', '');
    await destination.click();

    const nameInput = page.getByTestId('item-name-input');
    await expect(nameInput).toBeFocused();
    await expect(page.getByTestId('item-location-select')).toHaveValue(destinationId);
    await expect(page.locator('[data-cat="Items"]')).toHaveCount(1);

    await capturePhoto(page, 'photo-list-add-photo-inline');
    await page.getByTestId('photo-list-assign-item').click();
    await page.getByTestId('photo-list-item-unassigned').click();
    await expect(page.getByTestId('item-name-input')).toBeFocused();
    await expect(page.getByTestId('item-location-select')).toHaveValue('');

    expectClean(errors);
  });

  test('saved Photo Lists restore Location photos, assignment, and the structural Items category', async ({ page, errors }) => {
    const name = 'R0108 Persistence';
    await gotoMobile(page);
    await createPhotoList(page, name);
    await capturePhoto(page);
    await createPhotoLocation(page, 'Main compartment');

    await capturePhoto(page);
    await page.getByTestId('photo-list-assign-item').click();
    const destination = page.getByTestId('photo-list-item-location-sheet').locator('button[aria-label^="Assign photo item to "]');
    const destinationId = (await destination.getAttribute('data-testid'))!.replace('photo-list-item-location-', '');
    await destination.evaluate((button: HTMLButtonElement) => {
      button.click();
      button.click();
    });
    await saveCurrentPhotoList(page);

    const saved = await page.evaluate((listName) => {
      const entries = JSON.parse(localStorage.getItem('trailweigh:locker') ?? '[]');
      return entries.find((entry: { name: string }) => entry.name === listName)?.store;
    }, name);
    expect(saved.locations).toHaveLength(1);
    expect(saved.locations[0]).toMatchObject({ name: 'Main compartment', photoDataUrl: expect.stringMatching(/^data:image\/jpeg/) });
    expect(saved.items.Items).toHaveLength(1);
    expect(saved.items.Items[0]).toMatchObject({ locationId: destinationId, photoDataUrl: expect.stringMatching(/^data:image\/jpeg/) });

    await page.reload();
    await expect(page.getByTestId('main-scroll')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('.tw-v3-root')).toHaveAttribute('data-list-kind', 'photo');
    await expect(page.getByTestId('photo-list-add-photo-inline')).toBeVisible();
    await expect(page.getByRole('button', { name: /Open Items category/ })).toHaveCount(1);

    expectClean(errors);
  });
});