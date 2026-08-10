/**
 * BarStyleContext.tsx — Prompt 023E
 *
 * Provides bar/pill color, font, and text-color customization
 * to all checklist components without prop-drilling.
 *
 * Default values are empty strings so components that don't apply
 * these styles see zero visual change unless the user sets a custom value.
 */
import React, { createContext, useContext } from 'react';

export interface BarStyleContextValue {
  /** Hex/CSS background color for bars and pills. '' = use Tailwind default. */
  barColor: string;
  /** CSS font-family string for bar/pill text. '' = use inherited font. */
  barFont: string;
  /** Hex/CSS text color for bars and pills. '' = use Tailwind default. */
  barTextColor: string;
}

const DEFAULT_BAR_STYLE: BarStyleContextValue = {
  barColor:     '',
  barFont:      '',
  barTextColor: '',
};

const BarStyleContext = createContext<BarStyleContextValue>(DEFAULT_BAR_STYLE);

export const BarStyleProvider = BarStyleContext.Provider;

/** Returns the current bar style context values. */
export function useBarStyle(): BarStyleContextValue {
  return useContext(BarStyleContext);
}

/**
 * Returns an inline style object for bar/pill BACKGROUND elements.
 * Empty object when no custom color is set (preserves Tailwind default).
 */
export function barBgStyle(v: BarStyleContextValue): React.CSSProperties {
  return v.barColor ? { backgroundColor: v.barColor } : {};
}

/**
 * Returns an inline style object for bar/pill TEXT elements.
 * Empty object when no custom color is set.
 */
export function barFgStyle(v: BarStyleContextValue): React.CSSProperties {
  return v.barTextColor ? { color: v.barTextColor } : {};
}

/**
 * Returns a combined inline style object for bar/pill elements that
 * should receive all three customizations (background, text, font).
 * Each property is omitted when the corresponding value is empty,
 * so Tailwind classes continue to govern un-customized properties.
 */
export function barCombinedStyle(v: BarStyleContextValue): React.CSSProperties {
  const s: React.CSSProperties = {};
  if (v.barColor)     s.backgroundColor = v.barColor;
  if (v.barTextColor) s.color           = v.barTextColor;
  if (v.barFont)      s.fontFamily      = v.barFont;
  return s;
}
