import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeName =
  | 'forest' | 'desert' | 'alpine' | 'dusk' | 'night'
  | 'sage'   | 'slate'  | 'ember'  | 'tide' | 'smoke';

export interface BgPhoto {
  id: string;
  label: string;
  url: string;
  thumb: string;
}

export const BG_PHOTOS: BgPhoto[] = [
  {
    id: 'mountains',
    label: 'Mountains',
    url: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1920&q=90&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=320&q=80&auto=format&fit=crop',
  },
  {
    id: 'alpine-lake',
    label: 'Alpine Lake',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=90&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=320&q=80&auto=format&fit=crop',
  },
  {
    id: 'desert',
    label: 'Desert',
    url: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1920&q=90&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=320&q=80&auto=format&fit=crop',
  },
  {
    id: 'forest',
    label: 'Forest',
    url: 'https://images.unsplash.com/photo-1448375751071-09e0af7f6e4f?w=1920&q=90&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1448375751071-09e0af7f6e4f?w=320&q=80&auto=format&fit=crop',
  },
  {
    id: 'stars',
    label: 'Night Sky',
    url: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1920&q=90&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=320&q=80&auto=format&fit=crop',
  },
];

export const THEMES: { id: ThemeName; label: string; swatch: string; dark?: boolean }[] = [
  { id: 'forest', label: 'Forest', swatch: '#3d5a40' },
  { id: 'desert', label: 'Desert', swatch: '#8a5c38' },
  { id: 'alpine', label: 'Alpine', swatch: '#2d608a' },
  { id: 'dusk',   label: 'Dusk',   swatch: '#6b3d7a' },
  { id: 'night',  label: 'Night',  swatch: '#1a2a3a', dark: true },
  { id: 'sage',   label: 'Sage',   swatch: '#6b7c5e' },
  { id: 'slate',  label: 'Slate',  swatch: '#4a5a72' },
  { id: 'ember',  label: 'Ember',  swatch: '#b85030' },
  { id: 'tide',   label: 'Tide',   swatch: '#2d7a6a' },
  { id: 'smoke',  label: 'Smoke',  swatch: '#7a6a5f' },
];

export interface FontOption {
  id: string;
  label: string;
  fontFamily: string;
  googleFont?: string;  // e.g. 'Playfair+Display:wght@400;600;700'
  preview?: string;     // sample text for the pill
}

export const FONT_OPTIONS: FontOption[] = [
  { id: 'default',  label: 'Default',  fontFamily: '',                                         preview: 'Aa' },
  { id: 'serif',    label: 'Serif',    fontFamily: 'Georgia, "Times New Roman", serif',         preview: 'Aa' },
  { id: 'mono',     label: 'Mono',     fontFamily: '"Courier New", Courier, monospace',          preview: 'Aa' },
  { id: 'playfair', label: 'Elegant',  fontFamily: '"Playfair Display", Georgia, serif',        preview: 'Aa', googleFont: 'Playfair+Display:wght@400;600;700' },
  { id: 'nunito',   label: 'Rounded',  fontFamily: 'Nunito, system-ui, sans-serif',             preview: 'Aa', googleFont: 'Nunito:wght@400;600;700' },
];

export const TEXT_COLOR_PRESETS: { label: string; hex: string }[] = [
  { label: 'Charcoal', hex: '#1a1a1a' },
  { label: 'Brown',    hex: '#3d2b1f' },
  { label: 'Navy',     hex: '#1a2a4a' },
  { label: 'Forest',   hex: '#1a3a20' },
  { label: 'Plum',     hex: '#3a1a3a' },
  { label: 'Slate',    hex: '#2a3540' },
  { label: 'White',    hex: '#f8f8f8' },
];

const STORAGE_KEY = 'tw-theme-v1';

interface ThemeState {
  theme: ThemeName;
  bgPhotoId: string;
  bgOpacity: number;      // 0–100, default 70
  customColor: string;    // hex '#rrggbb' or '' = off (accent/primary)
  customBgUrl: string;    // data URL or HTTP URL, '' = off
  customTextColor: string; // hex '#rrggbb' or '' = off
  customFont: string;      // font option id, '' = default
}

interface ThemeContextType extends ThemeState {
  setTheme:           (t: ThemeName) => void;
  setBgPhoto:         (id: string)   => void;
  setBgOpacity:       (v: number)    => void;
  setCustomColor:     (hex: string)  => void;
  setCustomBgUrl:     (url: string)  => void;
  setCustomTextColor: (hex: string)  => void;
  setCustomFont:      (id: string)   => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/** Convert #rrggbb to "H S% L%" — clamps lightness ≤ 45% for accent/primary use. */
function hexToHSL(hex: string): string {
  const [h, s, l] = hexToHSLRaw(hex);
  return `${h} ${s}% ${Math.min(l, 45)}%`;
}

/** Convert #rrggbb to [H, S, L] tuple (no clamping). */
function hexToHSLRaw(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (d !== 0) {
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

/** Dynamically load a Google Font once (idempotent). */
function loadGoogleFont(spec: string) {
  const id = `gf-${spec}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id   = id;
  link.rel  = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${spec}&display=swap`;
  document.head.appendChild(link);
}

function loadState(): ThemeState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return {
        theme:            p.theme            ?? 'forest',
        bgPhotoId:        p.bgPhotoId        ?? '',
        bgOpacity:        p.bgOpacity        ?? 70,
        customColor:      p.customColor      ?? '',
        customBgUrl:      p.customBgUrl      ?? '',
        customTextColor:  p.customTextColor  ?? '',
        customFont:       p.customFont       ?? '',
      };
    }
  } catch { /* ignore */ }
  return { theme: 'forest', bgPhotoId: '', bgOpacity: 70, customColor: '', customBgUrl: '', customTextColor: '', customFont: '' };
}

function applyToDOM(state: ThemeState) {
  const { theme, bgPhotoId, customColor, customBgUrl, customTextColor, customFont } = state;
  const html = document.documentElement;
  html.setAttribute('data-theme', theme);

  // photo-active class drives frosted-glass CSS
  html.style.backgroundImage = '';
  if (bgPhotoId || customBgUrl) {
    html.classList.add('photo-active');
  } else {
    html.classList.remove('photo-active');
  }

  // Custom accent colour (--primary)
  if (customColor && /^#[0-9a-f]{6}$/i.test(customColor)) {
    const hsl = hexToHSL(customColor);
    html.style.setProperty('--primary', hsl);
    html.style.setProperty('--ring',    hsl);
    html.style.setProperty('--primary-foreground', '0 0% 98%');
  } else {
    html.style.removeProperty('--primary');
    html.style.removeProperty('--ring');
    html.style.removeProperty('--primary-foreground');
  }

  // Custom text colour (--foreground)
  if (customTextColor && /^#[0-9a-f]{6}$/i.test(customTextColor)) {
    const [h, s, l] = hexToHSLRaw(customTextColor);
    html.style.setProperty('--foreground', `${h} ${s}% ${l}%`);
    // Set muted-foreground as a lightened/faded variant (+30% lightness, capped at 90)
    html.style.setProperty('--muted-foreground', `${h} ${Math.round(s * 0.6)}% ${Math.min(l + 30, 90)}%`);
  } else {
    html.style.removeProperty('--foreground');
    html.style.removeProperty('--muted-foreground');
  }

  // Custom font
  const fontOpt = FONT_OPTIONS.find(f => f.id === customFont);
  if (fontOpt && fontOpt.fontFamily) {
    if (fontOpt.googleFont) loadGoogleFont(fontOpt.googleFont);
    html.style.fontFamily = fontOpt.fontFamily;
  } else {
    html.style.fontFamily = '';
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ThemeState>(loadState);

  useEffect(() => {
    applyToDOM(state);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const setTheme           = (theme: ThemeName)        => setState(s => ({ ...s, theme }));
  const setBgPhoto         = (bgPhotoId: string)        => setState(s => ({ ...s, bgPhotoId, customBgUrl: '' }));
  const setBgOpacity       = (bgOpacity: number)        => setState(s => ({ ...s, bgOpacity }));
  const setCustomColor     = (customColor: string)      => setState(s => ({ ...s, customColor }));
  const setCustomBgUrl     = (customBgUrl: string)      => setState(s => ({ ...s, customBgUrl, bgPhotoId: '' }));
  const setCustomTextColor = (customTextColor: string)  => setState(s => ({ ...s, customTextColor }));
  const setCustomFont      = (customFont: string)       => setState(s => ({ ...s, customFont }));

  return (
    <ThemeContext.Provider value={{
      ...state,
      setTheme, setBgPhoto, setBgOpacity,
      setCustomColor, setCustomBgUrl,
      setCustomTextColor, setCustomFont,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

/**
 * Renders the background photo as a fixed-position layer behind everything.
 * Opacity is controlled by the bgOpacity state (0 = faded out, 100 = full).
 * Mount this once at the app root, inside <ThemeProvider>.
 */
export function BgPhotoLayer() {
  const { bgPhotoId, bgOpacity, customBgUrl } = useTheme();
  const presetUrl = BG_PHOTOS.find(p => p.id === bgPhotoId)?.url;
  const imageUrl  = customBgUrl || presetUrl;
  if (!imageUrl) return null;
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        backgroundImage: `url("${imageUrl}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        // NOTE: no backgroundAttachment:'fixed' — it causes subpixel blurring
        opacity: bgOpacity / 100,
        pointerEvents: 'none',
        transition: 'opacity 0.2s ease',
      }}
    />
  );
}
