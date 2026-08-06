/**
 * Shared layout definition for GearCategory column headers and GearRow item rows.
 *
 * ── Outer grid: 4 columns ────────────────────────────────────────────────────
 *  1. auto  — checkbox + drag-grip
 *  2. auto  — TYPE input  (w-20 sm:w-28)
 *  3. 1fr   — DESCRIPTION (flexible; receives all width the right group doesn't use)
 *  4. auto  — right-side column group (a flex container with explicit widths)
 *
 * Reducing the total width of the right-side group makes DESCRIPTION genuinely
 * wider, because 1fr absorbs the freed space.
 *
 * ── Right-side group ─────────────────────────────────────────────────────────
 * The group is a flex row split into two sub-rows with different gaps:
 *
 *  Sub-row A  (gap-3 = 12 px between each):  MOVE · WEIGHT · QTY
 *  6 px spacer                                                    ← only gap reduced
 *  Sub-row B  (gap-3 = 12 px):               TOTAL · DELETE
 *
 * Previous QTY-to-TOTAL gap: 12 px (gap-3 in the old flat grid)
 * New QTY-to-TOTAL gap:       6 px  (w-1.5 explicit spacer)
 *
 * Use every constant below in both GearCategory (header) and GearRow (row) —
 * never hard-code sizes in the individual files.
 */

// ── Outer grid ───────────────────────────────────────────────────────────────
export const GEAR_GRID_COLS = 'grid-cols-[auto_auto_1fr_auto]';
export const GEAR_GRID_GAP  = 'gap-x-3';

// ── Right-group column widths ─────────────────────────────────────────────────
export const RG_MOVE_W   = 'w-8';        // 32 px — chevron tap target
export const RG_WEIGHT_W = 'w-[90px]';   // 90 px — weight value + unit label
export const RG_QTY_W    = 'w-14';       // 56 px — qty control (fits 1–20 comfortably)
export const RG_TOTAL_W  = 'w-[88px]';   // 88 px — total value (two lines)
export const RG_DELETE_W = 'w-6';        // 24 px — delete/spacer
