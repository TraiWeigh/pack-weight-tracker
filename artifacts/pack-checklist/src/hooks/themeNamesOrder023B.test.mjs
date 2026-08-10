/**
 * PROMPT 023B — Part A: Theme Names & Order
 * Updated by PROMPT 023D: TOPO_PRESETS was a 023B built-in that is now removed
 * (user's Topo is a custom collection, not a built-in theme).
 *
 * Tests 01–05, 07, 10, 12, 13, 15 are updated to reflect the 023D state.
 * Tests 06, 08, 09, 11, 14 are unchanged.
 *
 * Verifies (023D state):
 *  1. TOPO_PRESETS is NOT exported as a built-in (removed by 023D)
 *  2. No hardcoded topo- preset IDs in the source (removed by 023D)
 *  3. PRESETS still exported with id/label/photoId (Landscape still works)
 *  4. No cross-preset overlap within PRESETS itself (no duplicate photoIds)
 *  5. PRESETS entry IDs do not start with 'topo-' (user's custom theme, not built-in)
 *  6. dropdownLabel returns 'Landscape' (not 'Landscapes') for landscapes tab
 *  7. dropdownLabel does NOT have a branch for 'topo' (023D removal)
 *  8. No 'Theme ' prefix in dropdownLabel for custom theme
 *  9. Dropdown renders a 'Landscape' button (not 'Landscapes')
 * 10. Dropdown does NOT have a hardcoded 'Topo' or 'Topo 1' button (023D removal)
 * 11. Custom theme dropdown option shows col.name without 'Theme ' prefix
 * 12. BUILT_IN_IDS does NOT include 'topo' (023D — only 'landscapes' is built-in)
 * 13. No conditional panel for 'topo' built-in (023D removal)
 * 14. New-theme input placeholder is 'Name…', not 'Theme name…'
 * 15. Thumbnail loading guard does NOT check for 'topo' (023D removal)
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const BG_PATH = resolve(
  'artifacts/pack-checklist/src/components/BackgroundPicker.tsx',
);
const src = readFileSync(BG_PATH, 'utf-8');

// ─── helpers ────────────────────────────────────────────────────────────────
const has = (pattern) => (typeof pattern === 'string' ? src.includes(pattern) : pattern.test(src));
const hasNot = (pattern) => !has(pattern);

// ─── 1. TOPO_PRESETS is NOT exported as a built-in (023D removal) ───────────
test('023B-A-01: TOPO_PRESETS is NOT exported as a built-in (023D removed)', () => {
  assert.ok(hasNot('export const TOPO_PRESETS'), 'TOPO_PRESETS must NOT be exported (removed by 023D)');
});

// ─── 2. No hardcoded topo- preset IDs in source ─────────────────────────────
test('023B-A-02: No hardcoded topo- preset IDs in BackgroundPicker (023D removed)', () => {
  // Built-in preset IDs like 'topo-ridge' should not exist;
  // user's custom Topo theme lives in localStorage, not in source
  assert.ok(
    hasNot("{ id: 'topo-ridge'") && hasNot("{ id: 'topo-aerial'"),
    'Hardcoded topo- preset objects must not exist (removed by 023D)'
  );
});

// ─── 3. PRESETS still exported with id/label/photoId ─────────────────────────
test('023B-A-03: PRESETS (Landscape) exported with id, label, photoId', () => {
  const block = src.match(/^export const PRESETS\s*=\s*\[([\s\S]*?)\];/m)?.[1] ?? '';
  assert.ok(block.includes('id:'),      'PRESETS entries should have id');
  assert.ok(block.includes('label:'),   'PRESETS entries should have label');
  assert.ok(block.includes('photoId:'), 'PRESETS entries should have photoId');
});

// ─── 4. PRESETS photoIds have no duplicates ──────────────────────────────────
test('023B-A-04: PRESETS photoIds have no duplicates', () => {
  const block = src.match(/^export const PRESETS\s*=\s*\[([\s\S]*?)\];/m)?.[1] ?? '';
  const ids = [...block.matchAll(/photoId:\s*'([^']+)'/g)].map(m => m[1]);
  const seen = new Set();
  for (const id of ids) {
    assert.ok(!seen.has(id), `Duplicate photoId '${id}' in PRESETS`);
    seen.add(id);
  }
});

// ─── 5. PRESETS IDs do not start with 'topo-' (sanity check) ────────────────
test('023B-A-05: PRESETS entry ids do not start with topo- (user custom theme, not built-in)', () => {
  const block = src.match(/^export const PRESETS\s*=\s*\[([\s\S]*?)\];/m)?.[1] ?? '';
  const ids = [...block.matchAll(/id:\s*'([^']+)'/g)].map(m => m[1]);
  for (const id of ids) {
    assert.ok(!id.startsWith('topo-'), `PRESETS id '${id}' should not start with 'topo-'`);
  }
});

// ─── 6. dropdownLabel returns 'Landscape' for landscapes tab ─────────────────
test('023B-A-06: dropdownLabel returns Landscape (not Landscapes) for landscapes tab', () => {
  assert.ok(has("return 'Landscape'"), "dropdownLabel should return 'Landscape'");
  assert.ok(hasNot("return 'Landscapes'"), "dropdownLabel must not return 'Landscapes'");
});

// ─── 7. dropdownLabel does NOT have a topo branch (023D removal) ─────────────
test('023B-A-07: dropdownLabel does NOT have a topo branch (023D removed built-in)', () => {
  assert.ok(
    hasNot("return 'Topo 1'") && hasNot("return 'Topo'"),
    "dropdownLabel must NOT return 'Topo 1' or 'Topo' (023D removed the topo built-in)"
  );
});

// ─── 8. No 'Theme ' prefix in dropdownLabel for custom theme ─────────────────
test('023B-A-08: dropdownLabel uses col.name without Theme prefix', () => {
  assert.ok(hasNot('return `Theme ${col.name}`'), 'dropdownLabel must not prepend "Theme "');
  assert.ok(has('if (col) return col.name'), "dropdownLabel should return col.name directly");
});

// ─── 9. Dropdown renders 'Landscape' button (not 'Landscapes') ───────────────
test('023B-A-09: dropdown option button shows Landscape not Landscapes', () => {
  assert.ok(has('>Landscape</button>'), "Dropdown button text should be 'Landscape'");
  assert.ok(hasNot('>Landscapes</button>'), "Dropdown button text must not be 'Landscapes'");
});

// ─── 10. Dropdown does NOT have a hardcoded Topo or Topo 1 button (023D) ─────
test('023B-A-10: dropdown does NOT have a hardcoded Topo or Topo 1 button (023D removed)', () => {
  assert.ok(hasNot('>Topo 1</button>'), "Dropdown must NOT have a hardcoded 'Topo 1' button (removed by 023D)");
  assert.ok(hasNot('>Topo</button>'),   "Dropdown must NOT have a hardcoded 'Topo' button (removed by 023D)");
});

// ─── 11. Custom theme dropdown option shows col.name without 'Theme ' ─────────
test('023B-A-11: custom theme dropdown option has no Theme prefix', () => {
  assert.ok(hasNot('>Theme {col.name}</button>'), 'Custom theme dropdown option must not say "Theme {col.name}"');
  assert.ok(has('>{col.name}</button>'), 'Custom theme dropdown option should show col.name directly');
});

// ─── 12. BUILT_IN_IDS does NOT include 'topo' (023D) ─────────────────────────
test('023B-A-12: BUILT_IN_IDS does NOT include topo (023D removed topo built-in)', () => {
  assert.ok(
    hasNot("'topo'"),
    "Source must not contain 'topo' as a built-in reference (removed by 023D)"
  );
});

// ─── 13. No conditional panel for topo built-in (023D removal) ───────────────
test('023B-A-13: no topo built-in panel in render (023D removed)', () => {
  assert.ok(
    hasNot("activeThemeId === 'topo'"),
    "Render must not have a conditional panel for 'topo' built-in (removed by 023D)"
  );
});

// ─── 14. New-theme input placeholder ─────────────────────────────────────────
test('023B-A-14: new-theme input placeholder is Name… not Theme name…', () => {
  assert.ok(has('placeholder="Name…"'), 'Placeholder should be "Name…"');
  assert.ok(hasNot('placeholder="Theme name…"'), 'Old placeholder "Theme name…" should be gone');
});

// ─── 15. Thumbnail loading guard does NOT check for 'topo' (023D removal) ────
test('023B-A-15: thumbnail loading guard does NOT include topo (023D removed)', () => {
  assert.ok(
    hasNot("activeThemeId === 'topo'"),
    "Thumbnail loading guard must NOT check for 'topo' (removed by 023D)"
  );
});
