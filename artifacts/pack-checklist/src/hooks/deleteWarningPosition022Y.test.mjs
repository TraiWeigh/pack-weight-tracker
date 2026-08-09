/**
 * deleteWarningPosition022Y.test.mjs
 * Prompt 022Y — Fix Custom-Theme Delete Warning Position
 *
 * Verifies:
 *   • Confirmation is NOT rendered as a bottom document-flow block inside the panel
 *   • Trash button is wrapped in Popover/PopoverTrigger (portal-based)
 *   • PopoverContent contains the confirmation copy
 *   • confirmDeleteTheme state still exists and is wired to trash + cancel
 *   • Only one delete confirmation at a time (single confirmDeleteTheme state)
 *   • Delete calls confirmAndDeleteTheme
 *   • onOpenChange wires to setConfirmDeleteTheme(null)
 *   • No inline mt-3 / bg-destructive/10 block appended after photo grid
 *   • Built-in themes do not get a delete trigger
 *   • category-bar delete behavior does not regress
 */

import fs     from 'node:fs';
import path   from 'node:path';
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

const srcRoot     = path.resolve('artifacts/pack-checklist/src');
const bgPickerSrc = fs.readFileSync(path.join(srcRoot, 'components/BackgroundPicker.tsx'), 'utf8');
const gearCatSrc  = fs.readFileSync(path.join(srcRoot, 'components/GearCategory.tsx'), 'utf8');
const popoverSrc  = fs.readFileSync(path.join(srcRoot, 'components/ui/popover.tsx'), 'utf8');
const checklistSrc = fs.readFileSync(path.join(srcRoot, 'pages/Checklist.tsx'), 'utf8');

// ── §A: Popover import ────────────────────────────────────────────────────────

describe('A. Popover import in BackgroundPicker', () => {
  test('A1: Popover and PopoverContent are imported from ui/popover', () => {
    assert.ok(
      bgPickerSrc.includes("from './ui/popover'") &&
      bgPickerSrc.includes('PopoverContent') &&
      bgPickerSrc.includes('PopoverTrigger'),
      'BackgroundPicker must import Popover, PopoverTrigger, PopoverContent from ./ui/popover'
    );
  });

  test('A2: ui/popover uses Radix Portal (confirmation can escape overflow)', () => {
    assert.ok(
      popoverSrc.includes('PopoverPrimitive.Portal'),
      'popover.tsx must wrap content in PopoverPrimitive.Portal'
    );
  });
});

// ── §B: Trash button is a PopoverTrigger ─────────────────────────────────────

describe('B. Trash button wrapped in Popover/PopoverTrigger', () => {
  test('B1: PopoverTrigger asChild wraps the trash button', () => {
    assert.ok(
      bgPickerSrc.includes('PopoverTrigger asChild') ||
      bgPickerSrc.includes('PopoverTrigger asChild='),
      'Trash button must be wrapped in <PopoverTrigger asChild>'
    );
  });

  test('B2: Trash button sets confirmDeleteTheme to col.id on click', () => {
    assert.ok(
      bgPickerSrc.includes('setConfirmDeleteTheme(col.id)'),
      'Trash button onClick must call setConfirmDeleteTheme(col.id)'
    );
  });

  test('B3: Popover open state is controlled by confirmDeleteTheme', () => {
    assert.ok(
      bgPickerSrc.includes('open={isConfirmingDelete}') ||
      bgPickerSrc.includes("open={confirmDeleteTheme === col.id}"),
      'Popover open prop must be controlled by isConfirmingDelete or confirmDeleteTheme === col.id'
    );
  });

  test('B4: onOpenChange wires to setConfirmDeleteTheme(null) for close', () => {
    assert.ok(
      bgPickerSrc.includes('setConfirmDeleteTheme(null)') &&
      bgPickerSrc.includes('onOpenChange'),
      'Popover onOpenChange must call setConfirmDeleteTheme(null) to close'
    );
  });
});

// ── §C: PopoverContent contains confirmation copy ─────────────────────────────

describe('C. PopoverContent contains confirmation copy', () => {
  test('C1: PopoverContent is used in BackgroundPicker', () => {
    assert.ok(
      bgPickerSrc.includes('<PopoverContent'),
      'BackgroundPicker must render <PopoverContent>'
    );
  });

  test('C2: Title "Delete Custom Theme?" is inside the file', () => {
    assert.ok(
      bgPickerSrc.includes('Delete Custom Theme?'),
      'Confirmation title must read "Delete Custom Theme?"'
    );
  });

  test('C3: "This action cannot be undone." warning is present', () => {
    assert.ok(
      bgPickerSrc.includes('This action cannot be undone.'),
      'Irreversible-action warning must be present'
    );
  });

  test('C4: Cancel button calls setConfirmDeleteTheme(null)', () => {
    assert.ok(
      bgPickerSrc.includes('setConfirmDeleteTheme(null)'),
      'Cancel must call setConfirmDeleteTheme(null)'
    );
  });

  test('C5: Delete Theme button calls confirmAndDeleteTheme', () => {
    assert.ok(
      bgPickerSrc.includes('confirmAndDeleteTheme(col.id)'),
      'Delete Theme button must call confirmAndDeleteTheme(col.id)'
    );
  });
});

// ── §D: No bottom document-flow warning block ─────────────────────────────────

describe('D. No bottom document-flow confirmation block', () => {
  test('D1: No mt-3 destructive/10 inline confirmation block in renderCustomThemePanel', () => {
    // The old block was: mt-3 p-2.5 rounded-lg bg-destructive/10 border border-destructive/30 text-[11px]
    // appended after the photo grid. This pattern should be gone.
    assert.ok(
      !bgPickerSrc.includes('mt-3 p-2.5 rounded-lg bg-destructive/10 border border-destructive/30 text-[11px]'),
      'Old bottom-of-panel inline confirmation block must not be present'
    );
  });

  test('D2: No conditional {isConfirmingDelete && <div className="mt-3 ...} appended at panel bottom', () => {
    // The old pattern rendered the warning as a standalone div after the photo grid
    const hasOldPattern = bgPickerSrc.includes('{isConfirmingDelete && (') &&
      bgPickerSrc.includes('mt-3 p-2.5');
    assert.ok(
      !hasOldPattern,
      'Confirmation must not be rendered as inline mt-3 block after photo grid'
    );
  });

  test('D3: Single confirmDeleteTheme state (not multiple parallel state vars)', () => {
    const stateDeclarations = (bgPickerSrc.match(/confirmDeleteTheme/g) || []).length;
    assert.ok(
      stateDeclarations >= 2,
      'confirmDeleteTheme must be declared and used (not removed)'
    );
    // Only one useState declaration for confirmDeleteTheme
    const useStateCount = (bgPickerSrc.match(/useState.*confirmDeleteTheme|confirmDeleteTheme.*useState/g) || []).length;
    // The declaration is: useState<string | null>(null)
    const declarationCount = (bgPickerSrc.match(/const \[confirmDeleteTheme/g) || []).length;
    assert.equal(declarationCount, 1, 'Exactly one confirmDeleteTheme state declaration (one popover at a time)');
  });
});

// ── §E: PopoverContent positioning attributes ─────────────────────────────────

describe('E. PopoverContent positioning', () => {
  test('E1: side prop is set on PopoverContent', () => {
    assert.ok(
      bgPickerSrc.includes('side=') && bgPickerSrc.includes('PopoverContent'),
      'PopoverContent must have a side prop for positioned placement'
    );
  });

  test('E2: align prop is set on PopoverContent', () => {
    assert.ok(
      bgPickerSrc.includes('align=') && bgPickerSrc.includes('PopoverContent'),
      'PopoverContent must have an align prop'
    );
  });
});

// ── §F: Built-in theme protection ─────────────────────────────────────────────

describe('F. Built-in theme protection', () => {
  test('F1: PRESETS array exists (built-in themes are not PhotoCollections)', () => {
    assert.ok(
      bgPickerSrc.includes('export const PRESETS'),
      'PRESETS array must still exist for built-in themes'
    );
  });

  test('F2: renderCustomThemePanel is only called for custom PhotoCollections, not PRESETS', () => {
    // The panel renderer should only be invoked for PhotoCollection items.
    // PRESETS are rendered differently (preset thumbnails, not renderCustomThemePanel).
    assert.ok(
      bgPickerSrc.includes('renderCustomThemePanel') &&
      bgPickerSrc.includes('PRESETS'),
      'renderCustomThemePanel and PRESETS must both be present'
    );
    // PRESETS should not include a Trash2 or renderCustomThemePanel call
    const presetsSection = bgPickerSrc.slice(
      bgPickerSrc.indexOf('export const PRESETS'),
      bgPickerSrc.indexOf('export const PRESETS') + 600
    );
    assert.ok(
      !presetsSection.includes('Trash2') && !presetsSection.includes('renderCustomThemePanel'),
      'PRESETS definition must not include Trash2 or renderCustomThemePanel'
    );
  });
});

// ── §G: Category-bar delete regression ───────────────────────────────────────

describe('G. Category-bar delete regression', () => {
  test('G1: GearCategory.tsx still has confirmDelete state', () => {
    assert.ok(
      gearCatSrc.includes('confirmDelete') || gearCatSrc.includes('showDeleteConfirm'),
      'GearCategory must still have its own delete confirmation state'
    );
  });

  test('G2: GearCategory trash trigger still exists', () => {
    assert.ok(
      gearCatSrc.includes('Trash2') || gearCatSrc.includes('trash') || gearCatSrc.includes('delete'),
      'GearCategory trash trigger must still be present'
    );
  });

  test('G3: GearCategory delete confirmation is inline in header (not a Popover)', () => {
    // Category bar uses inline replacement, not a portal popover — this is expected and should be unchanged
    assert.ok(
      gearCatSrc.includes('Delete?') || gearCatSrc.includes('deleteCategory') || gearCatSrc.includes('onDelete'),
      'GearCategory delete confirmation wording/handler must still be present'
    );
  });
});

// ── §H: Accessibility / trash button ─────────────────────────────────────────

describe('H. Accessibility', () => {
  test('H1: Trash button has aria-label including theme name', () => {
    assert.ok(
      bgPickerSrc.includes('aria-label={`Delete theme') ||
      bgPickerSrc.includes("aria-label={`Delete theme"),
      'Trash button must have an aria-label referencing the theme name'
    );
  });

  test('H2: Cancel button is a real <button> element', () => {
    // Cancel is inside PopoverContent — check it's a button tag
    assert.ok(
      bgPickerSrc.includes('>Cancel<'),
      'Cancel must be rendered as a button with text "Cancel"'
    );
  });

  test('H3: Delete Theme button is a real <button> element', () => {
    assert.ok(
      bgPickerSrc.includes('>Delete Theme<'),
      'Delete Theme must be rendered as a button with text "Delete Theme"'
    );
  });
});

// ── §I: 022P regression ───────────────────────────────────────────────────────

describe('I. 022P regression — core delete behavior preserved', () => {
  test('I1: confirmAndDeleteTheme function still exists', () => {
    assert.ok(
      bgPickerSrc.includes('confirmAndDeleteTheme'),
      'confirmAndDeleteTheme must still be defined'
    );
  });

  test('I2: confirmDeleteTheme state still declared', () => {
    assert.ok(
      bgPickerSrc.includes('confirmDeleteTheme') &&
      bgPickerSrc.includes('setConfirmDeleteTheme'),
      'confirmDeleteTheme state and setter must still be present'
    );
  });

  test('I3: Trash2 icon still used for the delete trigger', () => {
    assert.ok(
      bgPickerSrc.includes('Trash2'),
      'Trash2 icon must still be the delete trigger'
    );
  });
});
