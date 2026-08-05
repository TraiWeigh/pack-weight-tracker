import React, { useState, useRef } from 'react';
import { GearItem } from '../hooks/usePackData';
import {
  FileUp, Loader2, CheckCircle2, AlertCircle, X, Plus, ChevronDown, ChevronRight, Check, AlertTriangle,
  PenLine, RotateCcw as Retry, ChevronDown as ChevronDownSmall,
} from 'lucide-react';
import { ImageOcrPreview } from './ImageOcrPreview';

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
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ACCEPTED     = '.pdf,.docx,.doc,.xlsx,.xls,.numbers,.png,.jpg,.jpeg,.webp';
const ACCEPT_LABEL = 'PDF, Word, Excel, Numbers, or an image / screenshot';
const IMAGE_EXTS   = new Set(['png', 'jpg', 'jpeg', 'webp']);

// ── Category alias map ────────────────────────────────────────────────────────

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
  const ci = categoryOrder.find(c => c.toLowerCase() === destination.toLowerCase());
  if (ci) return ci;
  return categoryOrder[0] ?? destination;
}

// ── Validation ────────────────────────────────────────────────────────────────

function validateRow(item: EditedItem, categoryOrder: string[]): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!item.sub.trim() && !item.desc.trim()) errors.sub = 'Type or Description is required';
  const w = parseFloat(item.displayWeight);
  if (item.displayWeight.trim() === '' || isNaN(w) || w < 0) errors.weight = 'Enter a valid weight (0 or more)';
  if (!SUPPORTED_UNITS.includes(item.weightUnit)) errors.unit = 'Unsupported unit';
  if (!categoryOrder.includes(item.destination)) errors.destination = 'Select a valid category';
  return errors;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parsedToEdited(item: ParsedItem, categoryOrder: string[]): EditedItem {
  return {
    ...item,
    selected:      true,
    added:         false,
    destination:   resolveDestination(item.destination ?? '', categoryOrder) || (categoryOrder[0] ?? ''),
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

type Phase = 'idle' | 'prepare' | 'parsing' | 'review' | 'fallback' | 'error';

export function ImportGearPanel({ categoryOrder, onAddItem }: ImportGearPanelProps) {
  const [open, setOpen]   = useState(true);
  const [phase, setPhase] = useState<Phase>('idle');
  const [isDragging, setIsDragging] = useState(false);

  // Shared
  const [fileName, setFileName]     = useState('');
  const [errorMsg, setErrorMsg]     = useState('');
  const [statusMsg, setStatusMsg]   = useState('');
  const [isImageFile, setIsImageFile] = useState(false);

  // Prepare phase — holds the original File for ImageOcrPreview
  const [prepareFile, setPrepareFile] = useState<File | null>(null);

  // Review phase
  const [items, setItems] = useState<EditedItem[]>([]);

  // Fallback / partial-parse
  const [rawOcrText,       setRawOcrText]       = useState('');
  const [editedOcrText,    setEditedOcrText]    = useState('');
  const [unrecognizedText, setUnrecognizedText] = useState('');
  const [editedRemainder,  setEditedRemainder]  = useState('');
  const [showRemainder,    setShowRemainder]    = useState(false);
  const [isAnalyzing,      setIsAnalyzing]      = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Reset ─────────────────────────────────────────────────────────────────

  const reset = () => {
    setPhase('idle');
    setItems([]);
    setErrorMsg('');
    setFileName('');
    setStatusMsg('');
    setIsImageFile(false);
    setPrepareFile(null);
    setRawOcrText('');
    setEditedOcrText('');
    setUnrecognizedText('');
    setEditedRemainder('');
    setShowRemainder(false);
    setIsAnalyzing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── File selection ────────────────────────────────────────────────────────

  const processFile = (file: File) => {
    const ext   = (file.name.split('.').pop() ?? '').toLowerCase();
    const isImg = IMAGE_EXTS.has(ext) || file.type.startsWith('image/');

    setIsImageFile(isImg);
    setFileName(file.name);
    setErrorMsg('');

    if (isImg) {
      // Show prepare screen before OCR — do NOT call the API yet
      setPrepareFile(file);
      setPhase('prepare');
    } else {
      // Non-image: send straight to API
      setPhase('parsing');
      setStatusMsg('');
      submitToApi(file);
    }
  };

  // ── API calls ─────────────────────────────────────────────────────────────

  /**
   * Submit a File or Blob to /api/import-gear.
   * Called both by non-image processFile and by handleReadImage (prepare phase).
   */
  const submitToApi = async (fileOrBlob: File | Blob) => {
    const formData = new FormData();
    if (fileOrBlob instanceof File) {
      formData.append('file', fileOrBlob);
    } else {
      // Blob from canvas export — treat as PNG
      formData.append('file', fileOrBlob, 'prepared-image.png');
    }

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
        if (isImageFile) {
          if (data.error === 'DAMAGED_IMAGE') throw new Error('__damaged_image__');
          throw new Error('__ocr_failed__');
        }
        throw new Error(data.error ?? 'Import failed');
      }

      const parsed: ParsedItem[] = data.items ?? [];

      // OCR ran but gear parser found nothing — show fallback editor
      if (data.error === 'NO_GEAR_ITEMS' || (isImageFile && parsed.length === 0 && data.rawText)) {
        setRawOcrText(data.rawText ?? '');
        setEditedOcrText(data.rawText ?? '');
        setStatusMsg('');
        setPhase('fallback');
        return;
      }

      if (parsed.length === 0) {
        setPhase('error');
        setStatusMsg('');
        setErrorMsg(isImageFile
          ? 'No readable gear-list text was found. Try a clearer image or crop the screenshot closer to the list.'
          : 'No gear items with weight values were found in this file. Try a different file or format.');
        return;
      }

      // Items found — move to review
      if (isImageFile) {
        setStatusMsg('Analyzing gear list…');
        await new Promise(r => setTimeout(r, 600));
      }

      setItems(parsed.map(item => parsedToEdited(item, categoryOrder)));

      // Store partial-parse remainder for collapsible section
      if (data.remainder) {
        setUnrecognizedText(data.remainder);
        setEditedRemainder(data.remainder);
      } else {
        setUnrecognizedText('');
        setEditedRemainder('');
      }

      setStatusMsg('');
      setPhase('review');
    } catch (err: any) {
      setPhase('error');
      setStatusMsg('');
      if (err.message === '__damaged_image__') {
        setErrorMsg('We could not open this image. Please try another file.');
      } else if (isImageFile || err.message === '__ocr_failed__') {
        setErrorMsg('We could not read this image. Please try another screenshot or a clearer photo.');
      } else {
        setErrorMsg(err.message ?? 'Something went wrong. Please try again.');
      }
    }
  };

  /**
   * Called by ImageOcrPreview when the user clicks "Read Image".
   * The blob is the rotated+cropped image ready for OCR.
   */
  const handleReadImage = async (blob: Blob) => {
    setPhase('parsing');
    setStatusMsg('Reading image…');
    await submitToApi(blob);
  };

  /**
   * Re-run the gear parser on user-edited OCR text (no Tesseract).
   */
  const analyzeAgain = async (text: string) => {
    if (!text.trim()) return;
    setIsAnalyzing(true);
    try {
      const resp = await fetch('/api/parse-text', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ text }),
      });
      const data = await resp.json();
      const parsed: ParsedItem[] = data.items ?? [];

      if (parsed.length === 0) {
        // Still nothing — stay in fallback, show a hint
        setEditedOcrText(text);
        setIsAnalyzing(false);
        return;
      }

      // Merge with any existing items (in case this is a re-analyze of the remainder)
      setItems(prev => {
        const fresh = parsed.map(item => parsedToEdited(item, categoryOrder));
        return [...prev, ...fresh];
      });

      if (data.remainder) {
        setUnrecognizedText(data.remainder);
        setEditedRemainder(data.remainder);
      } else {
        setUnrecognizedText('');
        setEditedRemainder('');
      }

      setPhase('review');
    } catch {
      // silently stay in current phase
    } finally {
      setIsAnalyzing(false);
    }
  };

  /** Add a blank row to the review table for manual entry. */
  const addManualItem = () => {
    setItems(prev => [...prev, blankEditedItem(categoryOrder)]);
    setPhase('review');
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
    const toAdd = items.filter(i => i.selected && !i.added);
    if (toAdd.length === 0) return;
    let anyInvalid = false;
    setItems(prev => prev.map(it => {
      if (!it.selected || it.added) return it;
      const errs = validateRow(it, categoryOrder);
      if (Object.keys(errs).length > 0) { anyInvalid = true; return { ...it, errors: errs }; }
      const weightOz = displayToOz(it.displayWeight, it.weightUnit);
      onAddItem(it.destination, { sub: it.sub, desc: it.desc, weightOz, checked: false });
      return { ...it, added: true, selected: false, errors: {} };
    }));
    if (!anyInvalid) reset();
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

  return (
    <div className="bg-card border border-card-border rounded-xl shadow-sm overflow-hidden">

      {/* ── Panel header ── */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 p-4 sm:p-5 border-b border-border bg-muted/20 text-left hover:bg-muted/30 transition-colors"
      >
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
               : <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
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

          {/* ── Prepare phase — image crop/rotate ── */}
          {phase === 'prepare' && prepareFile && (
            <ImageOcrPreview
              file={prepareFile}
              onConfirm={handleReadImage}
              onCancel={reset}
            />
          )}

          {/* ── Parsing spinner ── */}
          {phase === 'parsing' && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <Loader2 className="w-7 h-7 text-primary animate-spin" />
              <div>
                <p className="text-sm font-semibold text-foreground">{statusMsg || 'Reading your file…'}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">{fileName}</p>
              </div>
            </div>
          )}

          {/* ── Fallback: "Review Extracted Text" ── */}
          {phase === 'fallback' && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PenLine className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-foreground">Review Extracted Text</span>
                </div>
                <button onClick={reset} className="text-muted-foreground hover:text-foreground">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed">
                OCR found text but couldn't identify gear items automatically. Edit the text below into
                clear &ldquo;Item Name — weight unit&rdquo; lines, then click&nbsp;<strong>Analyze Again</strong>.
              </p>

              <textarea
                value={editedOcrText}
                onChange={e => setEditedOcrText(e.target.value)}
                rows={8}
                spellCheck={false}
                className="w-full text-xs font-mono bg-muted/20 border border-border rounded-lg p-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 resize-y"
                placeholder={'Tent — 18.5 oz\nSleeping Pad — 12 oz\nRain Jacket — 7.2 oz'}
              />

              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => analyzeAgain(editedOcrText)}
                  disabled={isAnalyzing || !editedOcrText.trim()}
                  className="flex items-center gap-1.5 text-xs font-semibold bg-primary text-primary-foreground px-3 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {isAnalyzing
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Retry className="w-3.5 h-3.5" />
                  }
                  {isAnalyzing ? 'Analyzing…' : 'Analyze Again'}
                </button>

                <button
                  onClick={addManualItem}
                  className="flex items-center gap-1.5 text-xs font-medium border border-border px-3 py-2 rounded-lg hover:bg-muted/30 transition-colors text-foreground"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Item Manually
                </button>

                <button
                  onClick={reset}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground ml-auto"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </button>
              </div>

              {!isAnalyzing && editedOcrText.trim() && items.length === 0 && phase === 'fallback' && (
                <p className="text-[10px] text-muted-foreground">
                  No items recognized yet. Try formatting each line as: <em>Item name — weight oz</em>
                </p>
              )}
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

              {/* Unrecognized text collapsible (partial parse) */}
              {unrecognizedText && (
                <div className="border border-border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setShowRemainder(v => !v)}
                    className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
                  >
                    <span>Unrecognized extracted text</span>
                    <ChevronDownSmall className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${showRemainder ? 'rotate-180' : ''}`} />
                  </button>
                  {showRemainder && (
                    <div className="border-t border-border p-3 space-y-2">
                      <p className="text-[10px] text-muted-foreground">
                        These lines weren't recognized as gear items. Edit them and click Analyze to add more rows.
                      </p>
                      <textarea
                        value={editedRemainder}
                        onChange={e => setEditedRemainder(e.target.value)}
                        rows={4}
                        spellCheck={false}
                        className="w-full text-xs font-mono bg-muted/20 border border-border rounded-md p-2 text-foreground focus:outline-none focus:border-primary/50 resize-y"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => analyzeAgain(editedRemainder)}
                          disabled={isAnalyzing || !editedRemainder.trim()}
                          className="flex items-center gap-1 text-[11px] font-semibold bg-primary text-primary-foreground px-2.5 py-1.5 rounded-md hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Retry className="w-3 h-3" />}
                          {isAnalyzing ? 'Analyzing…' : 'Analyze'}
                        </button>
                        <button
                          onClick={addManualItem}
                          className="flex items-center gap-1 text-[11px] border border-border px-2.5 py-1.5 rounded-md hover:bg-muted/30 transition-colors text-foreground"
                        >
                          <Plus className="w-3 h-3" />
                          Add Manually
                        </button>
                      </div>
                    </div>
                  )}
                </div>
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
