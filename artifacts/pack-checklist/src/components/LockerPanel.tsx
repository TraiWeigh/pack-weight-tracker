import React, { useState } from 'react';
import { PackState, CategoryMeta } from '../hooks/usePackData';
import { Background } from './BackgroundPicker';
import { ChevronDown, ChevronRight, Trash2, FolderOpen } from 'lucide-react';

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

export const LOCKER_KEY = 'trailweigh:locker';

interface LockerPanelProps {
  entries: LockerEntry[];
  onLoad: (entry: LockerEntry) => void;
  onDelete: (id: string) => void;
}

function formatDate(ts: number) {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function LockerPanel({ entries, onLoad, onDelete }: LockerPanelProps) {
  const [open, setOpen] = useState(true);
  const [confirmId, setConfirmId] = useState<string | null>(null);

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
            <img src="/locker.png" alt="" className="w-4 h-4 opacity-60 flex-shrink-0" />
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
                <div
                  key={entry.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors group"
                >
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{entry.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(entry.savedAt)}</p>
                  </div>

                  {/* Actions */}
                  {confirmId === entry.id ? (
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
                  ) : (
                    <div className="flex items-center gap-1 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onLoad(entry)}
                        title="Load this list"
                        className="p-1.5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setConfirmId(entry.id)}
                        title="Delete"
                        className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
