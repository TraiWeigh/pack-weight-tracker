/**
 * R0107 — Photo List capture buffer + Safari visible-bottom footer correction.
 *
 * The Photo List capture remains intentionally unassigned: no category or item is
 * fabricated before the later Location-or-Item workflow.
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

async function saveCurrentPhotoList(page: Page) {
  for (let i = 0; i < 3; i++) await nextGroup(page);
  await page.getByRole('button', { name: 'Save — save list to Locker', exact: true }).click();
  await page.getByTestId('save-chooser-save').click();
}

test.describe('R0107 — Photo List capture and Safari footer correction', () => {
  test.use({ viewport: VIEWPORT });

  test('Photo List Add Photo opens real Camera and Photos sources', async ({ page, errors }) => {
    await gotoMobile(page);
    await createPhotoList(page, 'R0107 Source Choices');

    await page.getByTestId('photo-list-add-photo').click();
    await expect(page.getByTestId('photo-list-source-sheet')).toBeVisible();
    await expect(page.getByTestId('photo-list-source-camera')).toBeVisible();
    await expect(page.getByTestId('photo-list-source-photos')).toBeVisible();

    const cameraChooser = page.waitForEvent('filechooser');
    await page.getByTestId('photo-list-source-camera').click();
    await expect(await cameraChooser).toBeTruthy();

    await page.getByTestId('photo-list-add-photo').click();
    const libraryChooser = page.waitForEvent('filechooser');
    await page.getByTestId('photo-list-source-photos').click();
    await expect(await libraryChooser).toBeTruthy();

    expectClean(errors);
  });

  test('selected Photo List image is retained without creating categories or items, then survives Save and reload', async ({ page, errors }) => {
    const name = 'R0107 Retained Photo';
    await gotoMobile(page);
    await createPhotoList(page, name);

    await page.getByTestId('photo-list-add-photo').click();
    const chooserPromise = page.waitForEvent('filechooser');
    await page.getByTestId('photo-list-source-photos').click();
    const chooser = await chooserPromise;
    await chooser.setFiles({ name: 'trail-photo.png', mimeType: 'image/png', buffer: ONE_PIXEL_PNG });

    await expect(page.getByTestId('photo-list-pending-photo')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByTestId('photo-list-pending-photo')).toHaveAttribute('src', /^data:image\/jpeg/);
    await expect(page.getByText('0 categories', { exact: true })).toBeVisible();
    await expect(page.locator('[data-cat]')).toHaveCount(0);
    await page.screenshot({ path: 'reports/r0107/screenshots/01-photo-list-captured-390x844.png', fullPage: false });

    await saveCurrentPhotoList(page);
    const savedCapture = await page.evaluate((listName) => {
      const entries = JSON.parse(localStorage.getItem('trailweigh:locker') ?? '[]');
      return entries.find((entry: { name: string }) => entry.name === listName)?.store?.photoListCaptureDataUrl;
    }, name);
    expect(savedCapture).toMatch(/^data:image\/jpeg/);

    await page.reload();
    await expect(page.getByTestId('main-scroll')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('photo-list-pending-photo')).toBeVisible();
    await expect(page.locator('.tw-v3-root')).toHaveAttribute('data-list-kind', 'photo');
    await expect(page.getByRole('button', { name: /^Open .+ category$/ })).toHaveCount(0);

    expectClean(errors);
  });

  test('footer moves above a measured visual-viewport bottom occlusion without changing the R0097 layout baseline', async ({ page, errors }) => {
    await page.addInitScript(() => {
      const listeners = new Map<string, Set<() => void>>();
      const fakeViewport = {
        width: 390,
        height: 844,
        offsetTop: 0,
        addEventListener(type: string, listener: () => void) {
          if (!listeners.has(type)) listeners.set(type, new Set());
          listeners.get(type)!.add(listener);
        },
        removeEventListener(type: string, listener: () => void) {
          listeners.get(type)?.delete(listener);
        },
      };
      Object.defineProperty(window, 'visualViewport', { configurable: true, value: fakeViewport });
      Object.defineProperty(window, '__r0107SetVisibleHeight', {
        configurable: true,
        value: (height: number, offsetTop = 0) => {
          fakeViewport.height = height;
          fakeViewport.offsetTop = offsetTop;
          for (const listener of listeners.get('resize') ?? []) listener();
          for (const listener of listeners.get('scroll') ?? []) listener();
        },
      });
    });

    await gotoMobile(page);
    const root = page.locator('.tw-v3-root');
    await expect(root).toHaveAttribute('data-footer-viewport-occlusion', '0');

    await page.evaluate(() => (window as any).__r0107SetVisibleHeight(760));
    await expect(root).toHaveAttribute('data-footer-viewport-occlusion', '84');
    const occludedNav = await page.getByTestId('bottom-nav').boundingBox();
    expect(occludedNav).not.toBeNull();
    expect(occludedNav!.y + occludedNav!.height).toBeLessThanOrEqual(761);

    await page.evaluate(() => (window as any).__r0107SetVisibleHeight(844));
    await expect(root).toHaveAttribute('data-footer-viewport-occlusion', '0');

    expectClean(errors);
  });
});