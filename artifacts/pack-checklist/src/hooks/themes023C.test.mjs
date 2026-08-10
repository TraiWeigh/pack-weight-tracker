/**
 * PROMPT 023C — Part A: Background Theme Names & Order
 *
 * Verifies:
 *  01. RETRO_PRESETS exported with ≥4 entries (id, label, photoId)
 *  02. PSYCHEDELIC_PRESETS exported with ≥4 entries (id, label, photoId)
 *  03. No photoId overlap between PRESETS, TOPO_PRESETS, RETRO_PRESETS, PSYCHEDELIC_PRESETS
 *  04. Retro preset IDs start with 'retro-'
 *  05. Psychedelic preset IDs start with 'psyche-'
 *  06. dropdownLabel returns 'Retro-Outdoors' for retro-outdoors tab
 *  07. dropdownLabel returns 'Psychedelic' for psychedelic tab
 *  08. dropdownLabel returns 'Topo 1' (not 'Topo') for topo tab
 *  09. Dropdown has Landscape → Retro-Outdoors → Psychedelic → Topo 1 order
 *  10. Dropdown button shows 'Retro-Outdoors'
 *  11. Dropdown button shows 'Psychedelic'
 *  12. No bare '>Topo</button>' in dropdown (must be 'Topo 1')
 *  13. BUILT_IN_IDS array includes retro-outdoors and psychedelic
 *  14. Thumbnail guard covers retro-outdoors and psychedelic
 *  15. Retro-Outdoors panel renders RETRO_PRESETS
 *  16. Psychedelic panel renders PSYCHEDELIC_PRESETS
 *  17. Custom themes still appear after built-ins (col.name usage present)
 *  18. No photoId collision among Retro and Psychedelic presets themselves
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const BG_PATH = resolve('artifacts/pack-checklist/src/components/BackgroundPicker.tsx');
const src = readFileSync(BG_PATH, 'utf-8');

const has    = (p) => (typeof p === 'string' ? src.includes(p) : p.test(src));
const hasNot = (p) => !has(p);

// ─── helper: extract preset photoIds from a named block ─────────────────────
const photoIdsFrom = (blockName) => {
  const block = src.match(new RegExp(blockName + '\\s*=\\s*\\[([\\s\\S]*?)\\];'))?.[1] ?? '';
  return [...block.matchAll(/photoId:\s*'([^']+)'/g)].map(m => m[1]);
};

// ─── 01. RETRO_PRESETS exported ──────────────────────────────────────────────
test('023C-A-01: RETRO_PRESETS is exported', () => {
  assert.ok(has('export const RETRO_PRESETS'), 'RETRO_PRESETS must be exported');
});

// ─── 02. RETRO_PRESETS ≥4 entries ────────────────────────────────────────────
test('023C-A-02: RETRO_PRESETS has ≥4 entries', () => {
  const block = src.match(/RETRO_PRESETS\s*=\s*\[([\s\S]*?)\];/)?.[1] ?? '';
  const count = (block.match(/\{/g) ?? []).length;
  assert.ok(count >= 4, `Expected ≥4 entries in RETRO_PRESETS, found ${count}`);
});

// ─── 03. PSYCHEDELIC_PRESETS exported ────────────────────────────────────────
test('023C-A-03: PSYCHEDELIC_PRESETS is exported', () => {
  assert.ok(has('export const PSYCHEDELIC_PRESETS'), 'PSYCHEDELIC_PRESETS must be exported');
});

// ─── 04. PSYCHEDELIC_PRESETS ≥4 entries ──────────────────────────────────────
test('023C-A-04: PSYCHEDELIC_PRESETS has ≥4 entries', () => {
  const block = src.match(/PSYCHEDELIC_PRESETS\s*=\s*\[([\s\S]*?)\];/)?.[1] ?? '';
  const count = (block.match(/\{/g) ?? []).length;
  assert.ok(count >= 4, `Expected ≥4 entries in PSYCHEDELIC_PRESETS, found ${count}`);
});

// ─── 05. No cross-preset photoId overlap ─────────────────────────────────────
test('023C-A-05: No photoId overlap across PRESETS, TOPO, RETRO, PSYCHEDELIC', () => {
  const preset  = photoIdsFrom('export const PRESETS');
  const topo    = photoIdsFrom('TOPO_PRESETS');
  const retro   = photoIdsFrom('RETRO_PRESETS');
  const psyche  = photoIdsFrom('PSYCHEDELIC_PRESETS');
  const allSets = [['PRESETS', preset], ['TOPO_PRESETS', topo], ['RETRO_PRESETS', retro], ['PSYCHEDELIC_PRESETS', psyche]];
  for (let i = 0; i < allSets.length; i++) {
    for (let j = i + 1; j < allSets.length; j++) {
      const [nameA, idsA] = allSets[i];
      const [nameB, idsB] = allSets[j];
      const setB = new Set(idsB);
      for (const id of idsA) {
        assert.ok(!setB.has(id), `photoId '${id}' is duplicated between ${nameA} and ${nameB}`);
      }
    }
  }
});

// ─── 06. Retro preset IDs start with 'retro-' ────────────────────────────────
test('023C-A-06: RETRO_PRESETS entry ids start with retro-', () => {
  const block = src.match(/RETRO_PRESETS\s*=\s*\[([\s\S]*?)\];/)?.[1] ?? '';
  const ids = [...block.matchAll(/id:\s*'([^']+)'/g)].map(m => m[1]);
  assert.ok(ids.length > 0, 'RETRO_PRESETS should have id strings');
  for (const id of ids) {
    assert.ok(id.startsWith('retro-'), `RETRO_PRESETS id '${id}' should start with 'retro-'`);
  }
});

// ─── 07. Psychedelic preset IDs start with 'psyche-' ─────────────────────────
test('023C-A-07: PSYCHEDELIC_PRESETS entry ids start with psyche-', () => {
  const block = src.match(/PSYCHEDELIC_PRESETS\s*=\s*\[([\s\S]*?)\];/)?.[1] ?? '';
  const ids = [...block.matchAll(/id:\s*'([^']+)'/g)].map(m => m[1]);
  assert.ok(ids.length > 0, 'PSYCHEDELIC_PRESETS should have id strings');
  for (const id of ids) {
    assert.ok(id.startsWith('psyche-'), `PSYCHEDELIC_PRESETS id '${id}' should start with 'psyche-'`);
  }
});

// ─── 08. dropdownLabel returns 'Retro-Outdoors' ──────────────────────────────
test('023C-A-08: dropdownLabel returns Retro-Outdoors for retro-outdoors tab', () => {
  assert.ok(
    src.includes("activeThemeId === 'retro-outdoors'") && src.includes("return 'Retro-Outdoors'"),
    "dropdownLabel must return 'Retro-Outdoors' when activeThemeId === 'retro-outdoors'"
  );
});

// ─── 09. dropdownLabel returns 'Psychedelic' ─────────────────────────────────
test('023C-A-09: dropdownLabel returns Psychedelic for psychedelic tab', () => {
  assert.ok(
    src.includes("activeThemeId === 'psychedelic'") && src.includes("return 'Psychedelic'"),
    "dropdownLabel must return 'Psychedelic' when activeThemeId === 'psychedelic'"
  );
});

// ─── 10. dropdownLabel returns 'Topo 1' (not 'Topo') ────────────────────────
test('023C-A-10: dropdownLabel returns Topo 1 not Topo for topo tab', () => {
  assert.ok(
    src.includes("activeThemeId === 'topo'") && src.includes("return 'Topo 1'"),
    "dropdownLabel must return 'Topo 1' for topo (023C rename)"
  );
  assert.ok(hasNot("return 'Topo'"), "dropdownLabel must NOT return bare 'Topo'");
});

// ─── 11. Dropdown order: Landscape → Retro-Outdoors → Psychedelic → Topo 1 ──
test('023C-A-11: Dropdown order is Landscape → Retro-Outdoors → Psychedelic → Topo 1', () => {
  const landscapeIdx  = src.indexOf(">Landscape</button>");
  const retroIdx      = src.indexOf(">Retro-Outdoors</button>");
  const psycheIdx     = src.indexOf(">Psychedelic</button>");
  const topoIdx       = src.indexOf(">Topo 1</button>");
  assert.ok(landscapeIdx  > 0, "Landscape button must exist");
  assert.ok(retroIdx      > 0, "Retro-Outdoors button must exist");
  assert.ok(psycheIdx     > 0, "Psychedelic button must exist");
  assert.ok(topoIdx       > 0, "Topo 1 button must exist");
  assert.ok(landscapeIdx < retroIdx,  "Landscape must appear before Retro-Outdoors");
  assert.ok(retroIdx     < psycheIdx, "Retro-Outdoors must appear before Psychedelic");
  assert.ok(psycheIdx    < topoIdx,   "Psychedelic must appear before Topo 1");
});

// ─── 12. No bare '>Topo</button>' in dropdown ────────────────────────────────
test('023C-A-12: Bare >Topo</button> no longer exists in dropdown', () => {
  assert.ok(hasNot('>Topo</button>'), "Bare '>Topo</button>' must not exist (023C renamed to 'Topo 1')");
});

// ─── 13. BUILT_IN_IDS includes retro-outdoors and psychedelic ────────────────
test('023C-A-13: BUILT_IN_IDS array includes retro-outdoors and psychedelic', () => {
  assert.ok(
    /BUILT_IN_IDS\s*=\s*\[[\s\S]*?'retro-outdoors'[\s\S]*?\]/.test(src),
    "BUILT_IN_IDS must include 'retro-outdoors'"
  );
  assert.ok(
    /BUILT_IN_IDS\s*=\s*\[[\s\S]*?'psychedelic'[\s\S]*?\]/.test(src),
    "BUILT_IN_IDS must include 'psychedelic'"
  );
});

// ─── 14. Thumbnail guard covers retro-outdoors and psychedelic ───────────────
test('023C-A-14: Thumbnail loading guard covers retro-outdoors and psychedelic', () => {
  assert.ok(
    has("activeThemeId === 'retro-outdoors'"),
    "Thumbnail guard must check for 'retro-outdoors'"
  );
  assert.ok(
    has("activeThemeId === 'psychedelic'"),
    "Thumbnail guard must check for 'psychedelic'"
  );
});

// ─── 15. Retro-Outdoors panel renders RETRO_PRESETS ─────────────────────────
test('023C-A-15: Retro-Outdoors panel renders RETRO_PRESETS', () => {
  assert.ok(
    /activeThemeId === 'retro-outdoors'[\s\S]{1,400}RETRO_PRESETS/.test(src),
    "Panel should render RETRO_PRESETS when activeThemeId === 'retro-outdoors'"
  );
});

// ─── 16. Psychedelic panel renders PSYCHEDELIC_PRESETS ───────────────────────
test('023C-A-16: Psychedelic panel renders PSYCHEDELIC_PRESETS', () => {
  assert.ok(
    /activeThemeId === 'psychedelic'[\s\S]{1,400}PSYCHEDELIC_PRESETS/.test(src),
    "Panel should render PSYCHEDELIC_PRESETS when activeThemeId === 'psychedelic'"
  );
});

// ─── 17. Custom themes still use col.name (always last) ─────────────────────
test('023C-A-17: Custom themes still use col.name in dropdownLabel', () => {
  assert.ok(has('if (col) return col.name'), "dropdownLabel must still return col.name for custom themes");
});

// ─── 18. No intra-set photoId duplicates in Retro and Psychedelic presets ────
test('023C-A-18: No photoId duplicates within RETRO_PRESETS or PSYCHEDELIC_PRESETS', () => {
  for (const name of ['RETRO_PRESETS', 'PSYCHEDELIC_PRESETS']) {
    const ids = photoIdsFrom(name);
    const seen = new Set();
    for (const id of ids) {
      assert.ok(!seen.has(id), `Duplicate photoId '${id}' within ${name}`);
      seen.add(id);
    }
  }
});
