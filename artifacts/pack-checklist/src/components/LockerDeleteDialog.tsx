/**
 * LockerDeleteDialog — simple confirmation for Locker file deletion.
 *
 * No password or account re-verification required.
 * Ownership is enforced at the call site: requestProtectedDelete() in
 * ChecklistContent only opens this dialog when the user is signed in
 * (authenticated with a valid userId).
 *
 * Cancel:      nothing deleted.
 * Permanently Delete: host performs the deletion via onConfirmed().
 */
import React, { useRef, useEffect, useCallback } from 'react';
import { Trash2, X } from 'lucide-react';
import type { LockerEntry } from './LockerPanel';

// ── Constants (exported so Checklist can use them without duplication) ─────────

/** sessionStorage key for IDs pending deletion across an OAuth redirect round-trip. */
export const LOCKER_PENDING_DELETE_KEY = 'locker_pending_delete_ids';

/** URL query-parameter set to '1' after a successful identity verification redirect. */
export const LOCKER_DELETE_VERIFIED_PARAM = 'locker_delete_verified';

// ── Component ─────────────────────────────────────────────────────────────────

interface LockerDeleteDialogProps {
  /** Entries that will be deleted on confirmation. */
  entries: LockerEntry[];
  /** Called after the user clicks "Permanently Delete". The host performs deletion. */
  onConfirmed: () => void;
  /** Called when the dialog is cancelled — nothing is deleted. */
  onCancel: () => void;
}

export function LockerDeleteDialog({
  entries,
  onConfirmed,
  onCancel,
}: LockerDeleteDialogProps) {
  const dialogRef    = useRef<HTMLDivElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  // ── Autofocus "Permanently Delete" for keyboard users ─────────────────────
  useEffect(() => {
    const id = setTimeout(() => confirmBtnRef.current?.focus(), 60);
    return () => clearTimeout(id);
  }, []);

  // ── Focus trap ────────────────────────────────────────────────────────────
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { onCancel(); return; }
    if (e.key !== 'Tab') return;
    const el = dialogRef.current;
    if (!el) return;
    const focusable = Array.from(
      el.querySelectorAll<HTMLElement>('button:not([disabled])')
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      last.focus(); e.preventDefault();
    } else if (!e.shiftKey && document.activeElement === last) {
      first.focus(); e.preventDefault();
    }
  }, [onCancel]);

  // ── Content strings ───────────────────────────────────────────────────────
  const isSingle = entries.length === 1;
  const title = isSingle
    ? `Permanently delete "${entries[0].name}"?`
    : `Permanently delete ${entries.length} Locker files?`;
  const bodyText = isSingle
    ? 'This cannot be undone.'
    : `These ${entries.length} files will be permanently deleted. This cannot be undone.`;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ldel-title"
      aria-describedby="ldel-desc"
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog panel */}
      <div
        ref={dialogRef}
        className="relative bg-card border border-card-border rounded-xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-5"
      >
        {/* Header */}
        <div className="flex items-start gap-3">
          <div
            className="mt-0.5 p-2 rounded-full bg-destructive/10 flex-shrink-0"
            aria-hidden="true"
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </div>
          <div className="flex-1 min-w-0">
            <h2
              id="ldel-title"
              className="text-sm font-semibold text-foreground leading-snug"
            >
              {title}
            </h2>
            <p
              id="ldel-desc"
              className="mt-1 text-xs text-muted-foreground leading-relaxed"
            >
              {bodyText}
            </p>
          </div>
          <button
            onClick={onCancel}
            aria-label="Cancel deletion"
            className="flex-shrink-0 text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="text-sm font-medium text-muted-foreground hover:text-foreground px-4 py-2 rounded-lg border border-border hover:bg-muted/40 transition-colors"
          >
            Cancel
          </button>
          <button
            ref={confirmBtnRef}
            onClick={onConfirmed}
            className="text-sm font-semibold bg-destructive text-destructive-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
          >
            Permanently Delete
          </button>
        </div>
      </div>
    </div>
  );
}
