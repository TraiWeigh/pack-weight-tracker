import React, { useState, useRef } from 'react';
import { GearItem } from '../hooks/usePackData';
import {
  FileUp, Loader2, CheckCircle2, AlertCircle, X, Plus, ChevronDown, ChevronRight, Check, AlertTriangle,
} from 'lucide-react';

interface ParsedItem {
  sub: string;
  desc: string;
  weightOz: number;
  warning: boolean;
}

interface EditedItem extends ParsedItem {
  selected: boolean;
  added: boolean;
}

interface ImportGearPanelProps {
  categoryOrder: string[];
  onAddItem: (category: string, prefill: Partial<GearItem>) => void;
}

// Only accept the four deterministic formats (no CSV)
const ACCEPTED      = '.pdf,.docx,.doc,.xlsx,.xls,.numbers';
const ACCEPT_LABEL  = 'PDF, Word (.docx), Excel (.xlsx), or Numbers';

export function ImportGearPanel({ categoryOrder, onAddItem }: ImportGearPanelProps) {
  const [open, setOpen]       = useState(true);
  const [phase, setPhase]     = useState<'idle' | 'parsing' | 'review' | 'error'>('idle');
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName]     = useState('');
  const [items, setItems]           = useState<EditedItem[]>([]);
  const [errorMsg, setErrorMsg]     = useState('');
  const [targetCategory, setTargetCategory] = useState<string>('');
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

    try {
      const resp = await fetch('/api/import-gear', { method: 'POST', body: formData });
      const data = await resp.json();

      if (!resp.ok) throw new Error(data.error ?? 'Import failed');

      const parsed: ParsedItem[] = data.items ?? [];
      if (parsed.length === 0) {
        setPhase('error');
        setErrorMsg('No gear items with weight values were found in this file. Try a different file or format.');
        return;
      }

      setItems(parsed.map(item => ({ ...item, selected: true, added: false })));
      // Default target category to first in order
      if (categoryOrder.length > 0 && !targetCategory) {
        setTargetCategory(categoryOrder[0]);
      }
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

  // ── Item edits ──────────────────────────────────────────────────────────────

  const toggleSelect  = (idx: number) =>
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, selected: !it.selected } : it));

  const toggleAll = () => {
    const allSel = items.filter(i => !i.added).every(i => i.selected);
    setItems(prev => prev.map(it => it.added ? it : { ...it, selected: !allSel }));
  };

  const updateField = (idx: number, patch: Partial<EditedItem>) =>
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it));

  const addOne = (idx: number) => {
    const it = items[idx];
    if (!it || it.added) return;
    const cat = targetCategory || categoryOrder[0] || '';
    if (!cat) return;
    onAddItem(cat, { sub: it.sub, desc: it.desc, weightOz: it.weightOz, checked: true });
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, added: true, selected: false } : item));
  };

  const addSelected = () => {
    items.forEach((_, idx) => { if (items[idx].selected && !items[idx].added) addOne(idx); });
  };

  const pending     = items.filter(i => !i.added);
  const selectedCnt = items.filter(i => i.selected && !i.added).length;
  const addedCnt    = items.filter(i => i.added).length;

  return (
    <div className="bg-card border border-card-border rounded-xl shadow-sm overflow-hidden">

      {/* ── Panel header ── */}
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
            <FileUp className="w-4 h-4 text-primary flex-shrink-0" />
            <h2 className="font-semibold text-foreground text-base">Scan Gear List</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Upload a file to import Type, Description, and Weight.
          </p>
        </div>
      </button>

      {open && (
        <div className="p-4 sm:p-5 space-y-4">

          {/* ── Drop zone ── */}
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

          {/* ── Parsing state ── */}
          {phase === 'parsing' && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <Loader2 className="w-7 h-7 text-primary animate-spin" />
              <div>
                <p className="text-sm font-semibold text-foreground">Reading your file…</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">{fileName}</p>
              </div>
            </div>
          )}

          {/* ── Review table ── */}
          {phase === 'review' && items.length > 0 && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">

              {/* Summary bar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-foreground">
                    {pending.length} item{pending.length !== 1 ? 's' : ''} found
                    {addedCnt > 0 && <span className="text-muted-foreground font-normal"> · {addedCnt} added</span>}
                  </span>
                </div>
                <button onClick={reset} className="text-muted-foreground hover:text-foreground">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Target category */}
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  Add to:
                </label>
                <select
                  value={targetCategory}
                  onChange={e => setTargetCategory(e.target.value)}
                  className="flex-1 text-xs text-foreground bg-card border border-border rounded-md px-2 py-1.5 focus:outline-none focus:border-primary/50"
                >
                  {categoryOrder.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Table */}
              <div className="border border-border rounded-lg overflow-hidden">

                {/* Column headers */}
                <div className="grid grid-cols-[28px_1fr_1fr_68px_28px] gap-x-2 items-center px-2 py-1.5 bg-muted/40 border-b border-border">
                  {/* Select-all checkbox */}
                  <button
                    onClick={toggleAll}
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors mx-auto ${
                      selectedCnt === pending.length && pending.length > 0
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-border bg-card'
                    }`}
                  >
                    {selectedCnt === pending.length && pending.length > 0 && <Check className="w-2.5 h-2.5" />}
                  </button>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Type</span>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Description</span>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-right">Wt (oz)</span>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-center">⚠</span>
                </div>

                {/* Rows */}
                <div className="max-h-[320px] overflow-y-auto divide-y divide-border">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className={`grid grid-cols-[28px_1fr_1fr_68px_28px] gap-x-2 items-center px-2 py-1.5 transition-colors ${
                        item.added ? 'opacity-40 bg-muted/10' : 'hover:bg-muted/20'
                      }`}
                    >
                      {/* Checkbox */}
                      <button
                        disabled={item.added}
                        onClick={() => toggleSelect(idx)}
                        className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors mx-auto ${
                          item.added
                            ? 'border-border bg-muted'
                            : item.selected
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'border-border bg-card hover:border-primary/50'
                        }`}
                      >
                        {(item.selected || item.added) && <Check className="w-2.5 h-2.5" />}
                      </button>

                      {/* Type (editable) */}
                      {item.added ? (
                        <span className="text-xs text-muted-foreground truncate">{item.sub || '—'}</span>
                      ) : (
                        <input
                          value={item.sub}
                          onChange={e => updateField(idx, { sub: e.target.value })}
                          placeholder="Type"
                          maxLength={60}
                          className="w-full text-xs bg-transparent border-b border-transparent focus:border-primary/40 focus:outline-none text-foreground placeholder:text-muted-foreground/50 truncate"
                        />
                      )}

                      {/* Description (editable) */}
                      {item.added ? (
                        <span className="text-xs text-muted-foreground truncate">{item.desc || '—'}</span>
                      ) : (
                        <input
                          value={item.desc}
                          onChange={e => updateField(idx, { desc: e.target.value })}
                          placeholder="Description"
                          maxLength={150}
                          className="w-full text-xs bg-transparent border-b border-transparent focus:border-primary/40 focus:outline-none text-foreground placeholder:text-muted-foreground/50 truncate"
                        />
                      )}

                      {/* Weight (editable) */}
                      {item.added ? (
                        <span className="text-xs text-muted-foreground text-right font-mono">{item.weightOz.toFixed(2)}</span>
                      ) : (
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={item.weightOz}
                          onChange={e => updateField(idx, { weightOz: parseFloat(e.target.value) || 0 })}
                          className="w-full text-xs bg-transparent border-b border-transparent focus:border-primary/40 focus:outline-none text-right font-mono text-foreground"
                        />
                      )}

                      {/* Warning */}
                      <div className="flex justify-center">
                        {item.added ? (
                          <span className="text-[10px] text-primary font-semibold">✓</span>
                        ) : item.warning ? (
                          <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0" title="Review this item — weight or description may need correction" />
                        ) : (
                          <span className="w-3 h-3" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Warning legend */}
              {items.some(i => i.warning && !i.added) && (
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0" />
                  Flagged items may have unusual weights or missing descriptions — review before importing.
                </p>
              )}

              {/* Actions */}
              {pending.length > 0 && (
                <button
                  onClick={addSelected}
                  disabled={selectedCnt === 0}
                  className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold bg-primary text-primary-foreground px-3 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Import {selectedCnt > 0 ? `${selectedCnt} selected` : 'selected'} item{selectedCnt !== 1 ? 's' : ''}
                </button>
              )}

              {pending.length === 0 && addedCnt > 0 && (
                <div className="flex items-center justify-center gap-2 py-2 text-xs text-primary font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  All items added!
                  <button onClick={reset} className="underline text-muted-foreground hover:text-foreground ml-1">
                    Import another file
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
