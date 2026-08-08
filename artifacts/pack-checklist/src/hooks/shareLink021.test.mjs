/**
 * Prompt 021 — Share Link Repair: Structural tests
 *
 * Verifies:
 *   A. SharedChecklistPage crash fix — order + moveItem props
 *   B. normalizeSnapshot completeness (name + unit fields)
 *   C. Empty-list Share UX — grayed button state, no "Nothing to share" toast
 *   D. Save-before-sharing warning step (shareStep state)
 *   E. Data-ownership protection — commitSave uses new UUID path
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '../..');

const sharedPage = readFileSync(resolve(root, 'src/pages/SharedChecklistPage.tsx'), 'utf8');
const checklist  = readFileSync(resolve(root, 'src/pages/Checklist.tsx'), 'utf8');
const gearRow    = readFileSync(resolve(root, 'src/components/GearRow.tsx'), 'utf8');
const shareLib   = readFileSync(resolve(root, 'src/lib/shareLink.ts'), 'utf8');

// ─── helpers ──────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    failed++;
  }
}

// ─── A. SharedChecklistPage crash fix ─────────────────────────────────────────

console.log('\nPrompt 021 — Share Link Repair\n');
console.log('A. SharedChecklistPage crash fix — order + moveItem props');

// GearCategory must receive order={store.order} — the missing prop that caused the crash
assert(
  /order=\{store\.order\}/.test(sharedPage),
  'GearCategory is rendered with order={store.order}'
);

// GearCategory must receive moveItem={moveItem} — second missing prop
assert(
  /moveItem=\{moveItem\}/.test(sharedPage),
  'GearCategory is rendered with moveItem={moveItem}'
);

// moveItem callback must be defined in SharedChecklistPage
assert(
  /const moveItem = useCallback\(/.test(sharedPage),
  'moveItem callback is defined in SharedChecklistPage'
);

// moveItem must use pushAndSet to move items between categories
assert(
  /pushAndSet.*sourceCategory.*destinationCategory/s.test(sharedPage),
  'moveItem implementation uses pushAndSet with source/destination categories'
);

// The crash site in GearRow: order.filter() must still exist (good path)
assert(
  /const otherCategories = order\.filter/.test(gearRow),
  'GearRow.order.filter() crash site exists (remains, now guarded by prop being supplied)'
);

// ─── B. normalizeSnapshot completeness ────────────────────────────────────────

console.log('\nB. normalizeSnapshot completeness (name + unit fields)');

// normalizeSnapshot must return `unit` field from raw payload
assert(
  /unit:.*raw\.unit/.test(sharedPage),
  'normalizeSnapshot returns unit field from raw payload'
);

// normalizeSnapshot must return `name` field from raw payload
assert(
  /name:.*raw\.name/.test(sharedPage),
  'normalizeSnapshot returns name field from raw payload'
);

// unit field must guard against invalid values
assert(
  /raw\.unit === 'metric'.*raw\.unit === 'imperial'/.test(sharedPage) ||
  /\(raw\.unit === 'metric' \|\| raw\.unit === 'imperial'\)/.test(sharedPage),
  'normalizeSnapshot validates unit against allowed values'
);

// name field must guard against non-string values
assert(
  /typeof raw\.name === 'string'/.test(sharedPage),
  'normalizeSnapshot validates name is a string before returning'
);

// normalizeSnapshot must still reject missing/empty categoryOrder (original guard preserved)
assert(
  /!raw \|\| !Array\.isArray\(raw\.categoryOrder\) \|\| raw\.categoryOrder\.length === 0/.test(sharedPage),
  'normalizeSnapshot still rejects missing/non-array/empty categoryOrder'
);

// panelOpen prop fix for BackgroundPickerButton
assert(
  /BackgroundPickerButton.*panelOpen=\{bgPickerOpen\}/.test(sharedPage),
  'BackgroundPickerButton receives panelOpen={bgPickerOpen} (TS error fixed)'
);

// ─── C. Empty-list Share UX ───────────────────────────────────────────────────

console.log('\nC. Empty-list Share UX — grayed button, no toast');

// canShare computed value must exist in Checklist
assert(
  /const canShare = totalItems > 0/.test(checklist),
  'canShare derived from totalItems in Checklist component body'
);

// totalItems must be computed at render level (not only inside handleCopyLink)
assert(
  /const totalItems = store\.order\.reduce/.test(checklist),
  'totalItems is computed at render level in Checklist component body'
);

// "Nothing to share" toast must be removed from handleCopyLink
assert(
  !/title:\s*['"]Nothing to share['"]/.test(checklist),
  '"Nothing to share" toast removed from handleCopyLink'
);

// Grayed / aria-disabled Share button must exist for the empty-list state
assert(
  /aria-disabled="true"/.test(checklist) && /cursor-not-allowed/.test(checklist),
  'Grayed Share button uses aria-disabled and cursor-not-allowed (not native disabled)'
);

// Hover tooltip message for desktop empty state
assert(
  /Add some gear items before creating a share link/.test(checklist),
  'Empty-list tooltip message present for desktop hover/focus'
);

// showEmptyShareMsg state for mobile tap
assert(
  /showEmptyShareMsg/.test(checklist),
  'showEmptyShareMsg state manages mobile tap visibility of message'
);

// ─── D. Save-before-sharing warning ───────────────────────────────────────────

console.log('\nD. Save-before-sharing warning step');

// shareStep state must exist in Checklist
assert(
  /const \[shareStep, setShareStep\] = useState/.test(checklist),
  "shareStep state exists ('menu' | 'warning')"
);

// Initial value must be 'menu'
// (021E renamed 'warning' → 'locker-warning' to distinguish from pack-list share)
assert(
  /useState<'menu' \| 'locker-warning'>\('menu'\)/.test(checklist),
  "shareStep initialised to 'menu' (type: 'menu' | 'locker-warning' since 021E)"
);

// Warning message text must be present (021E: wording updated for Share Locker context)
assert(
  /Save the currently open file first/.test(checklist),
  'Save-before-sharing warning message present in Checklist'
);

// Confirm button must exist (021E: "Copy Link Anyway" → "Share Locker Anyway"; 021F: → "Share Link Anyway")
assert(
  /Share Link Anyway/.test(checklist),
  '"Share Link Anyway" button present in save-warning step (renamed from Share Locker Anyway in 021F)'
);

// Share Locker must set shareStep to 'locker-warning' (021E: renamed from 'warning')
assert(
  /setShareStep\('locker-warning'\)/.test(checklist),
  "Clicking Share Locker sets shareStep to 'locker-warning' before proceeding (renamed in 021E)"
);

// shareStep must reset to 'menu' on menu close
assert(
  /setShareStep\('menu'\)/.test(checklist),
  "shareStep resets to 'menu' when dropdown closes"
);

// ─── E. Data-ownership protection ─────────────────────────────────────────────

console.log('\nE. Data-ownership protection — recipient copy uses new UUID');

// commitSave in SharedChecklistPage must use crypto.randomUUID or existingId
assert(
  /const id = existingId \?\? crypto\.randomUUID\(\)/.test(sharedPage),
  'commitSave uses crypto.randomUUID() for new entries (no sender UUID reuse)'
);

// commitSave must write to the recipient's own Locker key
assert(
  /writeLockerEntry\(entry\)/.test(sharedPage),
  'commitSave writes to recipient Locker via writeLockerEntry'
);

// writeLockerEntry must read and write LOCKER_KEY (recipient-scoped localStorage)
assert(
  /localStorage\.setItem\(LOCKER_KEY/.test(sharedPage),
  'writeLockerEntry uses LOCKER_KEY for recipient localStorage (not sender namespace)'
);

// No API DELETE endpoint or sender localStorage mutation in SharedChecklistPage
assert(
  !/DELETE.*api\/links/.test(sharedPage),
  'SharedChecklistPage has no DELETE call to /api/links (links are immutable)'
);

// ─── Summary ──────────────────────────────────────────────────────────────────

const total = passed + failed;
console.log('\n' + '─'.repeat(52));
console.log(`Tests: ${total}   ✓ ${passed}   ✗ ${failed}`);

if (failed > 0) {
  process.exit(1);
}

console.log('\n⚠️  Automated tests verify structural correctness only.');
console.log('Rendered acceptance (open a shared link → no crash,');
console.log('empty Share button dimmed, Copy Link shows save warning)');
console.log('requires the user\'s fresh-preview acceptance test.');
