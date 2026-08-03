import React, { useState, useRef } from 'react';
import { useUser, useClerk } from '@clerk/react';
import { usePackData } from '../hooks/usePackData';
import { GearCategory } from '../components/GearCategory';
import { WeightSummary } from '../components/WeightSummary';
import { PrintLayout } from '../components/PrintLayout';
import { MailingListModal, hasSeenMailingPrompt } from '../components/MailingListModal';
import { UnitProvider, useUnit } from '../context/UnitContext';
import { sharePackList } from '../lib/exportPDF';
import { useLocation } from 'wouter';
import { isAdmin } from './AdminPage';
import { ScanGearPanel } from '../components/ScanGearPanel';
import { buildShareURL } from '../lib/shareLink';
import { RotateCcw, Tent, Printer, Share2, Link, LogOut, User, Shield, Plus, Check, X, ChevronsUpDown } from 'lucide-react';
import { ThemePickerButton, ThemePickerPanel } from '../components/ThemePicker';

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
    data, categoryOrder, categoryMeta,
    updateItem, addItem, removeItem,
    addCategory, deleteCategory, updateCategoryMeta, moveCategory,
    resetToDefaults,
  } = usePackData(userId);

  const { system } = useUnit();
  const { signOut } = useClerk();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [showMailingModal, setShowMailingModal] = useState(() => !isGuest && !hasSeenMailingPrompt(userId));
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [themePickerOpen, setThemePickerOpen] = useState(false);
  const [, setLocation] = useLocation();
  const admin = isAdmin(userEmail);

  // Expand / collapse all categories
  const [allOpen, setAllOpen] = useState(true);

  // Copy share link
  const [copied, setCopied] = useState(false);
  const handleCopyLink = async () => {
    const url = await buildShareURL({ data, categoryOrder, categoryMeta });
    // navigator.clipboard requires focus & a secure context; use execCommand as fallback
    let copyOk = false;
    try {
      await navigator.clipboard.writeText(url);
      copyOk = true;
    } catch {
      try {
        const el = document.createElement('textarea');
        el.value = url;
        el.style.cssText = 'position:fixed;pointer-events:none;opacity:0';
        document.body.appendChild(el);
        el.focus();
        el.select();
        copyOk = document.execCommand('copy');
        document.body.removeChild(el);
      } catch { /* ignore */ }
    }
    if (!copyOk) {
      // Last resort — show the URL so the user can copy manually
      window.prompt('Copy this link:', url);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Add Category state
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

  return (
    <>
      {showMailingModal && (
        <MailingListModal userId={userId} onDismiss={() => setShowMailingModal(false)} />
      )}

      {/* ── Screen content ── */}
      <div className="screen-only min-h-[100dvh] bg-background">
        <header className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg text-primary">
                <Tent className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-bold text-foreground text-xl leading-tight">TrailWeigh</h1>
                <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-widest">Ultralight Gear Tracker</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Reset */}
              <div className="relative">
                {showResetConfirm ? (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-200">
                    <span className="text-sm font-medium text-destructive">Reset all data?</span>
                    <button onClick={handleReset} className="text-xs bg-destructive text-destructive-foreground px-3 py-1.5 rounded-md hover:bg-destructive/90 font-medium transition-colors">Confirm</button>
                    <button onClick={() => setShowResetConfirm(false)} className="text-xs bg-muted text-muted-foreground px-3 py-1.5 rounded-md hover:bg-muted/80 font-medium transition-colors">Cancel</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowResetConfirm(true)}
                    className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-md hover:bg-muted/50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Reset</span>
                  </button>
                )}
              </div>

              {/* User menu / guest CTA */}
              {isGuest ? (
                <button
                  onClick={() => setLocation('/sign-up')}
                  className="flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/40 hover:border-primary bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <User className="w-3.5 h-3.5" />
                  Sign in to save
                </button>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(v => !v)}
                    className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-md hover:bg-muted/50"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline max-w-[120px] truncate">{userEmail || 'Account'}</span>
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

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 lg:h-[calc(100vh-4rem)] lg:overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:h-full">

            {/* Gear list */}
            <div className="lg:col-span-8 lg:h-full lg:flex lg:flex-col">
              {/* Pinned pills row — never scrolls */}
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
                <UnitToggle />
              </div>

              {/* Scrollable categories */}
              <div className="lg:flex-1 lg:overflow-y-auto lg:min-h-0 space-y-2 pb-8 lg:pr-3 lg:[scrollbar-gutter:stable]">
              {categoryOrder.map((category, idx) => (
                <GearCategory
                  key={category}
                  name={category}
                  items={data[category] || []}
                  meta={categoryMeta[category] ?? { countsToBase: true }}
                  isFirst={idx === 0}
                  isLast={idx === categoryOrder.length - 1}
                  forceOpen={allOpen}
                  updateItem={updateItem}
                  removeItem={removeItem}
                  addItem={addItem}
                  onMoveUp={() => moveCategory(category, 'up')}
                  onMoveDown={() => moveCategory(category, 'down')}
                  onUpdateMeta={updates => updateCategoryMeta(category, updates)}
                  onDelete={() => deleteCategory(category)}
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
            <div className="lg:col-span-4 order-first lg:order-last lg:overflow-y-auto lg:h-full py-8 lg:px-3 lg:[scrollbar-gutter:stable]">
              <div className="relative flex justify-end gap-2 mb-3">
                <ThemePickerButton onClick={() => setThemePickerOpen(o => !o)} />
                <ThemePickerPanel open={themePickerOpen} onClose={() => setThemePickerOpen(false)} />
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground border border-border hover:border-foreground/30 bg-card hover:bg-muted/50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print
                </button>
                <button
                  onClick={handleCopyLink}
                  className={`flex items-center gap-1.5 text-xs font-semibold border px-3 py-1.5 rounded-lg transition-colors ${
                    copied
                      ? 'text-green-700 border-green-300 bg-green-50 dark:text-green-400 dark:border-green-700 dark:bg-green-950'
                      : 'text-muted-foreground hover:text-foreground border-border hover:border-foreground/30 bg-card hover:bg-muted/50'
                  }`}
                >
                  <Link className="w-3.5 h-3.5" />
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
                <button
                  onClick={handleShare}
                  disabled={sharing}
                  className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground border border-border hover:border-foreground/30 bg-card hover:bg-muted/50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  {sharing ? 'Sharing…' : 'Share PDF'}
                </button>
              </div>

              <div className="flex flex-col gap-4 pb-2">
                <WeightSummary
                  data={data}
                  categoryOrder={categoryOrder}
                  categoryMeta={categoryMeta}
                />
                <ScanGearPanel
                  userId={userId}
                  categoryOrder={categoryOrder}
                  onAddItem={(category, prefill) => addItem(category, prefill)}
                />
              </div>
            </div>
          </div>
        </main>
      </div>

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

  // Guest — data from localStorage guest key (pre-loaded by SharedPackView)
  return (
    <UnitProvider>
      <ChecklistContent key="guest" userId={undefined} isGuest />
    </UnitProvider>
  );
}
