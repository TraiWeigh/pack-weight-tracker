import React, { useRef, useEffect, useState } from 'react';
import { Palette, X, Plus, ImagePlus, Link2 } from 'lucide-react';
import { useTheme, THEMES, BG_PHOTOS } from '../context/ThemeContext';

interface ThemePickerProps {
  open: boolean;
  onClose: () => void;
}

/** Resize an image File to max 1920 px wide and return a JPEG data URL. */
async function resizeToDataUrl(file: File, maxWidth = 1920): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale  = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Image load failed')); };
    img.src = objectUrl;
  });
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
    theme, bgPhotoId, bgOpacity, customColor, customBgUrl,
    setTheme, setBgPhoto, setBgOpacity, setCustomColor, setCustomBgUrl,
  } = useTheme();

  const panelRef      = useRef<HTMLDivElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef  = useRef<HTMLInputElement>(null);

  const [showCustomForm, setShowCustomForm] = useState(false);
  const [urlInput,       setUrlInput]       = useState('');
  const [urlError,       setUrlError]       = useState('');
  const [uploading,      setUploading]      = useState(false);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  // Reset form when panel closes
  useEffect(() => {
    if (!open) { setShowCustomForm(false); setUrlInput(''); setUrlError(''); }
  }, [open]);

  if (!open) return null;

  const activeLabel = customColor
    ? 'Custom accent'
    : (THEMES.find(t => t.id === theme)?.label ?? theme);

  const hasCustomBg = Boolean(customBgUrl);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setUrlError('Please choose an image file.'); return; }
    setUploading(true);
    setUrlError('');
    try {
      const dataUrl = await resizeToDataUrl(file);
      setCustomBgUrl(dataUrl);
      setShowCustomForm(false);
    } catch {
      setUrlError('Could not load that image. Try another file.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleUrlSubmit() {
    const trimmed = urlInput.trim();
    if (!trimmed) { setUrlError('Please enter a URL.'); return; }
    if (!/^https?:\/\//i.test(trimmed)) { setUrlError('URL must start with http:// or https://'); return; }
    setCustomBgUrl(trimmed);
    setShowCustomForm(false);
    setUrlInput('');
    setUrlError('');
  }

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

          {/* Custom accent colour swatch */}
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
              {customColor
                ? <span className="text-white text-[10px] font-bold drop-shadow">✓</span>
                : <Plus className="w-3.5 h-3.5 text-muted-foreground" />
              }
            </button>
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
          {/* None */}
          <button
            onClick={() => { setBgPhoto(''); setCustomBgUrl(''); setShowCustomForm(false); }}
            className={`h-16 rounded-lg border-2 transition-all flex items-center justify-center text-xs font-medium ${
              !bgPhotoId && !customBgUrl
                ? 'border-foreground bg-muted text-foreground'
                : 'border-border bg-muted/50 text-muted-foreground hover:border-foreground/30'
            }`}
          >
            None
          </button>

          {/* Preset photos */}
          {BG_PHOTOS.map(photo => (
            <button
              key={photo.id}
              title={photo.label}
              onClick={() => { setBgPhoto(photo.id); setShowCustomForm(false); }}
              className={`h-16 rounded-lg border-2 overflow-hidden transition-all ${
                bgPhotoId === photo.id && !customBgUrl
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

          {/* Custom image tile */}
          {hasCustomBg ? (
            <button
              title="Change custom image"
              onClick={() => setShowCustomForm(v => !v)}
              className={`h-16 rounded-lg border-2 overflow-hidden transition-all relative group ${
                customBgUrl
                  ? 'border-foreground scale-105 shadow-md'
                  : 'border-transparent hover:border-foreground/30'
              }`}
              style={{
                backgroundImage: `url("${customBgUrl}")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <ImagePlus className="w-4 h-4 text-white" />
              </div>
              {customBgUrl && (
                <span className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5">
                  <span className="text-white text-[8px] font-bold leading-none block px-0.5">✓</span>
                </span>
              )}
            </button>
          ) : (
            <button
              title="Add your own photo"
              onClick={() => setShowCustomForm(v => !v)}
              className={`h-16 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                showCustomForm
                  ? 'border-foreground bg-muted/60'
                  : 'border-dashed border-muted-foreground/40 hover:border-foreground/40 hover:bg-muted/30'
              }`}
            >
              <ImagePlus className="w-4 h-4 text-muted-foreground" />
              <span className="text-[9px] font-medium text-muted-foreground leading-none">Custom</span>
            </button>
          )}
        </div>

        {/* Current selection label */}
        {(bgPhotoId || customBgUrl) && (
          <div className="flex items-center justify-between mt-1.5">
            <p className="text-[11px] text-muted-foreground">
              {customBgUrl
                ? 'Custom image'
                : BG_PHOTOS.find(p => p.id === bgPhotoId)?.label}
            </p>
            {customBgUrl && (
              <button
                onClick={() => { setCustomBgUrl(''); setShowCustomForm(false); }}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>
        )}

        {/* Inline custom image form */}
        {showCustomForm && (
          <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
            {/* File upload */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full flex items-center justify-center gap-2 text-xs font-medium border border-border hover:border-foreground/30 bg-muted/40 hover:bg-muted/70 text-foreground px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              <ImagePlus className="w-3.5 h-3.5" />
              {uploading ? 'Processing…' : 'Upload from device'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="sr-only"
            />

            {/* URL input */}
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <Link2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                <input
                  type="url"
                  value={urlInput}
                  onChange={e => { setUrlInput(e.target.value); setUrlError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleUrlSubmit()}
                  placeholder="Paste image URL…"
                  className="w-full pl-7 pr-2 py-1.5 text-xs bg-muted/50 border border-border focus:border-primary focus:outline-none rounded-lg text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <button
                onClick={handleUrlSubmit}
                disabled={!urlInput.trim()}
                className="text-xs font-semibold bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90 disabled:opacity-40 transition-colors whitespace-nowrap"
              >
                Use
              </button>
            </div>

            {urlError && (
              <p className="text-[11px] text-destructive">{urlError}</p>
            )}
          </div>
        )}
      </div>

      {/* ── Image Intensity slider (shown when any bg is active) ── */}
      {(bgPhotoId || customBgUrl) && (
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
            <span className="text-[10px] text-muted-foreground w-8 text-right leading-none">Fade</span>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={bgOpacity}
              onChange={e => setBgOpacity(Number(e.target.value))}
              className="flex-1 accent-primary h-1.5 cursor-pointer"
            />
            <span className="text-[10px] text-muted-foreground w-8 leading-none">Full</span>
          </div>
        </div>
      )}
    </div>
  );
}
