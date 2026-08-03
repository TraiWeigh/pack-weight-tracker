import React, { useRef, useEffect } from 'react';
import { Palette, X, Plus } from 'lucide-react';
import { useTheme, THEMES, BG_PHOTOS } from '../context/ThemeContext';

interface ThemePickerProps {
  open: boolean;
  onClose: () => void;
}

export function ThemePickerButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title="Personalise theme & background"
      className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground border border-border hover:border-foreground/30 bg-card hover:bg-muted/50 px-3 py-1.5 rounded-lg transition-colors"
    >
      <Palette className="w-3.5 h-3.5" />
      Theme
    </button>
  );
}

export function ThemePickerPanel({ open, onClose }: ThemePickerProps) {
  const {
    theme, bgPhotoId, bgOpacity, customColor,
    setTheme, setBgPhoto, setBgOpacity, setCustomColor,
  } = useTheme();

  const panelRef     = useRef<HTMLDivElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const activeLabel = customColor
    ? 'Custom accent'
    : (THEMES.find(t => t.id === theme)?.label ?? theme);

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 z-50 w-80 bg-card border border-card-border rounded-xl shadow-xl animate-in fade-in slide-in-from-top-2 duration-150 p-4 space-y-4"
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Personalise</h3>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Colour Theme ── */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Colour Theme
        </p>

        {/* 10 preset swatches + custom swatch */}
        <div className="flex gap-2 flex-wrap">
          {THEMES.map(t => (
            <button
              key={t.id}
              title={t.label}
              onClick={() => setTheme(t.id)}
              className={`relative w-9 h-9 rounded-full border-2 transition-all flex-shrink-0 ${
                theme === t.id && !customColor
                  ? 'border-foreground scale-110 shadow-md'
                  : 'border-transparent hover:scale-105 hover:border-foreground/30'
              }`}
              style={{ backgroundColor: t.swatch }}
            >
              {theme === t.id && !customColor && (
                <span className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-bold drop-shadow">
                  ✓
                </span>
              )}
            </button>
          ))}

          {/* Custom colour swatch */}
          <div className="relative flex-shrink-0">
            <button
              title="Pick a custom accent colour"
              onClick={() => colorInputRef.current?.click()}
              className={`relative w-9 h-9 rounded-full border-2 transition-all flex items-center justify-center ${
                customColor
                  ? 'border-foreground scale-110 shadow-md'
                  : 'border-dashed border-muted-foreground/50 hover:scale-105 hover:border-muted-foreground'
              }`}
              style={customColor ? { backgroundColor: customColor } : undefined}
            >
              {customColor ? (
                <span className="text-white text-[10px] font-bold drop-shadow">✓</span>
              ) : (
                <Plus className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </button>
            {/* Native colour picker — visually hidden, triggered by the button above */}
            <input
              ref={colorInputRef}
              type="color"
              value={customColor || '#3d5a40'}
              onChange={e => setCustomColor(e.target.value)}
              className="sr-only"
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-1.5">
          <p className="text-[11px] text-muted-foreground">{activeLabel}</p>
          {customColor && (
            <button
              onClick={() => setCustomColor('')}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Background Photo ── */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Background Photo
        </p>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setBgPhoto('')}
            className={`h-16 rounded-lg border-2 transition-all flex items-center justify-center text-xs font-medium ${
              bgPhotoId === ''
                ? 'border-foreground bg-muted text-foreground'
                : 'border-border bg-muted/50 text-muted-foreground hover:border-foreground/30'
            }`}
          >
            None
          </button>
          {BG_PHOTOS.map(photo => (
            <button
              key={photo.id}
              title={photo.label}
              onClick={() => setBgPhoto(photo.id)}
              className={`h-16 rounded-lg border-2 overflow-hidden transition-all ${
                bgPhotoId === photo.id
                  ? 'border-foreground scale-105 shadow-md'
                  : 'border-transparent hover:border-foreground/30 hover:scale-102'
              }`}
              style={{
                backgroundImage: `url("${photo.thumb}")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          ))}
        </div>
        {bgPhotoId && (
          <p className="text-[11px] text-muted-foreground mt-1.5">
            {BG_PHOTOS.find(p => p.id === bgPhotoId)?.label}
          </p>
        )}
      </div>

      {/* ── Image Intensity slider (only when a photo is selected) ── */}
      {bgPhotoId && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Image Intensity
            </p>
            <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
              {bgOpacity}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground w-8 text-right leading-none">
              Fade
            </span>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={bgOpacity}
              onChange={e => setBgOpacity(Number(e.target.value))}
              className="flex-1 accent-primary h-1.5 cursor-pointer"
            />
            <span className="text-[10px] text-muted-foreground w-8 leading-none">
              Full
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
