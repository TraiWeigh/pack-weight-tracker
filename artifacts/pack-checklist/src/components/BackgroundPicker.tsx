import React, { useRef, useEffect } from 'react';
import { ImageIcon, X, Check } from 'lucide-react';
import { PhotoCollections } from './PhotoCollections';

// ── Types & constants ──────────────────────────────────────────────────────────

export type Background =
  | { type: 'preset'; id: string }
  | { type: 'custom'; dataUrl: string };

export const BG_STORAGE_KEY = 'trailweigh:background';

/** Built-in theme groups.  Add new groups here to extend the Themes dropdown. */
const BUILTIN_THEMES = [
  { id: 'landscapes', label: 'Landscapes' },
] as const;
type BuiltinThemeId = (typeof BUILTIN_THEMES)[number]['id'];

export const PRESETS = [
  { id: 'rocky-mountains',  label: 'Rocky Mountains',  photoId: '1464822759023-fed622ff2c3b' },
  { id: 'swiss-alps',       label: 'Swiss Alps',        photoId: '1506905925346-21bda4d32df4' },
  { id: 'forest',           label: 'Pine Forest',       photoId: '1448375240586-882707db888b' },
  { id: 'lake-reflection',  label: 'Lake Reflection',   photoId: '1501854140801-50d01698950b' },
  { id: 'desert-dunes',     label: 'Desert Dunes',      photoId: '1509316785289-025f5b846b35' },
  { id: 'snowy-peaks',      label: 'Snowy Peaks',       photoId: '1519681393784-d120267933ba' },
  { id: 'green-valley',     label: 'Green Valley',      photoId: '1469474968028-56623f02e42e' },
  { id: 'foggy-mountains',  label: 'Foggy Mountains',   photoId: '1485470733090-0aae1788d5af' },
  { id: 'coast',            label: 'Ocean Coast',       photoId: '1505118380757-91f5f5632de0' },
  { id: 'starry-night',     label: 'Starry Night',      photoId: '1419242902214-272b3f66ee7a' },
];

// Theme → preset mapping (ready to extend when new built-in themes are added)
const THEME_PRESETS: Record<BuiltinThemeId, typeof PRESETS> = {
  landscapes: PRESETS,
};

export function getFullUrl(photoId: string) {
  return `https://images.unsplash.com/photo-${photoId}?w=1920&q=85&fit=crop`;
}

function getThumbUrl(photoId: string) {
  return `https://images.unsplash.com/photo-${photoId}?w=400&h=260&fit=crop&q=70`;
}

// ── Button (PART 2: label changed to "Background Edit") ──────────────────────

export function BackgroundPickerButton({ onClick, active }: { onClick: () => void; active: boolean }) {
  return (
    <button
      onClick={onClick}
      title="Background Edit"
      aria-label="Background Edit"
      className={`flex items-center gap-1.5 text-xs font-semibold border px-3 py-1.5 rounded-lg transition-colors ${
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : 'text-muted-foreground hover:text-foreground border-border hover:border-foreground/30 bg-card hover:bg-muted/50'
      }`}
    >
      <ImageIcon className="w-3.5 h-3.5" />
      Background Edit
    </button>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────

interface BackgroundPickerPanelProps {
  open: boolean;
  onClose: () => void;
  background: Background | null;
  onBackgroundChange: (bg: Background | null) => void;
  bgFade: number;
  onBgFadeChange: (v: number) => void;
  bgTone: 'light' | 'dark';
  onBgToneChange: (t: 'light' | 'dark') => void;
  /** 'cover' = Fill Screen (default); 'contain' = Fit Image */
  bgSize: 'cover' | 'contain';
  onBgSizeChange: (v: 'cover' | 'contain') => void;
  containerRef?: React.RefObject<HTMLDivElement>;
  /** Called when the user clicks the Showcase pill inside the panel header */
  onShowcase?: () => void;
  /** True while Showcase cannot be activated (blocking conditions active) */
  isShowcaseBlocked?: boolean;
}

export function BackgroundPickerPanel({
  open,
  onClose,
  background,
  onBackgroundChange,
  bgFade,
  onBgFadeChange,
  bgTone,
  onBgToneChange,
  bgSize,
  onBgSizeChange,
  containerRef,
  onShowcase,
  isShowcaseBlocked = false,
}: BackgroundPickerPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const openRef  = useRef(open);
  useEffect(() => { openRef.current = open; }, [open]);

  // ── PART 5: Themes dropdown state ─────────────────────────────────────────
  const [activeThemeId, setActiveThemeId] = React.useState<BuiltinThemeId>('landscapes');

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const root = containerRef?.current ?? panelRef.current;
      if (root && !root.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose, containerRef]);

  const activePresetId = background?.type === 'preset' ? background.id : null;
  const themePresets   = THEME_PRESETS[activeThemeId];

  return (
    <div
      ref={panelRef}
      className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 w-[24rem] max-h-[calc(100dvh-10rem)] overflow-y-auto bg-card border border-card-border rounded-xl shadow-xl animate-in fade-in slide-in-from-top-2 duration-150"
      style={{ display: open ? undefined : 'none' }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between gap-2">
        {/* PART 3: Panel heading remains "Background" */}
        <h3 className="text-sm font-semibold text-foreground">Background</h3>
        {onShowcase && (
          <button
            onClick={onShowcase}
            disabled={isShowcaseBlocked}
            title={
              isShowcaseBlocked
                ? 'Finish the current action first'
                : 'Fill the screen with this background'
            }
            className={`text-xs font-semibold px-3 py-1 rounded-full transition-colors flex-shrink-0 ${
              isShowcaseBlocked
                ? 'bg-muted text-muted-foreground/40 cursor-not-allowed'
                : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
            }`}
          >
            Showcase
          </button>
        )}
      </div>

      {/* ── PART 4: Fill/Fit + Light/Dark on the same horizontal row ─────── */}
      <div className="px-4 pb-3 border-b border-border">
        {/*
         * PART 4: Both segmented controls sit on one horizontal level.
         *   Left  → Fill Screen / Fit Image
         *   Right → Light / Dark
         * flex-wrap lets them stack on narrow widths (phone) without overflow.
         */}
        <div
          className="flex flex-wrap items-center justify-between gap-2 mb-2.5"
          aria-label="Background display controls"
        >
          {/* Fill Screen / Fit Image */}
          <div
            role="group"
            aria-label="Image sizing"
            className="flex rounded-lg overflow-hidden border border-border text-[11px] font-semibold"
          >
            <button
              onClick={() => onBgSizeChange('cover')}
              aria-pressed={bgSize === 'cover'}
              className={`px-3 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset ${
                bgSize === 'cover'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Fill Screen
            </button>
            <button
              onClick={() => onBgSizeChange('contain')}
              aria-pressed={bgSize === 'contain'}
              className={`px-3 py-1 transition-colors border-l border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset ${
                bgSize === 'contain'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Fit Image
            </button>
          </div>

          {/* Light / Dark — right-aligned, same row */}
          <div
            role="group"
            aria-label="Background tone"
            className="flex rounded-lg overflow-hidden border border-border text-[11px] font-semibold"
          >
            <button
              onClick={() => onBgToneChange('light')}
              aria-pressed={bgTone === 'light'}
              className={`px-3 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset ${
                bgTone === 'light'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              ☀ Light
            </button>
            <button
              onClick={() => onBgToneChange('dark')}
              aria-pressed={bgTone === 'dark'}
              className={`px-3 py-1 transition-colors border-l border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset ${
                bgTone === 'dark'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              🌙 Dark
            </button>
          </div>
        </div>

        {/* Fade / Darken slider */}
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-muted-foreground">{bgTone === 'dark' ? 'Darken' : 'Lighten'}</span>
          <span className="text-xs text-muted-foreground tabular-nums">{Math.round(bgFade * 100)}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={bgFade}
          onChange={e => onBgFadeChange(parseFloat(e.target.value))}
          aria-label={bgTone === 'dark' ? 'Darken level' : 'Lighten level'}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-primary bg-border"
        />
      </div>

      {/* ── PART 5 + 6: Themes dropdown + preset thumbnails ───────────────── */}
      <div className="px-3 pb-2">
        {/* Themes dropdown — replaces the static "LANDSCAPES" heading */}
        <div className="flex items-center justify-between mb-2 px-1 mt-3">
          <label
            htmlFor="bg-themes-select"
            className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider"
          >
            Themes
          </label>
          <select
            id="bg-themes-select"
            value={activeThemeId}
            onChange={e => setActiveThemeId(e.target.value as BuiltinThemeId)}
            className="text-[11px] font-semibold bg-card text-foreground border border-border rounded-md px-2 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
          >
            {BUILTIN_THEMES.map(t => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Built-in preset thumbnails for the selected theme */}
        <div className="grid grid-cols-2 gap-1.5">
          {themePresets.map(p => {
            const isActive = activePresetId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => { onBackgroundChange({ type: 'preset', id: p.id }); }}
                aria-pressed={isActive}
                aria-label={p.label}
                className={`relative overflow-hidden rounded-lg aspect-[3/2] group transition-all ${
                  isActive
                    ? 'ring-2 ring-primary ring-offset-1'
                    : 'hover:ring-2 hover:ring-foreground/30 hover:ring-offset-1'
                }`}
              >
                <img
                  src={getThumbUrl(p.photoId)}
                  alt={p.label}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] font-semibold text-white leading-none">{p.label}</span>
                </div>
                {isActive && (
                  <div className="absolute top-1.5 right-1.5 bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── PARTS 7–12: Personal Photo Collections ────────────────────────── */}
      <PhotoCollections
        background={background}
        onBackgroundChange={onBackgroundChange}
      />

      {/* ── Remove background ──────────────────────────────────────────────── */}
      {background && (
        <>
          <div className="border-t border-border mx-3" />
          <div className="px-3 py-2.5">
            <button
              onClick={() => { onBackgroundChange(null); }}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-destructive border border-border hover:border-destructive/40 bg-transparent hover:bg-destructive/5 px-3 py-2 rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Remove background
            </button>
          </div>
        </>
      )}
    </div>
  );
}
