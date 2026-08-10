/**
 * PROMPT 023C — Part B: Phone Spacing
 *
 * Verifies:
 *  01. Toolbar group has pt-2 on mobile (added to provide A-group spacing)
 *  02. Toolbar group still has lg:pt-4 (desktop top padding unchanged)
 *  03. Sidebar outer wrapper has pt-3 on mobile (B-group spacing)
 *  04. Sidebar outer wrapper still has lg:pt-0 (desktop no-op)
 *  05. Sidebar inner flex-col uses gap-5 on mobile (increased from gap-4)
 *  06. Sidebar inner still uses lg:gap-4 on desktop (desktop unchanged)
 *  07. Phone Row 1 still has pt-4 (A-group top spacing unchanged)
 *  08. Lower phone toolbar still uses lg:hidden
 *  09. Desktop sidebar layout unchanged (lg:h-full lg:overflow-y-auto)
 * 10. Content area gap-8 still present (mobile gap between sidebar and categories)
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const CL_PATH = resolve('artifacts/pack-checklist/src/pages/Checklist.tsx');
const src = readFileSync(CL_PATH, 'utf-8');

const has    = (s) => (typeof s === 'string' ? src.includes(s) : s.test(src));
const hasNot = (s) => !has(s);

// ─── 01. Toolbar group has pt-2 on mobile ────────────────────────────────────
test('023C-B-01: Toolbar group has pt-2 (mobile top spacing after Phone Row 1)', () => {
  assert.ok(
    has('pt-2 lg:pt-4 grid grid-cols-1 lg:grid-cols-[1fr_365px]'),
    'Toolbar group div should have pt-2 lg:pt-4'
  );
});

// ─── 02. Toolbar group still has lg:pt-4 ─────────────────────────────────────
test('023C-B-02: Toolbar group still has lg:pt-4 (desktop top padding unchanged)', () => {
  assert.ok(
    has('lg:pt-4 grid grid-cols-1 lg:grid-cols-[1fr_365px]'),
    'Toolbar group must keep lg:pt-4 for desktop'
  );
});

// ─── 03. Sidebar outer wrapper has pt-3 on mobile ────────────────────────────
test('023C-B-03: Sidebar outer wrapper has pt-3 lg:pt-0 (B-group spacing)', () => {
  assert.ok(
    has('pt-3 lg:pt-0'),
    'Sidebar outer wrapper should have pt-3 lg:pt-0'
  );
});

// ─── 04. Sidebar inner uses gap-5 lg:gap-4 ───────────────────────────────────
test('023C-B-04: Sidebar inner flex-col uses gap-5 lg:gap-4', () => {
  assert.ok(
    has('gap-5 lg:gap-4'),
    'Sidebar inner div must use gap-5 lg:gap-4 (more mobile spacing, desktop unchanged)'
  );
});

// ─── 05. Old gap-4 pb-8 pattern replaced ─────────────────────────────────────
test('023C-B-05: Sidebar inner no longer uses bare gap-4 pb-8 without responsive prefix', () => {
  // The old pattern "flex flex-col gap-4 pb-8" must be gone (replaced by gap-5 lg:gap-4 pb-8)
  assert.ok(
    hasNot('flex flex-col gap-4 pb-8'),
    'Old "flex flex-col gap-4 pb-8" should be replaced by gap-5 lg:gap-4 in the sidebar'
  );
});

// ─── 06. Phone Row 1 still has pt-4 ──────────────────────────────────────────
test('023C-B-06: Phone Row 1 still has pt-4 (first-group top spacing preserved)', () => {
  assert.ok(
    has('pt-4 lg:hidden flex items-center justify-center'),
    'Phone Row 1 must keep pt-4 for top spacing'
  );
});

// ─── 07. Lower phone toolbar still uses lg:hidden ────────────────────────────
test('023C-B-07: Lower phone toolbar still has lg:hidden', () => {
  assert.ok(
    has('lg:hidden flex items-center justify-between'),
    'Lower phone toolbar must still use lg:hidden flex items-center justify-between'
  );
});

// ─── 08. Desktop sidebar layout unchanged ────────────────────────────────────
test('023C-B-08: Desktop sidebar has lg:h-full lg:overflow-y-auto (unchanged)', () => {
  assert.ok(
    has('lg:h-full lg:overflow-y-auto lg:min-h-0'),
    'Desktop sidebar layout (lg:h-full lg:overflow-y-auto) must be unchanged'
  );
});

// ─── 09. Content area gap-8 between sidebar and categories on mobile ─────────
test('023C-B-09: Content area grid still uses gap-8 lg:gap-4', () => {
  assert.ok(
    has('gap-8 lg:gap-4 lg:flex-1 lg:min-h-0 lg:overflow-hidden'),
    'Content area grid must keep gap-8 lg:gap-4 (mobile sidebar-to-categories gap)'
  );
});

// ─── 10. No desktop classes changed ──────────────────────────────────────────
test('023C-B-10: Desktop left toolbar still has hidden lg:flex (desktop-only)', () => {
  assert.ok(
    has('hidden lg:flex lg:flex-row lg:items-center'),
    'Desktop left toolbar must still use hidden lg:flex (mobile/desktop split unchanged)'
  );
});
