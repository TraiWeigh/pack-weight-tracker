import React, { useState } from 'react';
import { PackState, CategoryMeta } from '../hooks/usePackData';
import { Background } from './BackgroundPicker';
import { ChevronDown, ChevronRight, Trash2, FolderOpen, Pencil, Check, X } from 'lucide-react';
import { LockerIcon } from './LockerIcon';

export type Store = {
  items: PackState;
  order: string[];
  meta: Record<string, CategoryMeta>;
};

export interface LockerEntry {
  id: string;
  name: string;
  savedAt: number;
  store: Store;
  background: Background | null;
  bgFade: number;
  bgTone: 'light' | 'dark';
}

// Re-export for backwards-compat (canonical definition is in usePackData)
export { LOCKER_KEY } from '../hooks/usePackData';

interface LockerPanelProps {
  entries: LockerEntry[];
  onLoad: (entry: LockerEntry) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => void;
}

function formatDate(ts: number) {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function LockerPanel({ entries, onLoad, onDelete, onRename }: LockerPanelProps) {
  const [open, setOpen] = useState(true);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [renameError, setRenameError] = useState<string | null>(null);

  const startRename = (entry: LockerEntry) => {
    setEditId(entry.id);
    setEditName(entry.name);
    setRenameError(null);
    setConfirmId(null);
  };

  const confirmRename = () => {
    const trimmed = editName.trim();
    if (!trimmed || !editId) return;
    const isDuplicate = entries.some(e => e.id !== editId && e.name === trimmed);
    if (isDuplicate) {
      setRenameError('A list with this name already exists.');
      return;
    }
    onRename(editId, trimmed);
    setEditId(null);
    setEditName('');
    setRenameError(null);
  };

  const cancelRename = () => {
    setEditId(null);
    setEditName('');
    setRenameError(null);
  };

  return (
    <div className="bg-card border border-card-border rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 p-4 sm:p-5 border-b border-border bg-muted/20 text-left hover:bg-muted/30 transition-colors"
      >
        {open
          ? <ChevronDown  className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          : <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        }
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <LockerIcon className="w-6 h-6 min-w-[24px] flex-shrink-0 opacity-60" />
            <h2 className="font-semibold text-foreground text-base">Locker</h2>
            {entries.length > 0 && (
              <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {entries.length}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your saved gear lists.
          </p>
        </div>
      </button>

      {open && (
        <div>
          {entries.length === 0 ? (
            <p className="px-5 py-6 text-xs text-muted-foreground text-center">
              No saved lists yet. Click the <strong>Save</strong> button in the toolbar to save the current list.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {entries.map(entry => (
                <div key={entry.id} className="px-4 py-3 hover:bg-muted/20 transition-colors group">
                  {editId === entry.id ? (
                    /* ── Rename mode ── */
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <input
                          autoFocus
                          type="text"
                          value={editName}
                          onChange={e => { setEditName(e.target.value); setRenameError(null); }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') confirmRename();
                            if (e.key === 'Escape') cancelRename();
                          }}
                          maxLength={40}
                          className="flex-1 text-xs border border-border rounded-md px-2 py-1.5 bg-background focus:outline-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground min-w-0"
                        />
                        <button
                          onClick={confirmRename}
                          disabled={!editName.trim()}
                          title="Confirm rename"
                          className="p-1.5 rounded hover:bg-primary/10 text-primary disabled:opacity-40 transition-colors flex-shrink-0"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={cancelRename}
                          title="Cancel rename"
                          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {renameError && (
                        <p className="text-[10px] text-destructive pl-0.5">{renameError}</p>
                      )}
                    </div>
                  ) : confirmId === entry.id ? (
                    /* ── Delete confirm mode ── */
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{entry.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(entry.savedAt)}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="text-[10px] text-destructive font-medium hidden sm:inline">Delete?</span>
                        <button
                          onClick={() => { onDelete(entry.id); setConfirmId(null); }}
                          className="text-[10px] font-semibold bg-destructive text-destructive-foreground px-2 py-1 rounded"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setConfirmId(null)}
                          className="text-[10px] font-semibold bg-muted text-muted-foreground px-2 py-1 rounded"
                        >
                          No
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ── Normal mode ── */
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{entry.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(entry.savedAt)}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onLoad(entry)}
                          title="Load this list in a new tab"
                          className="p-1.5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => startRename(entry)}
                          title="Rename"
                          className="p-1.5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmId(entry.id)}
                          title="Delete"
                          className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
