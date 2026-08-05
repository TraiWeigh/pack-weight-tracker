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

interface EditedItem extends ParsedItem {
  selected: boolean;
  added: boolean;
  destination: string; // always a string (defaults to first category)
}

interface ImportGearPanelProps {
  categoryOrder: string[];
  onAddItem: (category: string, prefill: Partial<GearItem>) => void;
}

// Only accept the four deterministic formats (no CSV)
const ACCEPTED      = '.pdf,.docx,.doc,.xlsx,.xls,.numbers';
const ACCEPT_LABEL  = 'PDF, Word (.docx), Excel (.xlsx), or Numbers';

/**
 * Maps canonical API destination strings → lists of display-name aliases.
 *
 * The API always returns one of the canonical strings on the left
 * (matching DEFAULT_CATEGORY_ORDER defaults: "Shelter", "Sleep", "Consumables", …).
 * When a user renames a category (e.g. "Sleep" → "Sleep System") the canonical
 * string won't find an exact match in categoryOrder, so we walk the alias list
 * to find the renamed category instead.
 *
 * Rules:
 *  - Only complete phrases are aliases; generic words like "System", "Gear",
 *    "Equipment" alone are never used for matching.
 *  - "System" by itself must never cause Shelter gear to be placed in Sleep System
 *    or vice-versa.
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

/**
 * Resolve a server-supplied canonical destination to a category that actually
 * exists in the user's categoryOrder.
 *
 * 1. Exact match → use it.
 * 2. Role-alias match → find a category in categoryOrder that is an alias for
 *    the same canonical role as the incoming destination.
 * 3. Case-insensitive match → handles minor casing differences.
 * 4. Fall back to categoryOrder[0].
 */
function resolveDestination(destination: string, categoryOrder: string[]): string {
  if (!destination) return categoryOrder[0] ?? '';

  // 1. Exact match (fast path — covers the common case where nothing is renamed)
  if (categoryOrder.includes(destination)) return destination;

  // 2. Role-alias lookup: find which canonical role this destination belongs to,
  //    then find any alias for that role that exists in categoryOrder.
  for (const aliases of Object.values(CATEGORY_ROLE_ALIASES)) {
    if (aliases.includes(destination)) {
      // destination belongs to this role — find its representative in categoryOrder
      for (const alias of aliases) {
        if (categoryOrder.includes(alias)) return alias;
      }
    }
  }

  // 3. Case-insensitive fallback (e.g. "shelter" vs "Shelter")
  const destLower = destination.toLowerCase();
  const ci = categoryOrder.find(c => c.toLowerCase() === destLower);
  if (ci) return ci;

  // 4. No match — default to first category; user can change in dropdown
  return categoryOrder[0] ?? destination;
}

export function ImportGearPanel({ categoryOrder, onAddItem }: ImportGearPanelProps) {
  const [open, setOpen]       = useState(true);
  const [phase, setPhase]     = useState<'idle' | 'parsing' | 'review' | 'error'>('idle');
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName]     = useState('');
  const [items, setItems]           = useState<EditedItem[]>([]);
  const [errorMsg, setErrorMsg]     = useState('');
  const [targetCategory, setTargetCategory] = useState<string>(''); // global fallback
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

      // Guard against HTML error pages (e.g. 404) which cause
      // "The string did not match the expected pattern." in WebKit when parsed as JSON.
      const ct = resp.headers.get('content-type') ?? '';
      if (!ct.includes('application/json')) {
        throw new Error(
          resp.status === 404
            ? 'Upload route not found — please reload the page and try again.'
            : `Server error ${resp.status}: unexpected response format.`,
        );
      }

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error ?? 'Import failed');

      const parsed: ParsedItem[] = data.items ?? [];
      if (parsed.length === 0) {
        setPhase('error');
        setErrorMsg('No gear items with weight values were found in this file. Try a different file or format.');
        return;
      }

      const firstCat = categoryOrder[0] ?? '';
      setItems(parsed.map(item => ({
        ...item,
        selected: true,
        added: false,
        destination: resolveDestination(item.destination ?? '', categoryOrder) || firstCat,
      })));
      if (!targetCategory && firstCat) setTargetCategory(firstCat);
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

  // Whether items carry server-supplied destination (spreadsheet mode)
  const hasDestinations = items.some(i => i.destination);

  const addOne = (idx: number) => {
    const it = items[idx];
    if (!it || it.added) return;
    const cat = hasDestinations
      ? (it.destination || targetCategory || categoryOrder[0] || '')
      : (targetCategory || categoryOrder[0] || '');
    if (!cat) return;
    onAddItem(cat, { sub: it.sub, desc: it.desc, weightOz: it.weightOz, checked: false });
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, added: true, selected: false } : item));
  };

  const addSelected = () => {
    const toAdd = items.filter(i => i.selected && !i.added);
    if (toAdd.length === 0) return;
    toAdd.forEach(it => {
      const cat = hasDestinations
        ? (it.destination || targetCategory || categoryOrder[0] || '')
        : (targetCategory || categoryOrder[0] || '');
      if (!cat) return;
      onAddItem(cat, { sub: it.sub, desc: it.desc, weightOz: it.weightOz, checked: false });
    });
    reset();
  };

  const pending     = items.filter(i => !i.added);
  const selectedCnt = items.filter(i => i.selected && !i.added).length;
  const addedCnt    = items.filter(i => i.added).length;

  // Grid column layout — 6 cols when destinations shown, 5 otherwise
  const gridCols = hasDestinations
    ? 'grid-cols-[20px_minmax(70px,0.9fr)_minmax(70px,0.9fr)_minmax(90px,1.2fr)_56px_20px]'
    : 'grid-cols-[20px_minmax(80px,1fr)_minmax(100px,1.5fr)_60px_20px]';

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

              {/* Global "Add to:" selector — only shown when items lack per-row destinations */}
              {!hasDestinations && (
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
              )}

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
                  {hasDestinations && (
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Category</span>
                  )}
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Type</span>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Description</span>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-right">Wt (oz)</span>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-center">⚠</span>
                </div>

                {/* Rows */}
                <div className="max-h-[360px] overflow-y-auto divide-y divide-border">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className={`grid ${gridCols} gap-x-1 items-center px-2 py-1.5 transition-colors ${
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

                      {/* Destination (per-row, spreadsheet mode only) */}
                      {hasDestinations && (
                        item.added ? (
                          <span className="text-xs text-muted-foreground truncate">{item.destination || '—'}</span>
                        ) : (
                          <select
                            value={item.destination}
                            onChange={e => updateField(idx, { destination: e.target.value })}
                            className="w-full text-xs text-foreground bg-transparent border-b border-transparent focus:border-primary/40 focus:outline-none truncate"
                          >
                            {categoryOrder.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        )
                      )}

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
                          <AlertTriangle
                            className="w-3 h-3 text-amber-500 flex-shrink-0"
                            title={item.warningMsg ?? 'Review this item — weight or description may need correction'}
                          />
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
