import React, { useState } from 'react';
import { useUser, useClerk } from '@clerk/react';
import { usePackData, CATEGORY_ORDER } from '../hooks/usePackData';
import { GearCategory } from '../components/GearCategory';
import { WeightSummary } from '../components/WeightSummary';
import { PrintLayout } from '../components/PrintLayout';
import { MailingListModal, hasSeenMailingPrompt } from '../components/MailingListModal';
import { UnitProvider, useUnit } from '../context/UnitContext';
import { sharePackList } from '../lib/exportPDF';
import { RotateCcw, Tent, Printer, Share2, LogOut, User } from 'lucide-react';

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
  userId: string;
  userEmail?: string;
}

function ChecklistContent({ userId, userEmail }: ChecklistContentProps) {
  const { data, updateItem, addItem, removeItem, resetToDefaults } = usePackData(userId);
  const { system } = useUnit();
  const { signOut } = useClerk();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [showMailingModal, setShowMailingModal] = useState(() => !hasSeenMailingPrompt(userId));
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleReset = () => {
    resetToDefaults();
    setShowResetConfirm(false);
  };

  const handlePrint = () => window.print();

  const handleShare = async () => {
    setSharing(true);
    try {
      await sharePackList(data, system);
    } catch {
      // User cancelled or error — silently ignore
    } finally {
      setSharing(false);
    }
  };

  const handleSignOut = () => {
    signOut({ redirectUrl: import.meta.env.BASE_URL || '/' });
  };

  const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

  return (
    <>
      {/* Mailing list prompt for new users */}
      {showMailingModal && (
        <MailingListModal
          userId={userId}
          onDismiss={() => setShowMailingModal(false)}
        />
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

              {/* User menu */}
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
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* Gear list */}
            <div className="lg:col-span-8 space-y-2">
              <div className="flex justify-end mb-4">
                <UnitToggle />
              </div>
              {CATEGORY_ORDER.map(category => (
                <GearCategory
                  key={category}
                  name={category}
                  items={data[category] || []}
                  updateItem={updateItem}
                  removeItem={removeItem}
                  addItem={addItem}
                />
              ))}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-4 order-first lg:order-last mb-8 lg:mb-0">
              <div className="flex justify-end gap-2 mb-3">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground border border-border hover:border-foreground/30 bg-card hover:bg-muted/50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print
                </button>
                <button
                  onClick={handleShare}
                  disabled={sharing}
                  className="flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/40 hover:border-primary bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  {sharing ? 'Sharing…' : 'Share PDF'}
                </button>
              </div>

              <WeightSummary data={data} />
            </div>
          </div>
        </main>
      </div>

      {/* ── Print-only layout (always in DOM, hidden on screen) ── */}
      <PrintLayout data={data} system={system} />
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

  if (!user) return null;

  return (
    <UnitProvider>
      {/* key={user.id} forces remount when user changes, re-initializing storage */}
      <ChecklistContent key={user.id} userId={user.id} userEmail={user.primaryEmailAddress?.emailAddress} />
    </UnitProvider>
  );
}
