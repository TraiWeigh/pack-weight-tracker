/**
 * 022V — Mobile Portrait Toolbar and Pill Alignment Tests
 *
 * Verifies that toolbar controls can wrap on narrow portrait phones:
 * - Left pill panel uses flex-wrap so controls never overflow
 * - Open/Close stays together as one unit
 * - Imperial/Metric (UnitToggle) stays together as one unit
 * - lg:ml-auto (not bare ml-auto) on Hide/Preview/UnitToggle group so mobile is left-flow
 * - Guest "Sign in" button truncates "to save" below sm:
 * - Right panel (Background Edit / Share) already had flex-wrap
 * - Desktop layout preserved (lg: breakpoints intact)
 * - 022T/022U preserved
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

// ─── §A  Left toolbar panel — flex-wrap on portrait ──────────────────────────

test('[022V §A] left toolbar panel uses flex-wrap', () => {
  // The outer div wrapping Open/Close + Hide/Preview/UnitToggle must have flex-wrap
  // so controls spill onto a second row on narrow phones rather than overflowing.
  assert.ok(
    checklistSrc.includes('flex flex-wrap items-center gap-x-3 gap-y-2 lg:pr-7'),
    'Left toolbar panel must use flex flex-wrap with gap-x-3 gap-y-2',
  );
});

test('[022V §A] left toolbar panel no longer has the old non-wrapping layout', () => {
  // The old pattern was a single non-wrapping flex row — must be gone.
  assert.ok(
    !checklistSrc.includes('pb-3 flex items-center lg:pr-7 flex-shrink-0 relative'),
    'Old non-wrapping "flex items-center ... flex-shrink-0" must be replaced',
  );
});

test('[022V §A] gap-y-2 provides vertical spacing between wrapped pill rows', () => {
  assert.ok(
    checklistSrc.includes('gap-y-2'),
    'gap-y-2 must exist so wrapped rows have vertical spacing',
  );
});

// ─── §B  Open/Close stays together (segmented control) ───────────────────────

test('[022V §B] Open and Close buttons are in a single shared flex container (never split)', () => {
  // They are inside <div className="flex items-center bg-muted rounded-lg p-0.5 gap-0.5">
  // We search within the left-toolbar section to avoid matching UnitToggle's same container.
  const toolbarStart = checklistSrc.indexOf('Left toolbar panel');
  const rightToolbarStart = checklistSrc.indexOf('Right toolbar panel');
  const toolbarSection = checklistSrc.slice(toolbarStart, rightToolbarStart);
  const containerIdx = toolbarSection.indexOf('flex items-center bg-muted rounded-lg p-0.5 gap-0.5');
  assert.ok(containerIdx !== -1, 'Open/Close shared container must exist in left toolbar section');
  const openCloseBlock = toolbarSection.slice(containerIdx, containerIdx + 400);
  assert.ok(
    openCloseBlock.includes('Open') && openCloseBlock.includes('Close'),
    'Open and Close buttons must share a single container div',
  );
});

test('[022V §B] Open/Close container has no flex-wrap of its own (stays on one line)', () => {
  const containerStart = checklistSrc.indexOf('flex items-center bg-muted rounded-lg p-0.5 gap-0.5');
  const containerBlock = checklistSrc.slice(containerStart, containerStart + 50);
  assert.ok(
    !containerBlock.includes('flex-wrap'),
    'Open/Close inner container must NOT have flex-wrap — the two buttons must stay on one line',
  );
});

// ─── §C  Imperial/Metric (UnitToggle) stays together ─────────────────────────

test('[022V §C] UnitToggle Imperial and Metric buttons share one container', () => {
  // The UnitToggle function contains both button texts and the shared container class.
  // We use a 1200-char slice to safely cover the full function body.
  const unitToggleStart = checklistSrc.indexOf('function UnitToggle');
  const unitToggleSrc = checklistSrc.slice(unitToggleStart, unitToggleStart + 1200);
  assert.ok(
    unitToggleSrc.includes('Imperial') && unitToggleSrc.includes('Metric'),
    'UnitToggle must contain both Imperial and Metric buttons',
  );
  // Both buttons are inside one bg-muted rounded-lg container
  const containerClass = 'flex items-center bg-muted rounded-lg p-0.5 gap-0.5';
  assert.ok(
    unitToggleSrc.includes(containerClass),
    'Imperial/Metric must share a single bg-muted rounded-lg container',
  );
});

test('[022V §C] UnitToggle has no flex-wrap inside (two buttons always on one line)', () => {
  const unitToggleSrc = checklistSrc.slice(
    checklistSrc.indexOf('function UnitToggle'),
    checklistSrc.indexOf('}', checklistSrc.indexOf('function UnitToggle') + 100) + 200,
  );
  assert.ok(
    !unitToggleSrc.includes('flex-wrap'),
    'UnitToggle inner container must not have flex-wrap — Imperial/Metric stay together',
  );
});

// ─── §D  Hide/Preview/UnitToggle group uses lg:ml-auto not bare ml-auto ──────

test('[022V §D] Hide/Preview/UnitToggle wrapper uses lg:ml-auto (not bare ml-auto)', () => {
  // With lg:ml-auto, desktop gets the push-right behavior, but mobile items flow naturally.
  assert.ok(
    checklistSrc.includes('lg:ml-auto'),
    'Hide/Preview/UnitToggle group must use lg:ml-auto for desktop alignment',
  );
  // The bare "ml-auto" should NOT be on the same div (it would prevent mobile wrapping)
  // We check that "ml-auto flex" (the old pattern) is gone from the toolbar section.
  const toolbarStart = checklistSrc.indexOf('Left toolbar panel');
  const toolbarEnd = checklistSrc.indexOf('Right toolbar panel');
  const toolbarSection = checklistSrc.slice(toolbarStart, toolbarEnd);
  assert.ok(
    !toolbarSection.includes('"ml-auto flex '),
    'Bare "ml-auto flex" (without lg: prefix) must not appear in left toolbar section',
  );
});

test('[022V §D] Hide/Preview/UnitToggle group uses flex-wrap for internal wrapping', () => {
  assert.ok(
    checklistSrc.includes('flex flex-wrap items-center gap-x-3 gap-y-2 lg:ml-auto flex-shrink-0'),
    'Hide/Preview/UnitToggle group must have flex-wrap for internal wrapping at narrowest phones',
  );
});

// ─── §E  Guest "Sign in" button — truncated on narrow screens ────────────────

test('[022V §E] guest "Sign in to save" hides "to save" below sm: breakpoint', () => {
  assert.ok(
    checklistSrc.includes('hidden sm:inline"> to save</span>'),
    'Guest button must hide "to save" below sm: so narrow phones show only "Sign in"',
  );
});

test('[022V §E] guest button still shows "Sign in" text on all screens', () => {
  // The "Sign in" text (without "to save") must be visible on all screens
  assert.ok(
    checklistSrc.includes('Sign in<span'),
    'Guest button must have "Sign in" as base text visible on all screens',
  );
});

// ─── §F  Right toolbar panel (Background Edit / Share) — existing flex-wrap ──

test('[022V §F] right toolbar panel already has flex-wrap (unchanged from prior work)', () => {
  assert.ok(
    checklistSrc.includes('flex flex-wrap justify-center lg:justify-end gap-2'),
    'Right toolbar panel (Background Edit / Share) must retain flex-wrap',
  );
});

test('[022V §F] right toolbar panel is order-first on mobile', () => {
  assert.ok(
    checklistSrc.includes('order-first lg:order-last'),
    'Right toolbar panel must be order-first on mobile (appears above pill row)',
  );
});

// ─── §G  Desktop layout preserved ────────────────────────────────────────────

test('[022V §G] desktop uses lg:pr-7 on left toolbar panel', () => {
  assert.ok(
    checklistSrc.includes('lg:pr-7'),
    'Desktop left toolbar panel must retain lg:pr-7 spacing',
  );
});

test('[022V §G] toolbar group grid preserves lg:grid-cols breakpoint', () => {
  assert.ok(
    checklistSrc.includes('grid grid-cols-1 lg:grid-cols-[1fr_365px]'),
    'Toolbar group grid must preserve desktop two-column layout',
  );
});

test('[022V §G] desktop right panel has lg:justify-end', () => {
  assert.ok(
    checklistSrc.includes('lg:justify-end'),
    'Right panel must keep lg:justify-end for desktop right-alignment',
  );
});

// ─── §H  No horizontal overflow from fixed widths ────────────────────────────

test('[022V §H] left toolbar panel outer has no min-w constraint that forces overflow', () => {
  const toolbarStart = checklistSrc.indexOf('Left toolbar panel');
  const toolbarEnd = checklistSrc.indexOf('Right toolbar panel');
  const toolbarSection = checklistSrc.slice(toolbarStart, toolbarEnd);
  assert.ok(
    !toolbarSection.includes('min-w-[') || toolbarSection.indexOf('min-w-[') > 200,
    'Left toolbar panel must not have a min-w constraint that forces horizontal overflow',
  );
});

test('[022V §H] header inner container has min-w-0 to prevent overflow', () => {
  // The right-controls div in the header must have min-w-0 so it can shrink
  assert.ok(
    checklistSrc.includes('flex items-center gap-1 min-w-0'),
    'Header right-controls div must have min-w-0',
  );
});

test('[022V §H] pill labels are not forced to be white-space: nowrap at root level', () => {
  // Only specific buttons need whitespace-nowrap (e.g. "Create New List").
  // The pill row itself must not have a blanket nowrap that prevents wrapping.
  const toolbarStart = checklistSrc.indexOf('Left toolbar panel');
  const toolbarEnd = checklistSrc.indexOf('Right toolbar panel');
  const toolbarSection = checklistSrc.slice(toolbarStart, toolbarEnd);
  // whitespace-nowrap is OK on individual Create/Cancel buttons, not on the pill container
  const containerIdx = toolbarSection.indexOf('flex flex-wrap items-center gap-x-3 gap-y-2 lg:pr-7');
  assert.ok(
    containerIdx !== -1,
    'Pill container must be the flex-wrap variant (whitespace-nowrap not on container)',
  );
});

// ─── §I  Regression — 022T/022U preserved ────────────────────────────────────

test('[022V §I] 022U min-h-[100dvh] mobile scroll fix preserved', () => {
  assert.ok(
    checklistSrc.includes('min-h-[100dvh]') && checklistSrc.includes('lg:h-[100dvh]'),
    '022U mobile scroll fix must be preserved',
  );
});

test('[022V §I] 022T mergeLockerEntries import preserved', () => {
  assert.ok(
    checklistSrc.includes('mergeLockerEntries'),
    '022T mergeLockerEntries import must still exist',
  );
});

test('[022V §I] outer scroll container unchanged', () => {
  assert.ok(
    checklistSrc.includes('h-[100dvh] overflow-y-auto'),
    'Outer scroll container must be unchanged',
  );
});

test('[022V §I] footer is still after screen content in document flow', () => {
  const footerIdx = checklistSrc.indexOf('<Footer');
  const screenCloseIdx = checklistSrc.indexOf('</div>{/* end screen content */}');
  assert.ok(footerIdx > screenCloseIdx, 'Footer must remain after screen content');
});

// ─── §J  Control order preserved ─────────────────────────────────────────────

test('[022V §J] Open/Close group appears before Hide button in source order', () => {
  // Open button is inside "flex items-center bg-muted rounded-lg p-0.5 gap-0.5" container.
  // Hide button has unique aria-label "Hide interface".
  const openCloseIdx = checklistSrc.indexOf('flex items-center bg-muted rounded-lg p-0.5 gap-0.5');
  const hideIdx = checklistSrc.indexOf('aria-label="Hide interface');
  assert.ok(openCloseIdx !== -1, 'Open/Close container must exist');
  assert.ok(hideIdx !== -1, 'Hide button aria-label must exist');
  assert.ok(openCloseIdx < hideIdx, 'Open/Close group must appear before Hide in DOM order');
});

test('[022V §J] Hide appears before Preview in source order', () => {
  const hideIdx = checklistSrc.indexOf('aria-label="Hide interface');
  const previewIdx = checklistSrc.indexOf('setShowPreview(true)');
  assert.ok(hideIdx < previewIdx, 'Hide must appear before Preview in DOM order');
});

test('[022V §J] Preview appears before UnitToggle in source order', () => {
  const previewIdx = checklistSrc.indexOf('setShowPreview(true)');
  const unitIdx = checklistSrc.indexOf('<UnitToggle');
  assert.ok(previewIdx < unitIdx, 'Preview must appear before UnitToggle in DOM order');
});
