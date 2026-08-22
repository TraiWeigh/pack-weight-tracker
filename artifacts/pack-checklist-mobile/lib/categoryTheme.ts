/**
 * categoryTheme.ts — N002
 *
 * Native-only category identity: background colour + Ionicons icon name.
 * Hex colours match web mobileCategoryTheme.ts; icons mapped to Ionicons v5.
 * No web imports — Ionicons icon names are plain strings.
 */

export interface NativeCategoryTheme {
  /** Wedge/tile background (hex). */
  bg: string;
  /** Ionicons icon name. */
  icon: string;
}

interface ThemeEntry {
  keywords: string[];
  bg: string;
  icon: string;
}

/** Priority-ordered keyword → theme list. First match wins (case-insensitive). */
const KEYWORD_THEMES: ThemeEntry[] = [
  {
    keywords: ['backpack', 'pack', 'carry', 'hiking', 'trek', 'daypack', 'rucksack'],
    bg: '#3B6978', icon: 'bag-outline',
  },
  {
    keywords: ['tent', 'shelter', 'bivvy', 'hammock', 'tarp'],
    bg: '#4E7B5C', icon: 'home-outline',
  },
  // 'camp' is intentionally after 'tent' so camping stoves don't steal the tent colour
  {
    keywords: ['camp'],
    bg: '#4E7B5C', icon: 'bonfire-outline',
  },
  {
    keywords: ['sleep', 'sleeping', 'quilt', 'night', 'rest'],
    bg: '#5C6BC0', icon: 'moon-outline',
  },
  {
    keywords: ['cloth', 'wear', 'shirt', 'pant', 'jacket', 'layer', 'apparel',
      'outfit', 'sock', 'shoe', 'boot', 'hat', 'glove', 'rain', 'fleece', 'base'],
    bg: '#7B5D87', icon: 'shirt-outline',
  },
  {
    keywords: ['water', 'hydration', 'drink', 'purif', 'bottle', 'flask', 'hydrat'],
    bg: '#1B7A8A', icon: 'water-outline',
  },
  {
    keywords: ['electron', 'tech', 'device', 'battery', 'power', 'charger', 'solar',
      'light', 'headlamp', 'gps', 'phone', 'gadget', 'cable', 'plug', 'lantern'],
    bg: '#B8722A', icon: 'flash-outline',
  },
  {
    keywords: ['toilet', 'hygiene', 'soap', 'personal', 'toothbrush', 'deodorant',
      'sanitizer', 'skincare', 'grooming', 'wash', 'beauty', 'care'],
    bg: '#A05898', icon: 'body-outline',
  },
  {
    keywords: ['medical', 'med', 'first aid', 'health', 'safety', 'emergency',
      'pharma', 'drug', 'pill', 'bandage', 'wound', 'kit'],
    bg: '#C0423C', icon: 'medkit-outline',
  },
  {
    keywords: ['repair', 'tool', 'fix', 'tape', 'patch', 'knife', 'multi', 'cordage', 'rope'],
    bg: '#6B6B3A', icon: 'build-outline',
  },
  {
    keywords: ['coffee', 'cafe', 'brew', 'espresso', 'tea'],
    bg: '#6A4A2A', icon: 'cafe-outline',
  },
  {
    keywords: ['food', 'meal', 'snack', 'cook', 'stove', 'kitchen', 'eat',
      'consumable', 'nutrition', 'calorie', 'lunch', 'dinner', 'breakfast', 'spice'],
    bg: '#A06030', icon: 'restaurant-outline',
  },
  {
    keywords: ['suitcase', 'luggage', 'travel', 'trip', 'flight', 'airport', 'vacation'],
    bg: '#3A7AB8', icon: 'airplane-outline',
  },
  {
    keywords: ['document', 'passport', 'id', 'paper', 'permit', 'insurance',
      'license', 'visa', 'form'],
    bg: '#4A7A9B', icon: 'document-text-outline',
  },
  {
    keywords: ['car', 'vehicle', 'road', 'auto', 'drive', 'transport', 'rv', 'van'],
    bg: '#5A5A7A', icon: 'car-outline',
  },
  {
    keywords: ['bike', 'bicycle', 'cycle', 'cycl'],
    bg: '#4A7A4A', icon: 'bicycle-outline',
  },
  {
    keywords: ['business', 'work', 'office', 'meeting', 'corporate', 'professional', 'suit'],
    bg: '#3A5A7A', icon: 'briefcase-outline',
  },
  {
    keywords: ['fitness', 'exercise', 'gym', 'sport', 'workout', 'training', 'yoga', 'run', 'athlet'],
    bg: '#6A8A4A', icon: 'barbell-outline',
  },
  {
    keywords: ['photo', 'camera', 'lens', 'tripod', 'video', 'film'],
    bg: '#4A6A8A', icon: 'camera-outline',
  },
  {
    keywords: ['music', 'audio', 'headphone', 'speaker', 'instrument'],
    bg: '#8A4A6A', icon: 'musical-notes-outline',
  },
  {
    keywords: ['book', 'read', 'journal', 'writing', 'notes', 'study', 'kindle', 'magazine'],
    bg: '#5A6A4A', icon: 'book-outline',
  },
  {
    keywords: ['map', 'navig', 'orient', 'topo'],
    bg: '#3A6A6A', icon: 'map-outline',
  },
  {
    keywords: ['compass', 'wilderness', 'backcountry'],
    bg: '#4A6A3A', icon: 'compass-outline',
  },
  {
    keywords: ['international', 'globe', 'world', 'abroad', 'overseas'],
    bg: '#3A5A8A', icon: 'globe-outline',
  },
  {
    keywords: ['shop', 'store', 'grocery', 'market', 'purchase'],
    bg: '#8A5A3A', icon: 'storefront-outline',
  },
  {
    keywords: ['water sport', 'kayak', 'canoe', 'sail', 'marine', 'anchor', 'boat'],
    bg: '#2A5A8A', icon: 'boat-outline',
  },
  {
    keywords: ['home', 'house', 'household', 'general', 'misc', 'miscellaneous', 'other'],
    bg: '#7A5A3A', icon: 'cube-outline',
  },
];

/** Rotating fallback palette for unrecognised categories. */
const FALLBACK_THEMES: NativeCategoryTheme[] = [
  { bg: '#3B6978', icon: 'bag-outline' },
  { bg: '#6B8F71', icon: 'leaf-outline' },
  { bg: '#8B5E52', icon: 'grid-outline' },
  { bg: '#5C6BC0', icon: 'star-outline' },
  { bg: '#7B7F44', icon: 'sunny-outline' },
  { bg: '#7C4585', icon: 'diamond-outline' },
  { bg: '#BF6B3B', icon: 'flame-outline' },
  { bg: '#2C7873', icon: 'globe-outline' },
  { bg: '#5F7A8A', icon: 'layers-outline' },
  { bg: '#7A6C5D', icon: 'cube-outline' },
];

/**
 * Returns the NativeCategoryTheme for a category name + list index.
 * Colour and icon are resolved by keyword; falls back to rotating palette.
 */
export function getCategoryTheme(name: string, index: number): NativeCategoryTheme {
  const lower = name.toLowerCase();
  for (const entry of KEYWORD_THEMES) {
    if (entry.keywords.some(kw => lower.includes(kw))) {
      return { bg: entry.bg, icon: entry.icon };
    }
  }
  return FALLBACK_THEMES[index % FALLBACK_THEMES.length];
}
