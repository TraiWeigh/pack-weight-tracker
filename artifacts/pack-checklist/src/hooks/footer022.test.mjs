/**
 * footer022.test.mjs — Prompt 022 Footer & Info-Page Navigation Tests
 *
 * Source-code regression tests protecting:
 *   • Footer component exists and exports a default
 *   • Footer always uses dark background (hard-coded hex, not CSS var)
 *   • Footer section headings (TrailWeigh, Help, Account & Privacy)
 *   • All required footer links present
 *   • informationalOnly prop omits Delete Account / Data link
 *   • Footer is print:hidden (does not appear in PDF/print)
 *   • All 10 info-page routes registered in App.tsx
 *   • Sign-up legal consent text added in App.tsx SignUpPage function
 *   • Terms of Use and Privacy Policy links present in sign-up screen
 *   • SharedChecklistPage imports Footer with informationalOnly
 *   • LandingPage uses the Footer component (not an inline footer)
 *   • No owner-only link in shared view (Delete Account / Data)
 *   • 021P layout invariants preserved (pb-8 on sidebar inner div)
 */

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve('artifacts/pack-checklist/src');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

let passed = 0;
let failed = 0;

function test(label, fn) {
  try {
    fn();
    console.log(`  ✓ ${label}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${label}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

// ── Read source files once ─────────────────────────────────────────────────
const footerSrc   = read('components/Footer.tsx');
const appSrc      = read('App.tsx');
const landingSrc  = read('pages/LandingPage.tsx');
const sharedSrc   = read('pages/SharedChecklistPage.tsx');
const checklistSrc = read('pages/Checklist.tsx');

console.log('\n022 Footer Component:');

test('Footer.tsx exists and exports a default function', () => {
  assert.ok(footerSrc.includes('export default function Footer'), 'Missing default export Footer');
});

test('Footer uses hard-coded dark background color (not a CSS variable)', () => {
  // Must be a hex string, not hsl() or var(--) so it stays dark in all themes
  assert.ok(footerSrc.includes('#1e2322'), 'Dark background hex #1e2322 not found');
});

test('Footer background applied via style or className with hard-coded value', () => {
  assert.ok(
    footerSrc.includes("backgroundColor: BG") || footerSrc.includes("bg-[#"),
    'Dark BG must be applied via style or hard-coded Tailwind arbitrary class',
  );
});

test('Footer section heading: TrailWeigh', () => {
  assert.ok(footerSrc.includes('>TrailWeigh<'), 'TrailWeigh section heading missing');
});

test('Footer section heading: Help', () => {
  assert.ok(footerSrc.match(/>Help\s*</), 'Help section heading missing');
});

test('Footer section heading: Account & Privacy', () => {
  assert.ok(
    footerSrc.includes('Account') && footerSrc.includes('Privacy'),
    'Account & Privacy section heading missing',
  );
});

test('Footer link: About TrailWeigh → /about', () => {
  assert.ok(footerSrc.includes('to="/about"'), 'Missing /about route');
  assert.ok(footerSrc.includes('About TrailWeigh'), 'Missing About TrailWeigh text');
});

test('Footer link: How It Works → /how-it-works', () => {
  assert.ok(footerSrc.includes('to="/how-it-works"'), 'Missing /how-it-works route');
  assert.ok(footerSrc.includes('How It Works'), 'Missing How It Works text');
});

test('Footer link: Help & How-To → /help', () => {
  assert.ok(footerSrc.includes('to="/help"'), 'Missing /help route');
});

test('Footer link: Report a Problem → /report-problem', () => {
  assert.ok(footerSrc.includes('to="/report-problem"'), 'Missing /report-problem route');
});

test('Footer link: Contact Us → /contact', () => {
  assert.ok(footerSrc.includes('to="/contact"'), 'Missing /contact route');
});

test('Footer link: Privacy Policy → /privacy', () => {
  assert.ok(footerSrc.includes('to="/privacy"'), 'Missing /privacy route');
});

test('Footer link: Terms of Use → /terms', () => {
  assert.ok(footerSrc.includes('to="/terms"'), 'Missing /terms route');
});

test('Footer link: Delete Account / Data → /delete-account', () => {
  assert.ok(footerSrc.includes('to="/delete-account"'), 'Missing /delete-account route');
  assert.ok(footerSrc.includes('Delete Account'), 'Missing Delete Account text');
});

test('Footer link: Affiliate Disclosure → /affiliate', () => {
  assert.ok(footerSrc.includes('to="/affiliate"'), 'Missing /affiliate route');
});

test('Footer link: Accessibility → /accessibility', () => {
  assert.ok(footerSrc.includes('to="/accessibility"'), 'Missing /accessibility route');
});

test('Footer informationalOnly prop omits Delete Account / Data', () => {
  assert.ok(
    footerSrc.includes('informationalOnly') &&
    footerSrc.includes('!informationalOnly'),
    'informationalOnly guard missing from Footer',
  );
});

test('Footer has copyright line with 2026', () => {
  assert.ok(footerSrc.includes('2026 TrailWeigh'), 'Copyright line missing');
});

test('Footer is print:hidden (suppressed in PDF/print)', () => {
  assert.ok(footerSrc.includes('print:hidden'), 'Footer must have print:hidden class');
});

test('Footer heading uses font-semibold or equivalent', () => {
  assert.ok(footerSrc.includes('font-semibold'), 'Footer headings should be semibold');
});

test('Footer link font size is 14px (text-[14px])', () => {
  assert.ok(footerSrc.includes('text-[14px]'), 'Footer links must be 14px');
});

test('Footer copyright font size is 12px (text-[12px])', () => {
  assert.ok(footerSrc.includes('text-[12px]'), 'Copyright text must be ~12px');
});

test('Footer link line-height is ~21px (leading-[21px])', () => {
  assert.ok(footerSrc.includes('leading-[21px]'), 'Footer links should have leading-[21px]');
});

console.log('\n022 App Routes:');

test('Route /about registered in App.tsx', () => {
  assert.ok(appSrc.includes('path="/about"') || appSrc.includes("path='/about'"), 'Route /about missing');
});

test('Route /how-it-works registered in App.tsx', () => {
  assert.ok(appSrc.includes('path="/how-it-works"'), 'Route /how-it-works missing');
});

test('Route /help registered in App.tsx', () => {
  assert.ok(appSrc.includes('path="/help"'), 'Route /help missing');
});

test('Route /report-problem registered in App.tsx', () => {
  assert.ok(appSrc.includes('path="/report-problem"'), 'Route /report-problem missing');
});

test('Route /contact registered in App.tsx', () => {
  assert.ok(appSrc.includes('path="/contact"'), 'Route /contact missing');
});

test('Route /privacy registered in App.tsx', () => {
  assert.ok(appSrc.includes('path="/privacy"'), 'Route /privacy missing');
});

test('Route /terms registered in App.tsx', () => {
  assert.ok(appSrc.includes('path="/terms"'), 'Route /terms missing');
});

test('Route /delete-account registered in App.tsx', () => {
  assert.ok(appSrc.includes('path="/delete-account"'), 'Route /delete-account missing');
});

test('Route /affiliate registered in App.tsx', () => {
  assert.ok(appSrc.includes('path="/affiliate"'), 'Route /affiliate missing');
});

test('Route /accessibility registered in App.tsx', () => {
  assert.ok(appSrc.includes('path="/accessibility"'), 'Route /accessibility missing');
});

console.log('\n022 Sign-Up Legal Consent:');

test('Sign-up screen includes "By creating an account" legal text', () => {
  assert.ok(appSrc.includes('By creating an account'), 'Legal consent text missing from sign-up');
});

test('Sign-up includes Terms of Use link', () => {
  assert.ok(
    appSrc.includes('Terms of Use') && appSrc.includes('/terms'),
    'Terms of Use link missing from sign-up',
  );
});

test('Sign-up includes Privacy Policy link', () => {
  assert.ok(
    appSrc.includes('Privacy Policy') && appSrc.includes('/privacy'),
    'Privacy Policy link missing from sign-up',
  );
});

console.log('\n022 LandingPage Footer:');

test('LandingPage imports Footer component', () => {
  assert.ok(landingSrc.includes("import Footer"), 'Footer not imported in LandingPage');
});

test('LandingPage uses <Footer /> (not inline footer element)', () => {
  assert.ok(landingSrc.includes('<Footer'), 'LandingPage should render <Footer />');
});

test('LandingPage does NOT use an inline text-only footer', () => {
  // Old footer was: <footer className="text-center py-4 text-xs text-muted-foreground/60">
  assert.ok(
    !landingSrc.includes('text-center py-4 text-xs text-muted-foreground/60'),
    'Old inline footer still present in LandingPage — should have been replaced',
  );
});

console.log('\n022 SharedChecklistPage:');

test('SharedChecklistPage imports Footer', () => {
  assert.ok(sharedSrc.includes("import Footer"), 'Footer not imported in SharedChecklistPage');
});

test('SharedChecklistPage uses Footer with informationalOnly', () => {
  assert.ok(
    sharedSrc.includes('informationalOnly'),
    'SharedChecklistPage should render <Footer informationalOnly />',
  );
});

test('SharedChecklistPage does NOT expose Delete Account / Data in shared view', () => {
  // The informationalOnly prop on Footer suppresses the Delete Account link.
  // Double-check: no direct /delete-account anchor without informationalOnly guard.
  const matches = sharedSrc.match(/delete-account/g) || [];
  // If /delete-account appears at all it should only be within Footer (which guards it)
  // — not as a raw <a> or <Link> outside Footer.
  const rawLinks = sharedSrc.match(/to="\/delete-account"|href="\/delete-account"/g) || [];
  assert.strictEqual(rawLinks.length, 0, 'SharedChecklistPage must not have a raw /delete-account link');
});

console.log('\n022 021P Layout Invariants:');

test('Checklist.tsx: sidebar inner div still uses pb-8 without py-2 (021P preserved)', () => {
  // The 021P fix: removed py-2 from the sidebar inner content div.
  // 023C: inner div now uses "gap-5 lg:gap-4 pb-8" for responsive mobile spacing.
  // Accept either the original "flex flex-col gap-4 pb-8" or the 023C "gap-5 lg:gap-4 pb-8" variant.
  const hasPb8 = checklistSrc.includes('flex flex-col gap-4 pb-8') ||
                 (checklistSrc.includes('flex flex-col') && checklistSrc.includes('pb-8') &&
                  /flex flex-col\s+\S*\s*gap-\d/.test(checklistSrc));
  const hasBadPy = checklistSrc.includes('py-2 pb-8');
  assert.ok(hasPb8, '021P fix missing: sidebar inner div must have flex flex-col … pb-8 (gap may carry 023C responsive prefix)');
  assert.ok(!hasBadPy, '021P regression: "py-2 pb-8" re-introduced on sidebar inner div');
});

test('Checklist.tsx: toolbar-group parent still uses pt-4 (021O preserved)', () => {
  assert.ok(
    checklistSrc.includes('pt-4 grid grid-cols-1 lg:grid-cols-[1fr_365px]'),
    '021O regression: toolbar-group pt-4 missing',
  );
});

// ── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n022 Footer & Navigation: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
