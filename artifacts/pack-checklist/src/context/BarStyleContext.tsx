/**
 * BarStyleContext.tsx — Prompt 023E / 023G / 023N / 023O
 *
 * Provides bar/pill color, font, text-color, and transparency customization
 * to all checklist components without prop-drilling.
 *
 * Default values are empty strings / 1 (solid) so components see zero visual
 * change unless the user sets a custom value.
 *
 * 023O: All helpers now apply transparency to the *effective* bar color:
 *   effectiveColor = customBarColor ?? CSS-variable default
 * This means Transparency works even when no custom Bar Color is selected.
 */
import React, { createContext, useContext } from 'react';

export interface BarStyleContextValue {
  /** Hex/CSS background color for bars and pills. '' = use Tailwind default. */
  barColor: string;
  /** CSS font-family string for bar/pill text. '' = use inherited font. */
  barFont: string;
  /** Hex/CSS text color for bars and pills. '' = use Tailwind default. */
  barTextColor: string;
  /**
   * 023G: Background opacity for bars/pills (0 = fully transparent, 1 = solid).
   * Only affects the background surface — text and icons remain fully opaque.
   * Default is 1 (solid / fully opaque).
   */
  barTransparency: number;
}

const DEFAULT_BAR_STYLE: BarStyleContextValue = {
  barColor:        '',
  barFont:         '',
  barTextColor:    '',
  barTransparency: 1,
};

const BarStyleContext = createContext<BarStyleContextValue>(DEFAULT_BAR_STYLE);

export const BarStyleProvider = BarStyleContext.Provider;

/** Returns the current bar style context values. */
export function useBarStyle(): BarStyleContextValue {
  return useContext(BarStyleContext);
}

// ── Internal helper ──────────────────────────────────────────────────────────

/**
 * Converts a hex color string to an rgba(...) string with the given alpha.
 * Supports #rgb and #rrggbb formats.  Returns the original string unchanged
 * if the format is unrecognised (e.g. already rgba/named colours).
 */
function hexToRgba(hex: string, alpha: number): string {
  const cleaned = hex.trim().replace(/^#/, '');
  let r: number, g: number, b: number;
  if (cleaned.length === 3) {
    r = parseInt(cleaned[0] + cleaned[0], 16);
    g = parseInt(cleaned[1] + cleaned[1], 16);
    b = parseInt(cleaned[2] + cleaned[2], 16);
  } else if (cleaned.length === 6) {
    r = parseInt(cleaned.slice(0, 2), 16);
    g = parseInt(cleaned.slice(2, 4), 16);
    b = parseInt(cleaned.slice(4, 6), 16);
  } else {
    return hex; // unrecognised — pass through
  }
  if (isNaN(r) || isNaN(g) || isNaN(b)) return hex;
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
}

/** Extract and clamp the transparency alpha from a BarStyleContextValue. */
function resolveAlpha(v: BarStyleContextValue): number {
  return typeof v.barTransparency === 'number'
    ? Math.max(0, Math.min(1, v.barTransparency))
    : 1;
}

// ── Public helpers ───────────────────────────────────────────────────────────

/**
 * Returns an inline style object for bar/pill BACKGROUND wrapper elements.
 *
 * Custom color path:  applies barColor with current transparency (alpha).
 * Default color path: applies transparency to the default `bg-muted` surface
 *   (base opacity 1.0) by writing `hsl(var(--muted) / α)` as an inline style.
 *   Light/dark mode is preserved because --muted is a CSS custom property.
 *
 * Returns {} at Solid (alpha = 1) with no custom color — Tailwind governs.
 */
export function barBgStyle(v: BarStyleContextValue): React.CSSProperties {
  const alpha = resolveAlpha(v);
  if (v.barColor) {
    return { backgroundColor: alpha < 1 ? hexToRgba(v.barColor, alpha) : v.barColor };
  }
  // 023O: no custom color — apply transparency to the CSS-variable default (bg-muted)
  if (alpha < 1) return { backgroundColor: `hsl(var(--muted) / ${alpha.toFixed(4)})` };
  return {};
}

/**
 * Returns an inline style object for bar/pill TEXT/ICON elements.
 * Empty object when no custom color is set.
 */
export function barFgStyle(v: BarStyleContextValue): React.CSSProperties {
  return v.barTextColor ? { color: v.barTextColor } : {};
}

/**
 * Returns a combined inline style object for bar/pill elements that
 * should receive all customizations (background, text, font).
 *
 * Custom color path:  applies barColor with current transparency.
 * Default color path: applies transparency to the `bg-muted/30` default
 *   (bar headers) by writing `hsl(var(--muted) / α×0.3)` as an inline style.
 *   At Solid (alpha = 1) with no custom color, returns {} so Tailwind's
 *   bg-muted/30 class continues to govern the bar header background.
 */
export function barCombinedStyle(v: BarStyleContextValue): React.CSSProperties {
  const alpha = resolveAlpha(v);
  const s: React.CSSProperties = {};

  if (v.barColor) {
    s.backgroundColor = alpha < 1 ? hexToRgba(v.barColor, alpha) : v.barColor;
  } else if (alpha < 1) {
    // 023O: no custom color — scale the bg-muted/30 bar-header default by alpha.
    // effective alpha = barTransparency × 0.3 (preserves the 30 % default at solid).
    s.backgroundColor = `hsl(var(--muted) / ${(alpha * 0.3).toFixed(4)})`;
  }

  if (v.barTextColor) s.color      = v.barTextColor;
  if (v.barFont)      s.fontFamily = v.barFont;
  return s;
}

/**
 * Returns an inline style object with only fontFamily.
 * Apply to outer component wrapper divs so the selected font cascades
 * to both the bar/header AND the expanded panel content beneath it.
 * Empty object when no custom font is set (preserves Tailwind default).
 */
export function barFontStyle(v: BarStyleContextValue): React.CSSProperties {
  return v.barFont ? { fontFamily: v.barFont } : {};
}

/**
 * Returns an inline style object for the OUTER CARD WRAPPER that contains
 * a bar header (GearCategory, Pack Summary, Weight Distribution, etc.).
 *
 * When barTransparency < 1, removes the card wrapper's opaque bg-card
 * background so the page background image shows through the semi-transparent
 * bar header.  Works regardless of whether a custom bar color is set:
 *   - custom color: transparent wrapper lets custom-color header show the photo.
 *   - default color: transparent wrapper lets the default-muted header show the photo.
 *
 * Returns {} at Solid (alpha = 1) — Tailwind's bg-card class governs.
 */
export function barCardStyle(v: BarStyleContextValue): React.CSSProperties {
  const alpha = resolveAlpha(v);
  // 023O: previously guarded by `if (!v.barColor) return {}`.
  // Now applies to both custom-color and default-color paths.
  return alpha < 1 ? { backgroundColor: 'transparent' } : {};
}

/**
 * 023O: Returns an inline style object for the +Base / —Base toggle pill
 * in GearCategory.  Routes through the same effective-color + transparency
 * calculation as the other bar/pill surfaces.
 *
 * countsToBase = true  → full bar color (or primary/10 default) × alpha
 * countsToBase = false → 50 % hex weight (or muted/40 default) × alpha
 *
 * Always includes borderColor and text/font when a custom bar color is active,
 * so the pill stays visually integrated with the rest of the bar.
 */
export function barBasePillStyle(
  v: BarStyleContextValue,
  countsToBase: boolean,
): React.CSSProperties {
  const alpha = resolveAlpha(v);
  const style: React.CSSProperties = {};

  if (v.barTextColor) style.color      = v.barTextColor;
  if (v.barFont)      style.fontFamily = v.barFont;

  if (v.barColor) {
    style.borderColor = v.barColor;
    // countsToBase=true: full bar color × transparency.
    // countsToBase=false: ~31 % opacity (matching legacy ${barColor}50 hex-alpha) × transparency.
    const effectiveAlpha = countsToBase ? alpha : alpha * 0.314;
    style.backgroundColor = effectiveAlpha < 1
      ? hexToRgba(v.barColor, effectiveAlpha)
      : (countsToBase ? v.barColor : `${v.barColor}50`);
  } else if (alpha < 1) {
    // 023O: no custom color — scale the CSS-variable defaults by alpha.
    // countsToBase=true  class: bg-primary/10  → effective: primary × (alpha × 0.1)
    // countsToBase=false class: bg-muted/40    → effective: muted   × (alpha × 0.4)
    style.backgroundColor = countsToBase
      ? `hsl(var(--primary) / ${(alpha * 0.1).toFixed(4)})`
      : `hsl(var(--muted) / ${(alpha * 0.4).toFixed(4)})`;
  }

  return style;
}
