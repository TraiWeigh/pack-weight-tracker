import React, { useState, useRef } from 'react';
import { GearItem } from '../hooks/usePackData';
import { CATEGORY_ROLE_ALIASES, normCat, resolveDestination } from '../lib/categoryAliases';
import {
  FileUp, Loader2, CheckCircle2, AlertCircle, X,
  ChevronDown, ChevronUp, Check, AlertTriangle,
} from 'lucide-react';
import { useBarStyle, barCombinedStyle, barFgStyle, barFontStyle, barCardStyle } from '../context/BarStyleContext';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ParsedItem {
  sub: string;
  desc: string;
  weightOz: number;
  warning: boolean;
  warningMsg?: string;
  destination?: string;
}

type WeightUnit = 'oz' | 'g' | 'lb' | 'kg';
const SUPPORTED_UNITS: WeightUnit[] = ['oz', 'g', 'lb', 'kg'];
const TO_OZ: Record<WeightUnit, number> = { oz: 1, g: 1 / 28.3495, lb: 16, kg: 35.274 };

function displayToOz(display: string, unit: WeightUnit): number {
  const n = parseFloat(display);
  if (isNaN(n) || n < 0) return 0;
  return n * TO_OZ[unit];
}

interface EditedItem extends ParsedItem {
  selected:      boolean;
  added:         boolean;
  destination:   string;
  displayWeight: string;
  weightUnit:    WeightUnit;
  errors:        Record<string, string>;
}

interface ImportGearPanelProps {
  categoryOrder: string[];
  onAddItem: (category: string, prefill: Partial<GearItem>) => void;
  /** Whether the panel starts expanded. Defaults to true (private Checklist behavior). */
  defaultOpen?: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ACCEPTED     = '.pdf,.docx,.doc,.xlsx,.xls,.numbers';
const ACCEPT_LABEL = 'PDF, Word, Excel, or Numbers';

// CATEGORY_ROLE_ALIASES, normCat, and resolveDestination are imported from
// ../lib/categoryAliases — the single source of truth shared with the final
// import callback so the review table and Checklist.tsx cannot disagree.

// ── Validation ────────────────────────────────────────────────────────────────

function validateRow(item: EditedItem, categoryOrder: string[]): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!item.sub.trim() && !item.desc.trim()) errors.sub = 'Type or Description is required';
  const w = parseFloat(item.displayWeight);
  if (item.displayWeight.trim() === '' || isNaN(w) || w < 0) errors.weight = 'Enter a valid weight (0 or more)';
  if (!SUPPORTED_UNITS.includes(item.weightUnit)) errors.unit = 'Unsupported unit';
  // Accept destinations already in the user's list OR known canonical names (these will be
  // auto-created as new categories on import if not already present).
  if (!item.destination.trim()) errors.destination = 'Select a category';
  return errors;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parsedToEdited(item: ParsedItem, categoryOrder: string[]): EditedItem {
  const resolved = resolveDestination(item.destination ?? '', categoryOrder);
  return {
    ...item,
    selected:      true,
    added:         false,
    destination:   resolved || (categoryOrder[0] ?? ''),
    displayWeight: String(item.weightOz),
    weightUnit:    'oz',
    errors:        {},
  };
}

function blankEditedItem(categoryOrder: string[]): EditedItem {
  return {
    sub: '', desc: '', weightOz: 0, warning: false,
    selected: true, added: false,
    destination:   categoryOrder[0] ?? '',
    displayWeight: '',
    weightUnit:    'oz',
    errors:        {},
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

type Phase = 'idle' | 'parsing' | 'review' | 'error';

export function ImportGearPanel({ categoryOrder, onAddItem, defaultOpen = true }: ImportGearPanelProps) {
  const [open, setOpen]   = useState(defaultOpen);
  const barStyle = useBarStyle();
  const [phase, setPhase] = useState<Phase>('idle');
  const [isDragging, setIsDragging] = useState(false);

  const [fileName, setFileName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Review phase
  const [items, setItems] = useState<EditedItem[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Reset ─────────────────────────────────────────────────────────────────

  const reset = () => {
    setPhase('idle');
    setItems([]);
    setErrorMsg('');
    setFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── File selection ────────────────────────────────────────────────────────

  const processFile = (file: File) => {
    setFileName(file.name);
    setErrorMsg('');
    setPhase('parsing');
    submitToApi(file);
  };

  // ── API call ──────────────────────────────────────────────────────────────

  const submitToApi = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const resp = await fetch('/api/import-gear', { method: 'POST', body: formData });

      const ct = resp.headers.get('content-type') ?? '';
      if (!ct.includes('application/json')) {
        throw new Error(
          resp.status === 404
            ? 'Upload route not found — please reload the page and try again.'
            : `Server error ${resp.status}: unexpected response format.`,
        );
      }

      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.error ?? 'Import failed');
      }

      const parsed: ParsedItem[] = data.items ?? [];

      if (parsed.length === 0) {
        setPhase('error');
        setErrorMsg('No gear items with weight values were found in this file. Try a different file or format.');
        return;
      }

      setItems(parsed.map(item => parsedToEdited(item, categoryOrder)));
      setPhase('review');
    } catch (err: any) {
      setPhase('error');
      setErrorMsg(err.message ?? 'Something went wrong. Please try again.');
    }
  };

  /** Add a blank row to the review table for manual entry. */
  const addManualItem = () => {
    setItems(prev => [...prev, blankEditedItem(categoryOrder)]);
    if (phase !== 'review') setPhase('review');
  };

  // ── Item edit helpers ─────────────────────────────────────────────────────

  const toggleSelect = (idx: number) =>
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, selected: !it.selected } : it));

  const toggleAll = () => {
    const allSel = items.filter(i => !i.added).every(i => i.selected);
    setItems(prev => prev.map(it => it.added ? it : { ...it, selected: !allSel }));
  };

  const updateField = (idx: number, patch: Partial<EditedItem>) =>
    setItems(prev => prev.map((it, i) => {
      if (i !== idx) return it;
      const newErrors = { ...it.errors };
      if ('sub' in patch || 'desc' in patch) delete newErrors.sub;
      if ('displayWeight' in patch) delete newErrors.weight;
      if ('weightUnit' in patch) delete newErrors.unit;
      if ('destination' in patch) delete newErrors.destination;
      return { ...it, ...patch, errors: newErrors };
    }));

  const addSelected = () => {
    // Collect pending (selected, not yet added) items with their original indices
    const pending = items
      .map((it, idx) => ({ ...it, idx }))
      .filter(it => it.selected && !it.added);

    if (pending.length === 0) return;

    // Validate outside setItems — state updaters must be pure (no side effects)
    const validated = pending.map(it => ({
      ...it,
      errors: validateRow(it, categoryOrder),
    }));
    const invalid = validated.filter(it => Object.keys(it.errors).length > 0);
    const valid   = validated.filter(it => Object.keys(it.errors).length === 0);

    if (invalid.length > 0) {
      setItems(prev =>
        prev.map((it, i) => {
          const v = validated.find(vi => vi.idx === i);
          if (!v || !it.selected || it.added) return it;
          return { ...it, errors: v.errors };
        }),
      );
    }

    // Call onAddItem for each valid item — outside the state updater
    for (const it of valid) {
      const weightOz = displayToOz(it.displayWeight, it.weightUnit);
      onAddItem(it.destination, { sub: it.sub, desc: it.desc, weightOz, checked: false });
    }

    if (invalid.length === 0) {
      reset();
    } else {
      setItems(prev =>
        prev.map((it, i) => {
          const v = valid.find(vi => vi.idx === i);
          if (!v) return it;
          return { ...it, added: true, selected: false, errors: {} };
        }),
      );
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────

  const pending     = items.filter(i => !i.added);
  const selectedCnt = items.filter(i => i.selected && !i.added).length;
  const addedCnt    = items.filter(i => i.added).length;

  const gridCols = 'grid-cols-[20px_minmax(68px,0.85fr)_minmax(60px,0.75fr)_minmax(80px,1fr)_minmax(105px,auto)_20px]';

  // ── Handlers ─────────────────────────────────────────────────────────────

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

  // ── Render ────────────────────────────────────────────────────────────────

  // 023F: font cascades to expanded Scan Gear body via outer wrapper
  return (
    <div className="bg-card border border-card-border rounded-xl shadow-sm overflow-hidden" style={{ ...barCardStyle(barStyle), ...barFontStyle(barStyle) }}>

      {/* ── Panel header ── */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full flex items-center gap-2 p-4 sm:p-5 border-b border-border bg-muted/20 text-left hover:bg-muted/30 transition-colors"
        style={barCombinedStyle(barStyle)}
      >
        {/* Chevron reflects open/closed state: Up = expanded, Down = collapsed */}
        {open
          ? <ChevronUp   className="w-4 h-4 text-muted-foreground flex-shrink-0" style={barFgStyle(barStyle)} />
          : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" style={barFgStyle(barStyle)} />
        }
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <FileUp className="w-4 h-4 text-primary flex-shrink-0" style={barFgStyle(barStyle)} />
            <h2 className="font-semibold text-foreground text-base" style={barFgStyle(barStyle)}>Scan Gear List</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5" style={barFgStyle(barStyle)}>
            Upload a file to import Type, Description, and Weight.
          </p>
        </div>
      </button>

      {open && (
        <div className="p-4 sm:p-5 space-y-4" style={{ backgroundColor: 'hsl(var(--card))' }}>

          {/* ── Drop zone (idle + error) ── */}
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
                <input ref={fileInputRef} type="file" accept={ACCEPTED} className="hidden" onChange={handleFileChange} />
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

          {/* ── Parsing spinner ── */}
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

              {/* Table */}
              <div className="border border-border rounded-lg overflow-hidden">

                {/* Column headers */}
                <div className={`grid ${gridCols} gap-x-1 items-center px-2 py-1.5 bg-muted/40 border-b border-border`}>
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
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Category</span>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Type</span>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Description</span>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Weight / Unit</span>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-center">⚠</span>
                </div>

                {/* Rows */}
                <div className="max-h-[420px] overflow-y-auto divide-y divide-border">
                  {items.map((item, idx) => {
                    const hasErrors = Object.keys(item.errors).length > 0;
                    return (
                      <div key={idx} className={item.added ? 'opacity-40 bg-muted/10' : ''}>
                        <div className={`grid ${gridCols} gap-x-1 items-center px-2 py-1.5 transition-colors ${
                          !item.added && hasErrors ? 'bg-destructive/5' : (!item.added ? 'hover:bg-muted/20' : '')
                        }`}>

                          {/* Checkbox */}
                          <button
                            disabled={item.added}
                            onClick={() => toggleSelect(idx)}
                            className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors mx-auto ${
                              item.added ? 'border-border bg-muted'
                                : item.selected ? 'bg-primary border-primary text-primary-foreground'
                                  : 'border-border bg-card hover:border-primary/50'
                            }`}
                          >
                            {(item.selected || item.added) && <Check className="w-2.5 h-2.5" />}
                          </button>

                          {/* Destination */}
                          {item.added ? (
                            <span className="text-xs text-muted-foreground truncate">{item.destination || '—'}</span>
                          ) : (
                            <select
                              value={item.destination}
                              onChange={e => updateField(idx, { destination: e.target.value })}
                              className={`w-full text-xs text-foreground bg-transparent border-b focus:outline-none truncate ${
                                item.errors.destination ? 'border-destructive text-destructive' : 'border-transparent focus:border-primary/40'
                              }`}
                            >
                              {categoryOrder.map(c => <option key={c} value={c}>{c}</option>)}
                              {/* If the assigned destination isn't yet in the user's list, render
                                  it as an extra option so the select always displays correctly.
                                  Importing will auto-create the category tab. */}
                              {item.destination && !categoryOrder.includes(item.destination) && (
                                <option key={`_extra_${item.destination}`} value={item.destination}>
                                  {item.destination}
                                </option>
                              )}
                            </select>
                          )}

                          {/* Type */}
                          {item.added ? (
                            <span className="text-xs text-muted-foreground truncate">{item.sub || '—'}</span>
                          ) : (
                            <input
                              value={item.sub}
                              onChange={e => updateField(idx, { sub: e.target.value })}
                              placeholder="Type"
                              maxLength={60}
                              className={`w-full text-xs bg-transparent border-b focus:outline-none placeholder:text-muted-foreground/50 truncate ${
                                item.errors.sub ? 'border-destructive text-destructive' : 'border-transparent focus:border-primary/40 text-foreground'
                              }`}
                            />
                          )}

                          {/* Description */}
                          {item.added ? (
                            <span className="text-xs text-muted-foreground truncate">{item.desc || '—'}</span>
                          ) : (
                            <input
                              value={item.desc}
                              onChange={e => updateField(idx, { desc: e.target.value })}
                              placeholder="Description"
                              maxLength={150}
                              className={`w-full text-xs bg-transparent border-b focus:outline-none placeholder:text-muted-foreground/50 truncate ${
                                item.errors.sub && !item.sub.trim()
                                  ? 'border-destructive text-destructive'
                                  : 'border-transparent focus:border-primary/40 text-foreground'
                              }`}
                            />
                          )}

                          {/* Weight + Unit */}
                          {item.added ? (
                            <span className="text-xs text-muted-foreground font-mono text-right">
                              {item.displayWeight} {item.weightUnit}
                            </span>
                          ) : (
                            <div className="flex items-center gap-1 min-w-0">
                              <input
                                type="text"
                                inputMode="decimal"
                                value={item.displayWeight}
                                onChange={e => updateField(idx, { displayWeight: e.target.value })}
                                placeholder="0"
                                className={`w-0 flex-1 text-xs bg-transparent border-b focus:outline-none text-right font-mono min-w-[32px] ${
                                  item.errors.weight
                                    ? 'border-destructive text-destructive placeholder:text-destructive/50'
                                    : 'border-transparent focus:border-primary/40 text-foreground placeholder:text-muted-foreground/50'
                                }`}
                              />
                              <select
                                value={item.weightUnit}
                                onChange={e => updateField(idx, { weightUnit: e.target.value as WeightUnit })}
                                className={`flex-shrink-0 text-xs bg-transparent border-b focus:outline-none cursor-pointer ${
                                  item.errors.unit
                                    ? 'border-destructive text-destructive'
                                    : 'border-transparent focus:border-primary/40 text-muted-foreground hover:text-foreground'
                                }`}
                              >
                                {SUPPORTED_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                              </select>
                            </div>
                          )}

                          {/* Warning */}
                          <div className="flex justify-center">
                            {item.added ? (
                              <span className="text-[10px] text-primary font-semibold">✓</span>
                            ) : item.warning ? (
                              <span title={item.warningMsg ?? 'Review this item — weight or description may need correction'}>
                                <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0" />
                              </span>
                            ) : (
                              <span className="w-3 h-3" />
                            )}
                          </div>
                        </div>

                        {/* Inline validation errors */}
                        {!item.added && hasErrors && (
                          <div className="px-6 pb-1.5 flex flex-wrap gap-x-4 gap-y-0.5">
                            {item.errors.sub       && <p className="text-[10px] text-destructive leading-tight">{item.errors.sub}</p>}
                            {item.errors.weight    && <p className="text-[10px] text-destructive leading-tight">{item.errors.weight}</p>}
                            {item.errors.unit      && <p className="text-[10px] text-destructive leading-tight">{item.errors.unit}</p>}
                            {item.errors.destination && <p className="text-[10px] text-destructive leading-tight">{item.errors.destination}</p>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Warning legend */}
              {items.some(i => i.warning && !i.added) && (
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0" />
                  Flagged items may have unusual weights or missing descriptions — review before importing.
                </p>
              )}

              {/* Validation error notice */}
              {items.some(i => !i.added && Object.keys(i.errors).length > 0) && (
                <p className="text-[10px] text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  Some rows have errors — correct the highlighted fields before they can be imported.
                </p>
              )}

              {/* Action bar */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={addSelected}
                  disabled={selectedCnt === 0}
                  className="flex items-center gap-1.5 text-xs font-semibold bg-primary text-primary-foreground px-3 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  Import {selectedCnt > 0 ? `${selectedCnt} item${selectedCnt !== 1 ? 's' : ''}` : 'Selected'}
                </button>

                <button
                  onClick={addManualItem}
                  className="flex items-center gap-1.5 text-xs font-medium border border-border px-3 py-2 rounded-lg hover:bg-muted/30 transition-colors text-foreground"
                >
                  + Add Row
                </button>

                <button
                  onClick={reset}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground ml-auto"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </button>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
