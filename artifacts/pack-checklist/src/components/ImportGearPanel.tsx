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
  warningMsg?: string;  // human-readable reason for the warning flag
  destination?: string; // category from spreadsheet section header
}

type WeightUnit = 'oz' | 'g' | 'lb' | 'kg';

const SUPPORTED_UNITS: WeightUnit[] = ['oz', 'g', 'lb', 'kg'];

// Conversion factors: multiply by these to get oz
const TO_OZ: Record<WeightUnit, number> = {
  oz: 1,
  g:  1 / 28.3495,
  lb: 16,
  kg: 35.274,
};

function displayToOz(display: string, unit: WeightUnit): number {
  const n = parseFloat(display);
  if (isNaN(n) || n < 0) return 0;
  return n * TO_OZ[unit];
}

interface EditedItem extends ParsedItem {
  selected: boolean;
  added: boolean;
  destination: string;     // always a string (defaults to first category)
  displayWeight: string;   // what the user types in the weight field
  weightUnit: WeightUnit;  // currently selected unit for this row
  errors: Record<string, string>; // field-level validation errors
}

interface ImportGearPanelProps {
  categoryOrder: string[];
  onAddItem: (category: string, prefill: Partial<GearItem>) => void;
}

// Accepted file formats: documents + images
const ACCEPTED      = '.pdf,.docx,.doc,.xlsx,.xls,.numbers,.png,.jpg,.jpeg,.webp';
const ACCEPT_LABEL  = 'PDF, Word, Excel, Numbers, or an image / screenshot';
const IMAGE_EXTS    = new Set(['png', 'jpg', 'jpeg', 'webp']);

/**
 * Maps canonical API destination strings → lists of display-name aliases.
 */
const CATEGORY_ROLE_ALIASES: Record<string, string[]> = {
  Shelter:          ['Shelter', 'Shelter System', 'Tent System', 'Tarp System', 'Hammock System', 'Camp Shelter'],
  Sleep:            ['Sleep', 'Sleep System', 'Sleeping System', 'Sleeping Gear', 'Sleep Gear', 'Bedding'],
  Consumables:      ['Consumables', 'Expendables', 'Consumable Weight', 'Expendable Weight',
                     'Trip Consumables', 'Used Up Items', 'Used-Up Items', 'Perishables',
                     'Food and Fuel', 'Consumable', 'Expendable', 'Miscellaneous'],
  Backpack:         ['Backpack', 'Pack'],
  Kitchen:          ['Kitchen', 'Cooking', 'Cooking System', 'Cook System'],
  Hydration:        ['Hydration', 'Water', 'Water System'],
  Electronics:      ['Electronics', 'Electronics System', 'Electronic Gear'],
  'Clothing Packed':['Clothing Packed', 'Clothing', 'Clothing System', 'Packed Clothing'],
  'Clothing Worn':  ['Clothing Worn', 'Worn Clothing', 'Worn Items', 'Worn Weight', 'Worn'],
  'Dog Pack':       ['Dog Pack', 'Dog Gear', 'Pet Gear'],
  'Med Kit':        ['Med Kit', 'First Aid', 'First Aid Kit', 'Medical Kit'],
  'Repair Kit':     ['Repair Kit', 'Repair', 'Repair and Tools'],
  Toiletries:       ['Toiletries', 'Hygiene', 'Personal Care', 'Toiletry Kit'],
};

function resolveDestination(destination: string, categoryOrder: string[]): string {
  if (!destination) return categoryOrder[0] ?? '';
  if (categoryOrder.includes(destination)) return destination;
  for (const aliases of Object.values(CATEGORY_ROLE_ALIASES)) {
    if (aliases.includes(destination)) {
      for (const alias of aliases) {
        if (categoryOrder.includes(alias)) return alias;
      }
    }
  }
  const destLower = destination.toLowerCase();
  const ci = categoryOrder.find(c => c.toLowerCase() === destLower);
  if (ci) return ci;
  return categoryOrder[0] ?? destination;
}

/** Validate a single row. Returns an errors object (empty = valid). */
function validateRow(item: EditedItem, categoryOrder: string[]): Record<string, string> {
  const errors: Record<string, string> = {};

  // Type OR Description must have usable text
  if (!item.sub.trim() && !item.desc.trim()) {
    errors.sub = 'Type or Description is required';
  }

  // Weight must be a valid number >= 0
  const w = parseFloat(item.displayWeight);
  if (item.displayWeight.trim() === '' || isNaN(w) || w < 0) {
    errors.weight = 'Enter a valid weight (0 or more)';
  }

  // Unit must be supported
  if (!SUPPORTED_UNITS.includes(item.weightUnit)) {
    errors.unit = 'Unsupported unit';
  }

  // Destination must be an existing category
  if (!categoryOrder.includes(item.destination)) {
    errors.destination = 'Select a valid category';
  }

  return errors;
}

export function ImportGearPanel({ categoryOrder, onAddItem }: ImportGearPanelProps) {
  const [open, setOpen]       = useState(true);
  const [phase, setPhase]     = useState<'idle' | 'parsing' | 'review' | 'error'>('idle');
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName]     = useState('');
  const [items, setItems]           = useState<EditedItem[]>([]);
  const [errorMsg, setErrorMsg]     = useState('');
  const [statusMsg, setStatusMsg]   = useState('');
  const [isImageFile, setIsImageFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setPhase('idle');
    setItems([]);
    setErrorMsg('');
    setFileName('');
    setStatusMsg('');
    setIsImageFile(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processFile = async (file: File) => {
    const ext = (file.name.split('.').pop() ?? '').toLowerCase();
    const isImg = IMAGE_EXTS.has(ext) || file.type.startsWith('image/');

    setIsImageFile(isImg);
    setFileName(file.name);
    setPhase('parsing');
    setErrorMsg('');
    setStatusMsg(isImg ? 'Reading image…' : '');

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
        if (isImg) {
          if (data.error === 'DAMAGED_IMAGE') {
            throw new Error('__damaged_image__');
          }
          throw new Error('__ocr_failed__');
        }
        throw new Error(data.error ?? 'Import failed');
      }

      const parsed: ParsedItem[] = data.items ?? [];

      if (isImg && data.error === 'NO_GEAR_ITEMS') {
        setPhase('error');
        setStatusMsg('');
        setErrorMsg('Text was found, but no gear items with recognizable names and weights were detected.');
        return;
      }

      if (parsed.length === 0) {
        setPhase('error');
        setStatusMsg('');
        setErrorMsg(isImg
          ? 'No readable gear-list text was found. Try a clearer image or crop the screenshot closer to the list.'
          : 'No gear items with weight values were found in this file. Try a different file or format.');
        return;
      }

      if (isImg) {
        setStatusMsg('Analyzing gear list…');
        await new Promise(r => setTimeout(r, 600));
      }

      const firstCat = categoryOrder[0] ?? '';
      setItems(parsed.map(item => ({
        ...item,
        selected: true,
        added: false,
        destination: resolveDestination(item.destination ?? '', categoryOrder) || firstCat,
        displayWeight: String(item.weightOz),
        weightUnit: 'oz' as WeightUnit,
        errors: {},
      })));
      setStatusMsg('');
      setPhase('review');
    } catch (err: any) {
      setPhase('error');
      setStatusMsg('');
      if (err.message === '__damaged_image__') {
        setErrorMsg('We could not open this image. Please try another file.');
      } else if (isImg || err.message === '__ocr_failed__') {
        setErrorMsg('We could not read this image. Please try another screenshot or a clearer photo.');
      } else {
        setErrorMsg(err.message ?? 'Something went wrong. Please try again.');
      }
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

  const toggleSelect = (idx: number) =>
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, selected: !it.selected } : it));

  const toggleAll = () => {
    const allSel = items.filter(i => !i.added).every(i => i.selected);
    setItems(prev => prev.map(it => it.added ? it : { ...it, selected: !allSel }));
  };

  /** Update fields and clear the validation error for the touched field(s). */
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

  /** Validate + import a single row, updating state if invalid. */
  const addOne = (idx: number) => {
    const it = items[idx];
    if (!it || it.added) return;
    const errs = validateRow(it, categoryOrder);
    if (Object.keys(errs).length > 0) {
      setItems(prev => prev.map((item, i) => i === idx ? { ...item, errors: errs } : item));
      return;
    }
    const weightOz = displayToOz(it.displayWeight, it.weightUnit);
    onAddItem(it.destination, { sub: it.sub, desc: it.desc, weightOz, checked: false });
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, added: true, selected: false } : item));
  };

  /**
   * Validate all selected rows.
   * - Invalid rows get their errors set and are NOT imported.
   * - Valid rows are imported immediately.
   * - If ALL selected rows were valid, reset the panel.
   */
  const addSelected = () => {
    const toAdd = items.filter(i => i.selected && !i.added);
    if (toAdd.length === 0) return;

    let anyInvalid = false;

    setItems(prev => prev.map(it => {
      if (!it.selected || it.added) return it;
      const errs = validateRow(it, categoryOrder);
      if (Object.keys(errs).length > 0) {
        anyInvalid = true;
        return { ...it, errors: errs };
      }
      // Valid — import this row
      const weightOz = displayToOz(it.displayWeight, it.weightUnit);
      onAddItem(it.destination, { sub: it.sub, desc: it.desc, weightOz, checked: false });
      return { ...it, added: true, selected: false, errors: {} };
    }));

    // Reset only when every selected row was valid
    if (!anyInvalid) {
      reset();
    }
  };

  const pending     = items.filter(i => !i.added);
  const selectedCnt = items.filter(i => i.selected && !i.added).length;
  const addedCnt    = items.filter(i => i.added).length;

  // Always show per-row destination + weight/unit — fixed 6-column grid:
  // checkbox | category | type | description | wt+unit | warning
  const gridCols = 'grid-cols-[20px_minmax(68px,0.85fr)_minmax(60px,0.75fr)_minmax(80px,1fr)_minmax(105px,auto)_20px]';

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
                <p className="text-sm font-semibold text-foreground">
                  {statusMsg || 'Reading your file…'}
                </p>
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

                        {/* Data row */}
                        <div className={`grid ${gridCols} gap-x-1 items-center px-2 py-1.5 transition-colors ${
                          !item.added && hasErrors ? 'bg-destructive/5' : (!item.added ? 'hover:bg-muted/20' : '')
                        }`}>

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

                          {/* Destination — always shown per-row */}
                          {item.added ? (
                            <span className="text-xs text-muted-foreground truncate">{item.destination || '—'}</span>
                          ) : (
                            <select
                              value={item.destination}
                              onChange={e => updateField(idx, { destination: e.target.value })}
                              className={`w-full text-xs text-foreground bg-transparent border-b focus:outline-none truncate ${
                                item.errors.destination
                                  ? 'border-destructive text-destructive'
                                  : 'border-transparent focus:border-primary/40'
                              }`}
                            >
                              {categoryOrder.map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
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
                                item.errors.sub
                                  ? 'border-destructive text-destructive'
                                  : 'border-transparent focus:border-primary/40 text-foreground'
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

                          {/* Weight + Unit (combined cell) */}
                          {item.added ? (
                            <span className="text-xs text-muted-foreground font-mono text-right">
                              {item.displayWeight} {item.weightUnit}
                            </span>
                          ) : (
                            <div className="flex items-center gap-1 min-w-0">
                              {/* Weight text input */}
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
                              {/* Unit dropdown */}
                              <select
                                value={item.weightUnit}
                                onChange={e => updateField(idx, { weightUnit: e.target.value as WeightUnit })}
                                className={`flex-shrink-0 text-xs bg-transparent border-b focus:outline-none cursor-pointer ${
                                  item.errors.unit
                                    ? 'border-destructive text-destructive'
                                    : 'border-transparent focus:border-primary/40 text-muted-foreground hover:text-foreground'
                                }`}
                              >
                                {SUPPORTED_UNITS.map(u => (
                                  <option key={u} value={u}>{u}</option>
                                ))}
                              </select>
                            </div>
                          )}

                          {/* Warning / added indicator */}
                          <div className="flex justify-center">
                            {item.added ? (
                              <span className="text-[10px] text-primary font-semibold">✓</span>
                            ) : item.warning ? (
                              <span
                                title={item.warningMsg ?? 'Review this item — weight or description may need correction'}
                              >
                                <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0" />
                              </span>
                            ) : (
                              <span className="w-3 h-3" />
                            )}
                          </div>
                        </div>

                        {/* Inline validation errors — shown below the row */}
                        {!item.added && hasErrors && (
                          <div className="px-6 pb-1.5 flex flex-wrap gap-x-4 gap-y-0.5">
                            {item.errors.sub && (
                              <p className="text-[10px] text-destructive leading-tight">{item.errors.sub}</p>
                            )}
                            {item.errors.weight && (
                              <p className="text-[10px] text-destructive leading-tight">{item.errors.weight}</p>
                            )}
                            {item.errors.unit && (
                              <p className="text-[10px] text-destructive leading-tight">{item.errors.unit}</p>
                            )}
                            {item.errors.destination && (
                              <p className="text-[10px] text-destructive leading-tight">{item.errors.destination}</p>
                            )}
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
