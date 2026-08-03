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
    url: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1920&q=70&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=160&q=60&auto=format&fit=crop',
  },
  {
    id: 'alpine-lake',
    label: 'Alpine Lake',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=70&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=160&q=60&auto=format&fit=crop',
  },
  {
    id: 'desert',
    label: 'Desert',
    url: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1920&q=70&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=160&q=60&auto=format&fit=crop',
  },
  {
    id: 'forest',
    label: 'Forest',
    url: 'https://images.unsplash.com/photo-1448375751071-09e0af7f6e4f?w=1920&q=70&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1448375751071-09e0af7f6e4f?w=160&q=60&auto=format&fit=crop',
  },
  {
    id: 'stars',
    label: 'Night Sky',
    url: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1920&q=70&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=160&q=60&auto=format&fit=crop',
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

const STORAGE_KEY = 'tw-theme-v1';

interface ThemeState {
  theme: ThemeName;
  bgPhotoId: string;
  bgOpacity: number;   // 0–100, default 70
  customColor: string; // hex '#rrggbb' or '' = off
}

interface ThemeContextType extends ThemeState {
  setTheme:       (t: ThemeName) => void;
  setBgPhoto:     (id: string)   => void;
  setBgOpacity:   (v: number)    => void;
  setCustomColor: (hex: string)  => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/** Convert a #rrggbb hex colour to a CSS HSL string clamped for use as a primary colour. */
function hexToHSL(hex: string): string {
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
  const H = Math.round(h * 360);
  const S = Math.round(s * 100);
  // Cap lightness so the colour is dark enough to read on a light background
  const L = Math.min(Math.round(l * 100), 45);
  return `${H} ${S}% ${L}%`;
}

function loadState(): ThemeState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return {
        theme:       p.theme       ?? 'forest',
        bgPhotoId:   p.bgPhotoId   ?? '',
        bgOpacity:   p.bgOpacity   ?? 70,
        customColor: p.customColor ?? '',
      };
    }
  } catch { /* ignore */ }
  return { theme: 'forest', bgPhotoId: '', bgOpacity: 70, customColor: '' };
}

function applyToDOM({ theme, bgPhotoId, customColor }: ThemeState) {
  const html = document.documentElement;
  html.setAttribute('data-theme', theme);

  // photo-active class drives frosted-glass CSS; background image itself
  // is rendered by <BgPhotoLayer /> so clear any legacy inline value
  html.style.backgroundImage = '';
  if (bgPhotoId) {
    html.classList.add('photo-active');
  } else {
    html.classList.remove('photo-active');
  }

  // Custom primary colour overlay (overrides theme's --primary)
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
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ThemeState>(loadState);

  useEffect(() => {
    applyToDOM(state);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const setTheme       = (theme: ThemeName)    => setState(s => ({ ...s, theme }));
  const setBgPhoto     = (bgPhotoId: string)   => setState(s => ({ ...s, bgPhotoId }));
  const setBgOpacity   = (bgOpacity: number)   => setState(s => ({ ...s, bgOpacity }));
  const setCustomColor = (customColor: string) => setState(s => ({ ...s, customColor }));

  return (
    <ThemeContext.Provider value={{ ...state, setTheme, setBgPhoto, setBgOpacity, setCustomColor }}>
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
  const { bgPhotoId, bgOpacity } = useTheme();
  const photo = BG_PHOTOS.find(p => p.id === bgPhotoId);
  if (!photo) return null;
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        backgroundImage: `url("${photo.url}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
        opacity: bgOpacity / 100,
        pointerEvents: 'none',
        transition: 'opacity 0.2s ease',
      }}
    />
  );
}
