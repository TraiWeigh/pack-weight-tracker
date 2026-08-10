/**
 * PROMPT 023D — Part B: About Page Multi-Use Intro (Always-Visible)
 *
 * Verifies that the About page now states TrailWeigh's multi-use purpose
 * in the always-visible introduction section (not inside an accordion).
 *
 * Tests:
 *  01. AboutPage intro div contains not-limited-to-backpacking wording
 *  02. AboutPage intro div contains many-kinds-of-lists wording
 *  03. AboutPage intro div says weight is optional / never required
 *  04. The wording appears in the always-visible section (space-y-4 div)
 *  05. The wording is in a callout element (bg-muted class present near the text)
 *  06. Existing About opening philosophy is still present
 *  07. "Where TrailWeigh Fits In" accordion section is preserved
 *  08. The existing callout inside "Where TrailWeigh Fits In" is preserved
 *  09. Sign-in multi-use tagline (023C) still present in App.tsx
 *  10. Sign-up localization subtitle still present in App.tsx
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const ABOUT_PATH = resolve('artifacts/pack-checklist/src/pages/info/AboutPage.tsx');
const APP_PATH   = resolve('artifacts/pack-checklist/src/App.tsx');
const aboutSrc   = readFileSync(ABOUT_PATH, 'utf-8');
const appSrc     = readFileSync(APP_PATH, 'utf-8');

const hasAbout = (p) => (typeof p === 'string' ? aboutSrc.includes(p) : p.test(aboutSrc));
const hasApp   = (p) => (typeof p === 'string' ? appSrc.includes(p) : p.test(appSrc));

// ─── 01. Not-limited-to-backpacking wording in About intro ───────────────────
test("023D-B-01: About intro contains 'isn't limited to backpacking' wording", () => {
  assert.ok(
    hasAbout("isn't limited to backpacking") || hasAbout("not limited to backpacking"),
    "About intro must state TrailWeigh is not limited to backpacking"
  );
});

// ─── 02. Many-kinds-of-lists wording in About intro ──────────────────────────
test("023D-B-02: About intro contains many-kinds-of-lists wording", () => {
  assert.ok(
    hasAbout('checklist or item list') || hasAbout('checklist') && hasAbout('item list'),
    "About intro must mention that many kinds of lists/checklists are supported"
  );
});

// ─── 03. Weight optional / never required in About intro ─────────────────────
test("023D-B-03: About intro says Weight is never required", () => {
  assert.ok(
    hasAbout('Weight is never required') || hasAbout('weight is never required'),
    "About intro must explicitly state that weight is never required"
  );
});

// ─── 04. Multi-use wording in always-visible intro div ───────────────────────
test("023D-B-04: Multi-use wording appears in the always-visible intro section", () => {
  // Locate the always-visible intro block (space-y-4 div before accordion sections)
  // It must contain the multi-use statement and appear before the accordion div
  const introEnd = aboutSrc.indexOf('Accordion sections');
  const spaceY4  = aboutSrc.indexOf('space-y-4');
  assert.ok(spaceY4 > 0, "space-y-4 intro div must exist");
  // The multi-use wording must appear before the accordion sections
  const wording = aboutSrc.indexOf("isn't limited to backpacking");
  const wording2 = aboutSrc.indexOf("not limited to backpacking");
  const wordingPos = Math.max(wording, wording2);
  assert.ok(wordingPos > 0, "Multi-use wording must be present in AboutPage");
  // It should appear in the early portion of the file (before the accordion section)
  assert.ok(
    wordingPos < aboutSrc.indexOf('SectionLabel>'),
    "Multi-use wording must appear before the accordion SectionLabel sections"
  );
});

// ─── 05. Multi-use callout box uses bg-muted class ───────────────────────────
test("023D-B-05: Multi-use intro callout uses bg-muted styling", () => {
  // The always-visible callout box should use bg-muted (like the existing accordion callout)
  const introSection = aboutSrc.slice(0, aboutSrc.indexOf('SectionLabel>'));
  assert.ok(
    introSection.includes('bg-muted'),
    "Always-visible multi-use callout should use bg-muted styling"
  );
});

// ─── 06. Existing opening philosophy still present ───────────────────────────
test("023D-B-06: Existing About opening philosophy is still present", () => {
  assert.ok(
    hasAbout('what we carry should support why'),
    "Original opening philosophy must still be present in About"
  );
  assert.ok(
    hasAbout('Carry what you need. Understand why you carry it'),
    "Core carry philosophy must still be present in About"
  );
});

// ─── 07. Where TrailWeigh Fits In section preserved ──────────────────────────
test("023D-B-07: 'Where TrailWeigh Fits In' accordion section is preserved", () => {
  assert.ok(
    hasAbout('Where TrailWeigh Fits In'),
    "'Where TrailWeigh Fits In' section must still exist"
  );
  assert.ok(
    hasAbout("id=\"trailweigh-fits\"") || hasAbout("id='trailweigh-fits'"),
    "'trailweigh-fits' accordion id must still exist"
  );
});

// ─── 08. Existing callout inside Where TrailWeigh Fits In preserved ───────────
test("023D-B-08: Existing callout inside 'Where TrailWeigh Fits In' accordion preserved", () => {
  assert.ok(
    hasAbout('more than a pack-list tool'),
    "The 023C callout inside 'Where TrailWeigh Fits In' must still be present"
  );
});

// ─── 09. Sign-in multi-use tagline (023C) still in App.tsx ────────────────────
test("023D-B-09: Sign-in multi-use tagline still present in App.tsx", () => {
  assert.ok(
    hasApp('Build packing lists, checklists, gear lists, and more'),
    "Sign-in page multi-use tagline must still be present"
  );
  assert.ok(
    hasApp('Weight tracking is always optional'),
    "Sign-in page weight-optional note must still be present"
  );
});

// ─── 10. Sign-up localization subtitle (023C) still in App.tsx ────────────────
test("023D-B-10: Sign-up localization subtitle still present in App.tsx", () => {
  assert.ok(
    hasApp('Build checklists, gear lists, and more. Weight tracking is always optional'),
    "Sign-up localization subtitle must still be present"
  );
});
