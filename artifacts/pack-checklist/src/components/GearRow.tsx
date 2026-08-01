import React, { memo } from 'react';
import { GearItem } from '../hooks/usePackData';
import { formatWeight, calcTotalOz } from '../lib/weightUtils';
import { X, GripVertical } from 'lucide-react';

interface GearRowProps {
  item: GearItem;
  category: string;
  updateItem: (category: string, id: string, updates: Partial<GearItem>) => void;
  removeItem: (category: string, id: string) => void;
}

export const GearRow = memo(function GearRow({ item, category, updateItem, removeItem }: GearRowProps) {
  const totalOz = calcTotalOz(item.weightOz, item.qty);
  const displayOz = formatWeight(totalOz, 'oz');
  const displayLbs = formatWeight(totalOz, 'lbs');
  
  const handleNumChange = (field: 'weightOz' | 'qty', value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      updateItem(category, item.id, { [field]: num });
    } else if (value === '') {
      updateItem(category, item.id, { [field]: 0 });
    }
  };

  const rowClasses = `group grid grid-cols-[auto_auto_1fr_80px_70px_80px_auto] gap-2 md:gap-4 py-2 border-b border-border/50 items-center transition-opacity hover:bg-black/5 dark:hover:bg-white/5 px-2 -mx-2 rounded-md ${
    !item.checked ? 'opacity-50 grayscale' : ''
  }`;

  return (
    <div className={rowClasses}>
      <div className="flex items-center gap-1 sm:gap-2">
        <GripVertical className="w-4 h-4 text-muted-foreground/30 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block" />
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={item.checked}
            onChange={(e) => updateItem(category, item.id, { checked: e.target.checked })}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer accent-primary"
          />
        </label>
      </div>
      
      <div className="text-xs sm:text-sm font-medium text-muted-foreground w-20 sm:w-28 truncate select-none">
        {item.sub || '-'}
      </div>
      
      <input
        type="text"
        value={item.desc}
        onChange={(e) => updateItem(category, item.id, { desc: e.target.value })}
        placeholder="Item description"
        className="w-full bg-transparent text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 rounded px-1 -ml-1 h-7 truncate placeholder:text-muted-foreground/50 transition-colors hover:bg-black/5"
      />
      
      <div className="flex items-center gap-1 group/input">
        <input
          type="number"
          min="0"
          step="0.01"
          value={item.weightOz === 0 ? '' : item.weightOz}
          onChange={(e) => handleNumChange('weightOz', e.target.value)}
          className="w-full bg-transparent text-sm text-right font-mono focus:outline-none focus:ring-1 focus:ring-primary/30 rounded px-1 h-7 transition-colors hover:bg-black/5"
          placeholder="0"
        />
        <span className="text-xs text-muted-foreground select-none">oz</span>
      </div>
      
      <div className="flex items-center gap-1">
        <input
          type="number"
          min="1"
          step="1"
          value={item.qty === 0 ? '' : item.qty}
          onChange={(e) => handleNumChange('qty', e.target.value)}
          className="w-full bg-transparent text-sm text-center font-mono focus:outline-none focus:ring-1 focus:ring-primary/30 rounded px-1 h-7 transition-colors hover:bg-black/5"
          placeholder="0"
        />
        <span className="text-xs text-muted-foreground select-none">x</span>
      </div>
      
      <div className="flex flex-col items-end justify-center">
        <span className="text-sm font-mono font-medium text-foreground tabular-nums leading-none">
          {displayOz}
        </span>
        <span className="text-[10px] font-mono text-muted-foreground tabular-nums leading-tight">
          {displayLbs} lbs
        </span>
      </div>
      
      <button
        onClick={() => removeItem(category, item.id)}
        className="text-muted-foreground hover:text-destructive p-1 rounded-md opacity-0 group-hover:opacity-100 transition-all focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-destructive/30"
        title="Remove item"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
});
