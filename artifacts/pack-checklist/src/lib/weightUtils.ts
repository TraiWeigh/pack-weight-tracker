export const ozToLbs = (oz: number) => oz / 16;

export const formatWeight = (oz: number, unit: 'oz' | 'lbs') => {
  if (unit === 'lbs') {
    return ozToLbs(oz).toFixed(2);
  }
  return oz.toFixed(2);
};

export const getUnitLabel = (unit: 'oz' | 'lbs') => unit;

export const calcTotalOz = (weightOz: number, qty: number) => weightOz * qty;
