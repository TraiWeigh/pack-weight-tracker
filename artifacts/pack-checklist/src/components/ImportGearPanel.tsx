import React, { useState, useRef } from 'react';
import { GearItem } from '../hooks/usePackData';
import {
  FileUp, Loader2, CheckCircle2, AlertCircle, X, Plus, ChevronDown, ChevronRight, Check,
} from 'lucide-react';

interface ParsedItem {
  sub: string;
  desc: string;
  weightOz: number;
  category: string;
}

interface EditedItem extends ParsedItem {
  selected: boolean;
  added: boolean;
}

interface ImportGearPanelProps {
  categoryOrder: string[];
  onAddItem: (category: string, prefill: Partial<GearItem>) => void;
}

const ACCEPTED = '.pdf,.docx,.doc,.xlsx,.xls,.numbers,.csv';
const ACCEPT_LABEL = 'PDF, Word (.docx), Excel (.xlsx), Numbers, or CSV';

export function ImportGearPanel({ categoryOrder, onAddItem }: ImportGearPanelProps) {
  const [open, setOpen] = useState(true);
  const [phase, setPhase] = useState<'idle' | 'parsing' | 'review' | 'error'>('idle');
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [items, setItems] = useState<EditedItem[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setPhase('idle');
    setItems([]);
    setErrorMsg('');
    setFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processFile = async (file: File) => {
    setFileName(file.name);
    setPhase('parsing');
    setErrorMsg('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('categoryOrder', JSON.stringify(categoryOrder));

    try {
      const resp = await fetch('/api/import-gear', { method: 'POST', body: formData });
      const data = await resp.json();

      if (!resp.ok) {
        if (data.code === 'no_api_key') {
          setPhase('error');
          setErrorMsg('OpenAI API key not configured. Add OPENAI_API_KEY to your environment secrets.');
          return;
        }
        throw new Error(data.error ?? 'Import failed');
      }

      const parsed: ParsedItem[] = data.items ?? [];
      setItems(parsed.map(item => ({
        ...item,
        category: categoryOrder.includes(item.category) ? item.category : (categoryOrder[0] ?? ''),
        selected: true,
        added: false,
      })));
      setPhase('review');
    } catch (err: any) {
      setPhase('error');
      setErrorMsg(err.message ?? 'Something went wrong. Please try again.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const toggleSelect = (idx: number) =>
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, selected: !it.selected } : it));

  const toggleAll = () => {
    const allSelected = items.filter(i => !i.added).every(i => i.selected);
    setItems(prev => prev.map(it => it.added ? it : { ...it, selected: !allSelected }));
  };

  const addOne = (idx: number) => {
    const it = items[idx];
    if (!it || it.added) return;
    onAddItem(it.category, { sub: it.sub, desc: it.desc, weightOz: it.weightOz, checked: true });
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, added: true, selected: false } : item));
  };

  const addSelected = () => {
    items.forEach((it, idx) => { if (it.selected && !it.added) addOne(idx); });
  };

  const updateItem = (idx: number, patch: Partial<EditedItem>) =>
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it));

  const pendingCount = items.filter(i => !i.added).length;
  const selectedCount = items.filter(i => i.selected && !i.added).length;
  const addedCount = items.filter(i => i.added).length;

  return (
    <div className="bg-card border border-card-border rounded-xl shadow-sm overflow-hidden">

      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 p-4 sm:p-5 border-b border-border bg-muted/20 text-left hover:bg-muted/30 transition-colors"
      >
        {open
          ? <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          : <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        }
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <FileUp className="w-4 h-4 text-primary flex-shrink-0" />
            <h2 className="font-semibold text-foreground text-base">Import Packing List</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Upload a file — AI reads it and fills your gear categories.
          </p>
        </div>
      </button>

      {open && (
        <div className="p-4 sm:p-5 space-y-4">

          {/* Drop zone — shown when idle or after reset */}
          {(phase === 'idle' || phase === 'error') && (
            <>
              <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50 hover:bg-muted/30'
                }`}
              >
                <FileUp className={`w-6 h-6 mx-auto mb-2 transition-colors ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                <p className="text-sm font-medium text-foreground">Drop your packing list here</p>
                <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
                <p className="text-[10px] text-muted-foreground/60 mt-2">{ACCEPT_LABEL}</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED}
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {phase === 'error' && (
                <div className="flex items-start gap-2 p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-destructive font-medium">Import failed</p>
                    <p className="text-xs text-muted-foreground mt-0.5 break-words">{errorMsg}</p>
                  </div>
                  <button onClick={reset} className="text-muted-foreground hover:text-foreground flex-shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </>
          )}

          {/* Parsing state */}
          {phase === 'parsing' && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <Loader2 className="w-7 h-7 text-primary animate-spin" />
              <div>
                <p className="text-sm font-semibold text-foreground">Reading your file…</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">{fileName}</p>
              </div>
            </div>
          )}

          {/* Review list */}
          {phase === 'review' && items.length > 0 && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Summary bar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-foreground">
                    {pendingCount} item{pendingCount !== 1 ? 's' : ''} found
                    {addedCount > 0 && <span className="text-muted-foreground font-normal"> · {addedCount} added</span>}
                  </span>
                </div>
                <button onClick={reset} className="text-muted-foreground hover:text-foreground">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Item list */}
              <div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
                {/* Select-all header */}
                <div className="flex items-center gap-2 px-3 py-2 bg-muted/30">
                  <button
                    onClick={toggleAll}
                    className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                      selectedCount === pendingCount && pendingCount > 0
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-border bg-card'
                    }`}
                  >
                    {selectedCount === pendingCount && pendingCount > 0 && <Check className="w-3 h-3" />}
                  </button>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Select all
                  </span>
                  <span className="ml-auto text-[10px] text-muted-foreground">
                    {selectedCount} / {pendingCount} selected
                  </span>
                </div>

                <div className="max-h-[300px] overflow-y-auto">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex items-start gap-2 px-3 py-2.5 transition-colors ${
                        item.added ? 'opacity-40' : 'hover:bg-muted/20'
                      }`}
                    >
                      {/* Checkbox */}
                      <button
                        disabled={item.added}
                        onClick={() => toggleSelect(idx)}
                        className={`mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                          item.added
                            ? 'border-border bg-muted'
                            : item.selected
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'border-border bg-card hover:border-primary/50'
                        }`}
                      >
                        {(item.selected || item.added) && <Check className="w-3 h-3" />}
                      </button>

                      {/* Item info */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded truncate max-w-[80px]">
                            {item.sub || 'Item'}
                          </span>
                          <select
                            disabled={item.added}
                            value={item.category}
                            onChange={e => updateItem(idx, { category: e.target.value })}
                            className="text-[10px] text-muted-foreground bg-transparent border border-border rounded px-1 py-0.5 outline-none focus:border-primary/50 disabled:opacity-60"
                          >
                            {categoryOrder.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                        <p className="text-xs text-foreground leading-snug truncate" title={item.desc}>
                          {item.desc || '—'}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {item.weightOz > 0 ? `${item.weightOz.toFixed(2)} oz` : 'Weight unknown'}
                        </p>
                      </div>

                      {/* Add / added */}
                      {item.added ? (
                        <span className="text-[10px] font-semibold text-primary flex-shrink-0 mt-0.5">Added ✓</span>
                      ) : (
                        <button
                          onClick={() => addOne(idx)}
                          title="Add this item"
                          className="mt-0.5 p-1 rounded-md border border-border hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Add selected button */}
              {pendingCount > 0 && (
                <button
                  onClick={addSelected}
                  disabled={selectedCount === 0}
                  className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold bg-primary text-primary-foreground px-3 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add {selectedCount > 0 ? `${selectedCount} selected` : 'selected'} item{selectedCount !== 1 ? 's' : ''}
                </button>
              )}

              {pendingCount === 0 && addedCount > 0 && (
                <div className="flex items-center justify-center gap-2 py-2 text-xs text-primary font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  All items added!
                  <button onClick={reset} className="underline text-muted-foreground hover:text-foreground ml-1">
                    Import another
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
