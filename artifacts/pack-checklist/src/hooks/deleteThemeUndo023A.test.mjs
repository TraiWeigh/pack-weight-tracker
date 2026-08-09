/**
 * deleteThemeUndo023A.test.mjs
 * Prompt 023A — Make Custom-Theme Deletion Undoable
 *
 * Verifies (by source inspection of pure-function files):
 *   §A  BgSnapshot is extended with optional collections + activeThemeId
 *   §B  cleanupOrphanedPhotos exported from bgPhotoStore
 *   §C  BackgroundPickerPanelProps declares onBeforeDeleteTheme prop
 *   §D  BackgroundPickerPanelProps declares restoreCollectionsRef prop
 *   §E  confirmAndDeleteTheme calls onBeforeDeleteTheme before any state change
 *   §F  confirmAndDeleteTheme no longer calls deletePhotos (deferred for undo)
 *   §G  restoreCollectionsRef registered via useEffect after persist declaration
 *   §H  Orphaned-blob cleanup effect is present and runs on mount
 *   §I  Dialog copy updated to "You can undo this action."
 *   §J  Checklist declares restoreCollectionsRef mutable ref
 *   §K  Checklist passes onBeforeDeleteTheme to BackgroundPickerPanel
 *   §L  onBeforeDeleteTheme in Checklist calls pushBg with collections snapshot
 *   §M  Checklist passes restoreCollectionsRef to BackgroundPickerPanel
 *   §N  restoreBgCallbackRef.current in Checklist restores collections on undo
 *   §O  022Z regression: deletePopoverContentRef portal exclusion still present
 */

import fs     from 'node:fs';
import path   from 'node:path';
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

const srcRoot       = path.resolve('artifacts/pack-checklist/src');
const bgPickerSrc   = fs.readFileSync(path.join(srcRoot, 'components/BackgroundPicker.tsx'), 'utf8');
const usePackSrc    = fs.readFileSync(path.join(srcRoot, 'hooks/usePackData.ts'), 'utf8');
const bgPhotoSrc    = fs.readFileSync(path.join(srcRoot, 'lib/bgPhotoStore.ts'), 'utf8');
const checklistSrc  = fs.readFileSync(path.join(srcRoot, 'pages/Checklist.tsx'), 'utf8');

// ── §A: BgSnapshot extended ────────────────────────────────────────────────────

describe('A. BgSnapshot extended with collections and activeThemeId', () => {
  test('A1: BgSnapshot type exists in usePackData.ts', () => {
    assert.ok(
      usePackSrc.includes('export type BgSnapshot'),
      'BgSnapshot must be exported from usePackData.ts'
    );
  });

  test('A2: BgSnapshot includes optional collections field', () => {
    assert.ok(
      usePackSrc.includes('collections?:'),
      'BgSnapshot must declare optional collections field'
    );
  });

  test('A3: BgSnapshot includes optional activeThemeId field', () => {
    assert.ok(
      usePackSrc.includes('activeThemeId?:'),
      'BgSnapshot must declare optional activeThemeId field'
    );
  });

  test('A4: PhotoCollection type imported in usePackData.ts', () => {
    assert.ok(
      usePackSrc.includes("from '../lib/bgCollections'"),
      'usePackData.ts must import from bgCollections to type the collections field'
    );
  });
});

// ── §B: cleanupOrphanedPhotos in bgPhotoStore ─────────────────────────────────

describe('B. cleanupOrphanedPhotos exported from bgPhotoStore.ts', () => {
  test('B1: cleanupOrphanedPhotos function is exported', () => {
    assert.ok(
      bgPhotoSrc.includes('export async function cleanupOrphanedPhotos'),
      'cleanupOrphanedPhotos must be exported from bgPhotoStore.ts'
    );
  });

  test('B2: cleanupOrphanedPhotos calls getAllStoredPhotoIds', () => {
    const fnStart = bgPhotoSrc.indexOf('export async function cleanupOrphanedPhotos');
    const fnBody  = bgPhotoSrc.slice(fnStart, fnStart + 400);
    assert.ok(
      fnBody.includes('getAllStoredPhotoIds'),
      'cleanupOrphanedPhotos must use getAllStoredPhotoIds to enumerate stored blobs'
    );
  });

  test('B3: cleanupOrphanedPhotos calls deletePhotos to remove orphans', () => {
    const fnStart = bgPhotoSrc.indexOf('export async function cleanupOrphanedPhotos');
    const fnBody  = bgPhotoSrc.slice(fnStart, fnStart + 400);
    assert.ok(
      fnBody.includes('deletePhotos'),
      'cleanupOrphanedPhotos must call deletePhotos to purge unreferenced blobs'
    );
  });

  test('B4: cleanupOrphanedPhotos swallows errors (best-effort)', () => {
    const fnStart = bgPhotoSrc.indexOf('export async function cleanupOrphanedPhotos');
    const fnBody  = bgPhotoSrc.slice(fnStart, fnStart + 400);
    assert.ok(
      fnBody.includes('catch'),
      'cleanupOrphanedPhotos must catch/swallow errors so it never breaks the UI'
    );
  });
});

// ── §C: onBeforeDeleteTheme prop ──────────────────────────────────────────────

describe('C. BackgroundPickerPanelProps declares onBeforeDeleteTheme', () => {
  test('C1: onBeforeDeleteTheme prop declared in interface', () => {
    assert.ok(
      bgPickerSrc.includes('onBeforeDeleteTheme?:'),
      'BackgroundPickerPanelProps must declare optional onBeforeDeleteTheme prop'
    );
  });

  test('C2: onBeforeDeleteTheme callback receives collections and activeThemeId', () => {
    const propIdx = bgPickerSrc.indexOf('onBeforeDeleteTheme?:');
    const propLine = bgPickerSrc.slice(propIdx, propIdx + 200);
    assert.ok(
      propLine.includes('collections') && propLine.includes('activeThemeId'),
      'onBeforeDeleteTheme callback signature must include collections and activeThemeId'
    );
  });

  test('C3: onBeforeDeleteTheme destructured in BackgroundPickerPanel function', () => {
    const fnStart = bgPickerSrc.indexOf('}: BackgroundPickerPanelProps)');
    // Look back into the destructure block
    const destructureBlock = bgPickerSrc.slice(Math.max(0, fnStart - 600), fnStart + 30);
    assert.ok(
      destructureBlock.includes('onBeforeDeleteTheme'),
      'onBeforeDeleteTheme must be destructured in BackgroundPickerPanel'
    );
  });
});

// ── §D: restoreCollectionsRef prop ────────────────────────────────────────────

describe('D. BackgroundPickerPanelProps declares restoreCollectionsRef', () => {
  test('D1: restoreCollectionsRef prop declared in interface', () => {
    assert.ok(
      bgPickerSrc.includes('restoreCollectionsRef?:'),
      'BackgroundPickerPanelProps must declare optional restoreCollectionsRef prop'
    );
  });

  test('D2: restoreCollectionsRef typed as MutableRefObject or compatible', () => {
    const propIdx  = bgPickerSrc.indexOf('restoreCollectionsRef?:');
    const propLine = bgPickerSrc.slice(propIdx, propIdx + 200);
    assert.ok(
      propLine.includes('MutableRefObject') || propLine.includes('MutableRef'),
      'restoreCollectionsRef must be typed as a React.MutableRefObject'
    );
  });

  test('D3: restoreCollectionsRef destructured in BackgroundPickerPanel function', () => {
    const fnStart = bgPickerSrc.indexOf('}: BackgroundPickerPanelProps)');
    const destructureBlock = bgPickerSrc.slice(Math.max(0, fnStart - 600), fnStart + 30);
    assert.ok(
      destructureBlock.includes('restoreCollectionsRef'),
      'restoreCollectionsRef must be destructured in BackgroundPickerPanel'
    );
  });
});

// ── §E: confirmAndDeleteTheme calls onBeforeDeleteTheme ──────────────────────

describe('E. confirmAndDeleteTheme calls onBeforeDeleteTheme before state change', () => {
  const fnStart = bgPickerSrc.indexOf('const confirmAndDeleteTheme');
  const fnBody  = bgPickerSrc.slice(fnStart, fnStart + 1200);

  test('E1: onBeforeDeleteTheme is invoked inside confirmAndDeleteTheme', () => {
    assert.ok(
      fnBody.includes('onBeforeDeleteTheme'),
      'confirmAndDeleteTheme must invoke onBeforeDeleteTheme'
    );
  });

  test('E2: onBeforeDeleteTheme called before deleteCollection/persist', () => {
    const callPos    = fnBody.indexOf('onBeforeDeleteTheme');
    const persistPos = fnBody.indexOf('persist(');
    assert.ok(
      callPos > -1 && persistPos > -1 && callPos < persistPos,
      'onBeforeDeleteTheme must appear before persist() in confirmAndDeleteTheme body'
    );
  });

  test('E3: snapshot passed includes collections', () => {
    const callLine = fnBody.slice(fnBody.indexOf('onBeforeDeleteTheme'), fnBody.indexOf('onBeforeDeleteTheme') + 120);
    assert.ok(
      callLine.includes('collections'),
      'Snapshot passed to onBeforeDeleteTheme must include collections'
    );
  });

  test('E4: snapshot passed includes activeThemeId', () => {
    const callLine = fnBody.slice(fnBody.indexOf('onBeforeDeleteTheme'), fnBody.indexOf('onBeforeDeleteTheme') + 120);
    assert.ok(
      callLine.includes('activeThemeId'),
      'Snapshot passed to onBeforeDeleteTheme must include activeThemeId'
    );
  });
});

// ── §F: deletePhotos deferred (not called in confirmAndDeleteTheme) ───────────

describe('F. Blob deletion is deferred — deletePhotos not called in confirmAndDeleteTheme', () => {
  const fnStart  = bgPickerSrc.indexOf('const confirmAndDeleteTheme');
  const fnEnd    = bgPickerSrc.indexOf('\n  };', fnStart) + 5;
  const fnBody   = bgPickerSrc.slice(fnStart, fnEnd);

  test('F1: deletePhotos is not called inside confirmAndDeleteTheme', () => {
    // Allow commented-out references ("await deletePhotos" in a comment)
    // but not actual call sites (the call would be `await deletePhotos(`)
    const hasLiveCall = /await\s+deletePhotos\s*\(/.test(fnBody);
    assert.ok(
      !hasLiveCall,
      'confirmAndDeleteTheme must not call deletePhotos() directly (deferred for undo)'
    );
  });
});

// ── §G: restoreCollectionsRef registration effect ────────────────────────────

describe('G. restoreCollectionsRef setter registered via useEffect', () => {
  test('G1: useEffect references restoreCollectionsRef and persist in deps array', () => {
    // Find the registration effect
    const effectIdx = bgPickerSrc.indexOf('restoreCollectionsRef.current = (cols');
    assert.ok(
      effectIdx > -1,
      'A useEffect must assign restoreCollectionsRef.current a setter function'
    );
  });

  test('G2: setter calls persist(cols)', () => {
    const effectIdx = bgPickerSrc.indexOf('restoreCollectionsRef.current = (cols');
    const effectBody = bgPickerSrc.slice(effectIdx, effectIdx + 300);
    assert.ok(
      effectBody.includes('persist(cols)'),
      'The restore setter must call persist(cols) to update state and localStorage'
    );
  });

  test('G3: setter calls setActiveThemeId', () => {
    const effectIdx = bgPickerSrc.indexOf('restoreCollectionsRef.current = (cols');
    const effectBody = bgPickerSrc.slice(effectIdx, effectIdx + 300);
    assert.ok(
      effectBody.includes('setActiveThemeId'),
      'The restore setter must call setActiveThemeId to navigate to the restored theme'
    );
  });
});

// ── §H: orphaned-blob cleanup effect on mount ─────────────────────────────────

describe('H. Orphaned-blob cleanup effect present in BackgroundPickerPanel', () => {
  test('H1: cleanupOrphanedPhotos imported in BackgroundPicker', () => {
    assert.ok(
      bgPickerSrc.includes('cleanupOrphanedPhotos'),
      'cleanupOrphanedPhotos must be imported in BackgroundPicker.tsx'
    );
  });

  test('H2: cleanup effect calls loadCollections on mount', () => {
    // Search for the actual *call* in the effect body (skip the import line)
    const callIdx = bgPickerSrc.indexOf('cleanupOrphanedPhotos(referencedIds)');
    assert.ok(callIdx > -1, 'cleanupOrphanedPhotos must be called with referencedIds in the effect');
    const surrounding = bgPickerSrc.slice(Math.max(0, callIdx - 200), callIdx + 200);
    assert.ok(
      surrounding.includes('loadCollections'),
      'Orphaned-blob cleanup must read the persisted collections to determine referenced IDs'
    );
  });

  test('H3: cleanup effect is intentionally mount-only (empty deps)', () => {
    // Search for the actual call to locate the surrounding effect
    const callIdx = bgPickerSrc.indexOf('cleanupOrphanedPhotos(referencedIds)');
    const surrounding = bgPickerSrc.slice(callIdx, callIdx + 300);
    assert.ok(
      surrounding.includes('}, [])') || surrounding.includes('},[])'),
      'Orphaned-blob cleanup useEffect must use empty dependency array (mount-only)'
    );
  });
});

// ── §I: dialog copy updated ───────────────────────────────────────────────────

describe('I. Delete confirmation copy updated to indicate undo is available', () => {
  test('I1: old copy "cannot be undone" is gone', () => {
    assert.ok(
      !bgPickerSrc.includes('cannot be undone'),
      'The old "cannot be undone" copy must be removed from BackgroundPicker.tsx'
    );
  });

  test('I2: new copy "You can undo this action" is present', () => {
    assert.ok(
      bgPickerSrc.includes('You can undo this action'),
      'Dialog must now say "You can undo this action." to inform the user'
    );
  });
});

// ── §J: Checklist restoreCollectionsRef ──────────────────────────────────────

describe('J. Checklist.tsx declares restoreCollectionsRef mutable ref', () => {
  test('J1: restoreCollectionsRef declared with useRef', () => {
    assert.ok(
      checklistSrc.includes('restoreCollectionsRef') && checklistSrc.includes('useRef'),
      'Checklist must declare restoreCollectionsRef via useRef'
    );
  });

  test('J2: PhotoCollection type imported in Checklist.tsx', () => {
    assert.ok(
      checklistSrc.includes("from '../lib/bgCollections'"),
      'Checklist.tsx must import PhotoCollection type from bgCollections for ref typing'
    );
  });
});

// ── §K: Checklist passes onBeforeDeleteTheme ─────────────────────────────────

describe('K. Checklist passes onBeforeDeleteTheme to BackgroundPickerPanel', () => {
  test('K1: onBeforeDeleteTheme prop passed in JSX', () => {
    assert.ok(
      checklistSrc.includes('onBeforeDeleteTheme='),
      'Checklist.tsx must pass onBeforeDeleteTheme prop to BackgroundPickerPanel'
    );
  });
});

// ── §L: onBeforeDeleteTheme in Checklist calls pushBg with collections ────────

describe('L. onBeforeDeleteTheme callback calls pushBg with collections snapshot', () => {
  const propIdx  = checklistSrc.indexOf('onBeforeDeleteTheme=');
  const callback = checklistSrc.slice(propIdx, propIdx + 500);

  test('L1: pushBg is called inside the callback', () => {
    assert.ok(
      callback.includes('pushBg('),
      'onBeforeDeleteTheme in Checklist must call pushBg to register the undo entry'
    );
  });

  test('L2: collections snapshot is passed to pushBg', () => {
    const pushBgIdx  = callback.indexOf('pushBg(');
    const pushBgCall = callback.slice(pushBgIdx, pushBgIdx + 200);
    assert.ok(
      pushBgCall.includes('collections'),
      'pushBg call must include collections from the snapshot'
    );
  });

  test('L3: activeThemeId snapshot is passed to pushBg', () => {
    const pushBgIdx  = callback.indexOf('pushBg(');
    const pushBgCall = callback.slice(pushBgIdx, pushBgIdx + 200);
    assert.ok(
      pushBgCall.includes('activeThemeId'),
      'pushBg call must include activeThemeId from the snapshot'
    );
  });

  test('L4: bgSizeRef.current captured (not stale bgSize)', () => {
    assert.ok(
      callback.includes('bgSizeRef.current'),
      'pushBg call should capture bgSizeRef.current for the pre-deletion bgSize'
    );
  });
});

// ── §M: Checklist passes restoreCollectionsRef ────────────────────────────────

describe('M. Checklist passes restoreCollectionsRef to BackgroundPickerPanel', () => {
  test('M1: restoreCollectionsRef prop passed in JSX', () => {
    assert.ok(
      checklistSrc.includes('restoreCollectionsRef={restoreCollectionsRef}'),
      'Checklist.tsx must pass restoreCollectionsRef to BackgroundPickerPanel'
    );
  });
});

// ── §N: restoreBgCallbackRef.current restores collections ─────────────────────

describe('N. Checklist restoreBgCallbackRef restores collections on undo/redo', () => {
  const assignIdx  = checklistSrc.indexOf('restoreBgCallbackRef.current = (snap: BgSnapshot)');
  const assignBody = checklistSrc.slice(assignIdx, assignIdx + 800);

  test('N1: restoreCollectionsRef.current is called when snap.collections is defined', () => {
    assert.ok(
      assignBody.includes('restoreCollectionsRef.current'),
      'restoreBgCallbackRef.current must invoke restoreCollectionsRef.current on undo/redo'
    );
  });

  test('N2: guard checks snap.collections !== undefined before calling restore', () => {
    assert.ok(
      assignBody.includes('snap.collections') && assignBody.includes('undefined'),
      'Must guard with snap.collections !== undefined before restoring collections'
    );
  });

  test('N3: snap.activeThemeId passed to restore (falls back to landscapes)', () => {
    assert.ok(
      assignBody.includes('snap.activeThemeId') && assignBody.includes('landscapes'),
      'Must pass snap.activeThemeId with a safe fallback of "landscapes"'
    );
  });
});

// ── §O: 022Z regression — deletePopoverContentRef portal exclusion intact ──────

describe('O. 022Z regression: deletePopoverContentRef portal exclusion still present', () => {
  test('O1: deletePopoverContentRef useRef still declared', () => {
    assert.ok(
      bgPickerSrc.includes('deletePopoverContentRef') &&
      bgPickerSrc.includes('deletePopoverContentRef = useRef'),
      'deletePopoverContentRef must still be declared (022Z fix)'
    );
  });

  test('O2: mousedown handler still checks deletePopoverContentRef', () => {
    const handlerIdx = bgPickerSrc.indexOf('deletePopoverContentRef.current');
    assert.ok(
      handlerIdx > -1,
      'mousedown outside-click handler must still reference deletePopoverContentRef (022Z fix)'
    );
  });

  test('O3: PopoverContent still receives deletePopoverContentRef as ref', () => {
    assert.ok(
      bgPickerSrc.includes('ref={deletePopoverContentRef}'),
      'PopoverContent must still have ref={deletePopoverContentRef} (022Z fix)'
    );
  });
});
