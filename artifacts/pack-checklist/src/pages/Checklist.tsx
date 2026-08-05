import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useUser, useClerk } from '@clerk/react';
import { usePackData } from '../hooks/usePackData';
import { GearCategory } from '../components/GearCategory';
import { WeightSummary } from '../components/WeightSummary';
import { PrintLayout } from '../components/PrintLayout';
import { PreviewModal } from '../components/PreviewModal';
import { MailingListModal, hasSeenMailingPrompt } from '../components/MailingListModal';
import { UnitProvider, useUnit } from '../context/UnitContext';
import { sharePackList } from '../lib/exportPDF';
import { useLocation } from 'wouter';
import { isAdmin } from './AdminPage';
import { ImportGearPanel } from '../components/ImportGearPanel';
import { LockerPanel, LockerEntry } from '../components/LockerPanel';
import { LockerIcon } from '../components/LockerIcon';
import { LOCKER_KEY } from '../hooks/usePackData';
import { buildShareURL } from '../lib/shareLink';
import { useToast } from '../hooks/use-toast';
import {
  RotateCcw, Tent, Printer, Share2, Link, FileDown, LogOut,
  User, Shield, Plus, Check, X, ChevronsUpDown,
} from 'lucide-react';
import { BackgroundPickerButton, BackgroundPickerPanel, Background, BG_STORAGE_KEY, PRESETS, getFullUrl } from '../components/BackgroundPicker';

function UnitToggle() {
  const { system, setSystem } = useUnit();
  return (
    <div className="flex items-center bg-muted rounded-lg p-0.5 gap-0.5">
      <button
        onClick={() => setSystem('imperial')}
        className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
          system === 'imperial'
            ? 'bg-card text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        Imperial
      </button>
      <button
        onClick={() => setSystem('metric')}
        className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
          system === 'metric'
            ? 'bg-card text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        Metric
      </button>
    </div>
  );
}

interface ChecklistContentProps {
  userId?: string;
  userEmail?: string;
  isGuest?: boolean;
}

function ChecklistContent({ userId, userEmail, isGuest = false }: ChecklistContentProps) {
  const {
    data, categoryOrder, categoryMeta, store,
    updateItem, addItem, removeItem,
    addCategory, deleteCategory, updateCategoryMeta, moveCategory, reorderCategory,
    renameCategory, loadStore,
    resetToDefaults,
    undo, redo, canUndo, canRedo,
  } = usePackData(userId);

  const { system } = useUnit();
  const { signOut } = useClerk();
  const { toast } = useToast();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [showMailingModal, setShowMailingModal] = useState(() => !isGuest && !!userId && !hasSeenMailingPrompt(userId));
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [backgroundPickerOpen, setBackgroundPickerOpen] = useState(false);
  const bgPickerContainerRef = useRef<HTMLDivElement>(null);
  const [dragCat, setDragCat] = useState<string | null>(null);
  const [overCat, setOverCat] = useState<string | null>(null);

  // ── Background state — also loaded from saved-list session key ────────────

  const [background, setBackground] = useState<Background | null>(() => {
    // If this tab was opened via "Load This List", use the saved background
    try {
      const raw = sessionStorage.getItem('tw-savedlist-bg');
      if (raw !== null) {
        sessionStorage.removeItem('tw-savedlist-bg');
        const parsed = JSON.parse(raw);
        return parsed ?? null;
      }
    } catch {}
    // Normal path
    try {
      const s = localStorage.getItem(BG_STORAGE_KEY);
      if (!s) return null;
      const bg = JSON.parse(s) as Background;
      if (bg.type === 'custom') {
        if (!bg.dataUrl?.startsWith('data:image/') || bg.dataUrl.length > 12_000_000) {
          localStorage.removeItem(BG_STORAGE_KEY);
          return null;
        }
      }
      return bg;
    } catch {
      localStorage.removeItem(BG_STORAGE_KEY);
      return null;
    }
  });

  const handleBackgroundChange = (bg: Background | null) => {
    setBackground(bg);
    if (bg) localStorage.setItem(BG_STORAGE_KEY, JSON.stringify(bg));
    else localStorage.removeItem(BG_STORAGE_KEY);
  };

  const [bgFade, setBgFade] = useState<number>(() => {
    try {
      const raw = sessionStorage.getItem('tw-savedlist-bgfade');
      if (raw !== null) {
        sessionStorage.removeItem('tw-savedlist-bgfade');
        const v = parseFloat(raw);
        return isNaN(v) ? 1 : Math.min(1, Math.max(0, v));
      }
    } catch {}
    const s = localStorage.getItem('trailweigh:bgFade');
    const v = s ? parseFloat(s) : 1;
    return isNaN(v) ? 1 : Math.min(1, Math.max(0, v));
  });

  const handleBgFadeChange = (v: number) => {
    setBgFade(v);
    localStorage.setItem('trailweigh:bgFade', String(v));
  };

  const [bgTone, setBgTone] = useState<'light' | 'dark'>(() => {
    try {
      const raw = sessionStorage.getItem('tw-savedlist-bgtone');
      if (raw !== null) {
        sessionStorage.removeItem('tw-savedlist-bgtone');
        return raw as 'light' | 'dark';
      }
    } catch {}
    return (localStorage.getItem('trailweigh:bgTone') as 'light' | 'dark') ?? 'light';
  });

  const handleBgToneChange = (t: 'light' | 'dark') => {
    setBgTone(t);
    localStorage.setItem('trailweigh:bgTone', t);
  };

  const bgImageUrl = background
    ? background.type === 'preset'
      ? getFullUrl(PRESETS.find(p => p.id === background.id)?.photoId ?? '')
      : background.dataUrl
    : null;

  const [showShareMenu, setShowShareMenu] = useState(false);
  const [, setLocation] = useLocation();
  const admin = isAdmin(userEmail);

  const [allOpen, setAllOpen] = useState(true);

  const [copied, setCopied] = useState(false);
  async function copyUrlToClipboard(url: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch {
      try {
        const el = document.createElement('textarea');
        el.value = url;
        el.style.cssText = 'position:fixed;pointer-events:none;opacity:0';
        document.body.appendChild(el);
        el.focus(); el.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(el);
        return ok;
      } catch { return false; }
    }
  }

  const handleCopyLink = async () => {
    const url = await buildShareURL({ data, categoryOrder, categoryMeta });
    const ok = await copyUrlToClipboard(url);
    if (!ok) window.prompt('Copy this link:', url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Add Category ──────────────────────────────────────────────────────────
  const [addingCat, setAddingCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const newCatInputRef = useRef<HTMLInputElement>(null);

  const handleReset = () => { resetToDefaults(); setShowResetConfirm(false); };
  const handlePrint  = () => window.print();

  const handleShare = () => {
    setSharing(true);
    try {
      sharePackList(data, system, categoryOrder, categoryMeta);
    } finally {
      setSharing(false);
    }
  };

  const handleSignOut = () => {
    signOut({ redirectUrl: import.meta.env.BASE_URL || '/' });
  };

  const handleAddCategory = () => {
    const name = newCatName.trim();
    if (!name) return;
    addCategory(name);
    setNewCatName('');
    setAddingCat(false);
  };

  const handleAddCatKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAddCategory();
    if (e.key === 'Escape') { setAddingCat(false); setNewCatName(''); }
  };

  const openAddCat = () => {
    setAddingCat(true);
    setTimeout(() => newCatInputRef.current?.focus(), 50);
  };

  // ── New list in a new tab ─────────────────────────────────────────────────
  const handleNew = useCallback(() => {
    const uuid = crypto.randomUUID();
    const snapshot = { __v: 5, items: data, order: categoryOrder, meta: categoryMeta };
    localStorage.setItem(`tw-newseed-${uuid}`, JSON.stringify(snapshot));
    const base = (import.meta.env.BASE_URL as string).replace(/\/$/, '');
    window.open(`${window.location.origin}${base}/checklist?newseed=${uuid}`, '_blank');
  }, [data, categoryOrder, categoryMeta]);

  // ── Keyboard shortcuts (Ctrl/Cmd+Z, Ctrl/Cmd+Y, Ctrl/Cmd+Shift+Z) ────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if (isInput) return;
      const meta = e.ctrlKey || e.metaKey;
      if (!meta) return;
      if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) { e.preventDefault(); redo(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  // ── Locker ────────────────────────────────────────────────────────────────

  const [lockerEntries, setLockerEntries] = useState<LockerEntry[]>(() => {
    try {
      const raw = localStorage.getItem(LOCKER_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });

  // Persist whenever lockerEntries changes (does NOT broadcast — broadcasts happen
  // explicitly in mutating handlers to avoid cross-tab echo loops)
  useEffect(() => {
    localStorage.setItem(LOCKER_KEY, JSON.stringify(lockerEntries));
  }, [lockerEntries]);

  // BroadcastChannel for cross-tab Locker sync
  const lockerChannelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    let ch: BroadcastChannel | null = null;
    try {
      ch = new BroadcastChannel('gear-locker-sync');
      lockerChannelRef.current = ch;
      ch.onmessage = (e) => {
        if (e.data?.type === 'locker-update') {
          const entries: LockerEntry[] = e.data.entries;
          // Write immediately so any subsequent refresh gets the latest data
          localStorage.setItem(LOCKER_KEY, JSON.stringify(entries));
          setLockerEntries(entries);
        }
      };
    } catch {
      lockerChannelRef.current = null;
    }
    return () => {
      ch?.close();
      lockerChannelRef.current = null;
    };
  }, []);

  /** Broadcast Locker state to every other open tab. */
  const broadcastLocker = useCallback((entries: LockerEntry[]) => {
    try {
      lockerChannelRef.current?.postMessage({ type: 'locker-update', entries });
    } catch {}
  }, []);

  // Error toast when a ?savedListId= was not found in the Locker
  useEffect(() => {
    const hadError = sessionStorage.getItem('tw-savedlist-error');
    if (hadError) {
      sessionStorage.removeItem('tw-savedlist-error');
      toast({
        title: 'List not found',
        description: 'That saved list may have been deleted from the Locker.',
        variant: 'destructive',
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Save to Locker ────────────────────────────────────────────────────────

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveConflictId, setSaveConflictId] = useState<string | null>(null);
  const saveInputRef = useRef<HTMLInputElement>(null);

  const openSaveDialog = () => {
    setShowSaveDialog(true);
    setSaveConflictId(null);
    setTimeout(() => saveInputRef.current?.focus(), 50);
  };

  const closeSaveDialog = () => {
    setShowSaveDialog(false);
    setSaveName('');
    setSaveConflictId(null);
  };

  /** Save as a brand-new entry (no duplicate check). */
  const commitSaveNew = useCallback((name: string) => {
    const entry: LockerEntry = {
      id: crypto.randomUUID(),
      name,
      savedAt: Date.now(),
      store,
      background,
      bgFade,
      bgTone,
    };
    const updated = [entry, ...lockerEntries];
    setLockerEntries(updated);
    broadcastLocker(updated);
    closeSaveDialog();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, background, bgFade, bgTone, lockerEntries, broadcastLocker]);

  /** Save and replace an existing entry (same ID, updated content). */
  const commitSaveReplace = useCallback((existingId: string, name: string) => {
    const entry: LockerEntry = {
      id: existingId,
      name,
      savedAt: Date.now(),
      store,
      background,
      bgFade,
      bgTone,
    };
    const updated = lockerEntries.map(e => e.id === existingId ? entry : e);
    setLockerEntries(updated);
    broadcastLocker(updated);
    closeSaveDialog();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, background, bgFade, bgTone, lockerEntries, broadcastLocker]);

  const handleSaveToLocker = () => {
    const name = saveName.trim();
    if (!name) return;
    const existing = lockerEntries.find(e => e.name === name);
    if (existing) {
      // Show conflict options (Replace / Save as New / Cancel)
      setSaveConflictId(existing.id);
      return;
    }
    commitSaveNew(name);
  };

  const handleReplaceInLocker = () => {
    if (!saveConflictId) return;
    commitSaveReplace(saveConflictId, saveName.trim());
  };

  const handleSaveAsNew = () => {
    commitSaveNew(saveName.trim());
  };

  // ── Load from Locker — open in a new tab ─────────────────────────────────

  const handleLoadFromLocker = (entry: LockerEntry) => {
    const base = (import.meta.env.BASE_URL as string).replace(/\/$/, '');
    const url = `${window.location.origin}${base}/checklist?savedListId=${entry.id}`;
    const tab = window.open(url, '_blank');
    if (!tab) {
      toast({
        title: 'Pop-up blocked',
        description: 'Allow pop-ups for this site and try again.',
        variant: 'destructive',
      });
    }
  };

  // ── Delete from Locker ────────────────────────────────────────────────────

  const handleDeleteFromLocker = (id: string) => {
    const updated = lockerEntries.filter(e => e.id !== id);
    setLockerEntries(updated);
    broadcastLocker(updated);
  };

  // ── Rename in Locker ──────────────────────────────────────────────────────

  const handleRenameInLocker = useCallback((id: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const updated = lockerEntries.map(e => e.id === id ? { ...e, name: trimmed } : e);
    setLockerEntries(updated);
    broadcastLocker(updated);
  }, [lockerEntries, broadcastLocker]);

  // ── Toolbar button style ──────────────────────────────────────────────────
  const toolBtn = 'flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-md hover:bg-muted/50';
  const toolBtnDisabled = 'flex items-center gap-2 text-xs font-medium text-muted-foreground/30 px-2 py-1.5 rounded-md cursor-not-allowed';

  return (
    <>
      {showMailingModal && (
        <MailingListModal userId={userId ?? ''} onDismiss={() => setShowMailingModal(false)} />
      )}

      {/* ── Screen content ── */}
      <div
        className={`screen-only h-[100dvh] overflow-hidden flex flex-col bg-background${bgTone === 'dark' ? ' screen-dark' : ''}`}
        style={bgImageUrl ? {
          backgroundImage: bgFade < 1
            ? `linear-gradient(rgba(${bgTone === 'dark' ? '0,0,0' : '255,255,255'},${1 - bgFade}),rgba(${bgTone === 'dark' ? '0,0,0' : '255,255,255'},${1 - bgFade})),url(${bgImageUrl})`
            : `url(${bgImageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : undefined}
      >
        <header className="bg-card border-b border-border flex-shrink-0 z-10 shadow-sm">
          <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
            {/* Logo */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="bg-primary/10 p-2 rounded-lg text-primary">
                <Tent className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-bold text-foreground text-xl leading-tight">TrailWeigh</h1>
                <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-widest">Gear Tracker</p>
              </div>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-1 min-w-0">

              {/* ── New ─────────────────────────────────────────── */}
              <button
                onClick={handleNew}
                title="Open a copy of this list in a new tab"
                className={toolBtn}
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden md:inline">New</span>
              </button>

              {/* ── Undo ────────────────────────────────────────── */}
              <button
                onClick={undo}
                disabled={!canUndo}
                title={canUndo ? 'Undo (Ctrl+Z)' : 'Nothing to undo'}
                className={canUndo ? toolBtn : toolBtnDisabled}
              >
                <img src="/undo-icon.png" alt="Undo" className="w-5 h-5 min-w-[20px] object-contain flex-shrink-0" />
                <span className="hidden md:inline">Undo</span>
              </button>

              {/* ── Redo ────────────────────────────────────────── */}
              <button
                onClick={redo}
                disabled={!canRedo}
                title={canRedo ? 'Redo (Ctrl+Y)' : 'Nothing to redo'}
                className={canRedo ? toolBtn : toolBtnDisabled}
              >
                <img src="/redo-icon.png" alt="Redo" className="w-5 h-5 min-w-[20px] object-contain flex-shrink-0" />
                <span className="hidden md:inline">Redo</span>
              </button>

              {/* ── Save ────────────────────────────────────────── */}
              {showSaveDialog ? (
                saveConflictId ? (
                  /* Duplicate-name conflict — ask user what to do */
                  <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-right-4 duration-200">
                    <span className="text-xs text-muted-foreground hidden sm:inline truncate max-w-[120px]">
                      "{saveName}" exists:
                    </span>
                    <button
                      onClick={handleReplaceInLocker}
                      className="text-xs font-semibold bg-destructive text-destructive-foreground px-2.5 py-1.5 rounded-md hover:bg-destructive/90 transition-colors"
                    >
                      Replace
                    </button>
                    <button
                      onClick={handleSaveAsNew}
                      className="text-xs font-semibold bg-primary text-primary-foreground px-2.5 py-1.5 rounded-md hover:bg-primary/90 transition-colors"
                    >
                      Save as New
                    </button>
                    <button
                      onClick={() => setSaveConflictId(null)}
                      className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                      title="Back"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  /* Normal save — enter name */
                  <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-right-4 duration-200">
                    <input
                      ref={saveInputRef}
                      type="text"
                      value={saveName}
                      onChange={e => setSaveName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleSaveToLocker();
                        if (e.key === 'Escape') closeSaveDialog();
                      }}
                      placeholder="List name…"
                      maxLength={40}
                      className="text-xs border border-border rounded-md px-2 py-1.5 bg-background focus:outline-none focus:border-primary/50 w-28 sm:w-36 text-foreground placeholder:text-muted-foreground"
                    />
                    <button
                      onClick={handleSaveToLocker}
                      disabled={!saveName.trim()}
                      className="text-xs font-semibold bg-primary text-primary-foreground px-2.5 py-1.5 rounded-md hover:bg-primary/90 disabled:opacity-40 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={closeSaveDialog}
                      className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              ) : (
                <button
                  onClick={openSaveDialog}
                  title="Save current list to Locker"
                  className={toolBtn}
                >
                  <LockerIcon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="hidden md:inline">Save</span>
                </button>
              )}

              {/* Divider */}
              <div className="w-px h-5 bg-border mx-1 flex-shrink-0" />

              {/* ── Reset ───────────────────────────────────────── */}
              <div className="relative flex-shrink-0">
                {showResetConfirm ? (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-200">
                    <span className="text-sm font-medium text-destructive">Clear All Items?</span>
                    <button onClick={handleReset} className="text-xs bg-destructive text-destructive-foreground px-3 py-1.5 rounded-md hover:bg-destructive/90 font-medium transition-colors">Confirm</button>
                    <button onClick={() => setShowResetConfirm(false)} className="text-xs bg-muted text-muted-foreground px-3 py-1.5 rounded-md hover:bg-muted/80 font-medium transition-colors">Cancel</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowResetConfirm(true)}
                    className={toolBtn}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Reset</span>
                  </button>
                )}
              </div>

              {/* ── User menu / guest CTA ────────────────────────── */}
              {isGuest ? (
                <button
                  onClick={() => setLocation('/sign-up')}
                  className="flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/40 hover:border-primary bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
                >
                  <User className="w-3.5 h-3.5" />
                  Sign in to save
                </button>
              ) : (
                <div className="relative flex-shrink-0">
                  <button
                    onClick={() => setShowUserMenu(v => !v)}
                    className={toolBtn}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline max-w-[100px] truncate">{userEmail || 'Account'}</span>
                  </button>
                  {showUserMenu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                      <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-20 min-w-[160px] py-1 animate-in fade-in slide-in-from-top-2 duration-150">
                        <div className="px-3 py-2 border-b border-border">
                          <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                        </div>
                        {admin && (
                          <button
                            onClick={() => { setShowUserMenu(false); setLocation('/admin'); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-primary/5 transition-colors"
                          >
                            <Shield className="w-3.5 h-3.5" />
                            Admin Panel
                          </button>
                        )}
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/5 transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 flex-1 min-h-0 lg:overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:h-full">

            {/* Gear list */}
            <div className="lg:col-span-8 lg:h-full lg:flex lg:flex-col lg:overflow-hidden">
              {/* Pinned pills row */}
              <div className="pt-8 pb-3 flex items-center justify-between lg:pr-3 flex-shrink-0">
                <div className="flex items-center bg-muted rounded-lg p-0.5 gap-0.5">
                  <button
                    onClick={() => setAllOpen(true)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
                      allOpen === true
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Open
                  </button>
                  <button
                    onClick={() => setAllOpen(false)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
                      allOpen === false
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Close
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowPreview(true)}
                    className="flex items-center bg-muted rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Preview
                  </button>
                  <UnitToggle />
                </div>
              </div>

              {/* Scrollable categories */}
              <div className="lg:flex-1 lg:overflow-y-auto lg:min-h-0 space-y-2 pb-8 lg:pr-3 lg:[scrollbar-gutter:stable]">
              {categoryOrder.map((category) => (
                <GearCategory
                  key={category}
                  name={category}
                  items={data[category] || []}
                  meta={categoryMeta[category] ?? { countsToBase: true }}
                  forceOpen={allOpen}
                  updateItem={updateItem}
                  removeItem={removeItem}
                  addItem={addItem}
                  onUpdateMeta={updates => updateCategoryMeta(category, updates)}
                  onDelete={() => deleteCategory(category)}
                  onRename={newName => renameCategory(category, newName)}
                  isDragOver={overCat === category && dragCat !== category}
                  onDragStart={() => setDragCat(category)}
                  onDragEnd={() => { setDragCat(null); setOverCat(null); }}
                  onDragOver={e => { e.preventDefault(); if (dragCat && dragCat !== category) setOverCat(category); }}
                  onDragLeave={() => setOverCat(prev => prev === category ? null : prev)}
                  onDrop={e => {
                    e.preventDefault();
                    if (dragCat && dragCat !== category) reorderCategory(dragCat, category);
                    setDragCat(null);
                    setOverCat(null);
                  }}
                />
              ))}

              {/* ── Add Category ── */}
              <div className="mt-2">
                {addingCat ? (
                  <div className="flex items-center gap-2 p-3 bg-card border border-primary/40 rounded-lg shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
                    <input
                      ref={newCatInputRef}
                      type="text"
                      value={newCatName}
                      onChange={e => setNewCatName(e.target.value)}
                      onKeyDown={handleAddCatKeyDown}
                      placeholder="Category name…"
                      maxLength={40}
                      className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                    />
                    <button
                      onClick={handleAddCategory}
                      disabled={!newCatName.trim()}
                      className="flex items-center gap-1 text-xs font-semibold bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 disabled:opacity-40 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Add
                    </button>
                    <button
                      onClick={() => { setAddingCat(false); setNewCatName(''); }}
                      className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={openAddCat}
                    className="w-full flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-dashed border-border hover:border-primary/50 hover:bg-primary/5 px-4 py-3 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Category
                  </button>
                )}
              </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-4 order-first lg:order-last lg:h-full lg:flex lg:flex-col lg:overflow-hidden">
              {/* Pinned action bar */}
              <div className="relative flex flex-wrap justify-center gap-2 pt-8 pb-3 lg:px-3 flex-shrink-0">
                <div ref={bgPickerContainerRef}>
                  <BackgroundPickerButton onClick={() => setBackgroundPickerOpen(o => !o)} active={!!background} />
                  <BackgroundPickerPanel
                    open={backgroundPickerOpen}
                    onClose={() => setBackgroundPickerOpen(false)}
                    background={background}
                    onBackgroundChange={handleBackgroundChange}
                    bgFade={bgFade}
                    onBgFadeChange={handleBgFadeChange}
                    bgTone={bgTone}
                    onBgToneChange={handleBgToneChange}
                    containerRef={bgPickerContainerRef as React.RefObject<HTMLDivElement>}
                  />
                </div>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground border border-border hover:border-foreground/30 bg-card hover:bg-muted/50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print
                </button>
                {/* Share pill + dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowShareMenu(o => !o)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground border border-border hover:border-foreground/30 bg-card hover:bg-muted/50 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Share
                  </button>
                  {showShareMenu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowShareMenu(false)} />
                      <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-20 min-w-[160px] py-1 animate-in fade-in slide-in-from-top-2 duration-150">
                        <button
                          onClick={() => { handleCopyLink(); setShowShareMenu(false); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted/60 transition-colors"
                        >
                          <Link className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                          <div className="text-left">
                            <div>{copied ? 'Copied!' : 'Copy Link'}</div>
                          </div>
                        </button>
                        <div className="my-1 border-t border-border" />
                        <button
                          onClick={() => { handleShare(); setShowShareMenu(false); }}
                          disabled={sharing}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted/60 transition-colors disabled:opacity-50"
                        >
                          <FileDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                          {sharing ? 'Preparing…' : 'Download PDF'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Scrollable sidebar content */}
              <div className="lg:flex-1 lg:overflow-y-auto lg:min-h-0 lg:px-3 lg:[scrollbar-gutter:stable]">
              <div className="flex flex-col gap-4 py-2 pb-8">
                <WeightSummary
                  data={data}
                  categoryOrder={categoryOrder}
                  categoryMeta={categoryMeta}
                />
                <ImportGearPanel
                  categoryOrder={categoryOrder}
                  onAddItem={(category, prefill) => addItem(category, prefill)}
                />
                <LockerPanel
                  entries={lockerEntries}
                  onLoad={handleLoadFromLocker}
                  onDelete={handleDeleteFromLocker}
                  onRename={handleRenameInLocker}
                />
              </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ── Preview modal ── */}
      {showPreview && (
        <PreviewModal
          data={data}
          system={system}
          categoryOrder={categoryOrder}
          categoryMeta={categoryMeta}
          onClose={() => setShowPreview(false)}
        />
      )}

      {/* ── Print-only layout ── */}
      <PrintLayout
        data={data}
        system={system}
        categoryOrder={categoryOrder}
        categoryMeta={categoryMeta}
      />
    </>
  );
}

export default function Checklist() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return (
      <UnitProvider>
        <ChecklistContent key={user.id} userId={user.id} userEmail={user.primaryEmailAddress?.emailAddress} />
      </UnitProvider>
    );
  }

  return (
    <UnitProvider>
      <ChecklistContent key="guest" userId={undefined} isGuest />
    </UnitProvider>
  );
}
