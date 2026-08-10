/**
 * coverage023H.test.mjs — Prompt 023H Emergency Recovery
 *
 * Tests covering the three fixes made in 023H:
 *
 *  1. AppErrorBoundary exists and is wired into main.tsx
 *  2. All four 023G bar-style state initialisers guard their final
 *     localStorage.getItem call in a try/catch so a Safari SecurityError /
 *     QuotaExceededError cannot crash the React root
 *  3. The background initialiser catch-block wraps localStorage.removeItem
 *     in its own try/catch (pre-existing bug; made safe in 023H)
 *
 * None of these tests mock the browser DOM / localStorage — they verify the
 * defensive guard patterns are present in source using static analysis.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir    = path.resolve(__dirname, '..');

const checklist  = readFileSync(path.join(srcDir, 'pages/Checklist.tsx'),                 'utf8');
const mainTsx    = readFileSync(path.join(srcDir, 'main.tsx'),                             'utf8');
const boundary   = readFileSync(path.join(srcDir, 'components/AppErrorBoundary.tsx'),     'utf8');

// ── §1 — Error boundary ───────────────────────────────────────────────────────

describe('§1 AppErrorBoundary', () => {
  test('H01: AppErrorBoundary.tsx exists and exports AppErrorBoundary', () => {
    assert.ok(
      boundary.includes('AppErrorBoundary'),
      'AppErrorBoundary.tsx must export AppErrorBoundary',
    );
  });

  test('H02: AppErrorBoundary implements getDerivedStateFromError', () => {
    assert.ok(
      boundary.includes('getDerivedStateFromError'),
      'AppErrorBoundary must implement getDerivedStateFromError',
    );
  });

  test('H03: AppErrorBoundary implements componentDidCatch', () => {
    assert.ok(
      boundary.includes('componentDidCatch'),
      'AppErrorBoundary must implement componentDidCatch',
    );
  });

  test('H04: AppErrorBoundary does NOT call localStorage.clear or sessionStorage.clear', () => {
    assert.ok(
      !boundary.includes('localStorage.clear') && !boundary.includes('sessionStorage.clear'),
      'Error boundary must not wipe storage',
    );
  });

  test('H05: AppErrorBoundary does NOT set location.reload in an automatic/unconditional path', () => {
    // It may offer a manual reload button but must NOT auto-reload on error capture
    const catchIndex = boundary.indexOf('componentDidCatch');
    const getDerivedIndex = boundary.indexOf('getDerivedStateFromError');
    // Neither getDerivedStateFromError nor componentDidCatch should contain location.reload
    const catchBody = boundary.slice(catchIndex, catchIndex + 300);
    const derivedBody = boundary.slice(getDerivedIndex, getDerivedIndex + 200);
    assert.ok(
      !catchBody.includes('location.reload') && !derivedBody.includes('location.reload'),
      'Auto-reload on error capture would create a reload loop',
    );
  });

  test('H06: main.tsx imports AppErrorBoundary', () => {
    assert.ok(
      mainTsx.includes('AppErrorBoundary'),
      'main.tsx must import AppErrorBoundary',
    );
  });

  test('H07: main.tsx wraps <App /> with <AppErrorBoundary>', () => {
    assert.ok(
      mainTsx.includes('<AppErrorBoundary>'),
      'main.tsx must wrap App with <AppErrorBoundary>',
    );
  });
});

// ── §2 — Guarded barColor localStorage read ───────────────────────────────────

describe('§2 barColor initialiser guard (023H)', () => {
  // Find the barColor state declaration region
  const barColorInit = (() => {
    const start = checklist.indexOf("'trailweigh:barColor'");
    return start !== -1 ? checklist.slice(start - 100, start + 200) : '';
  })();

  test('H08: barColor localStorage fallback is guarded by try/catch', () => {
    // The guard pattern:  try { return localStorage.getItem('trailweigh:barColor') ... } catch { return ''; }
    const hasTry   = barColorInit.includes("try {") || barColorInit.includes("try{");
    const hasCatch = barColorInit.includes("catch");
    assert.ok(hasTry && hasCatch, 'barColor localStorage fallback must be in a try/catch block');
  });

  test('H09: barColor catch returns empty string default', () => {
    assert.ok(
      barColorInit.includes("catch") && (barColorInit.includes("return ''") || barColorInit.includes('return ""')),
      "barColor catch block must return '' as safe default",
    );
  });
});

// ── §3 — Guarded barFont localStorage read ────────────────────────────────────

describe('§3 barFont initialiser guard (023H)', () => {
  const barFontInit = (() => {
    const start = checklist.indexOf("'trailweigh:barFont'");
    return start !== -1 ? checklist.slice(start - 100, start + 200) : '';
  })();

  test('H10: barFont localStorage fallback is guarded by try/catch', () => {
    const hasTry   = barFontInit.includes("try {") || barFontInit.includes("try{");
    const hasCatch = barFontInit.includes("catch");
    assert.ok(hasTry && hasCatch, 'barFont localStorage fallback must be in a try/catch block');
  });

  test('H11: barFont catch returns empty string default', () => {
    assert.ok(
      barFontInit.includes("catch") && (barFontInit.includes("return ''") || barFontInit.includes('return ""')),
      "barFont catch block must return '' as safe default",
    );
  });
});

// ── §4 — Guarded barTextColor localStorage read ───────────────────────────────

describe('§4 barTextColor initialiser guard (023H)', () => {
  const barTextColorInit = (() => {
    const start = checklist.indexOf("'trailweigh:barTextColor'");
    return start !== -1 ? checklist.slice(start - 100, start + 200) : '';
  })();

  test('H12: barTextColor localStorage fallback is guarded by try/catch', () => {
    const hasTry   = barTextColorInit.includes("try {") || barTextColorInit.includes("try{");
    const hasCatch = barTextColorInit.includes("catch");
    assert.ok(hasTry && hasCatch, 'barTextColor localStorage fallback must be in a try/catch block');
  });

  test('H13: barTextColor catch returns empty string default', () => {
    assert.ok(
      barTextColorInit.includes("catch") && (barTextColorInit.includes("return ''") || barTextColorInit.includes('return ""')),
      "barTextColor catch block must return '' as safe default",
    );
  });
});

// ── §5 — Guarded barTransparency localStorage read ───────────────────────────

describe('§5 barTransparency initialiser guard (023H)', () => {
  const barTranspInit = (() => {
    const start = checklist.indexOf("'trailweigh:barTransparency'");
    return start !== -1 ? checklist.slice(start - 100, start + 250) : '';
  })();

  test('H14: barTransparency localStorage fallback is guarded by try/catch', () => {
    const hasTry   = barTranspInit.includes("try {") || barTranspInit.includes("try{");
    const hasCatch = barTranspInit.includes("catch");
    assert.ok(hasTry && hasCatch, 'barTransparency localStorage fallback must be in a try/catch block');
  });

  test('H15: barTransparency catch returns 1 (solid) as safe default', () => {
    assert.ok(
      barTranspInit.includes("catch") && barTranspInit.includes("return 1"),
      'barTransparency catch block must return 1 as safe default (solid)',
    );
  });
});

// ── §6 — Background initialiser catch-block safety ────────────────────────────

describe('§6 background initialiser catch-block safety (023H)', () => {
  // Locate the catch block near the "Normal path (primary / non-fork tab)" section
  const catchRegion = (() => {
    const marker = 'Normal path (primary / non-fork tab)';
    const start  = checklist.indexOf(marker);
    if (start === -1) return '';
    // Read enough to see the catch block
    return checklist.slice(start, start + 600);
  })();

  test('H16: background catch block wraps localStorage.removeItem in its own try/catch', () => {
    // The fix: try { localStorage.removeItem(BG_STORAGE_KEY); } catch {}
    const hasNestedTry = catchRegion.includes('try { localStorage.removeItem') ||
                         catchRegion.includes('try {\n') ||
                         // check for the pattern anywhere in this region
                         (catchRegion.includes('removeItem') && catchRegion.lastIndexOf('catch') > catchRegion.indexOf('removeItem') - 200);
    // Alternative: check that removeItem is inside its own try block in the catch region
    const removeIdx = catchRegion.indexOf('removeItem');
    if (removeIdx === -1) {
      // removeItem might have been removed entirely — also acceptable
      assert.ok(true, 'removeItem not present — safe by omission');
      return;
    }
    const beforeRemove = catchRegion.slice(0, removeIdx);
    const lastTryBefore = beforeRemove.lastIndexOf('try');
    const lastCatchBefore = beforeRemove.lastIndexOf('catch');
    // There should be a try block opened AFTER the last catch before removeItem
    assert.ok(
      lastTryBefore > lastCatchBefore,
      'localStorage.removeItem in background catch block must be wrapped in its own try/catch',
    );
  });
});

// ── §7 — 023F / 023G regressions still intact ─────────────────────────────────

describe('§7 023F/023G regression checks', () => {
  test('H17: 023G barTransparency is still in BarStyleContextValue interface', () => {
    const ctx = readFileSync(path.join(srcDir, 'context/BarStyleContext.tsx'), 'utf8');
    assert.ok(ctx.includes('barTransparency'), 'barTransparency must still be in BarStyleContextValue');
  });

  test('H18: 023F palette pill still has barCombinedStyle', () => {
    const ws = readFileSync(path.join(srcDir, 'components/WeightSummary.tsx'), 'utf8');
    const m  = ws.match(/Palette pill[\s\S]{0,600}?<\/button>/);
    assert.ok(m && m[0].includes('barCombinedStyle'), 'Palette pill must still receive barCombinedStyle');
  });

  test('H19: main.tsx does NOT revert to bare createRoot without boundary', () => {
    assert.ok(
      mainTsx.includes('AppErrorBoundary'),
      'main.tsx must still use AppErrorBoundary after any future edits',
    );
  });
});
