/**
 * PROMPT 023E — Part D: Landing Page rewrite
 *
 * Verifies:
 *  01. LandingPage has new hero headline "Build smarter lists"
 *  02. LandingPage has "for the trail—and beyond" in headline
 *  03. LandingPage has 4 feature cards (Flexible Checklists, Optional Weight, Print & Share, Use It Your Way)
 *  04. "Flexible Checklists" card present
 *  05. "Optional Weight Tracking" card present
 *  06. "Print & Share" card present
 *  07. "Use It Your Way" card present
 *  08. LandingPage has Create Free Account CTA button
 *  09. LandingPage has Sign In button
 *  10. LandingPage has ULTRALIGHT BACKPACKING badge
 *  11. LandingPage no longer has 3-card layout only (supports 4)
 *  12. LandingPage hero supporting copy mentions checklists
 *  13. LandingPage hero supporting copy mentions weight being optional
 *  14. LandingPage imports Footer
 *  15. LandingPage imports from lucide-react (icons used)
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const lp = readFileSync(resolve('artifacts/pack-checklist/src/pages/LandingPage.tsx'), 'utf-8');

test('023E-D-01: LandingPage hero headline contains "Build smarter lists"', () => {
  assert.ok(lp.includes('Build smarter lists'), 'LandingPage must have the new hero headline "Build smarter lists"');
});

test('023E-D-02: LandingPage headline includes "for the trail—and beyond" or equivalent', () => {
  assert.ok(
    lp.includes('trail') && lp.includes('beyond'),
    'LandingPage headline must include "for the trail" and "beyond"'
  );
});

test('023E-D-03: LandingPage has at least 4 feature cards rendered', () => {
  // Grid should accommodate 4 cards
  assert.ok(
    lp.includes('lg:grid-cols-4') || lp.includes('grid-cols-4'),
    'LandingPage feature grid must use lg:grid-cols-4 for 4-card layout'
  );
});

test('023E-D-04: "Flexible Checklists" card present', () => {
  assert.ok(lp.includes('Flexible Checklists'), 'LandingPage must have a "Flexible Checklists" feature card');
});

test('023E-D-05: "Optional Weight Tracking" card present', () => {
  assert.ok(lp.includes('Optional Weight Tracking') || lp.includes('Optional Weight'), 'LandingPage must have an "Optional Weight Tracking" card');
});

test('023E-D-06: "Print & Share" card present', () => {
  assert.ok(lp.includes('Print & Share') || lp.includes('Print and Share'), 'LandingPage must have a "Print & Share" card');
});

test('023E-D-07: "Use It Your Way" card present', () => {
  assert.ok(lp.includes('Use It Your Way'), 'LandingPage must have a "Use It Your Way" card');
});

test('023E-D-08: LandingPage has "Create Free Account" or "Get Started" CTA', () => {
  assert.ok(
    lp.includes('Create Free Account') || lp.includes('Get Started'),
    'LandingPage must have a primary CTA button (Create Free Account or Get Started)'
  );
});

test('023E-D-09: LandingPage has Sign In button', () => {
  assert.ok(lp.includes('Sign In'), 'LandingPage must have a Sign In button');
});

test('023E-D-10: LandingPage has ULTRALIGHT BACKPACKING badge', () => {
  assert.ok(
    lp.toLowerCase().includes('ultralight') && lp.toLowerCase().includes('backpacking'),
    'LandingPage must retain the ULTRALIGHT BACKPACKING badge'
  );
});

test('023E-D-11: LandingPage grid supports 4 cards side-by-side on desktop', () => {
  assert.ok(
    lp.includes('sm:grid-cols-2') && (lp.includes('lg:grid-cols-4') || lp.includes('xl:grid-cols-4')),
    'LandingPage feature grid must support 4 columns at desktop breakpoint'
  );
});

test('023E-D-12: LandingPage supporting copy mentions checklists', () => {
  assert.ok(lp.toLowerCase().includes('checklist'), 'LandingPage copy must mention checklists');
});

test('023E-D-13: LandingPage copy mentions weight being optional', () => {
  assert.ok(lp.toLowerCase().includes('optional') || lp.toLowerCase().includes('skip'), 
    'LandingPage copy must mention weight being optional or that you can skip it');
});

test('023E-D-14: LandingPage imports Footer', () => {
  assert.ok(lp.includes('Footer'), 'LandingPage must import and use Footer component');
});

test('023E-D-15: LandingPage imports from lucide-react', () => {
  assert.ok(lp.includes('lucide-react'), 'LandingPage must import icons from lucide-react');
});
