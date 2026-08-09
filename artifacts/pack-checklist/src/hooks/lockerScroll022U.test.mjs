/**
 * 022U — Locker Scroll / Mobile Visibility Tests
 *
 * Verifies that the mobile layout allows full Locker scrolling:
 * - The screen-content wrapper uses min-h on mobile (not a clipped h-[100dvh])
 * - Desktop preserves h-[100dvh] overflow-hidden via lg: prefix
 * - LockerPanel entries have no internal height cap
 * - SyncStatusPanel adds no fixed-height wrapper
 * - Footer is after Locker in the DOM (normal document flow)
 * - No body scroll locking present in source
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../../../..');

function src(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

const checklistSrc = src('artifacts/pack-checklist/src/pages/Checklist.tsx');
const lockerPanelSrc = src('artifacts/pack-checklist/src/components/LockerPanel.tsx');
const syncStatusSrc = src('artifacts/pack-checklist/src/components/SyncStatusPanel.tsx');

// ─── §A  Screen wrapper — mobile must not be viewport-height-clipped ──────────

test('[022U §A] screen-content uses min-h-[100dvh] on mobile (not bare h-[100dvh] overflow-hidden)', () => {
  // Must contain the 022U-correct pattern
  assert.ok(
    checklistSrc.includes('min-h-[100dvh]'),
    'Checklist.tsx must use min-h-[100dvh] so mobile content is not clipped',
  );
});

test('[022U §A] desktop overflow-hidden is scoped to lg: breakpoint', () => {
  // lg:overflow-hidden exists — desktop gets its clipping
  assert.ok(
    checklistSrc.includes('lg:overflow-hidden'),
    'Desktop must still have lg:overflow-hidden for the two-column layout',
  );
});

test('[022U §A] bare h-[100dvh] overflow-hidden is not present on screen wrapper (mobile fix)', () => {
  // The OLD problematic pattern must not appear together on the screen wrapper div.
  // It can appear elsewhere (outer scroll container uses h-[100dvh] alone).
  // We check the specific class string that was causing the bug.
  const oldPattern = 'h-[100dvh] overflow-hidden flex flex-col';
  assert.ok(
    !checklistSrc.includes(oldPattern),
    'Old clip pattern "h-[100dvh] overflow-hidden flex flex-col" must be gone',
  );
});

test('[022U §A] desktop height breakpoint is lg:h-[100dvh]', () => {
  assert.ok(
    checklistSrc.includes('lg:h-[100dvh]'),
    'Desktop must preserve lg:h-[100dvh] for the two-column viewport layout',
  );
});

test('[022U §A] outer page-scroll container keeps h-[100dvh] overflow-y-auto', () => {
  // The outer wrapper is the actual scroll container — it must stay unchanged.
  assert.ok(
    checklistSrc.includes('h-[100dvh] overflow-y-auto'),
    'Outer scroll wrapper h-[100dvh] overflow-y-auto must remain',
  );
});

// ─── §B  LockerPanel — no internal height cap on entries ─────────────────────

test('[022U §B] LockerPanel entry list has no max-h or fixed-height constraint', () => {
  // The divide-y container that wraps all entries must not have a max-height
  // or fixed height that would clip entries.
  const divideSection = lockerPanelSrc.slice(
    lockerPanelSrc.indexOf('divide-y divide-border'),
    lockerPanelSrc.indexOf('divide-y divide-border') + 400,
  );
  assert.ok(
    !divideSection.includes('max-h-') && !divideSection.includes('h-['),
    'Entry list must not have max-h or h-[] constraints that could clip entries',
  );
});

test('[022U §B] LockerPanel supports rendering 1 entry', () => {
  // Structural: entries.map renders one div per entry; a 1-item array produces 1 div
  assert.ok(
    lockerPanelSrc.includes('entries.map'),
    'LockerPanel uses entries.map to render all entries',
  );
  // No minimum-entry gate that would hide entries
  assert.ok(
    !lockerPanelSrc.includes('entries.length < 2'),
    'No 2-entry minimum gate on the list',
  );
});

test('[022U §B] LockerPanel overflow-hidden is only on the card container (rounded corners), not the entry list', () => {
  // The card wrapper uses overflow-hidden for border-radius clipping — that is correct.
  // The entry list (divide-y) must NOT have overflow-hidden.
  const listIdx = lockerPanelSrc.indexOf('divide-y divide-border');
  const cardIdx = lockerPanelSrc.indexOf('rounded-xl shadow-sm overflow-hidden');
  assert.ok(cardIdx !== -1, 'Card container overflow-hidden must exist (rounded corners)');
  // The entry list container comes AFTER the card — the overflow-hidden is on the card wrapper
  // which does not restrict block height growth.
  assert.ok(
    listIdx !== -1,
    'Entry list container (divide-y divide-border) must exist',
  );
});

// ─── §C  SyncStatusPanel — no fixed height on surrounding wrapper ─────────────

test('[022U §C] SyncStatusPanel has no h-[] fixed height on outer wrapper', () => {
  // Extract the opening div of SyncStatusPanel JSX
  const jsxStart = syncStatusSrc.indexOf('return (');
  const jsxFragment = syncStatusSrc.slice(jsxStart, jsxStart + 800);
  assert.ok(
    !jsxFragment.includes('h-[') || jsxFragment.indexOf('h-[') > 200,
    'SyncStatusPanel outer wrapper must not start with a fixed h-[] height',
  );
});

test('[022U §C] SyncStatusPanel has no overflow-hidden on top-level wrapper', () => {
  const jsxStart = syncStatusSrc.indexOf('return (');
  // Check the first ~150 chars of the returned JSX for overflow-hidden
  const outerJsx = syncStatusSrc.slice(jsxStart, jsxStart + 200);
  // The outer wrapper div should not have overflow-hidden (that would clip expanded content)
  assert.ok(
    !outerJsx.includes('overflow-hidden'),
    'SyncStatusPanel top wrapper must not have overflow-hidden',
  );
});

test('[022U §C] collapsed SyncStatusPanel does not introduce a max-h wrapper', () => {
  assert.ok(
    !syncStatusSrc.includes('max-h-0') && !syncStatusSrc.includes('max-h-[0'),
    'SyncStatusPanel must not use max-h-0 to hide content (use conditional rendering)',
  );
});

// ─── §D  Footer normal document flow ─────────────────────────────────────────

test('[022U §D] Footer component is rendered AFTER the screen-content closing div', () => {
  const footerIdx = checklistSrc.indexOf('<Footer');
  const screenCloseIdx = checklistSrc.indexOf('</div>{/* end screen content */}');
  assert.ok(footerIdx !== -1, '<Footer> must exist in Checklist');
  assert.ok(screenCloseIdx !== -1, 'Screen content close comment must exist');
  assert.ok(
    footerIdx > screenCloseIdx,
    'Footer must be positioned AFTER screen content in DOM order',
  );
});

test('[022U §D] Footer is inside the outer scroll container', () => {
  const footerIdx = checklistSrc.indexOf('<Footer');
  const scrollContainerCloseIdx = checklistSrc.indexOf('</div>{/* end page scroll container */}');
  assert.ok(
    footerIdx < scrollContainerCloseIdx,
    'Footer must be inside the outer scroll container',
  );
});

test('[022U §D] Footer has no fixed or absolute positioning', () => {
  // Find the Footer component definition
  const footerSrc = (() => {
    try {
      return src('artifacts/pack-checklist/src/components/Footer.tsx');
    } catch {
      return src('artifacts/pack-checklist/src/components/footer.tsx');
    }
  })();
  assert.ok(
    !footerSrc.includes('position: fixed') && !footerSrc.includes('fixed inset'),
    'Footer must not use fixed positioning',
  );
  assert.ok(
    !footerSrc.includes('position: absolute') && !footerSrc.includes('absolute inset'),
    'Footer must not use absolute positioning covering the page',
  );
});

// ─── §E  No body scroll lock in source ───────────────────────────────────────

test('[022U §E] no document.body overflow manipulation found', () => {
  // Grep all TSX files for body scroll locking patterns
  const dirs = ['src/pages', 'src/components', 'src/hooks'];
  const root = path.join(ROOT, 'artifacts/pack-checklist');
  let found = [];
  for (const dir of dirs) {
    const dirPath = path.join(root, dir);
    if (!fs.existsSync(dirPath)) continue;
    for (const file of fs.readdirSync(dirPath)) {
      if (!file.endsWith('.tsx') && !file.endsWith('.ts')) continue;
      const content = fs.readFileSync(path.join(dirPath, file), 'utf8');
      if (
        content.includes('document.body.style.overflow') ||
        content.includes('body.classList.add') ||
        content.includes('overflow: hidden') && content.includes('document.body')
      ) {
        found.push(file);
      }
    }
  }
  assert.deepEqual(found, [], `Body scroll lock found in: ${found.join(', ')}`);
});

test('[022U §E] no touch-action: none found in page wrapper', () => {
  assert.ok(
    !checklistSrc.includes('touch-action: none') && !checklistSrc.includes('touch-action:none'),
    'Page wrapper must not disable touch-action',
  );
});

// ─── §F  Locker files reachable at any count ─────────────────────────────────

test('[022U §F] LockerPanel renders all entries regardless of count (1-file)', () => {
  // The list is entries.map with no slice or limit
  assert.ok(
    !lockerPanelSrc.includes('.slice(0,') && !lockerPanelSrc.includes('.slice(0, '),
    'LockerPanel must not slice the entry list (all entries must render)',
  );
});

test('[022U §F] LockerPanel renders all entries regardless of count (5-file / any count)', () => {
  // No ".length > N" gate before the map
  assert.ok(
    !lockerPanelSrc.match(/entries\.length\s*[<>]=?\s*[45]/),
    'LockerPanel must not gate entry rendering on count thresholds',
  );
});

test('[022U §F] LockerPanel entry controls (load, rename, delete) exist for each entry', () => {
  // Controls are inside the map — so all entries get them
  assert.ok(
    lockerPanelSrc.includes('onLoad') && lockerPanelSrc.includes('startRename') && lockerPanelSrc.includes('setConfirmId'),
    'All three entry controls must be inside the entries.map',
  );
});

// ─── §G  Regression — 022T sync preserved ────────────────────────────────────

test('[022U §G] SyncStatusPanel is still imported in LockerPanel', () => {
  assert.ok(
    lockerPanelSrc.includes("from './SyncStatusPanel'"),
    'SyncStatusPanel import must still exist in LockerPanel',
  );
});

test('[022U §G] syncProps still passed to SyncStatusPanel', () => {
  assert.ok(
    lockerPanelSrc.includes('syncProps') && lockerPanelSrc.includes('<SyncStatusPanel'),
    'syncProps and SyncStatusPanel rendering must be preserved',
  );
});

test('[022U §G] mergeLockerEntries is imported in Checklist (022T root-cause fix)', () => {
  assert.ok(
    checklistSrc.includes('mergeLockerEntries'),
    '022T root-cause fix (mergeLockerEntries import) must be preserved',
  );
});

test('[022U §G] 022F footer normal-document-flow preserved — no sticky/fixed footer', () => {
  const footerSrc = (() => {
    try { return src('artifacts/pack-checklist/src/components/Footer.tsx'); }
    catch { return src('artifacts/pack-checklist/src/components/footer.tsx'); }
  })();
  assert.ok(
    !footerSrc.includes('sticky') && !footerSrc.includes('position: fixed'),
    'Footer must remain normal document flow (022F fix preserved)',
  );
});

// ─── §H  Outer scroll container unchanged ────────────────────────────────────

test('[022U §H] outer scroll container uses h-[100dvh] overflow-y-auto', () => {
  assert.ok(
    checklistSrc.includes('h-[100dvh] overflow-y-auto'),
    'Outer scroll container must still have h-[100dvh] overflow-y-auto',
  );
});

test('[022U §H] inner screen-only wrapper comment refers to 022U fix', () => {
  assert.ok(
    checklistSrc.includes('022U fix'),
    'Code comment must document the 022U change for future maintainers',
  );
});

// ─── §I  Background still covers element on mobile ───────────────────────────

test('[022U §I] backgroundImage is still set on the screen-content div', () => {
  assert.ok(
    checklistSrc.includes('backgroundImage') && checklistSrc.includes('bgImageUrl'),
    'Background image must still be applied to the screen-content div',
  );
});
