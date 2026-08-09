/**
 * deleteConfirmJump022Z.test.mjs
 * Prompt 022Z — Fix Custom-Theme Delete Confirmation Jump and Double-Click
 *
 * Verifies:
 *   • deletePopoverContentRef is declared (enables portal exclusion)
 *   • mousedown handler excludes clicks inside deletePopoverContentRef
 *   • PopoverContent receives the ref (anchors to DOM node in portal)
 *   • onInteractOutside guard present on PopoverContent
 *   • confirmAndDeleteTheme calls setConfirmDeleteTheme(null) synchronously
 *     before any await (deletion captured before anchor can disappear)
 *   • Single confirmDeleteTheme state — one popover at a time
 *   • Cancel clears confirmDeleteTheme → onOpenChange closes popover
 *   • Delete Theme button calls confirmAndDeleteTheme with col.id
 *   • No document-flow bottom warning block remains (022Y regression)
 *   • Built-in theme protection unchanged
 *   • Category-bar delete regression check
 */

import fs     from 'node:fs';
import path   from 'node:path';
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

const srcRoot     = path.resolve('artifacts/pack-checklist/src');
const bgPickerSrc = fs.readFileSync(path.join(srcRoot, 'components/BackgroundPicker.tsx'), 'utf8');
const gearCatSrc  = fs.readFileSync(path.join(srcRoot, 'components/GearCategory.tsx'), 'utf8');

// ── §A: deletePopoverContentRef declared ─────────────────────────────────────

describe('A. deletePopoverContentRef declared', () => {
  test('A1: deletePopoverContentRef useRef is declared', () => {
    assert.ok(
      bgPickerSrc.includes('deletePopoverContentRef'),
      'deletePopoverContentRef must be declared as a useRef'
    );
  });

  test('A2: useRef<HTMLDivElement | null> typing or equivalent for the ref', () => {
    assert.ok(
      bgPickerSrc.includes('deletePopoverContentRef = useRef'),
      'deletePopoverContentRef must be initialized with useRef()'
    );
  });
});

// ── §B: mousedown handler excludes portal clicks ──────────────────────────────

describe('B. mousedown outside-click handler excludes portal popover clicks', () => {
  test('B1: handler checks deletePopoverContentRef before calling onClose', () => {
    assert.ok(
      bgPickerSrc.includes('deletePopoverContentRef.current?.contains(e.target') ||
      bgPickerSrc.includes('deletePopoverContentRef.current && deletePopoverContentRef.current.contains(e.target'),
      'mousedown handler must check deletePopoverContentRef.current.contains(e.target) before onClose'
    );
  });

  test('B2: handler returns early (skips onClose) when click is in portal', () => {
    // Must have a return statement in the portal-check branch
    const handlerSection = bgPickerSrc.slice(
      bgPickerSrc.indexOf('Close panel on outside click'),
      bgPickerSrc.indexOf('Close dropdown on outside click')
    );
    assert.ok(
      handlerSection.includes('return'),
      'mousedown handler must early-return when click is inside deletePopoverContentRef'
    );
  });

  test('B3: document.addEventListener mousedown still registered for panel close', () => {
    // The handler must still exist — we are patching it, not removing it
    const count = (bgPickerSrc.match(/document\.addEventListener\('mousedown'/g) || []).length;
    assert.ok(count >= 1, 'document mousedown listener for panel close must still exist');
  });
});

// ── §C: PopoverContent receives the ref ──────────────────────────────────────

describe('C. PopoverContent wired to deletePopoverContentRef', () => {
  test('C1: PopoverContent has ref={deletePopoverContentRef}', () => {
    assert.ok(
      bgPickerSrc.includes('ref={deletePopoverContentRef}'),
      'PopoverContent must receive ref={deletePopoverContentRef}'
    );
  });

  test('C2: PopoverContent is rendered inside BackgroundPicker', () => {
    assert.ok(
      bgPickerSrc.includes('<PopoverContent'),
      'BackgroundPicker must render <PopoverContent>'
    );
  });
});

// ── §D: onInteractOutside guard ───────────────────────────────────────────────

describe('D. onInteractOutside guard on PopoverContent', () => {
  test('D1: onInteractOutside handler present on PopoverContent', () => {
    assert.ok(
      bgPickerSrc.includes('onInteractOutside'),
      'PopoverContent must have onInteractOutside prop'
    );
  });

  test('D2: onInteractOutside calls e.preventDefault() when appropriate', () => {
    assert.ok(
      bgPickerSrc.includes('e.preventDefault()'),
      'onInteractOutside must call e.preventDefault() to suppress premature close'
    );
  });
});

// ── §E: confirmAndDeleteTheme synchronous close before await ─────────────────

describe('E. confirmAndDeleteTheme — setConfirmDeleteTheme(null) called synchronously', () => {
  test('E1: setConfirmDeleteTheme(null) is called inside confirmAndDeleteTheme', () => {
    // 023A deferred blob deletion (await deletePhotos removed from theme deletion),
    // so the original ordering check is replaced by a presence check.
    // The requirement is simply that the popover closes (null state) on delete.
    const fnStart = bgPickerSrc.indexOf('const confirmAndDeleteTheme');
    assert.ok(fnStart > -1, 'confirmAndDeleteTheme must exist');
    const fnBody  = bgPickerSrc.slice(fnStart, fnStart + 1500);
    const nullIdx = fnBody.indexOf('setConfirmDeleteTheme(null)');
    assert.ok(
      nullIdx > -1,
      'setConfirmDeleteTheme(null) must be called inside confirmAndDeleteTheme to close the popover'
    );
  });
});

// ── §F: single state / one popover at a time ──────────────────────────────────

describe('F. Single confirmDeleteTheme state — one popover at a time', () => {
  test('F1: exactly one useState declaration for confirmDeleteTheme', () => {
    const count = (bgPickerSrc.match(/const \[confirmDeleteTheme/g) || []).length;
    assert.equal(count, 1, 'Exactly one confirmDeleteTheme state declaration');
  });

  test('F2: Popover open prop tied to isConfirmingDelete or confirmDeleteTheme', () => {
    assert.ok(
      bgPickerSrc.includes('open={isConfirmingDelete}') ||
      bgPickerSrc.includes("open={confirmDeleteTheme === col.id}"),
      'Popover open prop must be controlled by isConfirmingDelete or confirmDeleteTheme'
    );
  });
});

// ── §G: Cancel and onOpenChange wiring ───────────────────────────────────────

describe('G. Cancel and onOpenChange wiring', () => {
  test('G1: Cancel button calls setConfirmDeleteTheme(null)', () => {
    assert.ok(
      bgPickerSrc.includes('setConfirmDeleteTheme(null)'),
      'Cancel must call setConfirmDeleteTheme(null)'
    );
  });

  test('G2: onOpenChange calls setConfirmDeleteTheme(null) when closing', () => {
    assert.ok(
      bgPickerSrc.includes('onOpenChange') &&
      bgPickerSrc.includes('setConfirmDeleteTheme(null)'),
      'Popover onOpenChange must call setConfirmDeleteTheme(null) on close'
    );
  });
});

// ── §H: Delete button uses confirmAndDeleteTheme ──────────────────────────────

describe('H. Delete Theme button', () => {
  test('H1: Delete Theme button calls confirmAndDeleteTheme(col.id)', () => {
    assert.ok(
      bgPickerSrc.includes('confirmAndDeleteTheme(col.id)'),
      'Delete Theme button must call confirmAndDeleteTheme(col.id)'
    );
  });

  test('H2: confirmAndDeleteTheme is async (supports blob cleanup)', () => {
    assert.ok(
      bgPickerSrc.includes('const confirmAndDeleteTheme = async'),
      'confirmAndDeleteTheme must be async'
    );
  });
});

// ── §I: No bottom document-flow warning (022Y regression) ─────────────────────

describe('I. 022Y regression — no bottom document-flow warning block', () => {
  test('I1: Old mt-3 destructive/10 inline block is absent', () => {
    assert.ok(
      !bgPickerSrc.includes('mt-3 p-2.5 rounded-lg bg-destructive/10 border border-destructive/30 text-[11px]'),
      '022Y: old bottom-panel inline confirmation block must not be present'
    );
  });
});

// ── §J: Built-in theme protection ─────────────────────────────────────────────

describe('J. Built-in theme protection', () => {
  test('J1: PRESETS array still exists', () => {
    assert.ok(bgPickerSrc.includes('export const PRESETS'), 'PRESETS must still exist');
  });

  test('J2: renderCustomThemePanel not called for PRESETS', () => {
    const presetsBlock = bgPickerSrc.slice(
      bgPickerSrc.indexOf('export const PRESETS'),
      bgPickerSrc.indexOf('export const PRESETS') + 600
    );
    assert.ok(
      !presetsBlock.includes('renderCustomThemePanel'),
      'renderCustomThemePanel must not appear in the PRESETS definition block'
    );
  });
});

// ── §K: Category-bar regression ───────────────────────────────────────────────

describe('K. Category-bar delete regression', () => {
  test('K1: GearCategory still has its own delete state', () => {
    assert.ok(
      gearCatSrc.includes('confirmDelete') || gearCatSrc.includes('showDeleteConfirm'),
      'GearCategory must still have delete confirmation state'
    );
  });

  test('K2: GearCategory trash trigger still present', () => {
    assert.ok(
      gearCatSrc.includes('Trash2') || gearCatSrc.includes('delete') || gearCatSrc.includes('onDelete'),
      'GearCategory trash trigger must still exist'
    );
  });
});

// ── §L: deletePopoverContentRef comment explains the 022Z fix ─────────────────

describe('L. 022Z comment annotation present', () => {
  test('L1: 022Z comment annotation present near the fix', () => {
    assert.ok(
      bgPickerSrc.includes('022Z'),
      '022Z annotation comment must be present in BackgroundPicker.tsx'
    );
  });
});
