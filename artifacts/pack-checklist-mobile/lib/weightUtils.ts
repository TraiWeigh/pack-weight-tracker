import type { PackState } from '@/context/PackDataContext';

export const OZ_TO_LBS = 1 / 16;
export const OZ_TO_G = 28.3495;

export const ozToLbs = (oz: number) => oz * OZ_TO_LBS;
export const ozToGrams = (oz: number) => oz * OZ_TO_G;

export const calcTotalOz = (weightOz: number, qty: number) => weightOz * qty;

export type UnitSystem = 'imperial' | 'metric';

export const largeUnit = (system: UnitSystem) => system === 'metric' ? 'kg' : 'lbs';

export const formatWeight = (oz: number, system: UnitSystem, size: 'small' | 'large' = 'small') => {
  if (system === 'metric') {
    if (size === 'large') return (ozToGrams(oz) / 1000).toFixed(3);
    return ozToGrams(oz).toFixed(1);
  }
  if (size === 'large') return ozToLbs(oz).toFixed(2);
  return oz.toFixed(2);
};

export interface WeightTotals {
  baseWeightOz: number;
  clothingWornOz: number;
  dogPackOz: number;
  expendablesOz: number;
  grandTotalOz: number;
}

export function calcWeights(data: PackState): WeightTotals {
  let baseWeightOz = 0;
  let expendablesOz = 0;
  let dogPackOz = 0;
  let clothingWornOz = 0;

  for (const [cat, items] of Object.entries(data)) {
    for (const item of items) {
      if (!item.checked) continue;
      const total = calcTotalOz(item.weightOz, item.qty);
      if (cat === 'Dog Pack') {
        dogPackOz += total;
      } else if (cat === 'Clothing Worn') {
        clothingWornOz += total;
      } else if (cat === 'Expendables' || item.expendable) {
        expendablesOz += total;
      } else {
        baseWeightOz += total;
      }
    }
  }

  const grandTotalOz = baseWeightOz + expendablesOz + dogPackOz + clothingWornOz;
  return { baseWeightOz, clothingWornOz, dogPackOz, expendablesOz, grandTotalOz };
}
