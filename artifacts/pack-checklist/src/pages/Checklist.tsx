import React, { useState } from 'react';
import { usePackData, CATEGORY_ORDER } from '../hooks/usePackData';
import { GearCategory } from '../components/GearCategory';
import { WeightSummary } from '../components/WeightSummary';
import { UnitProvider } from '../context/UnitContext';
import { RotateCcw, Tent } from 'lucide-react';

export default function Checklist() {
  const { data, updateItem, addItem, removeItem, resetToDefaults } = usePackData();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleReset = () => {
    resetToDefaults();
    setShowResetConfirm(false);
  };

  return (
    <UnitProvider>
      <div className="min-h-[100dvh] bg-background">
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
                  <span className="hidden sm:inline">Reset Defaults</span>
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Main Gear List */}
            <div className="lg:col-span-8 space-y-2">
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

            {/* Sidebar Summary */}
            <div className="lg:col-span-4 order-first lg:order-last mb-8 lg:mb-0">
              <WeightSummary data={data} />
            </div>

          </div>
        </main>
      </div>
    </UnitProvider>
  );
}
