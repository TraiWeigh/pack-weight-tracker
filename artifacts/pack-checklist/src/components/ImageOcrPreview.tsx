/**
 * ImageOcrPreview — canvas-based image preparation before OCR.
 *
 * Lets the user rotate and crop an uploaded image before it is sent to the
 * OCR endpoint.  All edits are temporary and never persist outside this
 * component.
 */
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { RotateCcw, RotateCw, RefreshCcw, ScanLine, X, Loader2 } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type Rotation = 0 | 90 | 180 | 270;
interface CropRect { x: number; y: number; w: number; h: number }
interface Layout   { offsetX: number; offsetY: number; scale: number; drawW: number; drawH: number }

type DragOp =
  | { kind: 'create';  sx: number; sy: number }
  | { kind: 'move';    sx: number; sy: number; ox: number; oy: number }
  | { kind: 'resize';  corner: 'tl' | 'tr' | 'bl' | 'br'; sx: number; sy: number; orig: CropRect };

// ── Constants ─────────────────────────────────────────────────────────────────

const CANVAS_MAX_H = 340;
const HANDLE_R     = 6;   // half-size of corner drag handles (px)
const MIN_CROP_PX  = 20;  // minimum crop dimension in display pixels

// ── Helpers ───────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

function canvasPos(e: { clientX: number; clientY: number }, canvas: HTMLCanvasElement) {
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

/** Determine what the pointer hits on the current crop rect. */
function hitTest(pos: { x: number; y: number }, crop: CropRect | null): DragOp['kind'] | 'corner-tl' | 'corner-tr' | 'corner-bl' | 'corner-br' {
  if (!crop) return 'create';
  const near = (ax: number, ay: number) =>
    Math.abs(pos.x - ax) < HANDLE_R * 2 && Math.abs(pos.y - ay) < HANDLE_R * 2;
  if (near(crop.x,          crop.y))          return 'corner-tl';
  if (near(crop.x + crop.w, crop.y))          return 'corner-tr';
  if (near(crop.x,          crop.y + crop.h)) return 'corner-bl';
  if (near(crop.x + crop.w, crop.y + crop.h)) return 'corner-br';
  if (pos.x > crop.x && pos.x < crop.x + crop.w &&
      pos.y > crop.y && pos.y < crop.y + crop.h) return 'move';
  return 'create';
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  file:      File;
  onConfirm: (blob: Blob) => void;
  onCancel:  () => void;
}

export function ImageOcrPreview({ file, onConfirm, onCancel }: Props) {
  const canvasRef                     = useRef<HTMLCanvasElement>(null);
  const imgRef                        = useRef<HTMLImageElement | null>(null);
  const layoutRef                     = useRef<Layout | null>(null);
  const dragRef                       = useRef<DragOp | null>(null);

  const [ready,      setReady]      = useState(false);
  const [rotation,   setRotation]   = useState<Rotation>(0);
  const [crop,       setCrop]       = useState<CropRect | null>(null);
  const cropRef                     = useRef<CropRect | null>(null);
  cropRef.current                   = crop;

  const [isExporting, setIsExporting] = useState(false);
  const [error,        setError]      = useState('');

  // ── Load image from File ──────────────────────────────────────────────────
  useEffect(() => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      imgRef.current = img;
      setReady(true);
    };
    img.onerror = () => setError('We could not prepare this image. Please try another image.');
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // ── Draw canvas ───────────────────────────────────────────────────────────
  const draw = React.useCallback(() => {
    const canvas = canvasRef.current;
    const img    = imgRef.current;
    if (!canvas || !img || !ready) return;

    const ctx    = canvas.getContext('2d');
    if (!ctx) return;

    const cw = canvas.clientWidth  || canvas.parentElement?.clientWidth || 400;
    const ch = CANVAS_MAX_H;
    canvas.width  = cw;
    canvas.height = ch;

    // Rotated natural dimensions
    const swapped  = rotation === 90 || rotation === 270;
    const rotNatW  = swapped ? img.naturalHeight : img.naturalWidth;
    const rotNatH  = swapped ? img.naturalWidth  : img.naturalHeight;

    const scale   = Math.min(cw / rotNatW, ch / rotNatH, 1);
    const drawW   = rotNatW * scale;
    const drawH   = rotNatH * scale;
    const offsetX = (cw   - drawW) / 2;
    const offsetY = (ch   - drawH) / 2;

    layoutRef.current = { offsetX, offsetY, scale, drawW, drawH };

    // Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, cw, ch);

    // Rotated image
    ctx.save();
    ctx.translate(offsetX + drawW / 2, offsetY + drawH / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(
      img,
      -(img.naturalWidth  * scale) / 2,
      -(img.naturalHeight * scale) / 2,
      img.naturalWidth  * scale,
      img.naturalHeight * scale,
    );
    ctx.restore();

    const c = cropRef.current;
    if (c) {
      // Darken region outside crop
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.52)';
      ctx.fillRect(offsetX, offsetY, drawW, drawH);
      ctx.restore();

      // Re-draw image clipped to crop (restore brightness inside crop)
      ctx.save();
      ctx.beginPath();
      ctx.rect(c.x, c.y, c.w, c.h);
      ctx.clip();
      ctx.translate(offsetX + drawW / 2, offsetY + drawH / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(
        img,
        -(img.naturalWidth  * scale) / 2,
        -(img.naturalHeight * scale) / 2,
        img.naturalWidth  * scale,
        img.naturalHeight * scale,
      );
      ctx.restore();

      // Crop border
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth   = 1.5;
      ctx.setLineDash([]);
      ctx.strokeRect(c.x + 0.75, c.y + 0.75, c.w - 1.5, c.h - 1.5);

      // Rule-of-thirds grid inside crop
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth   = 0.75;
      for (let i = 1; i < 3; i++) {
        const gx = c.x + (c.w * i) / 3;
        const gy = c.y + (c.h * i) / 3;
        ctx.beginPath(); ctx.moveTo(gx, c.y); ctx.lineTo(gx, c.y + c.h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(c.x, gy); ctx.lineTo(c.x + c.w, gy); ctx.stroke();
      }

      // Corner handles
      const corners: [number, number][] = [
        [c.x,          c.y],
        [c.x + c.w,    c.y],
        [c.x,          c.y + c.h],
        [c.x + c.w,    c.y + c.h],
      ];
      for (const [hx, hy] of corners) {
        ctx.fillStyle   = '#3b82f6';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth   = 1.5;
        ctx.beginPath();
        ctx.arc(hx, hy, HANDLE_R, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }
  }, [ready, rotation]);

  // Redraw when image / rotation / crop changes
  useLayoutEffect(() => { draw(); }, [draw, crop]);

  // Redraw on container resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [draw]);

  // ── Pointer helpers ───────────────────────────────────────────────────────
  const updateCropFromDrag = React.useCallback((pos: { x: number; y: number }) => {
    const l = layoutRef.current;
    const d = dragRef.current;
    if (!l || !d) return;

    const imgL = l.offsetX, imgR = l.offsetX + l.drawW;
    const imgT = l.offsetY, imgB = l.offsetY + l.drawH;

    if (d.kind === 'create') {
      const x = clamp(Math.min(d.sx, pos.x), imgL, imgR);
      const y = clamp(Math.min(d.sy, pos.y), imgT, imgB);
      const w = clamp(Math.abs(pos.x - d.sx), 0, imgR - x);
      const h = clamp(Math.abs(pos.y - d.sy), 0, imgB - y);
      setCrop({ x, y, w, h });
    } else if (d.kind === 'move') {
      const c = cropRef.current;
      if (!c) return;
      const dx = pos.x - d.sx;
      const dy = pos.y - d.sy;
      const nx  = clamp(d.ox + dx, imgL, imgR - c.w);
      const ny  = clamp(d.oy + dy, imgT, imgB - c.h);
      setCrop({ ...c, x: nx, y: ny });
    } else if (d.kind === 'resize') {
      const o = d.orig;
      let { x, y, w, h } = o;
      if (d.corner === 'tl') {
        const nx = clamp(pos.x, imgL, o.x + o.w - MIN_CROP_PX);
        const ny = clamp(pos.y, imgT, o.y + o.h - MIN_CROP_PX);
        x = nx; w = o.x + o.w - nx;
        y = ny; h = o.y + o.h - ny;
      } else if (d.corner === 'tr') {
        const ny = clamp(pos.y, imgT, o.y + o.h - MIN_CROP_PX);
        y = ny; h = o.y + o.h - ny;
        w = clamp(pos.x - o.x, MIN_CROP_PX, imgR - o.x);
      } else if (d.corner === 'bl') {
        const nx = clamp(pos.x, imgL, o.x + o.w - MIN_CROP_PX);
        x = nx; w = o.x + o.w - nx;
        h = clamp(pos.y - o.y, MIN_CROP_PX, imgB - o.y);
      } else {
        w = clamp(pos.x - o.x, MIN_CROP_PX, imgR - o.x);
        h = clamp(pos.y - o.y, MIN_CROP_PX, imgB - o.y);
      }
      setCrop({ x, y, w, h });
    }
  }, []);

  const startDrag = React.useCallback((pos: { x: number; y: number }) => {
    const c = cropRef.current;
    const hit = hitTest(pos, c);

    if (hit === 'create') {
      dragRef.current = { kind: 'create', sx: pos.x, sy: pos.y };
    } else if (hit === 'move') {
      dragRef.current = { kind: 'move', sx: pos.x, sy: pos.y, ox: c!.x, oy: c!.y };
    } else {
      // resize corner
      const corner = hit.replace('corner-', '') as 'tl' | 'tr' | 'bl' | 'br';
      dragRef.current = { kind: 'resize', corner, sx: pos.x, sy: pos.y, orig: { ...c! } };
    }
  }, []);

  const endDrag = React.useCallback(() => {
    const c = cropRef.current;
    if (c && (c.w < MIN_CROP_PX || c.h < MIN_CROP_PX)) setCrop(null);
    dragRef.current = null;
  }, []);

  // Mouse events
  const onMouseDown  = (e: React.MouseEvent)    => { e.preventDefault(); startDrag(canvasPos(e.nativeEvent, canvasRef.current!)); };
  const onMouseMove  = (e: React.MouseEvent)    => { if (dragRef.current) updateCropFromDrag(canvasPos(e.nativeEvent, canvasRef.current!)); };
  const onMouseUp    = ()                        => endDrag();
  const onMouseLeave = ()                        => endDrag();

  // Touch events
  const onTouchStart = (e: React.TouchEvent) => { e.preventDefault(); startDrag(canvasPos(e.touches[0], canvasRef.current!)); };
  const onTouchMove  = (e: React.TouchEvent) => { e.preventDefault(); if (dragRef.current) updateCropFromDrag(canvasPos(e.touches[0], canvasRef.current!)); };
  const onTouchEnd   = ()                     => endDrag();

  // ── Rotation helpers ──────────────────────────────────────────────────────
  const rotateLeft  = () => { setRotation(r => ((r + 270) % 360) as Rotation); setCrop(null); };
  const rotateRight = () => { setRotation(r => ((r + 90)  % 360) as Rotation); setCrop(null); };
  const reset       = () => { setRotation(0); setCrop(null); setError(''); };

  // ── Export and confirm ────────────────────────────────────────────────────
  const handleReadImage = async () => {
    const img = imgRef.current;
    const l   = layoutRef.current;
    if (!img || !l) return;

    setIsExporting(true);
    setError('');

    try {
      const swapped  = rotation === 90 || rotation === 270;
      const natW     = img.naturalWidth;
      const natH     = img.naturalHeight;
      const rotNatW  = swapped ? natH : natW;
      const rotNatH  = swapped ? natW : natH;

      // Step 1 — create full-resolution rotated canvas
      const rotCanvas     = document.createElement('canvas');
      rotCanvas.width     = rotNatW;
      rotCanvas.height    = rotNatH;
      const rotCtx        = rotCanvas.getContext('2d')!;
      rotCtx.translate(rotNatW / 2, rotNatH / 2);
      rotCtx.rotate((rotation * Math.PI) / 180);
      rotCtx.drawImage(img, -natW / 2, -natH / 2, natW, natH);

      // Step 2 — map display crop → full-resolution rotated coords
      let sx = 0, sy = 0, sw = rotNatW, sh = rotNatH;
      if (crop) {
        sx = (crop.x - l.offsetX) / l.scale;
        sy = (crop.y - l.offsetY) / l.scale;
        sw = crop.w / l.scale;
        sh = crop.h / l.scale;
        sx = clamp(sx, 0, rotNatW - 1);
        sy = clamp(sy, 0, rotNatH - 1);
        sw = clamp(sw, 1, rotNatW - sx);
        sh = clamp(sh, 1, rotNatH - sy);
      }

      // Reject if crop area is too small to be useful
      const MIN_PX = 30;
      if (sw < MIN_PX || sh < MIN_PX) {
        setError('Select a larger area of the image before continuing.');
        setIsExporting(false);
        return;
      }

      // Step 3 — extract crop into export canvas
      const out     = document.createElement('canvas');
      out.width     = Math.round(sw);
      out.height    = Math.round(sh);
      out.getContext('2d')!.drawImage(rotCanvas, sx, sy, sw, sh, 0, 0, sw, sh);

      const blob = await new Promise<Blob | null>(res => out.toBlob(res, 'image/png', 0.95));
      if (!blob) throw new Error('toBlob returned null');

      onConfirm(blob);
    } catch {
      setError('We could not prepare this image. Please try another image.');
    } finally {
      setIsExporting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
      {/* File name */}
      <p className="text-[10px] text-muted-foreground truncate">{file.name}</p>

      {/* Canvas */}
      <div className="rounded-lg overflow-hidden border border-border bg-slate-950 select-none touch-none" style={{ cursor: crop ? 'move' : 'crosshair' }}>
        <canvas
          ref={canvasRef}
          className="w-full block"
          style={{ height: CANVAS_MAX_H }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        />
      </div>

      {/* Hint */}
      <p className="text-[10px] text-muted-foreground text-center">
        {crop ? 'Drag corners to resize • Drag inside to move • Drag outside to replace' : 'Drag to select the area to scan'}
      </p>

      {/* Error */}
      {error && (
        <p className="text-[11px] text-destructive text-center">{error}</p>
      )}

      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Rotate */}
        <button
          onClick={rotateLeft}
          title="Rotate left 90°"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground border border-border rounded-md px-2 py-1.5 hover:bg-muted/30 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Left</span>
        </button>
        <button
          onClick={rotateRight}
          title="Rotate right 90°"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground border border-border rounded-md px-2 py-1.5 hover:bg-muted/30 transition-colors"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Right</span>
        </button>
        <button
          onClick={reset}
          title="Reset rotation and crop"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground border border-border rounded-md px-2 py-1.5 hover:bg-muted/30 transition-colors"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>
        {crop && (
          <button
            onClick={() => setCrop(null)}
            className="text-[10px] text-muted-foreground hover:text-foreground ml-0.5 underline"
          >
            Clear crop
          </button>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Cancel */}
        <button
          onClick={onCancel}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground border border-border rounded-md px-2 py-1.5 hover:bg-muted/30 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Cancel
        </button>

        {/* Read Image */}
        <button
          onClick={handleReadImage}
          disabled={isExporting || !ready}
          className="flex items-center gap-1.5 text-xs font-semibold bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {isExporting
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <ScanLine className="w-3.5 h-3.5" />
          }
          {isExporting ? 'Preparing…' : 'Read Image'}
        </button>
      </div>
    </div>
  );
}
