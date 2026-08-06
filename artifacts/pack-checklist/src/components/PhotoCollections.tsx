/**
 * PhotoCollections.tsx — PARTS 7–12 of Prompt 016
 *
 * Renders personal photo collections inside the Background panel.
 * State (collections) is managed here and persisted to localStorage
 * under 'trailweigh:photoCollections'.  The active background selection
 * flows through the parent BackgroundPickerPanel via onBackgroundChange.
 *
 * Collections are a GLOBAL personal library — they are not per-Locker-file.
 * The active background (which may reference a collection photo's dataUrl)
 * is stored separately in LockerEntry.background.
 */
import React, { useState, useRef, useCallback } from 'react';
import { Check, Plus, Pencil, Trash2, X } from 'lucide-react';
import {
  PHOTO_COLLECTIONS_KEY,
  MAX_PHOTOS_PER_COLLECTION,
  runMigration,
  createCollection,
  renameCollection,
  deleteCollection,
  addPhotoToCollection,
  deletePhotoFromCollection,
} from '../lib/bgCollections';
import type { PhotoCollection, CollectionPhoto } from '../lib/bgCollections';
import { BG_STORAGE_KEY } from './BackgroundPicker';
import type { Background } from './BackgroundPicker';

// ── Image compression (same as prior single-upload slot) ─────────────────────

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

const SAFE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const UNSAFE_EXT = /\.(tiff?|raw|cr2|cr3|nef|arw|dng|orf|rw2|pef|heic|heif|bmp|svg)$/i;

// ── Collection state initializer ──────────────────────────────────────────────

function initCollections(): PhotoCollection[] {
  try {
    const raw = localStorage.getItem(PHOTO_COLLECTIONS_KEY);
    if (raw !== null) {
      // Collections key already exists — no migration needed
      const cols = JSON.parse(raw) as PhotoCollection[];
      return Array.isArray(cols) ? cols : [];
    }
    // First run with new code: migrate any legacy single custom-photo slot
    let cols: PhotoCollection[] = [];
    const bgRaw = localStorage.getItem(BG_STORAGE_KEY);
    if (bgRaw) {
      try {
        const bg = JSON.parse(bgRaw) as Background;
        if (bg.type === 'custom' && bg.dataUrl) {
          cols = runMigration(cols, bg.dataUrl);
        }
      } catch { /* ignore corrupt bg data */ }
    }
    // Save initial collections (marks migration as done — key now exists)
    localStorage.setItem(PHOTO_COLLECTIONS_KEY, JSON.stringify(cols));
    return cols;
  } catch { return []; }
}

// ── Component ─────────────────────────────────────────────────────────────────

interface PhotoCollectionsProps {
  background: Background | null;
  onBackgroundChange: (bg: Background | null) => void;
}

export function PhotoCollections({ background, onBackgroundChange }: PhotoCollectionsProps) {

  const [collections, setCollections] = useState<PhotoCollection[]>(initCollections);

  // ── UI state ──────────────────────────────────────────────────────────────
  /** Which collection's "Add Photo" was last clicked (upload target) */
  const [uploadTargetId,          setUploadTargetId]          = useState<string | null>(null);
  const [uploadError,             setUploadError]             = useState<string | null>(null);
  /** Confirm deletion of a single photo */
  const [confirmDeletePhoto,      setConfirmDeletePhoto]      = useState<{ cid: string; pid: string } | null>(null);
  /** Confirm deletion of a whole collection */
  const [confirmDeleteCollection, setConfirmDeleteCollection] = useState<string | null>(null);
  /** Inline rename state */
  const [renamingId,              setRenamingId]              = useState<string | null>(null);
  const [renameValue,             setRenameValue]             = useState('');
  const [renameError,             setRenameError]             = useState<string | null>(null);
  /** "Add Collection" inline input */
  const [addMode,                 setAddMode]                 = useState(false);
  const [newColName,              setNewColName]              = useState('');
  const [newColError,             setNewColError]             = useState<string | null>(null);

  const fileInputRef  = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const newColInputRef = useRef<HTMLInputElement>(null);

  // ── Persistence helper ────────────────────────────────────────────────────

  const persist = useCallback((cols: PhotoCollection[]) => {
    setCollections(cols);
    try { localStorage.setItem(PHOTO_COLLECTIONS_KEY, JSON.stringify(cols)); } catch {}
  }, []);

  // ── File upload ───────────────────────────────────────────────────────────

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file || !uploadTargetId) return;
    setUploadError(null);

    if (!SAFE_TYPES.includes(file.type) || UNSAFE_EXT.test(file.name)) {
      setUploadError('Only JPEG, PNG, WebP, and GIF are supported.');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setUploadError('File is too large (max 25 MB). Please resize and try again.');
      return;
    }
    try {
      const dataUrl = await compressImage(file);
      const photo: CollectionPhoto = { id: crypto.randomUUID(), dataUrl };
      const updated = addPhotoToCollection(uploadTargetId, photo, collections);
      if (updated) persist(updated);
    } catch {
      setUploadError('Could not load that image. Try a different file.');
    }
  };

  const triggerUpload = (collectionId: string) => {
    setUploadTargetId(collectionId);
    setUploadError(null);
    setTimeout(() => fileInputRef.current?.click(), 0);
  };

  // ── Add collection ────────────────────────────────────────────────────────

  const openAddMode = () => {
    setAddMode(true);
    setNewColName('');
    setNewColError(null);
    setTimeout(() => newColInputRef.current?.focus(), 50);
  };

  const commitAddCollection = () => {
    const name = newColName.trim();
    if (!name) {
      setNewColError('Collection name cannot be blank.');
      return;
    }
    const res = createCollection(name, collections);
    if (!res) {
      setNewColError('Collection name cannot be blank.');
      return;
    }
    persist(res.result);
    setAddMode(false);
    setNewColName('');
    setNewColError(null);
  };

  const cancelAddCollection = () => {
    setAddMode(false);
    setNewColName('');
    setNewColError(null);
  };

  // ── Rename collection ─────────────────────────────────────────────────────

  const startRename = (col: PhotoCollection) => {
    setRenamingId(col.id);
    setRenameValue(col.name);
    setRenameError(null);
    setTimeout(() => renameInputRef.current?.focus(), 50);
  };

  const commitRename = (id: string) => {
    const result = renameCollection(id, renameValue, collections);
    if (result === null) {
      const trimmed = renameValue.trim();
      if (!trimmed) {
        setRenameError('Name cannot be blank.');
      } else {
        setRenameError('Another collection already has that name.');
      }
      return;
    }
    persist(result);
    setRenamingId(null);
    setRenameError(null);
  };

  const cancelRename = () => {
    setRenamingId(null);
    setRenameError(null);
  };

  // ── Delete photo ──────────────────────────────────────────────────────────

  const confirmAndDeletePhoto = (cid: string, pid: string) => {
    const updated = deletePhotoFromCollection(cid, pid, collections);
    // If the deleted photo was the active background, clear it
    if (
      background?.type === 'custom' &&
      collections
        .find(c => c.id === cid)
        ?.photos.find(p => p.id === pid)?.dataUrl === background.dataUrl
    ) {
      onBackgroundChange(null);
    }
    persist(updated);
    setConfirmDeletePhoto(null);
  };

  // ── Delete collection ─────────────────────────────────────────────────────

  const confirmAndDeleteCollection = (id: string) => {
    const col = collections.find(c => c.id === id);
    // If the active background is a photo inside this collection, clear it
    if (background?.type === 'custom') {
      const hasActive = col?.photos.some(p => p.dataUrl === background.dataUrl);
      if (hasActive) onBackgroundChange(null);
    }
    persist(deleteCollection(id, collections));
    setConfirmDeleteCollection(null);
    if (renamingId === id) setRenamingId(null);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="px-3 pb-3">
      {/* Always-mounted file input — one input shared via uploadTargetId */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={handleFileChange}
        aria-hidden="true"
      />

      {/* ── Section divider ────────────────────────────────────────────────── */}
      <div className="border-t border-border mt-3 mb-3" />

      {/* ── Add Collection button / inline input ───────────────────────────── */}
      {!addMode ? (
        <button
          onClick={openAddMode}
          className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground border border-dashed border-border hover:border-foreground/40 bg-transparent hover:bg-muted/30 px-3 py-2 rounded-lg transition-colors mb-2"
          aria-label="Add Collection"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Collection
        </button>
      ) : (
        <div className="mb-2">
          <div className="flex items-center gap-1.5">
            <input
              ref={newColInputRef}
              type="text"
              value={newColName}
              onChange={e => { setNewColName(e.target.value); setNewColError(null); }}
              onKeyDown={e => {
                if (e.key === 'Enter') commitAddCollection();
                if (e.key === 'Escape') cancelAddCollection();
              }}
              placeholder="Collection name…"
              maxLength={40}
              aria-label="New collection name"
              className="flex-1 text-xs border border-border rounded-md px-2 py-1.5 bg-background focus:outline-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground min-w-0"
            />
            <button
              onClick={commitAddCollection}
              disabled={!newColName.trim()}
              className="text-xs font-semibold bg-primary text-primary-foreground px-2.5 py-1.5 rounded-md hover:bg-primary/90 disabled:opacity-40 transition-colors whitespace-nowrap flex-shrink-0"
            >
              Create
            </button>
            <button
              onClick={cancelAddCollection}
              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
              aria-label="Cancel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {newColError && (
            <p className="text-[11px] text-destructive mt-1 px-1">{newColError}</p>
          )}
        </div>
      )}

      {/* ── Upload error (shown after file-picker or drag feedback) ─────────── */}
      {uploadError && (
        <p className="text-[11px] text-destructive mb-2 px-1">{uploadError}</p>
      )}

      {/* ── Collection cards ────────────────────────────────────────────────── */}
      {collections.length === 0 && (
        <p className="text-[11px] text-muted-foreground text-center py-2">
          No collections yet. Create one to upload your own photos.
        </p>
      )}

      {collections.map(col => {
        const isRenaming = renamingId === col.id;
        const isDeletingCollection = confirmDeleteCollection === col.id;

        return (
          <div key={col.id} className="mb-3 last:mb-0">
            {/* Collection header */}
            <div className="flex items-center gap-1.5 mb-1.5 min-w-0">
              {isRenaming ? (
                /* Inline rename input */
                <div className="flex-1 flex items-center gap-1 min-w-0">
                  <input
                    ref={renameInputRef}
                    type="text"
                    value={renameValue}
                    onChange={e => { setRenameValue(e.target.value); setRenameError(null); }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') commitRename(col.id);
                      if (e.key === 'Escape') cancelRename();
                    }}
                    maxLength={40}
                    aria-label={`Rename collection ${col.name}`}
                    className="flex-1 text-xs border border-border rounded-md px-2 py-1 bg-background focus:outline-none focus:border-primary/50 text-foreground min-w-0"
                  />
                  <button
                    onClick={() => commitRename(col.id)}
                    className="text-xs font-semibold bg-primary text-primary-foreground px-2 py-1 rounded-md hover:bg-primary/90 transition-colors flex-shrink-0 whitespace-nowrap"
                  >
                    OK
                  </button>
                  <button
                    onClick={cancelRename}
                    className="p-1 text-muted-foreground hover:text-foreground flex-shrink-0"
                    aria-label="Cancel rename"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <>
                  {/* Collection name (truncated) + photo count */}
                  <span
                    className="text-[11px] font-semibold text-foreground flex-1 truncate min-w-0"
                    title={col.name}
                  >
                    {col.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0 mr-1">
                    {col.photos.length}/{MAX_PHOTOS_PER_COLLECTION}
                  </span>
                  {/* Rename button */}
                  <button
                    onClick={() => startRename(col)}
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label={`Rename collection ${col.name}`}
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  {/* Delete collection button */}
                  <button
                    onClick={() => {
                      if (col.photos.length > 0) {
                        setConfirmDeleteCollection(col.id);
                      } else {
                        confirmAndDeleteCollection(col.id);
                      }
                    }}
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label={`Delete collection ${col.name}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>

            {/* Rename error */}
            {isRenaming && renameError && (
              <p className="text-[11px] text-destructive mb-1 px-1">{renameError}</p>
            )}

            {/* Confirm delete COLLECTION */}
            {isDeletingCollection && (
              <div className="mb-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/30 text-[11px]">
                <p className="text-foreground mb-2 leading-snug">
                  Delete <strong>{col.name}</strong>? This will remove the collection and all {col.photos.length} photo{col.photos.length !== 1 ? 's' : ''} from your personal library.
                </p>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => confirmAndDeleteCollection(col.id)}
                    className="font-semibold bg-destructive text-destructive-foreground px-2.5 py-1 rounded-md text-[11px] hover:bg-destructive/90 transition-colors"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setConfirmDeleteCollection(null)}
                    className="font-semibold bg-muted text-muted-foreground px-2.5 py-1 rounded-md text-[11px] hover:bg-muted/80 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Photo grid */}
            {(col.photos.length > 0 || col.photos.length === 0) && (
              <div className="grid grid-cols-2 gap-1.5">
                {col.photos.map(photo => {
                  const isActive =
                    background?.type === 'custom' && background.dataUrl === photo.dataUrl;
                  const isConfirmingDelete =
                    confirmDeletePhoto?.cid === col.id && confirmDeletePhoto.pid === photo.id;

                  return (
                    <div key={photo.id} className="relative">
                      {isConfirmingDelete ? (
                        /* Confirm-delete overlay replaces the thumbnail */
                        <div className="rounded-lg aspect-[3/2] bg-destructive/10 border border-destructive/30 flex flex-col items-center justify-center gap-1.5 p-2">
                          <p className="text-[10px] text-center text-foreground leading-tight">
                            Remove this photo from your library?
                          </p>
                          <div className="flex gap-1">
                            <button
                              onClick={() => confirmAndDeletePhoto(col.id, photo.id)}
                              className="text-[10px] font-semibold bg-destructive text-destructive-foreground px-2 py-0.5 rounded transition-colors"
                            >
                              Remove
                            </button>
                            <button
                              onClick={() => setConfirmDeletePhoto(null)}
                              className="text-[10px] font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Normal thumbnail */
                        <button
                          onClick={() => onBackgroundChange({ type: 'custom', dataUrl: photo.dataUrl })}
                          aria-pressed={isActive}
                          aria-label="Select this photo as background"
                          className={`w-full relative overflow-hidden rounded-lg aspect-[3/2] group transition-all ${
                            isActive
                              ? 'ring-2 ring-primary ring-offset-1'
                              : 'hover:ring-2 hover:ring-foreground/30 hover:ring-offset-1'
                          }`}
                        >
                          <img
                            src={photo.dataUrl}
                            alt="Custom background"
                            className="w-full h-full object-cover"
                          />
                          {isActive && (
                            <div className="absolute top-1.5 right-1.5 bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center pointer-events-none">
                              <Check className="w-2.5 h-2.5" />
                            </div>
                          )}
                          {/* Delete button — always visible (touch accessible) at low opacity,
                              full opacity on hover/focus so hover-dependent devices work too */}
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setConfirmDeletePhoto({ cid: col.id, pid: photo.id });
                            }}
                            className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center opacity-50 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                            aria-label="Delete this photo from collection"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* Add Photo tile — shown while under the limit */}
                {col.photos.length < MAX_PHOTOS_PER_COLLECTION && (
                  <button
                    onClick={() => triggerUpload(col.id)}
                    aria-label={`Add photo to ${col.name}`}
                    className="relative overflow-hidden rounded-lg aspect-[3/2] group transition-all ring-1 ring-border hover:ring-2 hover:ring-foreground/30 hover:ring-offset-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <div className="absolute inset-0 m-1 rounded border-2 border-dashed border-border group-hover:border-foreground/30 transition-colors" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                      <div className="rounded-full p-1.5 bg-muted/60 text-muted-foreground group-hover:bg-muted group-hover:text-foreground transition-colors">
                        <Plus className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors leading-none">
                        Add Photo
                      </span>
                    </div>
                  </button>
                )}

                {/* Limit reached notice — shown in the grid position after the last photo */}
                {col.photos.length >= MAX_PHOTOS_PER_COLLECTION && (
                  <div className="rounded-lg aspect-[3/2] bg-muted/40 flex items-center justify-center">
                    <span className="text-[10px] text-muted-foreground text-center px-2 leading-tight">
                      Limit reached ({MAX_PHOTOS_PER_COLLECTION} photos)
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Supported formats hint */}
            <p className="text-[10px] text-muted-foreground mt-1 px-1">
              JPEG, PNG, WebP, GIF — max 25 MB each
            </p>
          </div>
        );
      })}
    </div>
  );
}
