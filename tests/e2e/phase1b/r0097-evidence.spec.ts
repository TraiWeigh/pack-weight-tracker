/**
 * R0097 evidence capture — fixed 402px screenshots and browser geometry for the
 * report. The 20px top inset is a controlled Safari-safe-area simulation; it does
 * not claim to replace physical iPhone acceptance.
 */
import { test, expect, gotoDemo, addCategory } from '../helpers/trailweigh';

const OUT = 'reports/r0097/screenshots';

function snapshot() {
  const rect = (selector: string) => {
    const el = document.querySelector(selector) as HTMLElement | null;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, height: r.height };
  };
  const main = document.querySelector('[data-testid="main-scroll"]') as HTMLElement;
  return {
    root: rect('.tw-v3-root'),
    appBar: rect('[data-testid="app-bar"]'),
    summary: rect('[data-testid="list-summary-bar"]'),
    filter: rect('[data-testid="filter-bar"]'),
    main: {
      ...rect('[data-testid="main-scroll"]'),
      scrollTop: main.scrollTop,
      scrollHeight: main.scrollHeight,
      clientHeight: main.clientHeight,
    },
    footer: rect('[data-testid="bottom-nav"]'),
    document: {
      windowScrollY: window.scrollY,
      documentScrollTop: document.documentElement.scrollTop,
      bodyScrollTop: document.body.scrollTop,
      documentScrollWidth: document.documentElement.scrollWidth,
    },
    weightRight: (document.querySelector('[data-testid^="cat-weight-"]') as HTMLElement).getBoundingClientRect().right,
  };
}

test('captures R0097 safe-area evidence at 402×714', async ({ page }) => {
  await page.setViewportSize({ width: 402, height: 714 });
  await gotoDemo(page);
  await page.addStyleTag({ content: '.tw-v3-root{--tw-safe-top:20px !important}' });
  await page.waitForTimeout(80);

  const topStack = await page.evaluate(snapshot);
  await page.screenshot({ path: `${OUT}/01-top-stack-safe-area-402x714.png`, fullPage: false });

  for (const suffix of ['A', 'B', 'C', 'D', 'E', 'F', 'G']) await addCategory(page, `R0097 Evidence ${suffix}`);
  await page.evaluate(() => {
    const main = document.querySelector('[data-testid="main-scroll"]') as HTMLElement;
    main.scrollTop = Math.max(0, (main.scrollHeight - main.clientHeight) * 0.55);
    main.dispatchEvent(new Event('scroll', { bubbles: true }));
  });
  await page.waitForTimeout(100);
  const midScroll = await page.evaluate(snapshot);
  await page.screenshot({ path: `${OUT}/02-mid-scroll-safe-area-402x714.png`, fullPage: false });

  await page.evaluate(() => {
    const main = document.querySelector('[data-testid="main-scroll"]') as HTMLElement;
    main.scrollTop = main.scrollHeight - main.clientHeight;
    main.dispatchEvent(new Event('scroll', { bubbles: true }));
  });
  await page.waitForTimeout(100);
  const bottom = await page.evaluate(snapshot);
  await page.screenshot({ path: `${OUT}/03-bottom-list-safe-area-402x714.png`, fullPage: false });

  await page.getByTestId('hamburger-btn').click();
  await expect(page.getByTestId('nav-drawer')).toHaveAttribute('data-open', 'true');
  const drawer = await page.evaluate(snapshot);
  await page.screenshot({ path: `${OUT}/04-hamburger-safe-area-402x714.png`, fullPage: false });

  await page.getByTestId('drawer-nav-home').click();
  await expect(page.getByTestId('home-screen')).toBeVisible();
  const home = await page.evaluate(() => {
    const content = document.querySelector('[data-testid="home-content-scroll"]') as HTMLElement;
    content.scrollTop = Math.min(180, content.scrollHeight - content.clientHeight);
    return {
      home: (() => {
        const r = (document.querySelector('[data-testid="home-screen"]') as HTMLElement).getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, height: r.height };
      })(),
      contentScrollTop: content.scrollTop,
      contentScrollHeight: content.scrollHeight,
      contentClientHeight: content.clientHeight,
      windowScrollY: window.scrollY,
      documentScrollTop: document.documentElement.scrollTop,
    };
  });
  await page.screenshot({ path: `${OUT}/05-home-safe-area-402x714.png`, fullPage: false });

  console.log(`R0097_METRICS ${JSON.stringify({ topStack, midScroll, bottom, drawer, home })}`);
});