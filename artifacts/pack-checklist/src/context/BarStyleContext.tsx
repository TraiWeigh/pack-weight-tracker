/**
 * BarStyleContext.tsx — Prompt 023E / 023G
 *
 * Provides bar/pill color, font, text-color, and transparency customization
 * to all checklist components without prop-drilling.
 *
 * Default values are empty strings / 1 (solid) so components see zero visual
 * change unless the user sets a custom value.
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

// ── Public helpers ───────────────────────────────────────────────────────────

/**
 * Returns an inline style object for bar/pill BACKGROUND elements.
 * Applies barColor with the current transparency (alpha channel).
 * Returns an empty object when no custom color is set.
 */
export function barBgStyle(v: BarStyleContextValue): React.CSSProperties {
  if (!v.barColor) return {};
  const alpha = typeof v.barTransparency === 'number'
    ? Math.max(0, Math.min(1, v.barTransparency))
    : 1;
  return { backgroundColor: alpha < 1 ? hexToRgba(v.barColor, alpha) : v.barColor };
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
 * Each property is omitted when the corresponding value is empty,
 * so Tailwind classes continue to govern un-customized properties.
 *
 * Background alpha is derived from barTransparency so the surface becomes
 * translucent while text/icons remain at full opacity.
 */
export function barCombinedStyle(v: BarStyleContextValue): React.CSSProperties {
  const s: React.CSSProperties = {};
  if (v.barColor) {
    const alpha = typeof v.barTransparency === 'number'
      ? Math.max(0, Math.min(1, v.barTransparency))
      : 1;
    s.backgroundColor = alpha < 1 ? hexToRgba(v.barColor, alpha) : v.barColor;
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
