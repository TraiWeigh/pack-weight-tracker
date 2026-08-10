/**
 * PROMPT 023D — Part A: Background Themes (Corrective)
 *
 * Verifies that the three Replit-added built-in theme duplicates have been
 * removed from BackgroundPicker.tsx and that the preserved user state is correct.
 *
 * Tests:
 *  01. RETRO_PRESETS is NOT exported (Replit-added built-in removed)
 *  02. PSYCHEDELIC_PRESETS is NOT exported (Replit-added built-in removed)
 *  03. TOPO_PRESETS is NOT exported (Replit-added built-in removed)
 *  04. No 'retro-outdoors' built-in dropdown button exists
 *  05. No 'psychedelic' built-in dropdown button exists
 *  06. No 'Topo 1' built-in dropdown button exists
 *  07. No 'Topo' built-in dropdown button exists
 *  08. BUILT_IN_IDS does not include 'retro-outdoors'
 *  09. BUILT_IN_IDS does not include 'psychedelic'
 *  10. BUILT_IN_IDS does not include 'topo'
 *  11. dropdownLabel has NO branch for 'retro-outdoors'
 *  12. dropdownLabel has NO branch for 'psychedelic'
 *  13. dropdownLabel has NO branch for 'topo'
 *  14. Landscape built-in still present in dropdown
 *  15. Custom themes still use col.name (still last in dropdown)
 *  16. BUILT_IN_IDS array still guards 'landscapes'
 *  17. Thumbnail guard still covers 'landscapes' as built-in
 *  18. No retro-* or psyche- hardcoded preset IDs exist in source
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const BG_PATH = resolve('artifacts/pack-checklist/src/components/BackgroundPicker.tsx');
const src = readFileSync(BG_PATH, 'utf-8');

const has    = (p) => (typeof p === 'string' ? src.includes(p) : p.test(src));
const hasNot = (p) => !has(p);

// ─── 01. RETRO_PRESETS NOT exported ──────────────────────────────────────────
test('023D-A-01: RETRO_PRESETS is NOT exported (Replit-added built-in removed)', () => {
  assert.ok(hasNot('export const RETRO_PRESETS'), 'RETRO_PRESETS must NOT be exported (removed by 023D)');
});

// ─── 02. PSYCHEDELIC_PRESETS NOT exported ────────────────────────────────────
test('023D-A-02: PSYCHEDELIC_PRESETS is NOT exported (Replit-added built-in removed)', () => {
  assert.ok(hasNot('export const PSYCHEDELIC_PRESETS'), 'PSYCHEDELIC_PRESETS must NOT be exported (removed by 023D)');
});

// ─── 03. TOPO_PRESETS NOT exported ───────────────────────────────────────────
test('023D-A-03: TOPO_PRESETS is NOT exported as a built-in (removed by 023D)', () => {
  assert.ok(hasNot('export const TOPO_PRESETS'), 'TOPO_PRESETS must NOT be exported (removed by 023D)');
});

// ─── 04. No retro-outdoors built-in dropdown button ──────────────────────────
test('023D-A-04: No hardcoded Retro-Outdoors built-in button in dropdown', () => {
  // The string '>Retro-Outdoors</button>' should not exist as a hardcoded dropdown option
  assert.ok(hasNot('>Retro-Outdoors</button>'), "Dropdown must NOT have a hardcoded 'Retro-Outdoors' button");
});

// ─── 05. No psychedelic built-in dropdown button ──────────────────────────────
test('023D-A-05: No hardcoded Psychedelic built-in button in dropdown', () => {
  assert.ok(hasNot('>Psychedelic</button>'), "Dropdown must NOT have a hardcoded 'Psychedelic' button");
});

// ─── 06. No Topo 1 built-in dropdown button ───────────────────────────────────
test('023D-A-06: No hardcoded Topo 1 built-in button in dropdown', () => {
  assert.ok(hasNot('>Topo 1</button>'), "Dropdown must NOT have a hardcoded 'Topo 1' button");
});

// ─── 07. No bare Topo built-in dropdown button ────────────────────────────────
test('023D-A-07: No hardcoded bare Topo built-in button in dropdown', () => {
  assert.ok(hasNot('>Topo</button>'), "Dropdown must NOT have a hardcoded bare 'Topo' button");
});

// ─── 08. BUILT_IN_IDS does not include retro-outdoors ─────────────────────────
test('023D-A-08: BUILT_IN_IDS does not include retro-outdoors', () => {
  assert.ok(
    hasNot("'retro-outdoors'"),
    "Source must not contain 'retro-outdoors' as a built-in reference"
  );
});

// ─── 09. BUILT_IN_IDS does not include psychedelic ────────────────────────────
test('023D-A-09: BUILT_IN_IDS does not include psychedelic', () => {
  assert.ok(
    hasNot("'psychedelic'"),
    "Source must not contain 'psychedelic' as a built-in reference"
  );
});

// ─── 10. BUILT_IN_IDS does not include topo ───────────────────────────────────
test('023D-A-10: BUILT_IN_IDS does not include topo', () => {
  assert.ok(
    hasNot("'topo'"),
    "Source must not contain 'topo' as a built-in reference"
  );
});

// ─── 11. dropdownLabel has NO branch for retro-outdoors ───────────────────────
test('023D-A-11: dropdownLabel has no branch for retro-outdoors', () => {
  assert.ok(
    hasNot("return 'Retro-Outdoors'"),
    "dropdownLabel must NOT return 'Retro-Outdoors' (built-in removed by 023D)"
  );
});

// ─── 12. dropdownLabel has NO branch for psychedelic ──────────────────────────
test('023D-A-12: dropdownLabel has no branch for psychedelic', () => {
  assert.ok(
    hasNot("return 'Psychedelic'"),
    "dropdownLabel must NOT return 'Psychedelic' (built-in removed by 023D)"
  );
});

// ─── 13. dropdownLabel has NO branch for topo ─────────────────────────────────
test('023D-A-13: dropdownLabel has no branch for topo or Topo 1', () => {
  assert.ok(
    hasNot("return 'Topo 1'") && hasNot("return 'Topo'"),
    "dropdownLabel must NOT return 'Topo 1' or 'Topo' (built-in removed by 023D)"
  );
});

// ─── 14. Landscape built-in still present ─────────────────────────────────────
test('023D-A-14: Landscape built-in still present in dropdown', () => {
  assert.ok(has('>Landscape</button>'), "Landscape dropdown button must still exist");
  assert.ok(has("return 'Landscape'"), "dropdownLabel must still return 'Landscape' for landscapes tab");
});

// ─── 15. Custom themes still use col.name (always last) ───────────────────────
test('023D-A-15: Custom themes still listed via col.name in dropdown', () => {
  assert.ok(has('if (col) return col.name'), "dropdownLabel must still return col.name for custom themes");
  assert.ok(has('>{col.name}</button>'), "Custom theme dropdown option must still render col.name");
});

// ─── 16. BUILT_IN_IDS array still guards landscapes ──────────────────────────
test('023D-A-16: BUILT_IN_IDS array contains landscapes', () => {
  assert.ok(
    /BUILT_IN_IDS\s*=\s*\[[\s\S]*?'landscapes'[\s\S]*?\]/.test(src),
    "BUILT_IN_IDS must still contain 'landscapes'"
  );
});

// ─── 17. Thumbnail guard still covers landscapes as built-in ──────────────────
test('023D-A-17: Thumbnail loading guard still covers landscapes', () => {
  assert.ok(
    has("activeThemeId === 'landscapes'"),
    "Thumbnail guard must still check for 'landscapes' to skip custom-blob loading"
  );
});

// ─── 18. No retro- or psyche- hardcoded preset IDs in source ──────────────────
test('023D-A-18: No retro- or psyche- hardcoded preset entry IDs in source', () => {
  assert.ok(
    hasNot("id: 'retro-campfire'") && hasNot("id: 'retro-autumn'"),
    "Hardcoded retro- preset objects must not exist (removed by 023D)"
  );
  assert.ok(
    hasNot("id: 'psyche-aurora'") && hasNot("id: 'psyche-bloom'"),
    "Hardcoded psyche- preset objects must not exist (removed by 023D)"
  );
});
