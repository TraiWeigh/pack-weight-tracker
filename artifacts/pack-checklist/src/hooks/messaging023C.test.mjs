/**
 * PROMPT 023C — Part C: Multi-Use Messaging
 *
 * Verifies:
 *  01. SignInPage has the multi-use tagline paragraph
 *  02. SignInPage is wrapped in flex-col gap-4 (to accommodate the tagline)
 *  03. SignUp localization subtitle is not the old "Start tracking your pack weight"
 *  04. SignUp localization subtitle mentions weight being optional
 *  05. AboutPage "Where TrailWeigh Fits In" section contains multi-use note
 *  06. AboutPage note includes "weight" and "optional" (or "never required")
 *  07. AboutPage bullet list updated to mention checklist or item list
 *  08. HowItWorksPage intro mentions "checklist" or "item list"
 *  09. HowItWorksPage "Adding and editing items" mentions weight is optional
 *  10. Multi-use note in AboutPage appears within the trailweigh-fits section
 *  11. SignIn multi-use paragraph is above the <SignIn> component
 *  12. HowItWorksPage preserves "Save / Preview / Print / Share" section
 *  13. AboutPage "Where TrailWeigh Fits In" section still exists
 *  14. SignUp subtitle does NOT say "Start tracking your pack weight"
 *  15. SignInPage no longer uses a simple single-line flex wrapper
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const APP_PATH  = resolve('artifacts/pack-checklist/src/App.tsx');
const ABOUT_PATH = resolve('artifacts/pack-checklist/src/pages/info/AboutPage.tsx');
const HOW_PATH   = resolve('artifacts/pack-checklist/src/pages/info/HowItWorksPage.tsx');

const app   = readFileSync(APP_PATH,   'utf-8');
const about = readFileSync(ABOUT_PATH, 'utf-8');
const how   = readFileSync(HOW_PATH,   'utf-8');

const inApp   = (p) => (typeof p === 'string' ? app.includes(p)   : p.test(app));
const inAbout = (p) => (typeof p === 'string' ? about.includes(p) : p.test(about));
const inHow   = (p) => (typeof p === 'string' ? how.includes(p)   : p.test(how));

// ─── 01. SignInPage has the multi-use tagline ─────────────────────────────────
test('023C-C-01: SignInPage contains a multi-use tagline paragraph', () => {
  // The multi-use message must appear inside SignInPage (before the closing }
  const signInBlock = app.match(/function SignInPage\(\)[\s\S]*?^}/m)?.[0] ?? '';
  assert.ok(
    signInBlock.includes('optional') || signInBlock.includes('checklist') || signInBlock.includes('gear list'),
    'SignInPage must contain a multi-use message mentioning checklists, gear lists, or weight being optional'
  );
});

// ─── 02. SignInPage uses flex-col gap-4 to accommodate the tagline ────────────
test('023C-C-02: SignInPage wrapper uses flex-col gap-4', () => {
  const signInBlock = app.match(/function SignInPage\(\)[\s\S]*?^}/m)?.[0] ?? '';
  assert.ok(
    signInBlock.includes('flex-col') && signInBlock.includes('gap-4'),
    'SignInPage wrapper should use flex-col gap-4 to vertically stack tagline + form'
  );
});

// ─── 03. SignUp localization subtitle is not the old copy ────────────────────
test('023C-C-03: SignUp subtitle localization is not "Start tracking your pack weight"', () => {
  assert.ok(
    !inApp("subtitle: 'Start tracking your pack weight'"),
    'SignUp localization subtitle must be updated from the old gear-only copy'
  );
});

// ─── 04. SignUp subtitle mentions weight is optional ─────────────────────────
test('023C-C-04: SignUp subtitle localization mentions weight is optional', () => {
  // Find the signUp localization block
  const signUpLocal = app.match(/signUp:\s*\{[\s\S]*?start:\s*\{[\s\S]*?subtitle:\s*'([^']+)'/)?.[1] ?? '';
  assert.ok(
    signUpLocal.toLowerCase().includes('optional') || signUpLocal.toLowerCase().includes('skip'),
    `SignUp subtitle must mention weight is optional or can be skipped; got: "${signUpLocal}"`
  );
});

// ─── 05. AboutPage "Where TrailWeigh Fits In" contains multi-use note ────────
test('023C-C-05: AboutPage contains multi-use note in the Where TrailWeigh Fits In section', () => {
  assert.ok(
    inAbout('more than a pack-list tool') || inAbout('any kind of checklist or item list'),
    'AboutPage must include the approved multi-use note in Where TrailWeigh Fits In'
  );
});

// ─── 06. AboutPage multi-use note mentions weight is never required ───────────
test('023C-C-06: AboutPage multi-use note mentions weight optional or never required', () => {
  assert.ok(
    inAbout('never required') || inAbout('skip it entirely') || inAbout('weight is not relevant'),
    'AboutPage multi-use note must state that adding a weight is optional or never required'
  );
});

// ─── 07. AboutPage bullet list updated to mention checklist or item list ──────
test('023C-C-07: AboutPage Where TrailWeigh Fits In bullet list mentions checklist or item list', () => {
  // Find the bullet list in the Where TrailWeigh Fits In section
  const fitsSection = about.match(/id="trailweigh-fits"[\s\S]*?<\/Section>/)?.[0] ?? '';
  assert.ok(
    fitsSection.includes('checklist') || fitsSection.includes('item list'),
    'The Where TrailWeigh Fits In bullet list must mention checklist or item list'
  );
});

// ─── 08. HowItWorksPage intro mentions checklist or item list ────────────────
test('023C-C-08: HowItWorksPage intro mentions checklist or item list', () => {
  // Find the intro paragraph (text before the accordion)
  const intro = how.match(/How It Works[\s\S]{0,600}Open a topic/)?.[0] ?? '';
  assert.ok(
    intro.includes('checklist') || intro.includes('item list'),
    'HowItWorksPage intro must mention checklist or item list (not only gear list)'
  );
});

// ─── 09. HowItWorksPage mentions weight is optional in Adding/editing items ───
test('023C-C-09: HowItWorksPage adding/editing section notes weight is optional', () => {
  const addSection = how.match(/Adding and editing items[\s\S]{0,600}quantity/)?.[0] ?? '';
  assert.ok(
    addSection.includes('optional') || addSection.includes('not required') || addSection.includes('skip'),
    'HowItWorksPage "Adding and editing items" must note that weight is optional'
  );
});

// ─── 10. AboutPage multi-use note is inside trailweigh-fits section ───────────
test('023C-C-10: AboutPage multi-use note appears inside the trailweigh-fits section', () => {
  const section = about.match(/id="trailweigh-fits"[\s\S]*?<\/Section>/)?.[0] ?? '';
  assert.ok(
    section.includes('more than a pack-list tool') || section.includes('any kind of checklist') ||
    section.includes('never required') || section.includes('skip it entirely'),
    'Multi-use note must be inside the trailweigh-fits Section, not outside it'
  );
});

// ─── 11. SignIn multi-use paragraph is above the <SignIn> component ───────────
test('023C-C-11: SignIn multi-use paragraph appears before <SignIn in source', () => {
  const signInBlock = app.match(/function SignInPage\(\)[\s\S]*?^}/m)?.[0] ?? '';
  const paraIdx = signInBlock.search(/optional|checklist|gear list/);
  const componentIdx = signInBlock.indexOf('<SignIn');
  assert.ok(paraIdx > 0 && paraIdx < componentIdx,
    'Multi-use paragraph must appear BEFORE <SignIn in SignInPage'
  );
});

// ─── 12. HowItWorksPage still has Save / Preview / Print / Share section ─────
test('023C-C-12: HowItWorksPage Save/Preview/Print/Share section is preserved', () => {
  assert.ok(inHow('Save / Preview / Print / Share'), 'HowItWorksPage must still have the Save/Preview/Print/Share section');
});

// ─── 13. AboutPage Where TrailWeigh Fits In section still exists ──────────────
test('023C-C-13: AboutPage Where TrailWeigh Fits In section exists', () => {
  assert.ok(inAbout('Where TrailWeigh Fits In'), '"Where TrailWeigh Fits In" section must still exist');
  assert.ok(inAbout('id="trailweigh-fits"'), 'Section must have id trailweigh-fits');
});

// ─── 14. SignUp subtitle NOT "Start tracking your pack weight" ───────────────
test('023C-C-14: SignUp subtitle does not say Start tracking your pack weight', () => {
  assert.ok(
    !inApp('Start tracking your pack weight'),
    'Old gear-only subtitle must be gone from App.tsx'
  );
});

// ─── 15. SignInPage no longer uses the simple single-wrapper pattern ───────────
test('023C-C-15: SignInPage is not the old single items-center justify-center only wrapper', () => {
  // Old: 'flex min-h-[100dvh] items-center justify-center bg-background px-4">'
  // New: should include flex-col and gap-4
  const signInBlock = app.match(/function SignInPage\(\)[\s\S]*?^}/m)?.[0] ?? '';
  assert.ok(
    signInBlock.includes('flex-col'),
    'SignInPage wrapper must now include flex-col (it stacks tagline + Clerk form vertically)'
  );
});
