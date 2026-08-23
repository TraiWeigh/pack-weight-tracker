import type { PackState } from '@/context/PackDataContext';

export const OZ_TO_LBS = 1 / 16;
export const OZ_TO_G   = 28.3495;

export const ozToLbs   = (oz: number) => oz * OZ_TO_LBS;
export const ozToGrams = (oz: number) => oz * OZ_TO_G;

export const calcTotalOz = (weightOz: number, qty: number) => weightOz * qty;

export type UnitSystem = 'imperial' | 'metric';

export const largeUnit = (system: UnitSystem) => system === 'metric' ? 'kg' : 'lbs';

/**
 * v3-parity display label: switches oz → lb at ≥16 oz, g → kg at ≥1000 g.
 * Always includes unit suffix.
 */
export function formatDisplayWeight(oz: number, system: UnitSystem = 'imperial'): string {
  if (system === 'metric') {
    const g = ozToGrams(oz);
    if (g >= 1000) return `${(g / 1000).toFixed(2)} kg`;
    return `${g.toFixed(0)} g`;
  }
  if (oz >= 16) return `${(oz / 16).toFixed(2)} lb`;
  return `${oz.toFixed(1)} oz`;
}

/**
 * Legacy compact weight value (no suffix). Used by SectionHeader weight badges.
 * Pass `size:'large'` to get lb/kg; 'small' for oz/g.
 */
export const formatWeight = (oz: number, system: UnitSystem, size: 'small' | 'large' = 'small') => {
  if (system === 'metric') {
    if (size === 'large') return (ozToGrams(oz) / 1000).toFixed(3);
    return ozToGrams(oz).toFixed(1);
  }
  if (size === 'large') return ozToLbs(oz).toFixed(2);
  return oz.toFixed(2);
};

export const getTotalOz = (state: PackState): number =>
  Object.values(state).flat().reduce((acc, item) => acc + calcTotalOz(item.weightOz, item.qty), 0);

export const getCheckedOz = (state: PackState): number =>
  Object.values(state).flat()
    .filter(i => i.checked)
    .reduce((acc, item) => acc + calcTotalOz(item.weightOz, item.qty), 0);

export const getCategoryOz = (items: PackState[string]) =>
  items.reduce((acc, item) => acc + calcTotalOz(item.weightOz, item.qty), 0);

export const getCheckedCategoryOz = (items: PackState[string]) =>
  items.filter(i => i.checked).reduce((acc, item) => acc + calcTotalOz(item.weightOz, item.qty), 0);

export const kg    = (oz: number) => (oz * OZ_TO_G / 1000).toFixed(2);
export const lbs   = (oz: number) => (oz * OZ_TO_LBS).toFixed(2);
export const grams = (oz: number) => (oz * OZ_TO_G).toFixed(0);

/**
 * Compute the five TrailWeigh weight buckets from checked items.
 * Matches web v3 / SummarySheet behaviour.
 */
export function calcWeights(data: PackState): {
  baseWeightOz:     number;
  clothingWornOz:   number;
  dogPackOz:        number;
  expendablesOz:    number;
  grandTotalOz:     number;
} {
  const catOz = (catName: string) =>
    (data[catName] || [])
      .filter(i => i.checked)
      .reduce((s, i) => s + calcTotalOz(i.weightOz, i.qty), 0);

  const clothingWornOz = catOz('Clothing Worn');
  const dogPackOz      = catOz('Dog Pack');
  const expendablesOz  = catOz('Expendables');

  const baseWeightOz = Object.keys(data).reduce((s, cat) => {
    if (cat === 'Clothing Worn' || cat === 'Dog Pack' || cat === 'Expendables') return s;
    return s + catOz(cat);
  }, 0);

  const grandTotalOz = baseWeightOz + clothingWornOz + dogPackOz + expendablesOz;

  return { baseWeightOz, clothingWornOz, dogPackOz, expendablesOz, grandTotalOz };
}
