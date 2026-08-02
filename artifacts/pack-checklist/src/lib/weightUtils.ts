export const OZ_TO_G = 28.3495;
export const OZ_TO_LBS = 1 / 16;

export const ozToLbs = (oz: number) => oz * OZ_TO_LBS;
export const ozToGrams = (oz: number) => oz * OZ_TO_G;
export const gramsToOz = (g: number) => g / OZ_TO_G;

export const calcTotalOz = (weightOz: number, qty: number) => weightOz * qty;

export type UnitSystem = 'imperial' | 'metric';

/** Small unit label (per-item column) */
export const smallUnit = (system: UnitSystem) => system === 'metric' ? 'g' : 'oz';

/** Large unit label (summary/category totals) */
export const largeUnit = (system: UnitSystem) => system === 'metric' ? 'kg' : 'lbs';

/**
 * Format an oz value for display.
 * size='small' → oz or g (per-item precision)
 * size='large' → lbs or kg (summary precision)
 */
export const formatWeight = (oz: number, system: UnitSystem, size: 'small' | 'large' = 'small') => {
  if (system === 'metric') {
    if (size === 'large') return (ozToGrams(oz) / 1000).toFixed(3);
    return ozToGrams(oz).toFixed(1);
  }
  if (size === 'large') return ozToLbs(oz).toFixed(2);
  return oz.toFixed(2);
};
