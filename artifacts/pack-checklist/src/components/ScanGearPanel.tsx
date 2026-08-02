import React, { useState, useRef, useEffect } from 'react';
import { GearItem } from '../hooks/usePackData';
import { getScanCredits, useScanCredit, initScanCredits } from '../lib/scanCredits';
import {
  Sparkles, Link2, ImageIcon, ChevronDown, ChevronRight,
  Loader2, CheckCircle2, AlertCircle, X, Upload,
} from 'lucide-react';

interface ScanResult {
  sub: string;
  desc: string;
  weightOz: number;
  category: string;
}

interface ScanGearPanelProps {
  userId: string;
  categoryOrder: string[];
  onAddItem: (category: string, prefill: Partial<GearItem>) => void;
}

type ScanMode = 'url' | 'image';
type Phase = 'idle' | 'scanning' | 'confirm' | 'error';

const HOW_IT_WORKS = [
  {
    num: '1',
    title: 'Find your gear online',
    body: 'Copy a product URL from any gear site — REI, Zpacks, Gossamer Gear, ULA, etc.',
  },
  {
    num: '2',
    title: 'Or upload a photo',
    body: 'Snap or screenshot a spec sheet, hang tag, or product photo.',
  },
  {
    num: '3',
    title: 'AI reads the details',
    body: 'The AI extracts the item name, type, weight, and best-fit category automatically.',
  },
  {
    num: '4',
    title: 'Review and add',
    body: 'Edit anything before it lands in your list. Each scan uses 1 credit.',
  },
];

export function ScanGearPanel({ userId, categoryOrder, onAddItem }: ScanGearPanelProps) {
  const [howOpen, setHowOpen] = useState(false);
  const [mode, setMode] = useState<ScanMode>('url');
  const [urlInput, setUrlInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageName, setImageName] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [credits, setCredits] = useState(0);
  const [buyMsg, setBuyMsg] = useState(false);

  // Editable confirm fields
  const [editSub, setEditSub] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [editCat, setEditCat] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    initScanCredits(userId);
    setCredits(getScanCredits(userId));
  }, [userId]);

  const refreshCredits = () => setCredits(getScanCredits(userId));

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // strip data:...;base64, prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleScan = async () => {
    if (credits <= 0) return;

    setPhase('scanning');
    setErrorMsg('');

    try {
      let body: Record<string, string>;

      if (mode === 'url') {
        if (!urlInput.trim()) {
          setPhase('error');
          setErrorMsg('Please enter a URL.');
          return;
        }
        body = { type: 'url', url: urlInput.trim() };
      } else {
        if (!imageFile) {
          setPhase('error');
          setErrorMsg('Please choose an image.');
          return;
        }
        const base64 = await toBase64(imageFile);
        body = { type: 'image', base64, mimeType: imageFile.type };
      }

      const resp = await fetch('/api/scan-gear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await resp.json();

      if (!resp.ok) {
        if (data.code === 'no_api_key') {
          setPhase('error');
          setErrorMsg('OpenAI API key not configured. Add OPENAI_API_KEY to your environment secrets to activate scanning.');
          return;
        }
        throw new Error(data.error ?? 'Scan failed');
      }

      // Deduct credit
      useScanCredit(userId);
      refreshCredits();

      const scanned: ScanResult = {
        sub: data.sub ?? '',
        desc: data.desc ?? '',
        weightOz: parseFloat(data.weightOz) || 0,
        category: data.category && categoryOrder.includes(data.category)
          ? data.category
          : (categoryOrder[0] ?? ''),
      };

      setResult(scanned);
      setEditSub(scanned.sub);
      setEditDesc(scanned.desc);
      setEditWeight(scanned.weightOz.toString());
      setEditCat(scanned.category);
      setPhase('confirm');

    } catch (err: any) {
      setPhase('error');
      setErrorMsg(err.message ?? 'Something went wrong. Please try again.');
    }
  };

  const handleAdd = () => {
    if (!editCat) return;
    onAddItem(editCat, {
      sub: editSub,
      desc: editDesc,
      weightOz: parseFloat(editWeight) || 0,
      checked: true,
    });
    // Reset
    setPhase('idle');
    setResult(null);
    setUrlInput('');
    setImageFile(null);
    setImageName('');
  };

  const handleCancel = () => {
    setPhase('idle');
    setResult(null);
    setErrorMsg('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImageName(file.name);
      setPhase('idle');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      setImageName(file.name);
      setPhase('idle');
    }
  };

  return (
    <div className="bg-card border border-card-border rounded-xl shadow-sm overflow-hidden mt-4">
      {/* ── Header ── */}
      <div className="p-4 sm:p-5 border-b border-border bg-muted/20">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-foreground text-base">Scan Gear with AI</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Paste a product URL or upload a photo — AI fills in the details.
        </p>
      </div>

      <div className="p-4 sm:p-5 space-y-4">

        {/* ── How This Works accordion ── */}
        <div className="border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => setHowOpen(o => !o)}
            className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted/40 transition-colors"
          >
            <span>How This Works</span>
            {howOpen
              ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
              : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          </button>

          {howOpen && (
            <div className="px-3 pb-3 pt-1 border-t border-border space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              {HOW_IT_WORKS.map(step => (
                <div key={step.num} className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex-shrink-0 flex items-center justify-center mt-0.5">
                    {step.num}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{step.title}</p>
                    <p className="text-xs text-muted-foreground">{step.body}</p>
                  </div>
                </div>
              ))}

              <div className="mt-2 p-2.5 bg-primary/5 border border-primary/20 rounded-lg text-xs text-muted-foreground">
                <span className="font-semibold text-primary">Pricing:</span> Each scan costs roughly $0.01–0.03 via OpenAI. You get <strong>3 free trial scans</strong> to start.
              </div>
            </div>
          )}
        </div>

        {/* ── Credit bar ── */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {credits > 0
              ? <><span className="font-semibold text-foreground">{credits}</span> scan{credits !== 1 ? 's' : ''} remaining</>
              : <span className="text-destructive font-medium">No scans remaining</span>}
          </span>
          <div className="relative">
            <button
              onClick={() => setBuyMsg(v => !v)}
              className="text-xs font-semibold text-primary border border-primary/30 hover:border-primary bg-primary/5 hover:bg-primary/10 px-2.5 py-1 rounded-md transition-colors"
            >
              Get More
            </button>
            {buyMsg && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setBuyMsg(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 w-56 bg-popover border border-border rounded-lg shadow-lg p-3 text-xs text-muted-foreground animate-in fade-in slide-in-from-top-2 duration-150">
                  <p className="font-semibold text-foreground mb-1">Stripe payments coming soon</p>
                  <p>Credit packs will be available to purchase here once Stripe is connected. Stay tuned!</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Mode tabs ── */}
        <div className="flex bg-muted rounded-lg p-0.5 gap-0.5">
          {(['url', 'image'] as ScanMode[]).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setPhase('idle'); setErrorMsg(''); }}
              className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-1.5 rounded-md transition-colors ${
                mode === m
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {m === 'url' ? <Link2 className="w-3.5 h-3.5" /> : <ImageIcon className="w-3.5 h-3.5" />}
              {m === 'url' ? 'Paste URL' : 'Upload Photo'}
            </button>
          ))}
        </div>

        {/* ── Input area ── */}
        {mode === 'url' ? (
          <div className="flex gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && phase !== 'scanning' && credits > 0 && handleScan()}
              placeholder="https://www.rei.com/product/…"
              className="flex-1 text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
            />
            <button
              onClick={handleScan}
              disabled={phase === 'scanning' || credits <= 0 || !urlInput.trim()}
              className="flex items-center gap-1.5 text-xs font-semibold bg-primary text-primary-foreground px-3 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            >
              {phase === 'scanning'
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Sparkles className="w-3.5 h-3.5" />}
              {phase === 'scanning' ? 'Scanning…' : 'Scan'}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border hover:border-primary/50 rounded-lg p-4 text-center cursor-pointer transition-colors group"
            >
              <Upload className="w-5 h-5 text-muted-foreground group-hover:text-primary mx-auto mb-1.5 transition-colors" />
              {imageName ? (
                <p className="text-xs font-medium text-foreground truncate">{imageName}</p>
              ) : (
                <>
                  <p className="text-xs font-medium text-muted-foreground">Click or drag a photo here</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">PNG, JPG, WEBP up to 10 MB</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            <button
              onClick={handleScan}
              disabled={phase === 'scanning' || credits <= 0 || !imageFile}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold bg-primary text-primary-foreground px-3 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {phase === 'scanning'
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Scanning…</>
                : <><Sparkles className="w-3.5 h-3.5" /> Scan Photo</>}
            </button>
          </div>
        )}

        {/* ── Error state ── */}
        {phase === 'error' && (
          <div className="flex items-start gap-2 p-3 bg-destructive/5 border border-destructive/20 rounded-lg animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-destructive font-medium">Scan failed</p>
              <p className="text-xs text-muted-foreground mt-0.5 break-words">{errorMsg}</p>
            </div>
            <button onClick={handleCancel} className="text-muted-foreground hover:text-foreground flex-shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ── Confirm card ── */}
        {phase === 'confirm' && result && (
          <div className="border border-primary/30 bg-primary/5 rounded-lg p-3 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-xs font-semibold text-foreground">Review before adding</span>
              <button onClick={handleCancel} className="ml-auto text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              {[
                { label: 'Type', value: editSub, set: setEditSub },
                { label: 'Name / Description', value: editDesc, set: setEditDesc },
              ].map(({ label, value, set }) => (
                <div key={label}>
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</label>
                  <input
                    type="text"
                    value={value}
                    onChange={e => set(e.target.value)}
                    className="w-full mt-0.5 text-sm bg-card border border-border rounded-md px-2.5 py-1.5 text-foreground outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
              ))}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Weight (oz)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editWeight}
                    onChange={e => setEditWeight(e.target.value)}
                    className="w-full mt-0.5 text-sm bg-card border border-border rounded-md px-2.5 py-1.5 text-foreground outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Category</label>
                  <select
                    value={editCat}
                    onChange={e => setEditCat(e.target.value)}
                    className="w-full mt-0.5 text-sm bg-card border border-border rounded-md px-2 py-1.5 text-foreground outline-none focus:border-primary/50 transition-colors"
                  >
                    {categoryOrder.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <button
              onClick={handleAdd}
              disabled={!editCat}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold bg-primary text-primary-foreground px-3 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-40 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Add to {editCat}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
