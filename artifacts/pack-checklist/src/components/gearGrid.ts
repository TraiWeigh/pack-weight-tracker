/**
 * Shared grid definition for GearCategory column headers and GearRow item rows.
 *
 * Both must use GEAR_GRID_COLS and GEAR_GRID_GAP so columns stay perfectly
 * aligned regardless of content. Change here only — never in the individual
 * component files.
 *
 * Column order:
 *  1. auto  — checkbox + drag-grip
 *  2. auto  — TYPE input  (w-20 sm:w-28; header uses w-28 spacer)
 *  3. 1fr   — DESCRIPTION (flexible, always the widest column)
 *  4. 32px  — MOVE        (fixed; header label + chevron icon both centered)
 *  5. 90px  — WEIGHT
 *  6. 70px  — QTY
 *  7. 88px  — TOTAL
 *  8. auto  — DELETE button / spacer
 */
export const GEAR_GRID_COLS =
  'grid-cols-[auto_auto_1fr_32px_90px_70px_88px_auto]';

/** Use the same gap in both header and rows. */
export const GEAR_GRID_GAP = 'gap-3';
