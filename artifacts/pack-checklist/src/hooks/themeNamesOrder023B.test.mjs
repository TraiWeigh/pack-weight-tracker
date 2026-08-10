/**
 * PROMPT 023B — Part A: Theme Names & Order
 *
 * Verifies:
 *  1. TOPO_PRESETS exported with ≥4 entries, each having id/label/photoId
 *  2. No photoId overlap between PRESETS and TOPO_PRESETS
 *  3. dropdownLabel returns 'Landscape' (not 'Landscapes') for landscapes tab
 *  4. dropdownLabel returns 'Topo' for topo tab
 *  5. Custom theme label shows col.name — no 'Theme ' prefix in dropdownLabel
 *  6. Dropdown renders a 'Landscape' button (not 'Landscapes')
 *  7. Dropdown renders a 'Topo' button after Landscape and before custom themes
 *  8. Custom theme dropdown option shows col.name without 'Theme ' prefix
 *  9. activeThemeId guard effect accepts 'topo' as a valid built-in ID
 * 10. Topo panel rendered when activeThemeId === 'topo'
 * 11. New-theme input placeholder is 'Name…', not 'Theme name…'
 * 12. Topo preset IDs start with 'topo-'
 * 13. Landscape label in built-in section label guard (thumbnail loading)
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

// ─── 1. TOPO_PRESETS exported ───────────────────────────────────────────────
test('023B-A-01: TOPO_PRESETS is exported', () => {
  assert.ok(has('export const TOPO_PRESETS'), 'TOPO_PRESETS must be exported');
});

test('023B-A-02: TOPO_PRESETS has ≥4 entries', () => {
  const block = src.match(/TOPO_PRESETS\s*=\s*\[([\s\S]*?)\];/)?.[1] ?? '';
  const count = (block.match(/\{/g) ?? []).length;
  assert.ok(count >= 4, `Expected ≥4 entries in TOPO_PRESETS, found ${count}`);
});

test('023B-A-03: TOPO_PRESETS entries have id, label, photoId', () => {
  const block = src.match(/TOPO_PRESETS\s*=\s*\[([\s\S]*?)\];/)?.[1] ?? '';
  assert.ok(block.includes('id:'), 'Each entry should have id');
  assert.ok(block.includes('label:'), 'Each entry should have label');
  assert.ok(block.includes('photoId:'), 'Each entry should have photoId');
});

// ─── 4. No photoId overlap ──────────────────────────────────────────────────
test('023B-A-04: TOPO_PRESETS photoIds do not overlap with PRESETS', () => {
  const presetBlock  = src.match(/^export const PRESETS\s*=\s*\[([\s\S]*?)\];/m)?.[1] ?? '';
  const topoBlock    = src.match(/TOPO_PRESETS\s*=\s*\[([\s\S]*?)\];/)?.[1]  ?? '';
  const photoIdRe   = /photoId:\s*'([^']+)'/g;
  const extractIds  = (block) => { const ids = []; let m; while ((m = photoIdRe.exec(block)) !== null) ids.push(m[1]); return new Set(ids); };
  const presetIds  = extractIds(presetBlock);
  const topoIds    = extractIds(topoBlock);
  for (const id of topoIds) {
    assert.ok(!presetIds.has(id), `photoId '${id}' duplicated between PRESETS and TOPO_PRESETS`);
  }
});

// ─── 5. Topo preset IDs start with 'topo-' ──────────────────────────────────
test('023B-A-05: TOPO_PRESETS entry ids start with topo-', () => {
  const block = src.match(/TOPO_PRESETS\s*=\s*\[([\s\S]*?)\];/)?.[1] ?? '';
  const ids = [...block.matchAll(/id:\s*'([^']+)'/g)].map(m => m[1]);
  assert.ok(ids.length > 0, 'Should have id strings in TOPO_PRESETS');
  for (const id of ids) {
    assert.ok(id.startsWith('topo-'), `TOPO_PRESETS id '${id}' should start with 'topo-'`);
  }
});

// ─── 6. dropdownLabel returns 'Landscape' for landscapes tab ────────────────
test('023B-A-06: dropdownLabel returns Landscape (not Landscapes) for landscapes tab', () => {
  assert.ok(has("return 'Landscape'"), "dropdownLabel should return 'Landscape'");
  assert.ok(hasNot("return 'Landscapes'"), "dropdownLabel must not return 'Landscapes'");
});

// ─── 7. dropdownLabel returns 'Topo 1' for topo tab (023C renamed from 'Topo') ─
test('023B-A-07: dropdownLabel returns Topo 1 for topo tab (023C rename)', () => {
  assert.ok(
    src.includes("activeThemeId === 'topo'") && src.includes("return 'Topo 1'"),
    "dropdownLabel should return 'Topo 1' when activeThemeId === 'topo' (023C rename)"
  );
});

// ─── 8. No 'Theme ' prefix in dropdownLabel for custom theme ────────────────
test('023B-A-08: dropdownLabel uses col.name without Theme prefix', () => {
  // Must NOT contain backtick-template with "Theme " prefix in dropdownLabel
  assert.ok(hasNot('return `Theme ${col.name}`'), 'dropdownLabel must not prepend "Theme "');
  // The if (col) branch must exist and use col.name
  assert.ok(has('if (col) return col.name'), "dropdownLabel should return col.name directly");
});

// ─── 9. Dropdown renders 'Landscape' button (not 'Landscapes') ──────────────
test('023B-A-09: dropdown option button shows Landscape not Landscapes', () => {
  // Look for the button content — must have >Landscape< and must NOT have >Landscapes<
  assert.ok(has('>Landscape</button>'), "Dropdown button text should be 'Landscape'");
  assert.ok(hasNot('>Landscapes</button>'), "Dropdown button text must not be 'Landscapes'");
});

// ─── 10. Dropdown renders 'Topo 1' button (023C renamed from 'Topo') ─────────
test('023B-A-10: dropdown option button shows Topo 1 (023C rename)', () => {
  assert.ok(has('>Topo 1</button>'), "Dropdown must have a 'Topo 1' button (023C rename from 'Topo')");
  assert.ok(hasNot('>Topo</button>'), "Dropdown must NOT have a bare 'Topo' button (023C: renamed to 'Topo 1')");
});

// ─── 11. Custom theme dropdown option shows col.name without 'Theme ' ────────
test('023B-A-11: custom theme dropdown option has no Theme prefix', () => {
  assert.ok(hasNot('>Theme {col.name}</button>'), 'Custom theme dropdown option must not say "Theme {col.name}"');
  assert.ok(has('>{col.name}</button>'), 'Custom theme dropdown option should show col.name directly');
});

// ─── 12. activeThemeId guard effect accepts 'topo' as valid built-in ─────────
// 023C: guard was refactored to use BUILT_IN_IDS array; 'topo' must still be listed
test('023B-A-12: activeThemeId guard accepts topo as built-in (023C: BUILT_IN_IDS array)', () => {
  // Either the old explicit !== check or the new BUILT_IN_IDS array must include 'topo'
  const hasOldGuard   = /activeThemeId !== 'topo'/.test(src);
  const hasArrayGuard = /BUILT_IN_IDS\s*=\s*\[[\s\S]*?'topo'[\s\S]*?\]/.test(src);
  assert.ok(
    hasOldGuard || hasArrayGuard,
    "Guard effect must still protect 'topo' from resetting to landscapes"
  );
});

// ─── 13. Topo panel rendered when activeThemeId === 'topo' ──────────────────
test('023B-A-13: topo panel renders TOPO_PRESETS when activeThemeId is topo', () => {
  // There should be a conditional for topo in the panel area
  assert.ok(
    /activeThemeId === 'topo'[\s\S]{1,200}TOPO_PRESETS/.test(src),
    'Panel should render TOPO_PRESETS when activeThemeId === topo'
  );
});

// ─── 14. New-theme input placeholder ─────────────────────────────────────────
test('023B-A-14: new-theme input placeholder is Name… not Theme name…', () => {
  assert.ok(has('placeholder="Name…"'), 'Placeholder should be "Name…"');
  assert.ok(hasNot('placeholder="Theme name…"'), 'Old placeholder "Theme name…" should be gone');
});

// ─── 15. Thumbnail loading guard also covers 'topo' ─────────────────────────
test('023B-A-15: thumbnail loading effect guard covers topo', () => {
  assert.ok(
    /activeThemeId === 'topo'[\s\S]{0,60}setThumbnailUrls\(\{\}\)/.test(src) ||
    (src.includes("activeThemeId === 'topo'") && src.includes('setThumbnailUrls({}')),
    'Thumbnail loading guard should also short-circuit for topo tab'
  );
});
