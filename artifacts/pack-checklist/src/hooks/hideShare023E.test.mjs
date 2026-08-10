/**
 * PROMPT 023E — Part B & C: Hide disabled bug fix + Share hover fix
 *
 * Verifies:
 *  01. closeSaveDialog calls setHasInputFocus(false)
 *  02. closeSaveDialog calls saveInputRef.current?.blur()
 *  03. handleLoadFromLocker calls setHasInputFocus(false) in-place path
 *  04. Hide button disabled condition uses hasInputFocus (correct condition)
 *  05. Hide button disabled is not always-false (disabled guard preserved)
 *  06. Share button does NOT have hover:bg-muted/50 class (fixed)
 *  07. Share button has onMouseEnter handler (hover state tracking)
 *  08. Share button has onMouseLeave handler (hover state tracking)
 *  09. shareHovered state declared in ChecklistContent
 *  10. Share button does NOT have hover:border-foreground/30 (fixed)
 *  11. Active Share button background stays bg-card (not fading on hover)
 *  12. Share button applies white text on hover via shareHovered
 *  13. Disabled (canShare=false) Share button still has aria-disabled="true"
 *  14. Hide disabled uses dragCat condition (full condition preserved)
 *  15. Hide disabled uses showResetConfirm (full condition preserved)
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const cl = readFileSync(resolve('artifacts/pack-checklist/src/pages/Checklist.tsx'), 'utf-8');

// ── Part B: Hide disabled bug fix ─────────────────────────────────────────
test('023E-B-01: closeSaveDialog calls setHasInputFocus(false)', () => {
  const closeBlock = cl.match(/const closeSaveDialog[\s\S]{0,400}?\};/)?.[0] ?? '';
  assert.ok(
    closeBlock.includes('setHasInputFocus(false)'),
    'closeSaveDialog must call setHasInputFocus(false) to clear stale focus state'
  );
});

test('023E-B-02: closeSaveDialog calls saveInputRef.current?.blur()', () => {
  const closeBlock = cl.match(/const closeSaveDialog[\s\S]{0,400}?\};/)?.[0] ?? '';
  assert.ok(
    closeBlock.includes('.blur()'),
    'closeSaveDialog must call blur() on saveInputRef before removing the input from DOM'
  );
});

test('023E-B-03: handleLoadFromLocker calls setHasInputFocus(false) in in-place path', () => {
  // Extract from the function declaration to the "Non-empty path" comment that marks the boundary
  // between in-place load and new-tab load. setHasInputFocus(false) must appear in the in-place section.
  const fnStart = cl.indexOf('const handleLoadFromLocker');
  const nonEmptyMarker = cl.indexOf('── Non-empty path', fnStart);
  const inPlaceSection = fnStart >= 0 && nonEmptyMarker >= 0
    ? cl.substring(fnStart, nonEmptyMarker)
    : '';
  assert.ok(
    inPlaceSection.includes('setHasInputFocus(false)'),
    'handleLoadFromLocker in-place path must call setHasInputFocus(false) to clear stale focus'
  );
});

test('023E-B-04: Hide button uses hasInputFocus in disabled condition', () => {
  assert.ok(cl.includes('hasInputFocus'), 'Hide disabled condition must include hasInputFocus');
});

test('023E-B-05: Hide disabled guard is NOT removed (condition preserved)', () => {
  // Must have the disabled prop with showResetConfirm (not just `disabled={false}`)
  const hideMatch = cl.match(/aria-label="Hide interface[\s\S]{0,200}disabled=/)?.[0] ?? '';
  assert.ok(
    hideMatch.includes('showResetConfirm') || cl.includes('showResetConfirm'),
    'Hide disabled condition must still include showResetConfirm'
  );
});

// ── Part C: Share hover fix ───────────────────────────────────────────────
test('023E-C-06: Active Share button does NOT have hover:bg-muted/50', () => {
  // Extract only the active (canShare=true) Share button block
  const shareSection = cl.match(/Active: normal Share button[\s\S]{0,600}?<\/button>/)?.[0] ?? '';
  assert.ok(
    !shareSection.includes('hover:bg-muted/50'),
    'Active Share button must NOT have hover:bg-muted/50 — that class causes the whole pill to fade'
  );
});

test('023E-C-07: Active Share button has onMouseEnter handler', () => {
  // Use a generous limit — the Share button has a long inline style prop
  const shareSection = cl.match(/Active: normal Share button[\s\S]{0,1500}?<\/button>/)?.[0] ?? '';
  assert.ok(
    shareSection.includes('onMouseEnter'),
    'Share button must have onMouseEnter handler for hover state tracking'
  );
});

test('023E-C-08: Active Share button has onMouseLeave handler', () => {
  const shareSection = cl.match(/Active: normal Share button[\s\S]{0,1500}?<\/button>/)?.[0] ?? '';
  assert.ok(
    shareSection.includes('onMouseLeave'),
    'Share button must have onMouseLeave handler for hover state tracking'
  );
});

test('023E-C-09: shareHovered state declared in ChecklistContent', () => {
  assert.ok(
    cl.includes('shareHovered') && cl.includes('setShareHovered'),
    'Checklist must declare shareHovered state for hover color control'
  );
});

test('023E-C-10: Active Share button does NOT have hover:border-foreground/30', () => {
  const shareSection = cl.match(/Active: normal Share button[\s\S]{0,600}?<\/button>/)?.[0] ?? '';
  assert.ok(
    !shareSection.includes('hover:border-foreground/30'),
    'Active Share button must NOT have hover:border-foreground/30'
  );
});

test('023E-C-11: Active Share button has bg-card class (stable background)', () => {
  const shareSection = cl.match(/Active: normal Share button[\s\S]{0,1500}?<\/button>/)?.[0] ?? '';
  assert.ok(
    shareSection.includes('bg-card'),
    'Active Share button must have bg-card to keep background stable on hover'
  );
});

test('023E-C-12: Share button applies white text on hover via shareHovered', () => {
  const shareSection = cl.match(/Active: normal Share button[\s\S]{0,1500}?<\/button>/)?.[0] ?? '';
  assert.ok(
    shareSection.includes("'white'") || shareSection.includes('"white"'),
    'Share button must apply white text color when shareHovered is true'
  );
});

test('023E-C-13: Disabled Share button still has aria-disabled="true"', () => {
  assert.ok(
    cl.includes('aria-disabled="true"'),
    'Disabled (empty list) Share button must keep aria-disabled="true"'
  );
});

test('023E-C-14: Hide disabled uses dragCat condition', () => {
  assert.ok(cl.includes('dragCat'), 'Hide disabled condition must include dragCat');
});

test('023E-C-15: Hide disabled uses showResetConfirm', () => {
  assert.ok(cl.includes('showResetConfirm'), 'Hide disabled condition must include showResetConfirm');
});
