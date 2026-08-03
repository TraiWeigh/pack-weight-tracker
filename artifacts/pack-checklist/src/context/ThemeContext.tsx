import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeName = 'forest' | 'desert' | 'alpine' | 'dusk' | 'night';

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
];

const STORAGE_KEY = 'tw-theme-v1';

interface ThemeState {
  theme: ThemeName;
  bgPhotoId: string; // '' = none
}

interface ThemeContextType extends ThemeState {
  setTheme: (t: ThemeName) => void;
  setBgPhoto: (id: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function loadState(): ThemeState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { theme: 'forest', bgPhotoId: '' };
}

function applyToDOM({ theme, bgPhotoId }: ThemeState) {
  const html = document.documentElement;
  html.setAttribute('data-theme', theme);

  const photo = BG_PHOTOS.find(p => p.id === bgPhotoId);
  if (photo) {
    html.style.backgroundImage = `url("${photo.url}")`;
    html.classList.add('photo-active');
  } else {
    html.style.backgroundImage = '';
    html.classList.remove('photo-active');
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ThemeState>(loadState);

  useEffect(() => {
    applyToDOM(state);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const setTheme   = (theme: ThemeName)  => setState(s => ({ ...s, theme }));
  const setBgPhoto = (bgPhotoId: string) => setState(s => ({ ...s, bgPhotoId }));

  return (
    <ThemeContext.Provider value={{ ...state, setTheme, setBgPhoto }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
