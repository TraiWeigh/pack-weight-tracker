import React, { useRef, useEffect } from 'react';
import { ImageIcon, Upload, X, Check } from 'lucide-react';

// ── Types & constants ──────────────────────────────────────────────────────────

export type Background =
  | { type: 'preset'; id: string }
  | { type: 'custom'; dataUrl: string };

export const BG_STORAGE_KEY = 'trailweigh:background';

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

export function getFullUrl(photoId: string) {
  return `https://images.unsplash.com/photo-${photoId}?w=1920&q=85&fit=crop`;
}

function getThumbUrl(photoId: string) {
  return `https://images.unsplash.com/photo-${photoId}?w=400&h=260&fit=crop&q=70`;
}

// Compress an uploaded image to a JPEG data URL (max 1920px wide)
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxW = 1920;
        const scale = img.width > maxW ? maxW / img.width : 1;
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = reject;
      img.src = e.target!.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Button ────────────────────────────────────────────────────────────────────

export function BackgroundPickerButton({ onClick, active }: { onClick: () => void; active: boolean }) {
  return (
    <button
      onClick={onClick}
      title="Background"
      className={`flex items-center gap-1.5 text-xs font-semibold border px-3 py-1.5 rounded-lg transition-colors ${
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : 'text-muted-foreground hover:text-foreground border-border hover:border-foreground/30 bg-card hover:bg-muted/50'
      }`}
    >
      <ImageIcon className="w-3.5 h-3.5" />
      Background
    </button>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────

interface BackgroundPickerPanelProps {
  open: boolean;
  onClose: () => void;
  background: Background | null;
  onBackgroundChange: (bg: Background | null) => void;
}

export function BackgroundPickerPanel({
  open,
  onClose,
  background,
  onBackgroundChange,
}: BackgroundPickerPanelProps) {
  const panelRef  = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const activePresetId =
    background?.type === 'preset' ? background.id : null;
  const isCustomActive = background?.type === 'custom';

  const handlePickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImage(file);
      onBackgroundChange({ type: 'custom', dataUrl });
      onClose();
    } catch {
      // silently ignore
    } finally {
      // reset so same file can be re-picked
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 z-50 w-[22rem] bg-card border border-card-border rounded-xl shadow-xl animate-in fade-in slide-in-from-top-2 duration-150"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h3 className="text-sm font-semibold text-foreground">Background</h3>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Photo grid */}
      <div className="px-3 pb-1">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
          Landscapes
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {PRESETS.map((p) => {
            const isActive = activePresetId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => { onBackgroundChange({ type: 'preset', id: p.id }); onClose(); }}
                className={`relative overflow-hidden rounded-lg aspect-[3/2] group transition-all ${
                  isActive ? 'ring-2 ring-primary ring-offset-1' : 'hover:ring-2 hover:ring-foreground/30 hover:ring-offset-1'
                }`}
              >
                <img
                  src={getThumbUrl(p.photoId)}
                  alt={p.label}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {/* Label overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] font-semibold text-white leading-none">{p.label}</span>
                </div>
                {/* Active check */}
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

      {/* Divider */}
      <div className="border-t border-border mx-3 mt-3" />

      {/* Upload + None */}
      <div className="px-3 py-3 flex items-center gap-2">
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePickFile}
        />
        <button
          onClick={() => fileInput.current?.click()}
          className={`flex-1 flex items-center justify-center gap-2 text-xs font-semibold border rounded-lg px-3 py-2 transition-colors ${
            isCustomActive
              ? 'bg-primary/10 text-primary border-primary/40'
              : 'text-muted-foreground hover:text-foreground border-border hover:border-foreground/30 bg-muted/30 hover:bg-muted/50'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          {isCustomActive ? 'Change photo…' : 'Upload photo…'}
        </button>
        {background && (
          <button
            onClick={() => { onBackgroundChange(null); onClose(); }}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-destructive border border-border hover:border-destructive/40 bg-muted/30 hover:bg-destructive/5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
          >
            <X className="w-3.5 h-3.5" />
            None
          </button>
        )}
      </div>
    </div>
  );
}
