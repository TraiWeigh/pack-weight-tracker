/**
 * footer022A.test.mjs — Prompt 022A Checklist Footer Regression Tests
 *
 * Protects:
 *   • Checklist.tsx imports and renders Footer
 *   • Checklist uses full footer (not informationalOnly)
 *   • Footer is inside a scroll container (h-[100dvh] overflow-y-auto)
 *   • The existing screen-content div keeps h-[100dvh] overflow-hidden flex flex-col
 *   • Footer is NOT fixed or sticky in Checklist
 *   • Footer component is NOT duplicated (still one file)
 *   • SharedChecklistPage still uses informationalOnly (unchanged)
 *   • 021P sidebar inner div invariant (pb-8, no py-2)
 *   • 021O toolbar-group pt-4 invariant
 *   • 021N lg:grid-cols-[1fr_365px] sidebar width
 */

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve('artifacts/pack-checklist/src');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

let passed = 0;
let failed = 0;

function test(label, fn) {
  try {
    fn();
    console.log(`  ✓ ${label}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${label}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

const checklistSrc = read('pages/Checklist.tsx');
const sharedSrc    = read('pages/SharedChecklistPage.tsx');
const footerSrc    = read('components/Footer.tsx');

// ── Footer presence in Checklist ─────────────────────────────────────────────
console.log('\n022A Checklist Footer Presence:');

test('Checklist.tsx imports Footer component', () => {
  assert.ok(
    checklistSrc.includes("import Footer") && checklistSrc.includes("Footer"),
    'Footer not imported in Checklist.tsx',
  );
});

test('Checklist.tsx renders <Footer />', () => {
  assert.ok(
    checklistSrc.includes('<Footer') || checklistSrc.includes('<Footer/>'),
    'Checklist.tsx must render <Footer />',
  );
});

test('Checklist.tsx uses full footer (not informationalOnly)', () => {
  // The full footer renders without informationalOnly prop.
  // Check that the Footer usage in Checklist does NOT have informationalOnly.
  // We look for <Footer immediately NOT followed by "informationalOnly".
  const footerUsages = [...checklistSrc.matchAll(/<Footer[^>]*/g)];
  assert.ok(footerUsages.length > 0, 'No <Footer usage found in Checklist.tsx');
  const hasInfoOnly = footerUsages.some(m => m[0].includes('informationalOnly'));
  assert.ok(!hasInfoOnly, 'Checklist must use full footer, not informationalOnly');
});

// ── Scroll container architecture ────────────────────────────────────────────
console.log('\n022A Scroll Container Architecture:');

test('Checklist.tsx has a scroll container with overflow-y-auto', () => {
  assert.ok(
    checklistSrc.includes('overflow-y-auto'),
    'Missing overflow-y-auto scroll container in Checklist.tsx',
  );
});

test('Scroll container is h-[100dvh] (full viewport height)', () => {
  // The scroll wrapper must be h-[100dvh] to fill viewport while allowing scroll
  const matches = checklistSrc.match(/h-\[100dvh\]/g) || [];
  // Should appear at least twice: once on the scroll wrapper, once on the screen-content div
  assert.ok(matches.length >= 2, 'Expected at least 2 h-[100dvh] occurrences (wrapper + screen div)');
});

test('Original screen-content div still has overflow-hidden', () => {
  // The existing screen div must keep overflow-hidden for internal column scroll
  assert.ok(
    checklistSrc.includes('overflow-hidden flex flex-col'),
    'screen-content div must keep overflow-hidden flex flex-col',
  );
});

test('Original screen-content div still fills the viewport (min-h-[100dvh] on mobile, h-[100dvh] on desktop)', () => {
  // 022U fix: mobile uses min-h-[100dvh] so content is not clipped; desktop keeps lg:h-[100dvh].
  // We accept the responsive variant — both min-h-[100dvh] and lg:h-[100dvh] must be present.
  assert.ok(
    checklistSrc.includes('min-h-[100dvh]') && checklistSrc.includes('lg:h-[100dvh]'),
    'screen-content div must use min-h-[100dvh] on mobile + lg:h-[100dvh] on desktop (022U fix)',
  );
});

// ── Footer NOT fixed or sticky ────────────────────────────────────────────────
console.log('\n022A Footer Not Fixed/Sticky:');

test('Footer component does not use position:fixed', () => {
  assert.ok(!footerSrc.includes('fixed'), 'Footer must not use fixed positioning');
});

test('Footer component does not use position:sticky', () => {
  assert.ok(!footerSrc.includes('sticky'), 'Footer must not use sticky positioning');
});

test('Checklist.tsx does not add fixed/sticky to Footer wrapper', () => {
  // Check no wrapper around Footer in Checklist uses fixed or sticky
  const footerIdx = checklistSrc.lastIndexOf('<Footer');
  const surrounding = checklistSrc.slice(Math.max(0, footerIdx - 200), footerIdx + 50);
  assert.ok(
    !surrounding.includes('position: fixed') && !surrounding.includes('fixed'),
    'Footer wrapper in Checklist must not be fixed',
  );
  assert.ok(
    !surrounding.includes('position: sticky') && !surrounding.includes('sticky'),
    'Footer wrapper in Checklist must not be sticky',
  );
});

// ── Component not duplicated ─────────────────────────────────────────────────
console.log('\n022A No Footer Duplication:');

test('Only one Footer.tsx component file exists', () => {
  const footerPath = path.join(root, 'components/Footer.tsx');
  assert.ok(fs.existsSync(footerPath), 'Footer.tsx does not exist at expected path');
  // No duplicate at pages level
  const altPath = path.join(root, 'pages/Footer.tsx');
  assert.ok(!fs.existsSync(altPath), 'Duplicate Footer.tsx found in pages/');
});

test('Footer component still exports default function Footer', () => {
  assert.ok(footerSrc.includes('export default function Footer'), 'Footer.tsx default export missing');
});

// ── Shared view unchanged ────────────────────────────────────────────────────
console.log('\n022A Shared View Unchanged:');

test('SharedChecklistPage still imports Footer', () => {
  assert.ok(sharedSrc.includes("import Footer"), 'Footer import missing from SharedChecklistPage');
});

test('SharedChecklistPage still uses informationalOnly', () => {
  assert.ok(sharedSrc.includes('informationalOnly'), 'SharedChecklistPage must still use informationalOnly');
});

test('SharedChecklistPage does not render full-footer (no bare <Footer />)', () => {
  // All Footer usages in shared page should have informationalOnly
  const usages = [...sharedSrc.matchAll(/<Footer[^/]*/g)];
  const fullFooterUsages = usages.filter(m => !m[0].includes('informationalOnly'));
  assert.strictEqual(fullFooterUsages.length, 0, 'SharedChecklistPage has a Footer usage without informationalOnly');
});

// ── 021P / 021O / 021N layout invariants ─────────────────────────────────────
console.log('\n022A Layout Invariants (021P/O/N):');

test('021P: sidebar inner div has pb-8 without py-2', () => {
  // 023C: inner div now uses responsive gap (gap-5 lg:gap-4) — accept either variant.
  const hasPb8 = checklistSrc.includes('flex flex-col gap-4 pb-8') ||
                 checklistSrc.includes('flex flex-col gap-5 lg:gap-4 pb-8') ||
                 checklistSrc.includes('flex flex-col gap-6 lg:gap-4 pb-8');
  const hasBadPy = checklistSrc.includes('py-2 pb-8');
  assert.ok(hasPb8, '021P regression: sidebar inner div must have flex flex-col … pb-8 (gap may carry 023C responsive prefix)');
  assert.ok(!hasBadPy, '021P regression: py-2 pb-8 re-introduced');
});

test('021O: toolbar-group parent has pt-4', () => {
  assert.ok(
    checklistSrc.includes('pt-4 grid grid-cols-1 lg:grid-cols-[1fr_365px]'),
    '021O regression: toolbar-group pt-4 missing',
  );
});

test('021N: sidebar width is lg:grid-cols-[1fr_365px]', () => {
  assert.ok(
    checklistSrc.includes('lg:grid-cols-[1fr_365px]'),
    '021N regression: sidebar width 365px missing',
  );
});

test('021K: categories scroll has lg:pr-3 lg:[scrollbar-gutter:stable]', () => {
  assert.ok(
    checklistSrc.includes('lg:pr-3') && checklistSrc.includes('scrollbar-gutter:stable'),
    '021K regression: categories scroll gutter missing',
  );
});

test('main has flex-1 min-h-0 lg:flex lg:flex-col (content fills space)', () => {
  assert.ok(
    checklistSrc.includes('flex-1 min-h-0 lg:flex lg:flex-col') ||
    checklistSrc.includes('flex-1 min-h-0') && checklistSrc.includes('lg:flex lg:flex-col'),
    'main flex-1 min-h-0 removed — checklist content area broken',
  );
});

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n022A Checklist Footer: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
