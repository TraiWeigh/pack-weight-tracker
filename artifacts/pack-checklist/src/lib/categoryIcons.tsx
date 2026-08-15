/**
 * categoryIcons.tsx — 027T
 *
 * TrailWeigh-wide semantic category icon resolver.
 *
 * API:
 *   getCategoryIcon(categoryName: string): SemanticIcon
 *
 * - Deterministic: same name always returns same icon.
 * - Extensible: add keyword families below; no changes elsewhere needed.
 * - Accepts optional future `context` parameter without a breaking change.
 * - Does NOT scatter icon decisions throughout JSX; V3 calls getCategoryIcon() once.
 *
 * Keyword matching is case-insensitive substring. Priority order: first match wins.
 * Ordering rule: more specific / earlier-in-alphabet families come first where
 * two families share a keyword substring (e.g. "clothing" before "pack" prevents
 * "Clothing Packed" → Backpack misfire).
 *
 * Custom SVG icons (ToothbrushIcon) live here so they are defined once and reused
 * by any consumer — previously hardcoded in MobileFunctionalV3.tsx.
 */

import React from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Backpack, Tent, Moon, Shirt, Droplets, Zap, PlugZap,
  Wrench, Hammer, UtensilsCrossed, Briefcase, FileText,
  Car, Building2, Home, Dumbbell, Camera, Music,
  BookOpen, Coffee, Globe, ShoppingBag, Package,
  Compass, Anchor, Bike, Luggage,
  ShieldPlus, Footprints, CloudRain, Flashlight,
  Baby, PawPrint, Waves, Snowflake, Box,
  Plane, Flame, Wallet, AlertTriangle, TreePine, Fish,
} from 'lucide-react';

// ─── ICON COMPONENT TYPE ────────────────────────────────────────────────────
// Matches LucideIcon prop surface; also satisfied by custom SVG components.
export type SemanticIconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
  'aria-hidden'?: boolean | 'true' | 'false';
};

export type SemanticIcon = React.ComponentType<SemanticIconProps>;

// ─── CUSTOM SVG ICONS ───────────────────────────────────────────────────────
// Toothbrush — no equivalent in lucide-react; custom SVG represents Toiletries/Hygiene.
// Formerly defined inline in MobileFunctionalV3.tsx; centralised here.
export function ToothbrushIcon({
  size = 26,
  color = 'rgba(255,255,255,0.93)',
  strokeWidth = 1.5,
}: SemanticIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 21L14 10" />
      <path d="M12 8L16 4L21 9L17 13Z" />
      <path d="M14 6L19 11" />
    </svg>
  );
}

// ─── NORMALIZATION ──────────────────────────────────────────────────────────
/**
 * Normalise a category name for keyword matching:
 * - lowercase
 * - collapse extra whitespace
 * - normalise common separators (& / + →space, hyphens → space)
 * - strip leading/trailing punctuation
 */
function normalise(name: string): string {
  return name
    .toLowerCase()
    .replace(/[&/+]+/g, ' ')       // ampersand / slash / plus → space
    .replace(/-+/g, ' ')            // hyphens → space
    .replace(/\s+/g, ' ')           // collapse whitespace
    .trim();
}

// ─── SEMANTIC KEYWORD FAMILIES ──────────────────────────────────────────────
/**
 * Priority-ordered list. First match wins.
 *
 * ORDERING RULES:
 * 1. More specific compound phrases before their component words.
 * 2. Clothing BEFORE backpack/pack — prevents "Clothing Packed" → Backpack.
 * 3. Photography/Music BEFORE general Electronics — Camera/Headphones get distinct icons.
 * 4. Medical before Repair — prevents 'repair kit' matching 'kit' in medical (mitigated
 *    by not using bare 'kit' as a medical keyword).
 * 5. Specific before generic (e.g. Coffee before Kitchen).
 * 6. Misc / generic LAST.
 */
const ICON_FAMILIES: Array<{ keywords: string[]; icon: SemanticIcon }> = [

  // ── A. FOOTWEAR ─────────────────────────────────────────────────────────
  // Must precede Clothing so "Footwear" / "Shoes" get Footprints, not Shirt.
  {
    keywords: ['footwear', 'shoe', 'boot', 'sandal', 'sneaker', 'slipper', 'heel', 'cleat', 'loafer', 'moccasin'],
    icon: Footprints,
  },

  // ── B. RAIN GEAR ────────────────────────────────────────────────────────
  // Before Clothing so "Rain Gear" / "Rain Jacket" gets CloudRain.
  {
    keywords: ['rain gear', 'raingear', 'rain jacket', 'rain coat', 'raincoat', 'poncho', 'waterproof gear', 'gore tex', 'gore-tex'],
    icon: CloudRain,
  },

  // ── C. CLOTHING / APPAREL ───────────────────────────────────────────────
  // BEFORE backpack/pack family. "Clothing Packed" → 'cloth' matches here → Shirt.
  {
    keywords: [
      'cloth', 'shirt', 'pant', 'trouser', 'jacket', 'layer', 'apparel',
      'outfit', 'hat', 'glove', 'fleece', 'sweater', 'dress', 'skirt',
      'top', 'bottom', 'underwear', 'swimwear', 'wetsuit', 'insulation',
      'down jacket', 'scarf', 'formal', 'wardrobe', 'laundry', 'wear',
      'legging', 'shorts', 'sleeve', 'hoodie', 'vest', 'bra', 'sock',
    ],
    icon: Shirt,
  },

  // ── D. BACKPACK / OUTDOOR PACK ──────────────────────────────────────────
  // After Clothing — "Clothing Packed" already matched Clothing above.
  {
    keywords: ['backpack', 'rucksack', 'daypack', 'hiking pack', 'pack', 'trek', 'haversack'],
    icon: Backpack,
  },

  // ── E. SHELTER ──────────────────────────────────────────────────────────
  {
    keywords: ['tent', 'shelter', 'tarp', 'bivvy', 'bivy', 'hammock', 'canopy', 'camp'],
    icon: Tent,
  },

  // ── F. SLEEP SYSTEM ─────────────────────────────────────────────────────
  // 'bag' intentionally omitted — too generic. 'sleeping bag' compound is included.
  {
    keywords: ['sleep', 'sleeping', 'quilt', 'sleeping pad', 'sleeping bag', 'pad', 'pillow', 'bedding', 'duvet', 'comforter', 'rest'],
    icon: Moon,
  },

  // ── G. HYDRATION / WATER ────────────────────────────────────────────────
  {
    keywords: ['water', 'hydration', 'hydrat', 'drink', 'filter', 'purif', 'bottle', 'flask', 'reservoir', 'bladder', 'canteen'],
    icon: Droplets,
  },

  // ── H. LIGHTING ─────────────────────────────────────────────────────────
  // Before Electronics — prevents headlamp/lantern from resolving to Zap.
  {
    keywords: ['headlamp', 'lantern', 'flashlight', 'torch', 'glow stick', 'lighting', 'light kit', 'lamp kit', 'beacon'],
    icon: Flashlight,
  },

  // ── I. PHOTOGRAPHY / VISUAL MEDIA ───────────────────────────────────────
  // Before Electronics — Camera gets Camera icon, not Zap.
  {
    keywords: ['photo', 'camera', 'lens', 'tripod', 'videography', 'film gear', 'gallery', 'image', 'visual media'],
    icon: Camera,
  },

  // ── J. MUSIC / AUDIO ────────────────────────────────────────────────────
  // Before Electronics — Headphones / Speakers get Music, not Zap.
  {
    keywords: ['music', 'audio', 'headphone', 'speaker', 'instrument', 'earbud', 'podcast', 'earphone', 'amplifier'],
    icon: Music,
  },

  // ── K. NAVIGATION ───────────────────────────────────────────────────────
  {
    keywords: ['navig', 'compass', 'orienteer', 'topo', 'map', 'route', 'trail map', 'wayfind', 'gps device'],
    icon: Compass,
  },

  // ── L1. CHARGERS / CABLES / POWER ACCESSORIES ───────────────────────────
  // Before general Electronics — "Chargers & Cables" gets PlugZap, not Zap.
  // Duplicate-avoidance: Electronics → Zap; Chargers/Cables → PlugZap.
  {
    keywords: [
      'charger', 'charging cable', 'power cable', 'cable', 'plug', 'adapter',
      'connector', 'usb', 'hdmi', 'power strip', 'power bank', 'wall plug', 'inverter',
    ],
    icon: PlugZap,
  },

  // ── L2. ELECTRONICS / TECH ──────────────────────────────────────────────
  // Catch-all for tech after Photography/Music/Navigation/Chargers are separated.
  {
    keywords: [
      'electron', 'tech', 'device', 'solar panel', 'phone', 'laptop', 'tablet',
      'gadget', 'computer', 'smartphone', 'gps', 'battery pack',
      'satellite', 'solar', 'accessories tech',
    ],
    icon: Zap,
  },

  // ── M. TOILETRIES / HYGIENE ─────────────────────────────────────────────
  // Custom ToothbrushIcon — no adequate lucide equivalent.
  {
    keywords: [
      'toilet', 'hygiene', 'soap', 'toothbrush', 'dental', 'deodorant',
      'sanitizer', 'skincare', 'grooming', 'shampoo', 'razor', 'shaving',
      'hair care', 'comb', 'cosmetic', 'feminine', 'sunscreen', 'lotion',
      'insect repellent', 'repellent', 'personal care', 'wash kit', 'beauty',
      'body wash', 'conditioner', 'makeup', 'perfume', 'aftershave',
    ],
    icon: ToothbrushIcon,
  },

  // ── N. MEDICAL / FIRST AID ──────────────────────────────────────────────
  // ShieldPlus — distinct from Toiletries (Heart was reused before 027T).
  // 'kit' not used as a bare keyword — too generic and matches "Repair Kit".
  // 'med kit' (compound) catches "Med Kit" specifically.
  {
    keywords: [
      'medical', 'med kit', 'first aid', 'firstaid', 'pharma', 'prescription',
      'medication', 'medicine', 'pill', 'bandage', 'wound care', 'antiseptic',
      'gauze', 'blister', 'ppe', 'splint', 'clinic', 'healthcare', 'health care',
      'ibuprofen', 'aspirin', 'allergy', 'epinephrine', 'epipen', 'syringe',
      'thermometer kit', 'surgical', 'brace', 'stethoscope',
    ],
    icon: ShieldPlus,
  },

  // ── O. REPAIR ───────────────────────────────────────────────────────────
  {
    keywords: ['repair', 'fix', 'patch', 'tape', 'cordage', 'rope', 'duct tape', 'seam seal', 'maintain', 'maintenance kit'],
    icon: Wrench,
  },

  // ── P. WORKSHOP / HAND TOOLS ────────────────────────────────────────────
  {
    keywords: [
      'tool', 'toolbox', 'hammer', 'drill', 'screw', 'wrench', 'plier',
      'saw', 'measure', 'hardware', 'fastener', 'workshop', 'garage tools',
      'garden tool', 'power tool', 'hand tool', 'plumbing', 'electrical tool',
    ],
    icon: Hammer,
  },

  // ── Q. COFFEE / HOT DRINKS ──────────────────────────────────────────────
  // Before Kitchen/Food — 'brew'/'espresso'/'tea' get Coffee icon specifically.
  {
    keywords: ['coffee', 'cafe', 'brew', 'espresso', 'tea', 'hot drink', 'percolator'],
    icon: Coffee,
  },

  // ── R. FUEL / CONSUMABLES ───────────────────────────────────────────────
  {
    keywords: ['fuel', 'propane', 'canister', 'butane', 'stove fuel', 'ev charg', 'expendable', 'consumable'],
    icon: Flame,
  },

  // ── S. KITCHEN / COOKING / FOOD ─────────────────────────────────────────
  {
    keywords: [
      'cook', 'cooking', 'cookware', 'stove', 'kitchen', 'pot', 'pan',
      'utensil', 'meal', 'food', 'snack', 'eat', 'nutrition', 'calorie',
      'lunch', 'dinner', 'breakfast', 'spice', 'grocery', 'pantry',
      'ingredient', 'ration', 'freeze dried', 'dehydrated', 'kettle',
    ],
    icon: UtensilsCrossed,
  },

  // ── T. TRAVEL / LUGGAGE / SUITCASE ──────────────────────────────────────
  {
    keywords: ['suitcase', 'luggage', 'travel', 'trip', 'flight', 'airport', 'vacation', 'carry on', 'carry-on', 'holiday'],
    icon: Luggage,
  },

  // ── U. AIR / TRAIN TRAVEL ───────────────────────────────────────────────
  // More specific than Travel; 'plane' / 'rail' / 'transit' here.
  {
    keywords: ['plane', 'airline', 'air travel', 'train', 'rail', 'transit', 'bus trip'],
    icon: Plane,
  },

  // ── V. DOCUMENTS / IMPORTANT PAPERS ─────────────────────────────────────
  {
    keywords: [
      'document', 'passport', 'paper', 'permit', 'insurance', 'license',
      'visa', 'form', 'contract', 'receipt', 'ticket', 'reservation',
      'certificate', 'identification', 'id card',
    ],
    icon: FileText,
  },

  // ── W. MONEY / WALLET / KEYS ────────────────────────────────────────────
  {
    keywords: ['wallet', 'money', 'cash', 'credit card', 'key', 'lock', 'banknote', 'coin', 'purse', 'currency'],
    icon: Wallet,
  },

  // ── X. CAR / VEHICLE / ROAD TRIP ────────────────────────────────────────
  {
    keywords: ['car', 'vehicle', 'road trip', 'rv', 'camper', 'motorcycle', 'moto', 'roadside', 'auto kit', 'truck gear'],
    icon: Car,
  },

  // ── Y. BICYCLE / CYCLING ────────────────────────────────────────────────
  {
    keywords: ['bike', 'bicycle', 'cycl', 'mtb', 'velo', 'cycling'],
    icon: Bike,
  },

  // ── Z. MARINE / WATER SPORTS ────────────────────────────────────────────
  {
    keywords: ['kayak', 'canoe', 'sail', 'marine', 'anchor', 'boat', 'paddle', 'paddle board', 'snorkel', 'scuba', 'dive'],
    icon: Anchor,
  },

  // ── AA. WORK / BUSINESS ─────────────────────────────────────────────────
  {
    keywords: ['business', 'work', 'office', 'meeting', 'corporate', 'professional', 'briefcase', 'badge', 'presentation'],
    icon: Briefcase,
  },

  // ── AB. HOUSEHOLD / HOME ────────────────────────────────────────────────
  {
    keywords: [
      'home', 'house', 'household', 'bathroom', 'bedroom', 'living room',
      'dining', 'cleaning', 'appliance', 'linen', 'decor', 'utility',
      'furniture', 'kitchen home', 'garage home',
    ],
    icon: Home,
  },

  // ── AC. SPORTS / FITNESS ────────────────────────────────────────────────
  {
    keywords: [
      'fitness', 'exercise', 'gym', 'sport', 'workout', 'training', 'yoga',
      'run', 'athlet', 'climbing', 'climb', 'ski', 'skiing', 'snow sport',
      'trail running', 'crossfit', 'weight', 'lifting',
    ],
    icon: Dumbbell,
  },

  // ── AD. BOOKS / STUDY ───────────────────────────────────────────────────
  {
    keywords: ['book', 'read', 'journal', 'writing', 'study', 'kindle', 'magazine', 'education', 'school', 'learn', 'notebook'],
    icon: BookOpen,
  },

  // ── AE. EMERGENCY / PREPAREDNESS ────────────────────────────────────────
  {
    keywords: ['emergency', 'evacuation', 'evacu', 'siren', 'alert', 'disaster', 'preparedness', 'prepper', 'fire kit', 'emergency kit'],
    icon: AlertTriangle,
  },

  // ── AF. PETS / ANIMALS ──────────────────────────────────────────────────
  {
    keywords: ['dog', 'cat', 'pet', 'paw', 'leash', 'collar', 'animal', 'kennel', 'vet', 'bone', 'treat', 'litter', 'waste bag', 'fur'],
    icon: PawPrint,
  },

  // ── AG. KIDS / FAMILY / BABY ────────────────────────────────────────────
  {
    keywords: ['baby', 'child', 'kid', 'toddler', 'infant', 'stroller', 'diaper', 'nappy', 'toy', 'family', 'lunchbox', 'feeding'],
    icon: Baby,
  },

  // ── AH. BEACH / RECREATION ──────────────────────────────────────────────
  {
    keywords: ['beach', 'umbrella', 'sunglasses', 'sand', 'ocean beach', 'recreation', 'picnic', 'cooler', 'vacation gear', 'resort', 'surf'],
    icon: Waves,
  },

  // ── AI. COLD WEATHER / SEASONAL ─────────────────────────────────────────
  {
    keywords: ['winter', 'cold weather', 'cold gear', 'ice', 'frost', 'seasonal cold'],
    icon: Snowflake,
  },

  // ── AJ. MOVING / STORAGE / CONTAINERS ───────────────────────────────────
  {
    keywords: ['moving', 'storage', 'bin', 'tote', 'container', 'shelf', 'closet', 'cabinet', 'drawer', 'basement', 'attic', 'warehouse', 'relocat', 'archive'],
    icon: Box,
  },

  // ── AK. SHOPPING ────────────────────────────────────────────────────────
  {
    keywords: ['shop', 'store', 'market', 'purchase', 'buy', 'retail', 'souvenir', 'gift'],
    icon: ShoppingBag,
  },

  // ── AL. INTERNATIONAL / GLOBE ───────────────────────────────────────────
  {
    keywords: ['international', 'globe', 'world', 'abroad', 'overseas', 'global', 'foreign'],
    icon: Globe,
  },

  // ── AM. NATURE / FOREST / GARDEN ────────────────────────────────────────
  {
    keywords: ['forest', 'nature', 'garden', 'plant', 'tree', 'leaf', 'herb', 'botanical', 'foliage'],
    icon: TreePine,
  },

  // ── AN. FISHING / HUNTING ───────────────────────────────────────────────
  {
    keywords: ['fishing', 'fish', 'hunt', 'hunting', 'angling', 'angl', 'tackle'],
    icon: Fish,
  },

  // ── AO. MISCELLANEOUS / ACCESSORIES ─────────────────────────────────────
  // Semi-fallback: matches generic label words before the true fallback.
  {
    keywords: ['misc', 'miscellaneous', 'other', 'general', 'extra', 'accessory', 'accessories', 'sundry', 'mixed'],
    icon: Package,
  },
];

// ─── RESOLVER ───────────────────────────────────────────────────────────────
/**
 * Returns the best available semantic icon for a category name.
 *
 * @param name    - Raw category name (any case / punctuation).
 * @param _context - Reserved for future domain/context hints; ignored in 027T.
 * @returns A React component satisfying SemanticIconProps.
 */
export function getCategoryIcon(name: string, _context?: unknown): SemanticIcon {
  const norm = normalise(name);
  for (const { keywords, icon } of ICON_FAMILIES) {
    if (keywords.some(kw => norm.includes(kw))) return icon;
  }
  // True fallback — deterministic neutral icon.
  return Package;
}
