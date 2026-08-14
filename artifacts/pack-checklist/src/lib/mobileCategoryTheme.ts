/**
 * mobileCategoryTheme.ts — 026R
 *
 * Maps a category name to a colored wedge theme + icon.
 * Uses keyword matching so it is NOT backpacking-only — it covers general
 * TrailWeigh use: travel, business, household, etc.
 * Any category that does not match a keyword falls back to a rotating palette
 * with the generic Package icon.
 */
import type { LucideIcon } from 'lucide-react';
import {
  Backpack, Tent, Moon, Shirt, Droplets, Zap,
  Heart, Wrench, UtensilsCrossed, Briefcase, FileText,
  Car, Building2, Home, Dumbbell, Camera, Music,
  BookOpen, Coffee, Globe, ShoppingBag, Package,
  Compass, Anchor, Bike, Map,
} from 'lucide-react';

export interface CategoryTheme {
  /** Wedge background color (hex). */
  bg: string;
  /** Icon/text color on the wedge (hex or 'white'/'black'). */
  text: string;
  /** Lucide icon component. */
  Icon: LucideIcon;
}

/** Priority-ordered keyword list. First match wins. */
const KEYWORD_THEMES: Array<{ keywords: string[]; theme: CategoryTheme }> = [
  {
    keywords: ['backpack', 'pack', 'carry', 'hiking', 'trek', 'daypack', 'rucksack'],
    theme: { bg: '#3B6978', text: '#fff', Icon: Backpack },
  },
  {
    keywords: ['tent', 'shelter', 'camp', 'bivvy', 'hammock', 'tarp'],
    theme: { bg: '#4E7B5C', text: '#fff', Icon: Tent },
  },
  {
    keywords: ['sleep', 'sleeping', 'pad', 'pillow', 'quilt', 'night', 'rest', 'bag'],
    theme: { bg: '#5C6BC0', text: '#fff', Icon: Moon },
  },
  {
    keywords: ['cloth', 'wear', 'shirt', 'pant', 'jacket', 'layer', 'apparel',
      'outfit', 'sock', 'shoe', 'boot', 'hat', 'glove', 'rain', 'down', 'fleece', 'base'],
    theme: { bg: '#7B5D87', text: '#fff', Icon: Shirt },
  },
  {
    keywords: ['water', 'hydration', 'drink', 'filter', 'purif', 'bottle', 'flask', 'hydrat'],
    theme: { bg: '#1B7A8A', text: '#fff', Icon: Droplets },
  },
  {
    keywords: ['electron', 'tech', 'device', 'battery', 'power', 'charger', 'solar',
      'light', 'headlamp', 'gps', 'phone', 'gadget', 'cable', 'plug', 'lantern'],
    theme: { bg: '#B8722A', text: '#fff', Icon: Zap },
  },
  {
    keywords: ['toilet', 'hygiene', 'soap', 'personal', 'toothbrush', 'deodorant',
      'sanitizer', 'skincare', 'grooming', 'wash', 'beauty', 'care'],
    theme: { bg: '#A05898', text: '#fff', Icon: Heart },
  },
  {
    keywords: ['medical', 'med', 'first aid', 'health', 'safety', 'emergency',
      'pharma', 'drug', 'pill', 'bandage', 'wound', 'kit'],
    theme: { bg: '#C0423C', text: '#fff', Icon: Heart },
  },
  {
    keywords: ['repair', 'tool', 'fix', 'tape', 'patch', 'knife', 'multi', 'cordage', 'rope'],
    theme: { bg: '#6B6B3A', text: '#fff', Icon: Wrench },
  },
  {
    keywords: ['food', 'meal', 'snack', 'cook', 'stove', 'kitchen', 'eat',
      'consumable', 'nutrition', 'calorie', 'lunch', 'dinner', 'breakfast', 'spice'],
    theme: { bg: '#A06030', text: '#fff', Icon: UtensilsCrossed },
  },
  {
    keywords: ['coffee', 'cafe', 'brew', 'espresso', 'tea'],
    theme: { bg: '#6A4A2A', text: '#fff', Icon: Coffee },
  },
  {
    keywords: ['suitcase', 'luggage', 'travel', 'trip', 'flight', 'airport', 'vacation'],
    theme: { bg: '#3A7AB8', text: '#fff', Icon: Briefcase },
  },
  {
    keywords: ['document', 'passport', 'id', 'paper', 'permit', 'insurance',
      'card', 'license', 'visa', 'form', 'contract', 'receipt'],
    theme: { bg: '#4A7A9B', text: '#fff', Icon: FileText },
  },
  {
    keywords: ['car', 'vehicle', 'road', 'auto', 'drive', 'transport', 'rv', 'van'],
    theme: { bg: '#5A5A7A', text: '#fff', Icon: Car },
  },
  {
    keywords: ['bike', 'bicycle', 'cycle', 'cycl'],
    theme: { bg: '#4A7A4A', text: '#fff', Icon: Bike },
  },
  {
    keywords: ['business', 'work', 'office', 'meeting', 'corporate', 'professional', 'suit'],
    theme: { bg: '#3A5A7A', text: '#fff', Icon: Building2 },
  },
  {
    keywords: ['home', 'house', 'household', 'general', 'misc', 'miscellaneous', 'other'],
    theme: { bg: '#7A5A3A', text: '#fff', Icon: Home },
  },
  {
    keywords: ['fitness', 'exercise', 'gym', 'sport', 'workout', 'training', 'yoga', 'run', 'athlet'],
    theme: { bg: '#6A8A4A', text: '#fff', Icon: Dumbbell },
  },
  {
    keywords: ['photo', 'camera', 'lens', 'tripod', 'video', 'film'],
    theme: { bg: '#4A6A8A', text: '#fff', Icon: Camera },
  },
  {
    keywords: ['music', 'audio', 'headphone', 'speaker', 'instrument'],
    theme: { bg: '#8A4A6A', text: '#fff', Icon: Music },
  },
  {
    keywords: ['book', 'read', 'journal', 'writing', 'notes', 'study', 'kindle', 'magazine'],
    theme: { bg: '#5A6A4A', text: '#fff', Icon: BookOpen },
  },
  {
    keywords: ['map', 'navig', 'orient', 'topo'],
    theme: { bg: '#3A6A6A', text: '#fff', Icon: Map },
  },
  {
    keywords: ['international', 'globe', 'world', 'abroad', 'overseas'],
    theme: { bg: '#3A5A8A', text: '#fff', Icon: Globe },
  },
  {
    keywords: ['shop', 'store', 'grocery', 'market', 'purchase'],
    theme: { bg: '#8A5A3A', text: '#fff', Icon: ShoppingBag },
  },
  {
    keywords: ['compass', 'wilderness', 'backcountry', 'navigation'],
    theme: { bg: '#4A6A3A', text: '#fff', Icon: Compass },
  },
  {
    keywords: ['water sport', 'kayak', 'canoe', 'sail', 'marine', 'anchor', 'boat'],
    theme: { bg: '#2A5A8A', text: '#fff', Icon: Anchor },
  },
];

/** Rotating palette for unrecognized categories. */
const FALLBACK_COLORS: Array<{ bg: string; text: string }> = [
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
 * Keyword match is case-insensitive; first match wins.
 * Falls back to rotating palette + Package icon if no keyword matches.
 */
export function getCategoryTheme(name: string, index: number): CategoryTheme {
  const lower = name.toLowerCase();
  for (const { keywords, theme } of KEYWORD_THEMES) {
    if (keywords.some(kw => lower.includes(kw))) return theme;
  }
  const fallback = FALLBACK_COLORS[index % FALLBACK_COLORS.length];
  return { ...fallback, Icon: Package };
}
