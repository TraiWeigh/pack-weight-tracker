/**
 * mobileCategoryTheme.ts — 027T
 *
 * Maps a category name to a coloured wedge theme.
 * Icon selection is now fully delegated to categoryIcons.ts (getCategoryIcon).
 *
 * This file owns ONLY the colour (bg / text) mapping.
 * Keyword matching for colours is case-insensitive substring; first match wins.
 * Any category that does not match a keyword falls back to a rotating palette.
 */
import type { LucideIcon } from 'lucide-react';
import type { SemanticIcon } from './categoryIcons';
import { getCategoryIcon } from './categoryIcons';

export interface CategoryTheme {
  /** Wedge background color (hex). */
  bg: string;
  /** Icon/text color on the wedge (hex or 'white'/'black'). */
  text: string;
  /** Semantic icon component — resolved by getCategoryIcon(). */
  Icon: LucideIcon | SemanticIcon;
}

// ─── COLOUR-ONLY ENTRY TYPE ─────────────────────────────────────────────────
interface ColorEntry {
  bg: string;
  text: string;
}

/** Priority-ordered keyword → colour list. First match wins. */
const KEYWORD_COLORS: Array<{ keywords: string[]; color: ColorEntry }> = [
  {
    keywords: ['backpack', 'pack', 'carry', 'hiking', 'trek', 'daypack', 'rucksack'],
    color: { bg: '#3B6978', text: '#fff' },
  },
  {
    keywords: ['tent', 'shelter', 'camp', 'bivvy', 'hammock', 'tarp'],
    color: { bg: '#4E7B5C', text: '#fff' },
  },
  {
    keywords: ['sleep', 'sleeping', 'pad', 'pillow', 'quilt', 'night', 'rest', 'bag'],
    color: { bg: '#5C6BC0', text: '#fff' },
  },
  {
    keywords: ['cloth', 'wear', 'shirt', 'pant', 'jacket', 'layer', 'apparel',
      'outfit', 'sock', 'shoe', 'boot', 'hat', 'glove', 'rain', 'down', 'fleece', 'base'],
    color: { bg: '#7B5D87', text: '#fff' },
  },
  {
    keywords: ['water', 'hydration', 'drink', 'filter', 'purif', 'bottle', 'flask', 'hydrat'],
    color: { bg: '#1B7A8A', text: '#fff' },
  },
  {
    keywords: ['electron', 'tech', 'device', 'battery', 'power', 'charger', 'solar',
      'light', 'headlamp', 'gps', 'phone', 'gadget', 'cable', 'plug', 'lantern'],
    color: { bg: '#B8722A', text: '#fff' },
  },
  {
    keywords: ['toilet', 'hygiene', 'soap', 'personal', 'toothbrush', 'deodorant',
      'sanitizer', 'skincare', 'grooming', 'wash', 'beauty', 'care'],
    color: { bg: '#A05898', text: '#fff' },
  },
  {
    keywords: ['medical', 'med', 'first aid', 'health', 'safety', 'emergency',
      'pharma', 'drug', 'pill', 'bandage', 'wound', 'kit'],
    color: { bg: '#C0423C', text: '#fff' },
  },
  {
    keywords: ['repair', 'tool', 'fix', 'tape', 'patch', 'knife', 'multi', 'cordage', 'rope'],
    color: { bg: '#6B6B3A', text: '#fff' },
  },
  {
    keywords: ['food', 'meal', 'snack', 'cook', 'stove', 'kitchen', 'eat',
      'consumable', 'nutrition', 'calorie', 'lunch', 'dinner', 'breakfast', 'spice'],
    color: { bg: '#A06030', text: '#fff' },
  },
  {
    keywords: ['coffee', 'cafe', 'brew', 'espresso', 'tea'],
    color: { bg: '#6A4A2A', text: '#fff' },
  },
  {
    keywords: ['suitcase', 'luggage', 'travel', 'trip', 'flight', 'airport', 'vacation'],
    color: { bg: '#3A7AB8', text: '#fff' },
  },
  {
    keywords: ['document', 'passport', 'id', 'paper', 'permit', 'insurance',
      'card', 'license', 'visa', 'form', 'contract', 'receipt'],
    color: { bg: '#4A7A9B', text: '#fff' },
  },
  {
    keywords: ['car', 'vehicle', 'road', 'auto', 'drive', 'transport', 'rv', 'van'],
    color: { bg: '#5A5A7A', text: '#fff' },
  },
  {
    keywords: ['bike', 'bicycle', 'cycle', 'cycl'],
    color: { bg: '#4A7A4A', text: '#fff' },
  },
  {
    keywords: ['business', 'work', 'office', 'meeting', 'corporate', 'professional', 'suit'],
    color: { bg: '#3A5A7A', text: '#fff' },
  },
  {
    keywords: ['home', 'house', 'household', 'general', 'misc', 'miscellaneous', 'other'],
    color: { bg: '#7A5A3A', text: '#fff' },
  },
  {
    keywords: ['fitness', 'exercise', 'gym', 'sport', 'workout', 'training', 'yoga', 'run', 'athlet'],
    color: { bg: '#6A8A4A', text: '#fff' },
  },
  {
    keywords: ['photo', 'camera', 'lens', 'tripod', 'video', 'film'],
    color: { bg: '#4A6A8A', text: '#fff' },
  },
  {
    keywords: ['music', 'audio', 'headphone', 'speaker', 'instrument'],
    color: { bg: '#8A4A6A', text: '#fff' },
  },
  {
    keywords: ['book', 'read', 'journal', 'writing', 'notes', 'study', 'kindle', 'magazine'],
    color: { bg: '#5A6A4A', text: '#fff' },
  },
  {
    keywords: ['map', 'navig', 'orient', 'topo'],
    color: { bg: '#3A6A6A', text: '#fff' },
  },
  {
    keywords: ['international', 'globe', 'world', 'abroad', 'overseas'],
    color: { bg: '#3A5A8A', text: '#fff' },
  },
  {
    keywords: ['shop', 'store', 'grocery', 'market', 'purchase'],
    color: { bg: '#8A5A3A', text: '#fff' },
  },
  {
    keywords: ['compass', 'wilderness', 'backcountry', 'navigation'],
    color: { bg: '#4A6A3A', text: '#fff' },
  },
  {
    keywords: ['water sport', 'kayak', 'canoe', 'sail', 'marine', 'anchor', 'boat'],
    color: { bg: '#2A5A8A', text: '#fff' },
  },
];

/** Rotating palette for unrecognized categories. */
const FALLBACK_COLORS: Array<ColorEntry> = [
  { bg: '#3B6978', text: '#fff' },
  { bg: '#6B8F71', text: '#fff' },
  { bg: '#8B5E52', text: '#fff' },
  { bg: '#5C6BC0', text: '#fff' },
  { bg: '#7B7F44', text: '#fff' },
  { bg: '#7C4585', text: '#fff' },
  { bg: '#BF6B3B', text: '#fff' },
  { bg: '#2C7873', text: '#fff' },
  { bg: '#5F7A8A', text: '#fff' },
  { bg: '#7A6C5D', text: '#fff' },
];

/**
 * Returns the CategoryTheme for a given category name + list index.
 * Colour is resolved here; Icon is resolved by getCategoryIcon() in categoryIcons.ts.
 * Falls back to rotating palette if no colour keyword matches.
 */
export function getCategoryTheme(name: string, index: number): CategoryTheme {
  const lower = name.toLowerCase();
  for (const { keywords, color } of KEYWORD_COLORS) {
    if (keywords.some(kw => lower.includes(kw))) {
      return { ...color, Icon: getCategoryIcon(name) };
    }
  }
  const fallback = FALLBACK_COLORS[index % FALLBACK_COLORS.length];
  return { ...fallback, Icon: getCategoryIcon(name) };
}
