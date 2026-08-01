import React, { useState } from 'react';
import { GearItem } from '../hooks/usePackData';
import { GearRow } from './GearRow';
import { calcTotalOz, formatWeight } from '../lib/weightUtils';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';

interface GearCategoryProps {
  name: string;
  items: GearItem[];
  updateItem: (category: string, id: string, updates: Partial<GearItem>) => void;
  removeItem: (category: string, id: string) => void;
  addItem: (category: string) => void;
}

export function GearCategory({ name, items, updateItem, removeItem, addItem }: GearCategoryProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Calculate totals for checked items only
  const categoryTotalOz = items
    .filter(i => i.checked)
    .reduce((sum, item) => sum + calcTotalOz(item.weightOz, item.qty), 0);
  
  const displayOz = formatWeight(categoryTotalOz, 'oz');
  const displayLbs = formatWeight(categoryTotalOz, 'lbs');
  const packedCount = items.filter(i => i.checked).length;

  return (
    <div className="mb-6 bg-card border border-card-border rounded-lg overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md">
      <div 
        className="flex items-center justify-between p-3 sm:p-4 bg-muted/30 cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 text-foreground font-semibold">
          {isOpen ? <ChevronDown className="w-5 h-5 text-muted-foreground" /> : <ChevronRight className="w-5 h-5 text-muted-foreground" />}
          <h2 className="text-base sm:text-lg">{name}</h2>
          <span className="text-xs font-normal text-muted-foreground bg-black/5 px-2 py-0.5 rounded-full ml-2">
            {packedCount} / {items.length} packed
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 text-right">
          <div className="flex items-baseline gap-1">
            <span className="font-mono font-bold text-primary tabular-nums">{displayOz}</span>
            <span className="text-xs font-medium text-muted-foreground">oz</span>
          </div>
          <div className="flex items-baseline gap-1 hidden sm:flex">
            <span className="text-muted-foreground/30">/</span>
            <span className="font-mono font-medium text-muted-foreground tabular-nums">{displayLbs}</span>
            <span className="text-[10px] font-medium text-muted-foreground">lbs</span>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="p-2 sm:p-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="hidden sm:grid grid-cols-[auto_auto_1fr_80px_70px_80px_auto] gap-4 px-2 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider select-none mb-1">
            <div className="w-[30px]"></div>
            <div className="w-28">Type</div>
            <div>Description</div>
            <div className="text-right">Weight</div>
            <div className="text-center">Qty</div>
            <div className="text-right">Total</div>
            <div className="w-6"></div>
          </div>
          
          <div className="flex flex-col">
            {items.map((item) => (
              <GearRow
                key={item.id}
                item={item}
                category={name}
                updateItem={updateItem}
                removeItem={removeItem}
              />
            ))}
          </div>
          
          <button
            onClick={() => addItem(name)}
            className="mt-3 flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-foreground hover:bg-primary px-3 py-1.5 rounded-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>
      )}
    </div>
  );
}
