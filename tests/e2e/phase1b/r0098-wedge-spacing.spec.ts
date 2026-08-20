/**
 * R0098 — wedge spacing measurement and regression coverage.
 *
 * The checklist category rows are the source of truth. The Home destination
 * wedge stack is the target variant being brought into the same rhythm.
 */
import { test, expect, gotoDemo, expectClean } from '../helpers/trailweigh';

const OUT = 'reports/r0098/screenshots';
const HOME_WEDGE_LABELS = ['Start Here', 'Tutorials', 'Controls', 'My Lists', 'Master List', 'Locations', 'Settings'];

type Box = {
  top: number;
  bottom: number;
  left: number;
  right: number;
  width: number;
  height: number;
};

type WedgeMetric = {
  label: string;
  row: Box;
  wedge: Box;
  separator: number;
  iconCenter: { x: number; y: number } | null;
  weightRight: number | null;
};

function gapBetween(rows: Array<{ row: Box }>) {
  return rows.length > 1 ? rows[1].row.top - rows[0].row.bottom : null;
}

async function measure(page: import('@playwright/test').Page) {
  return page.evaluate((labels) => {
    const getBox = (el: Element) => {
      const r = (el as HTMLElement).getBoundingClientRect();
      return {
        top: r.top, bottom: r.bottom, left: r.left, right: r.right,
        width: r.width, height: r.height,
      };
    };
    const getCenter = (el: Element | null) => {
      if (!el) return null;
      const r = (el as HTMLElement).getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    };

    const source = Array.from(document.querySelectorAll<HTMLElement>('[data-cat]'))
      .map(row => {
        const wedge = row.querySelector<HTMLElement>('[data-testid^="cat-header-"] > button');
        const weight = row.querySelector<HTMLElement>('[data-testid^="cat-weight-"]');
        const style = getComputedStyle(row);
        return {
          label: row.dataset.cat ?? '',
          row: getBox(row),
          wedge: wedge ? getBox(wedge) : getBox(row),
          separator: parseFloat(style.borderBottomWidth) || 0,
          iconCenter: getCenter(wedge?.querySelector('svg') ?? null),
          weightRight: weight ? getBox(weight).right : null,
        };
      });

    const target = labels.map(label => {
      const button = document.querySelector<HTMLElement>(
        `[data-testid="home-content-scroll"] button[aria-label^="${label}"]`,
      );
      const row = button?.parentElement;
      return {
        label,
        row: row ? getBox(row) : null,
        wedge: button ? getBox(button.querySelector<HTMLElement>('div') ?? button) : null,
        separator: row ? parseFloat(getComputedStyle(row).borderBottomWidth) || 0 : 0,
        iconCenter: getCenter(button?.querySelector('svg') ?? null),
        weightRight: null,
      };
    });

    return { source, target };
  }, HOME_WEDGE_LABELS) as {
    source: WedgeMetric[];
    target: Array<WedgeMetric | { label: string; row: null; wedge: null; separator: number }>;
  };
}

for (const viewport of [
  { width: 402, height: 714 },
  { width: 402, height: 754 },
  { width: 390, height: 844 },
  { width: 360, height: 800 },
]) {
  test(`R0098 matches the List wedge rhythm at ${viewport.width}×${viewport.height}`, async ({ page, errors }) => {
    await page.setViewportSize(viewport);
    await gotoDemo(page);

    const list = await measure(page);
    const source = list.source;
    const sourceGap = source[1].wedge.top - source[0].wedge.bottom;
    const sourceRowGap = gapBetween(source);
    const sourceWeightRight = source[0].weightRight;

    expect(source.length).toBeGreaterThanOrEqual(2);
    expect(sourceRowGap, 'List rows remain flush; their divider creates the visible gap').toBe(0);
    expect(sourceGap, 'List wedge visible gap is the source of truth').toBe(1);
    expect(source[0].row.height, 'protected category row height').toBe(65);
    expect(source[0].wedge.width, 'protected List wedge width').toBe(72);
    expect(source[0].wedge.left, 'protected List wedge left edge').toBe(0);
    expect(sourceWeightRight, 'protected category weight right edge').toBe(viewport.width - 44);

    if (viewport.width === 402 && viewport.height === 714) {
      await page.screenshot({ path: `${OUT}/02-source-list-wedges-402x714.png`, fullPage: false });
    }

    await page.getByTestId('hamburger-btn').click();
    await page.getByTestId('drawer-nav-home').click();
    await expect(page.getByTestId('home-screen')).toBeVisible();
    const home = await measure(page);
    const target = home.target.filter((item): item is WedgeMetric => item.row !== null && item.wedge !== null);
    const targetGap = target[1].wedge.top - target[0].wedge.bottom;

    expect(target.length).toBe(HOME_WEDGE_LABELS.length);
    expect(targetGap, 'target Home wedge gap matches the measured List wedge gap').toBe(sourceGap);
    expect(gapBetween(target), 'target row gap matches the List wedge rhythm').toBe(sourceGap);
    for (const wedge of target) {
      expect(wedge.row.height, `Home row height remains unchanged for ${wedge.label}`).toBe(68);
      expect(wedge.wedge.width, `Home wedge width remains unchanged for ${wedge.label}`).toBe(72);
      expect(wedge.wedge.left, `Home wedge left edge remains unchanged for ${wedge.label}`).toBe(12);
      expect(wedge.iconCenter, `Home icon remains present for ${wedge.label}`).not.toBeNull();
      // The existing 8.5px right padding visually balances the chevron point.
      // Preserve its measured local icon centre; R0098 changes spacing only.
      expect(wedge.iconCenter!.x - wedge.wedge.left, `Home icon placement remains unchanged for ${wedge.label}`).toBeCloseTo(31.75, 2);
      expect(wedge.iconCenter!.y - wedge.wedge.top, `Home icon stays vertically centred for ${wedge.label}`).toBeCloseTo(34, 1);
    }
    const overflow = await page.evaluate(() => ({
      rootWidth: (document.querySelector('.tw-v3-root') as HTMLElement).getBoundingClientRect().width,
      documentWidth: document.documentElement.scrollWidth,
      homeScrolls: (document.querySelector('[data-testid="home-content-scroll"]') as HTMLElement).scrollHeight
        > (document.querySelector('[data-testid="home-content-scroll"]') as HTMLElement).clientHeight,
    }));
    expect(overflow.rootWidth).toBe(viewport.width);
    expect(overflow.documentWidth).toBe(viewport.width);
    expect(overflow.homeScrolls).toBe(true);

    if (viewport.width === 402 && viewport.height === 714) {
      await page.screenshot({ path: `${OUT}/03-target-wedges-after-402x714.png`, fullPage: false });
      await page.getByTestId('home-content-scroll').evaluate((el: HTMLElement) => { el.scrollTop = 320; });
      await page.waitForTimeout(80);
      await page.screenshot({ path: `${OUT}/04-target-wedges-closeup-scroll-402x714.png`, fullPage: false });
    }

    console.log(`R0098_AFTER_METRICS ${JSON.stringify({
      viewport,
      sourceGap,
      sourceRowGap,
      source,
      target,
      targetGap,
      rootWidth: overflow.rootWidth,
      documentWidth: overflow.documentWidth,
    })}`);
    expectClean(errors);
  });
}