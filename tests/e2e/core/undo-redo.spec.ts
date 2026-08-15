import { test, expect, expectClean, gotoDemo, summary, addCategory, openMenu, SEED } from '../helpers/trailweigh';

async function clickMenuButton(page: any, name: string) {
  await openMenu(page);
  await page.getByRole('button', { name, exact: true }).click();
  const back = page.getByRole('button', { name: 'Back to list' }).first();
  if (await back.isVisible().catch(() => false)) await back.click();
}

test.describe('H. Undo / Redo', () => {
  test('Undo and Redo start disabled with empty history', async ({ page, errors }) => {
    await gotoDemo(page);
    await openMenu(page);
    await expect(page.getByRole('button', { name: 'Undo' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Redo' })).toBeDisabled();
    await page.getByRole('button', { name: 'Back to list' }).click();
    expectClean(errors);
  });

  test('mutation -> Undo restores prior state -> Redo restores mutation', async ({ page, errors }) => {
    await gotoDemo(page);
    await addCategory(page, 'UndoProbe');
    expect((await summary(page)).categories).toBe(7);

    await clickMenuButton(page, 'Undo');
    expect((await summary(page)).categories, 'Undo should remove the added category').toBe(6);
    await expect(page.getByRole('button', { name: 'Open UndoProbe category' })).not.toBeVisible();

    await clickMenuButton(page, 'Redo');
    expect((await summary(page)).categories, 'Redo should restore the added category').toBe(7);
    await expect(page.getByRole('button', { name: 'Open UndoProbe category' })).toBeVisible();
    expectClean(errors);
  });

  test('repeated Undo/Redo cycles do not corrupt state', async ({ page, errors }) => {
    await gotoDemo(page);
    await addCategory(page, 'CycleProbe');
    for (let i = 0; i < 3; i++) {
      await clickMenuButton(page, 'Undo');
      await clickMenuButton(page, 'Redo');
    }
    const s = await summary(page);
    expect(s.categories).toBe(7);
    expect(s.items).toBe(SEED.items);
    await expect(page.getByRole('button', { name: 'Open CycleProbe category' })).toHaveCount(1);
    expectClean(errors);
  });

  test('after full Undo the Undo control disables again', async ({ page, errors }) => {
    await gotoDemo(page);
    await addCategory(page, 'OnceProbe');
    await clickMenuButton(page, 'Undo');
    await openMenu(page);
    await expect(page.getByRole('button', { name: 'Undo' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Redo' })).toBeEnabled();
    await page.getByRole('button', { name: 'Back to list' }).click();
    expectClean(errors);
  });
});
