import { Router } from 'express';
import multer from 'multer';

/* eslint-disable @typescript-eslint/no-require-imports */
const { PDFParse } = require('pdf-parse') as { PDFParse: new (opts: { data: Buffer; verbosity?: number }) => { getText(): Promise<{ pages: { text: string }[]; text: string }> } };
const XLSX: typeof import('xlsx') = require('xlsx');
const mammoth: typeof import('mammoth') = require('mammoth');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const importGearRouter = Router();
export default importGearRouter;

// ── Shared types ──────────────────────────────────────────────────────────────

export interface ExtractedItem {
  sub: string;         // Type
  desc: string;        // Description
  weightOz: number;
  warning: boolean;
  warningMsg?: string;  // human-readable reason for the warning flag
  destination?: string; // category from section header (spreadsheets only)
}

// ── Normalisation helper ──────────────────────────────────────────────────────

/** Lowercase, trim, strip punctuation, collapse whitespace */
export function norm(v: unknown): string {
  return String(v ?? '')
    .toLowerCase()
    .replace(/[\r\n]+/g, ' ')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ── Weight parsing ────────────────────────────────────────────────────────────

export function parseWeightToOz(raw: string | number, unitHint = ''): { oz: number; warning: boolean } {
  const num = typeof raw === 'number' ? raw : parseFloat(String(raw ?? '').replace(/[^\d.]/g, ''));
  if (isNaN(num) || num <= 0) return { oz: 0, warning: true };

  const unit = norm(unitHint) || norm(String(raw));
  let oz: number;
  if (/^g(ram)?s?$/.test(unit))           oz = num / 28.3495;
  else if (/^(lb|lbs|pound|pounds)$/.test(unit)) oz = num * 16;
  else if (/^(kg|kgs|kilogram|kilograms)$/.test(unit)) oz = num * 35.274;
  else                                     oz = num; // oz / unknown → treat as oz
  oz = Math.round(oz * 100) / 100;
  return { oz, warning: oz <= 0 || oz > 700 };
}

// ── Text-based heuristic extraction (PDF / Word fallback) ─────────────────────

const WEIGHT_RE = /(\d+(?:\.\d+)?)\s*(oz|g(?:rams?)?|lbs?|pounds?|kg(?:s|ilograms?)?)(?=\b|\s|$)/i;
const SKIP_LINE_RE = /^(total|grand\s*total|base\s*weight|sub\s*total|sum\b|clothing\b|weight\b|type\b|description\b|category\b|item\b|gear\b|name\b|qty\b|quantity\b|#\b)/i;

export function extractFromText(text: string): ExtractedItem[] {
  const results: ExtractedItem[] = [];

  // Pre-process: normalise pipe separators that surround numbers/units
  // "Tent | 18.5 | oz"  →  "Tent 18.5 oz"
  const preprocessed = text
    .replace(/\|(\s*)(\d)/g, ' $2')   // "| 18.5" → " 18.5"
    .replace(/(\d)(\s*)\|/g, '$1 ');  // "18.5 |" → "18.5 "

  const rawLines = preprocessed.split(/[\r\n]+/).map(l => l.trim()).filter(l => l.length > 2);

  // Pre-pass: merge name-only lines with the weight-only line that follows
  // Handles two-line format:  "Tent\n18.5 oz"  →  "Tent 18.5 oz"
  const lines: string[] = [];
  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const hasWeight = WEIGHT_RE.test(line);
    if (!hasWeight && !SKIP_LINE_RE.test(line)) {
      const next = rawLines[i + 1];
      if (next) {
        const nextHasWeight  = WEIGHT_RE.test(next);
        // "weight-only" = after stripping the weight token, nothing non-punctuation remains
        const nextRemainder  = next.replace(WEIGHT_RE, '').replace(/[^\w]/g, '').trim();
        if (nextHasWeight && nextRemainder.length === 0) {
          lines.push(`${line} ${next}`);
          i++; // consume the weight line
          continue;
        }
      }
    }
    lines.push(line);
  }

  for (const line of lines) {
    if (SKIP_LINE_RE.test(line)) continue;
    const wm = line.match(WEIGHT_RE);
    if (!wm) continue;

    const val = parseFloat(wm[1]);
    const unit = wm[2].toLowerCase();
    let oz: number;
    if (unit.startsWith('g'))               oz = val / 28.3495;
    else if (unit.startsWith('lb') || unit.startsWith('pound')) oz = val * 16;
    else if (unit.startsWith('kg'))         oz = val * 35.274;
    else                                    oz = val;
    oz = Math.round(oz * 100) / 100;
    if (oz <= 0) continue;

    const rest = line
      .replace(wm[0], '')
      .replace(/\([^)]*\)/g, '')
      .replace(/[|,—–]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!rest) continue;

    let sub = '', desc = '';
    const parts = rest.split(/\t|  +|\s+-\s+/).map(p => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      sub  = parts[0].slice(0, 60);
      desc = parts.slice(1).join(' ').slice(0, 200);
    } else {
      const spIdx = rest.search(/\s/);
      if (spIdx > 0 && spIdx <= 20) {
        sub  = rest.slice(0, spIdx).slice(0, 60);
        desc = rest.slice(spIdx + 1).trim().slice(0, 200);
      } else {
        desc = rest.slice(0, 200);
      }
    }

    results.push({ sub, desc, weightOz: oz, warning: oz > 500 || (!desc && !sub) });
  }

  return results;
}

// ── TrailWeigh-specific PDF parser ────────────────────────────────────────────
//
// Understands the structured TrailWeigh PACK WEIGHT PDF format:
//   Category header row: "X CategoryName Description Weight Add Unit Qty"
//   Gear row:            "TRUE|FALSE Type Description... Weight Add [oz] [Qty]"
//   Stop condition:      any page containing "Meal Planner"
//
// Key insight: we use a GREEDY name capture `(.+)` so the regex engine finds
// the RIGHTMOST consecutive number pair — this is always (Weight, Add) even
// when the gear name contains a number (e.g. "Durston Wapta 30").
// We do NOT call applyGearClassification on PDF items because the PDF already
// provides explicit category context via the section header.
// ─────────────────────────────────────────────────────────────────────────────

const PDF_CATEGORY_NAMES: Record<string, string> = {
  'backpack':          'Backpack',
  'shelter':           'Shelter',
  'sleep':             'Sleep',
  'clothing packed':   'Clothing Packed',
  'kitchen':           'Kitchen',
  'electronics':       'Electronics',
  'toiletries + med':  'Toiletries + Med',
  'toiletries':        'Toiletries + Med',
  'hydration':         'Hydration',
  'clothing worn':     'Clothing Worn',
  'miscellaneous':     'Miscellaneous',
  'misc':              'Miscellaneous',
};

// Known gear type phrases — sorted longest-first so multi-word types are
// matched preferentially over single-word prefixes.
const PDF_TYPE_PHRASES: string[] = [
  'cold soak container', '1 gal freezer bag', '1 qrt freezer bag',
  'sleeping bag liner', 'bear canister', 'inflatable pad', 'trekking poles',
  'trekking pole', 'water bladder', 'water bottle', 'water filter',
  'sleeping bag', 'sleeping pad', 'ground sheet', 'puffy jacket',
  'down jacket', 'rain jacket', 'rain shell', 'wind jacket', 'wind shirt',
  'wind pants', 'puffy pants', 'puffy vest', 'tent stakes', 'tent stake',
  'stake bag', 'tent pole', 'down socks', 'down booties', 'down hood',
  'foam pad', 'sleep socks', 'neck warmer', 'neck gaiter', 'base layer',
  'mid layer', 'thermal pants', 'rain pants', 'pack liner', 'food bag',
  'bear bag', 'power bank', 'sun hat', 'bug bivy', 'bug net', 'head net',
  'repair kit', 'med kit', 'pot/mug', 'midlayer', 'windbreaker', 'poncho',
  'backpack', 'hammock', 'bivy', 'bivvy', 'tarp', 'tent', 'quilt', 'pillow',
  'stove', 'spoon', 'fuel', 'filter', 'headlamp', 'balaclava', 'beanie',
  'gloves', 'mittens', 'gaiters', 'shelter', 'sleep',
];

// Canonical category order as they appear in the TrailWeigh spreadsheet.
// Used to enforce forward-only category progression so the right-side summary
// table (which also has "X Backpack Description…" header rows) can't reset
// currentCategory backwards once we've already advanced past that section.
const PDF_CATEGORY_ORDER = [
  'Backpack', 'Shelter', 'Sleep', 'Clothing Packed',
  'Kitchen', 'Electronics', 'Toiletries + Med',
  'Hydration', 'Clothing Worn', 'Miscellaneous',
];

// Category header: must start with "X" (the TrailWeigh checkbox placeholder in the header row)
const PDF_CAT_HDR_RE = /^x\s+(backpack|shelter|sleep|clothing\s+packed|kitchen|electronics|toiletries(?:\s*\+\s*med)?|hydration|clothing\s+worn|miscellaneous|misc)\b/i;

// Lines to skip: totals, summary labels, column headers, nutrition
const PDF_SKIP_RE = /^(?:total|grand\s+total|base\s+weight|expendables|trip\s+total|sub\s+total|daily\s+average|calories|protein\b|fat\b|carbs?\b|description\b|weight\b|add\b|unit\b|qty\b|category\b|type\b|page\s*\d+|category\s+weight)/i;

// Category summary rows: "Backpack 0.875 lb", "Base Weight 4.6 lb" etc.
const PDF_SUMMARY_ROW_RE = /^(?:backpack|shelter|sleep|clothing(?:\s+(?:packed|worn))?|kitchen|electronics|toiletries|hydration|miscellaneous|misc|worn|base\s+weight|expendables|total)\s+[\d.]+\s*(?:lb|oz|g|kg)\b/i;

// Gear row: starts with TRUE or FALSE (possibly concatenated with type text,
// including types that start with a digit e.g. "FALSE1 Gal Freezer Bag").
const PDF_CHECKBOX_RE = /^(?:true|false)(?=[\s\dA-Za-z])/i;

// Gear row parser: GREEDY name match so the regex engine backtracks to find
// the RIGHTMOST Weight+Add number pair before the optional unit/qty/summary.
// Trailing summary columns like "Sleep 0.8125 lb" are absorbed by `(?:\s+[A-Za-z].*)?$`.
const PDF_ROW_RE = /^(.+)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s*(?:oz|g(?:rams?)?|lbs?|pounds?|kg(?:s|ilograms?)?)?(?:\s*\d+)?(?:\s+[A-Za-z].*)?$/i;

export function extractFromPdfPages(pages: { text: string }[]): ExtractedItem[] {
  const results: ExtractedItem[] = [];
  let currentCategory = '';
  // Track how far we've advanced through the canonical section order.
  // This prevents the right-side summary table (which also has "X Backpack
  // Description…" header rows) from resetting currentCategory backwards once
  // we've already moved past that section (e.g. Kitchen → Backpack regression).
  let currentCategoryIndex = -1;
  let reachedMealPlanner = false;

  for (const page of pages) {
    if (reachedMealPlanner) break;

    // Mark meal-planner boundary but still process lines before the heading
    if (/meal\s*planner/i.test(page.text)) reachedMealPlanner = true;

    const lines = page.text
      .split(/[\r\n]+/)
      .map(l => l.trim())
      .filter(l => l.length > 1);

    for (const line of lines) {
      // Hard stop at Meal Planner heading
      if (/^meal\s*planner\b/i.test(line)) break;

      // ── Category header detection (before checkbox check) ──────────────────
      const catMatch = PDF_CAT_HDR_RE.exec(line);
      if (catMatch) {
        const key = catMatch[1].toLowerCase().replace(/\s*\+\s*/g, ' + ').trim();
        const candidate = PDF_CATEGORY_NAMES[key] ?? '';
        const candidateIndex = PDF_CATEGORY_ORDER.indexOf(candidate);
        // Only advance — never go backwards (guards against summary-table headers)
        if (candidate && candidateIndex >= currentCategoryIndex) {
          currentCategory = candidate;
          currentCategoryIndex = candidateIndex;
        }
        continue;
      }

      // ── Skip non-gear lines ───────────────────────────────────────────────
      if (PDF_SKIP_RE.test(line))        continue;
      if (PDF_SUMMARY_ROW_RE.test(line)) continue;

      // ── Only process checkbox rows ────────────────────────────────────────
      if (!PDF_CHECKBOX_RE.test(line)) continue;

      // Strip the TRUE/FALSE prefix; handle concatenation ("FALSEPack Liner")
      const gearLine = line.replace(/^(?:true|false)\s*/i, '').trim();
      if (gearLine.length < 2) continue;

      // ── Parse name + weight ───────────────────────────────────────────────
      const m = PDF_ROW_RE.exec(gearLine);
      if (!m) continue;

      const nameText  = m[1].trim().replace(/\s+/g, ' ');
      const weightOz  = parseFloat(m[2]);

      if (!nameText || weightOz <= 0 || weightOz > 500) continue;

      // ── Split nameText into Type (sub) + Description (desc) ──────────────
      let sub  = '';
      let desc = '';
      const nameLower = nameText.toLowerCase();

      for (const phrase of PDF_TYPE_PHRASES) {
        if (nameLower === phrase || nameLower.startsWith(phrase + ' ')) {
          sub  = nameText.slice(0, phrase.length).trim();
          // Normalise capitalisation (e.g. "pack liner" → "Pack Liner")
          sub  = sub.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          desc = nameText.slice(phrase.length).trim();
          break;
        }
      }

      if (!sub) {
        // Unknown type — take the first word as sub-type
        const sp = nameText.search(/\s/);
        if (sp > 0) { sub = nameText.slice(0, sp); desc = nameText.slice(sp + 1).trim(); }
        else          desc = nameText;
      }

      results.push({
        sub:         sub.slice(0, 60),
        desc:        desc.slice(0, 200),
        weightOz:    Math.round(weightOz * 100) / 100,
        warning:     false,
        destination: currentCategory || undefined,
      });
    }
  }

  return results;
}

// ── Gear-type → canonical destination routing ─────────────────────────────────
//
// These sets drive Priority 1 (Consumables) and Priority 2 (Shelter / Sleep)
// in applyGearClassification.  A matching Type always wins over the source
// section header so that, e.g., a Tent listed under a "Sleep System" section
// still routes to "Shelter".
//
// Canonical destination strings match the app's DEFAULT_CATEGORY_ORDER names:
//   "Shelter", "Sleep", "Consumables", "Kitchen", etc.

/** Shelter gear — must always land in the Shelter category. */
export const SHELTER_TYPES = new Set([
  // Tents
  'tent', 'backpacking tent', 'freestanding tent', 'semi-freestanding tent',
  'trekking pole tent', 'trekking-pole tent', 'single-wall tent', 'double-wall tent',
  'net tent', 'inner tent', 'tent body',
  // Tarps
  'tarp', 'flat tarp', 'shaped tarp', 'pyramid tarp', 'hammock tarp',
  // Hammocks
  'hammock',
  // Bivies
  'bivy', 'bivvy', 'bug bivy',
  // Ground protection
  'groundsheet', 'ground sheet', 'ground cloth', 'groundcloth',
  'tent footprint', 'footprint', 'polycryo', 'polycro', 'tyvek groundsheet',
  // Fly / poles / stakes
  'rainfly', 'rain fly',
  'tent pole', 'tent poles', 'pole set', 'pole jack',
  'tent stake', 'tent stakes', 'stakes', 'stake', 'stake bag',
  // Suspension / rigging
  'guylines', 'guy lines', 'guyline', 'guy line', 'ridgeline',
  'hammock straps', 'tree straps', 'shelter suspension',
  // Bug protection
  'bug net', 'mosquito net',
]);

/** Sleep-system gear — must always land in the Sleep category. */
export const SLEEP_TYPES = new Set([
  // Insulation
  'sleeping bag', 'quilt', 'backpacking quilt', 'top quilt', 'underquilt',
  // Pads and mattresses
  'sleeping pad', 'sleep pad', 'inflatable pad', 'air pad', 'insulated pad',
  'foam pad', 'closed-cell foam pad', 'ccf pad', 'air mattress',
  // Pillow
  'pillow', 'inflatable pillow',
  // Liners and accessories
  'sleeping bag liner', 'sleep liner', 'sleeping liner',
  'quilt straps', 'pad straps', 'pump sack', 'pump bag', 'pad pump',
  // NOTE: wearable sleep clothing (sleep socks, down hood, etc.) lives in
  // CLOTHING_TYPES below — it routes to Clothing, not Sleep System.
]);

/**
 * Packed clothing — routes to "Clothing Packed".
 * Covers both sleep / camp clothing and trail / outdoor clothing that is
 * carried in the pack and put on as needed.
 * Items must never land in "Clothing Worn" unless the source section
 * explicitly identifies the row as worn clothing.
 */
export const CLOTHING_TYPES = new Set([
  // ── Sleep / camp clothing ─────────────────────────────────────────────────
  // Socks
  'sleep socks', 'sleeping socks', 'camp socks', 'insulated socks',
  'down socks', 'possum socks',
  // Headwear (sleep / camp)
  'down hood', 'sleeping hood', 'insulated hood',
  'balaclava', 'down balaclava', 'fleece balaclava',
  'beanie', 'warm hat',
  // Neck
  'neck gaiter',
  // Hands
  'gloves', 'mittens',
  // Shirts / tops (sleep / camp)
  'sleep shirt', 'sleeping shirt', 'camp shirt',
  'base layer', 'thermal top', 'long underwear',
  // Pants / bottoms (sleep / camp)
  'sleep pants', 'sleeping pants', 'camp pants', 'thermal bottom',
  // Full sleep clothes
  'sleep clothes', 'sleeping clothes',
  // Footwear (sleep / camp)
  'down booties', 'insulated booties', 'camp booties', 'camp shoes',
  // ── Outer / trail layers (packed, not worn continuously) ──────────────────
  // Rain / wind protection
  'rain jacket', 'rain shell', 'hardshell', 'hardshell jacket',
  'wind jacket', 'wind shell', 'windbreaker', 'wind shirt',
  // Insulating layers
  'down jacket', 'puffy', 'puffy jacket', 'puffy vest',
  'insulated jacket', 'synthetic jacket', 'fleece jacket', 'fleece vest',
  'midlayer', 'mid layer',
  // Bottoms
  'rain pants', 'rain shell pants', 'hardshell pants',
  'softshell pants', 'hiking pants', 'trail pants',
  // Sun protection
  'sun hat', 'sun hoody', 'sun hoodie',
  // Footwear (trail)
  'trail runners', 'trail shoes', 'approach shoes', 'gaiters', 'camp sandals',
]);

/**
 * Section headings that explicitly designate rows as "Clothing Worn".
 * When a source section matches these, the item keeps "Clothing Worn"
 * as its destination (unless overridden by a Consumables Type — nothing
 * else beats an explicit worn-clothing section).
 */
export const CLOTHING_WORN_SECTION_ALIASES = new Set([
  'clothing worn', 'worn clothing', 'worn', 'worn weight', 'worn items', 'wearing',
]);

// ── Consumables classification ────────────────────────────────────────────────

/** Section headings that map to the "Consumables" destination. */
export const CONSUMABLES_SECTION_ALIASES = new Set([
  'consumables', 'consumable', 'expendables', 'expendable',
  'consumable weight', 'expendable weight', 'trip consumables',
  'used up items', 'used-up items', 'perishables', 'food and fuel',
]);

/** Known consumable Types (normalized). Explicit source section takes priority. */
export const CONSUMABLES_TYPES = new Set([
  // Food and drinks
  'food', 'breakfast', 'lunch', 'dinner', 'meal', 'snack',
  'trail mix', 'energy bar', 'protein bar', 'meal bar', 'energy gel',
  'energy chews', 'jerky', 'nuts', 'dried fruit', 'candy', 'chocolate',
  'cheese', 'salami', 'tuna packet', 'salmon packet',
  'freeze-dried meal', 'dehydrated meal', 'cold-soak meal',
  'protein powder', 'protein shake', 'coffee', 'tea', 'drink mix',
  'electrolytes', 'electrolyte powder', 'electrolyte tablets',
  'olive oil', 'cooking oil', 'condiments', 'seasoning', 'spices',
  'salt', 'sugar', 'honey', 'maple syrup', 'powdered milk', 'powdered peanut butter',
  // Water and water treatment
  'water', 'drinking water', 'carried water', 'water treatment tablets',
  'purification tablets', 'chlorine dioxide tablets', 'iodine tablets',
  'water treatment drops', 'purification drops', 'chlorine dioxide drops', 'bleach drops',
  // Stove and fire
  'fuel', 'stove fuel', 'canister fuel', 'isobutane fuel', 'butane fuel',
  'propane fuel', 'alcohol fuel', 'denatured alcohol', 'white gas',
  'esbit', 'fuel tablet', 'solid fuel', 'matches', 'waterproof matches',
  'fire starter', 'tinder', 'lighter fuel', 'disposable lighter',
  // Skin, sun, insect
  'sunscreen', 'sunblock', 'mineral sunscreen', 'zinc sunscreen',
  'lip balm', 'lip sunscreen', 'bug spray', 'insect repellent',
  'picaridin', 'deet', 'permethrin spray', 'anti-chafe', 'chafing balm',
  'body glide', 'skin protectant', 'foot powder', 'lotion', 'moisturizer',
  'paw wax', 'foot balm',
  // Hygiene
  'toothpaste', 'tooth powder', 'toothpaste tablets', 'dental floss',
  'floss picks', 'hand sanitizer', 'soap', 'biodegradable soap', 'dish soap',
  'toilet paper', 'tissue', 'wet wipes', 'body wipes', 'cleaning wipes',
  'alcohol wipes', 'deodorant', 'shampoo', 'conditioner', 'contact solution',
  'menstrual products', 'tampons', 'pads', 'wag bag', 'waste bag', 'poop bag', 'pack-out bag',
  // Medical and first aid
  'medication', 'prescription medication', 'pain reliever', 'ibuprofen',
  'acetaminophen', 'aspirin', 'antihistamine', 'anti-diarrheal', 'antacid',
  'allergy medication', 'antibiotic', 'hydrocortisone', 'antibiotic ointment',
  'bandage', 'adhesive bandage', 'gauze', 'sterile pad', 'alcohol wipe',
  'antiseptic wipe', 'medical tape', 'athletic tape', 'leukotape',
  'kinesiology tape', 'kt tape', 'moleskin', 'blister pad', 'blister treatment',
  'hydrocolloid bandage', 'disposable gloves', 'oral rehydration salts',
  // Repair supplies
  'duct tape', 'gear tape', 'tenacious tape', 'dcf tape', 'repair tape',
  'patch', 'repair patch', 'sleeping-pad patch', 'tent patch', 'seam sealer',
  'seam sealant', 'fabric glue', 'super glue', 'adhesive', 'epoxy',
  'thread', 'zip tie', 'cable tie', 'rubber band', 'waterproofing treatment', 'shoe glue',
  // Disposable storage and packaging
  'freezer bag', 'ziploc bag', 'zip-top bag', 'plastic bag', 'grocery bag',
  'trash bag', 'garbage bag', 'litter bag', 'disposable meal bag', 'disposable food bag',
  'dog waste bag',
  // Batteries and chemical products
  'disposable battery', 'alkaline battery', 'lithium battery', 'coin battery',
  'button battery', 'aa battery', 'aaa battery', 'cr123 battery', 'cr2032 battery',
  'glow stick', 'chemical light', 'hand warmer', 'toe warmer',
  // Dog consumables
  'dog food', 'dog treats', 'dog snacks', 'dog water', 'dog medication',
  'flea treatment', 'tick treatment', 'flea and tick treatment', 'dog sunscreen',
  'dog wipes', 'dog poop bags', 'dog waste bags', 'dog electrolyte powder',
]);

/**
 * Normalise a section/destination name: if it is a recognised Consumables alias,
 * return "Consumables". Otherwise return it unchanged.
 */
export function normalizeDestination(destination: string): string {
  return CONSUMABLES_SECTION_ALIASES.has(norm(destination)) ? 'Consumables' : destination;
}

/**
 * Assign the canonical destination based on gear Type, then section.
 *
 * Priority order (per spec):
 *   1. Known Consumable Type            → "Consumables"      (beats everything)
 *   2. Known wearable sleep/camp Type   → "Clothing Packed"  (beats source section incl. Sleep System)
 *   3. Known Shelter Type               → "Shelter"          (beats source section)
 *   4. Known Sleep equipment Type       → "Sleep"            (beats source section)
 *   5. Source section is Clothing Worn alias → "Clothing Worn" (kept as-is)
 *   6. Source section is a Consumables alias → "Consumables"
 *   7. Source section kept as-is (user may change on review screen)
 *
 * `warning` is set when a Type-based override conflicts with the source section.
 * `warningMsg` carries a human-readable reason for display in the review screen.
 * The specific Type string is never changed — only Destination.
 */
export function applyGearClassification(item: ExtractedItem): ExtractedItem {
  const typeN = norm(item.sub);
  const destN = item.destination ? norm(item.destination) : '';

  /** True when source section differs from the canonical destination we're assigning. */
  const sectionConflict = (canonical: string) =>
    !!(item.destination && destN !== norm(canonical));

  // Priority 1: Consumable Type always wins (even over explicit Clothing Worn section).
  if (CONSUMABLES_TYPES.has(typeN)) {
    return { ...item, destination: 'Consumables', warning: item.warning || sectionConflict('Consumables') };
  }

  // Priority 2: Wearable sleep/camp clothing → "Clothing Packed".
  // This overrides any source section, including Sleep System sections.
  if (CLOTHING_TYPES.has(typeN)) {
    const conflict = sectionConflict('Clothing Packed');
    return {
      ...item,
      destination: 'Clothing Packed',
      warning: item.warning || conflict,
      warningMsg: conflict ? 'Wearable sleep item assigned to Clothing.' : item.warningMsg,
    };
  }

  // Priority 3: Shelter Type → "Shelter".
  if (SHELTER_TYPES.has(typeN)) {
    return { ...item, destination: 'Shelter', warning: item.warning || sectionConflict('Shelter') };
  }

  // Priority 4: Sleep equipment Type → "Sleep".
  if (SLEEP_TYPES.has(typeN)) {
    return { ...item, destination: 'Sleep', warning: item.warning || sectionConflict('Sleep') };
  }

  // Priority 5: Explicit Clothing Worn section → normalise to canonical "Clothing Worn".
  if (item.destination && CLOTHING_WORN_SECTION_ALIASES.has(destN)) {
    return { ...item, destination: 'Clothing Worn' };
  }

  // Priority 6: source section is a consumables alias → normalise.
  if (item.destination) {
    const normalized = normalizeDestination(item.destination);
    if (normalized !== item.destination) return { ...item, destination: normalized };
  }

  // Priority 7: keep source section or leave empty for manual selection.
  return item;
}

/** @deprecated Use applyGearClassification */
export const applyConsumablesClassification = applyGearClassification;

// ── Spreadsheet: detect section-header format ─────────────────────────────────
//
// A repeated section-header row looks like:
//   X | Backpack | Description | Weight | Add | Unit | Qty
//
// Detection: norm(row[2]) === 'description' AND norm(row[3]) matches /^(weight|wt)$/

function isSectionHeaderRow(row: unknown[]): boolean {
  return (
    norm(row[2]) === 'description' &&
    /^(weight|wt)$/.test(norm(row[3]))
  );
}

// Type aliases used in header detection
const TYPE_RE   = /^(type|gear type|item type|equipment type)$/;
const DESC_RE   = /^(description|item|item name|gear|gear item|product|product name|equipment|name)$/;
const WEIGHT_HDR_RE = /^(weight|item weight|gear weight|wt|ounces|oz|grams|pounds|lbs|kilograms|kg)$/;
const UNIT_RE   = /^(unit|weight unit|units)$/;

function detectCols(headerRow: unknown[]): {
  typeCol: number; descCol: number; weightCol: number; unitCol: number;
} {
  let typeCol = -1, descCol = -1, weightCol = -1, unitCol = -1;
  headerRow.forEach((h, i) => {
    const n = norm(h);
    if (typeCol   === -1 && TYPE_RE.test(n))        typeCol   = i;
    if (descCol   === -1 && DESC_RE.test(n))        descCol   = i;
    if (weightCol === -1 && WEIGHT_HDR_RE.test(n))  weightCol = i;
    if (unitCol   === -1 && UNIT_RE.test(n))        unitCol   = i;
  });
  return { typeCol, descCol, weightCol, unitCol };
}

// ── Section-mode extraction ───────────────────────────────────────────────────
//
// Used when repeated section-headers are detected.
// Processes only columns A–G (indices 0–6) to avoid right-side summary tables.

const MAX_GEAR_COL = 6; // G (index 6)

export function extractSectionMode(rows: unknown[][]): ExtractedItem[] {
  const results: ExtractedItem[] = [];

  let typeCol = -1, descCol = -1, weightCol = -1, unitCol = -1;
  let currentDestination = '';
  let inSection = false;

  for (const rawRow of rows) {
    // Only inspect cols A–G; ignore summary tables further right
    const row = (rawRow as unknown[]).slice(0, MAX_GEAR_COL + 1);

    // Skip entirely blank rows
    if (row.every(c => String(c ?? '').trim() === '')) continue;

    // ── Section header detection ──────────────────────────────────────────────
    if (isSectionHeaderRow(row)) {
      // col B (index 1) = destination category name; normalise consumables aliases
      currentDestination = normalizeDestination(String(row[1] ?? '').trim());
      inSection = true;

      // Dynamic column detection from this header row
      const detected = detectCols(row);

      // desc and weight are always at 2 and 3 in this format (checked above)
      descCol   = detected.descCol   !== -1 ? detected.descCol   : 2;
      weightCol = detected.weightCol !== -1 ? detected.weightCol : 3;
      unitCol   = detected.unitCol   !== -1 ? detected.unitCol   : 5;

      // Type: use alias match if found; otherwise the column just before desc
      typeCol = detected.typeCol !== -1 ? detected.typeCol : (descCol > 1 ? descCol - 1 : 1);

      continue; // don't import the header row as a gear item
    }

    if (!inSection) continue;
    if (typeCol === -1 || descCol === -1 || weightCol === -1) continue;

    const rawType   = String(row[typeCol]   ?? '').trim();
    const rawDesc   = String(row[descCol]   ?? '').trim();
    const rawWeight = row[weightCol];
    const rawUnit   = unitCol >= 0 ? String(row[unitCol] ?? '').trim() : '';

    // Skip blanks and boolean checkbox values
    if (!rawType || !rawDesc)           continue;
    if (/^(true|false)$/i.test(rawType)) continue;
    if (/^(true|false)$/i.test(rawDesc)) continue;

    // Skip total / summary rows
    if (/^(total|grand\s*total|sub\s*total)/i.test(rawType)) continue;
    if (/^(total|grand\s*total|sub\s*total)/i.test(rawDesc)) continue;
    // Skip if Weight cell contains non-numeric text like "Total"
    if (typeof rawWeight === 'string' && /[a-df-z]/i.test(rawWeight)) continue;

    // Parse numeric weight value
    const weightNum = typeof rawWeight === 'number'
      ? rawWeight
      : parseFloat(String(rawWeight ?? '').replace(/[^\d.]/g, ''));
    if (isNaN(weightNum) || weightNum <= 0) continue;

    // Convert to oz using the Unit column
    const { oz, warning } = parseWeightToOz(weightNum, rawUnit);

    results.push({
      sub:         rawType.slice(0, 60),
      desc:        rawDesc.slice(0, 200),
      weightOz:    oz,
      warning:     warning || oz > 500,
      destination: currentDestination,
    });
  }

  return results;
}

// ── Generic mode extraction ───────────────────────────────────────────────────
//
// Used when no repeated section headers are detected.
// Falls back to scanning the first header row for column aliases.

function extractGenericMode(rows: unknown[][]): ExtractedItem[] {
  const results: ExtractedItem[] = [];

  // Find the first row that looks like a header (has weight col at minimum)
  let headerIdx = -1;
  let typeCol = -1, descCol = -1, weightCol = -1, unitCol = -1;

  for (let r = 0; r < Math.min(rows.length, 10); r++) {
    const detected = detectCols(rows[r]);
    if (detected.weightCol !== -1) {
      headerIdx  = r;
      typeCol    = detected.typeCol;
      descCol    = detected.descCol;
      weightCol  = detected.weightCol;
      unitCol    = detected.unitCol;
      break;
    }
  }

  if (headerIdx === -1 || weightCol === -1) {
    // No structured headers — fall back to CSV text parsing
    // (Only used for spreadsheets; will be rare.)
    return [];
  }

  for (let r = headerIdx + 1; r < rows.length; r++) {
    const row = rows[r] as unknown[];
    const rawWeight = row[weightCol];
    if (rawWeight === '' || rawWeight == null) continue;

    const weightNum = typeof rawWeight === 'number'
      ? rawWeight
      : parseFloat(String(rawWeight ?? '').replace(/[^\d.]/g, ''));
    if (isNaN(weightNum) || weightNum <= 0) continue;

    const rawUnit = unitCol >= 0 ? String(row[unitCol] ?? '').trim() : '';
    const { oz, warning } = parseWeightToOz(weightNum, rawUnit);
    if (oz <= 0) continue;

    const sub  = typeCol  >= 0 ? String(row[typeCol]  ?? '').trim().slice(0, 60)  : '';
    let desc = '';
    if (descCol >= 0) {
      desc = String(row[descCol] ?? '').trim();
    } else {
      desc = (row as unknown[])
        .filter((_, i) => i !== typeCol && i !== weightCol && i !== unitCol)
        .map(v => String(v ?? '').trim())
        .filter(Boolean)
        .join(' ');
    }
    desc = desc.slice(0, 200);

    if (!desc && !sub) continue;
    if (/^(true|false)$/i.test(sub)) continue;

    results.push({ sub, desc, weightOz: oz, warning: warning || oz > 500 });
  }

  return results;
}

// ── Workbook dispatcher ───────────────────────────────────────────────────────

// Sheet names to skip entirely (case-insensitive)
const SKIP_SHEET_RE = /^meal\s*planner$/i;
// Preferred sheet names (match before others)
const PREFER_SHEET_RE = /pack\s*weight\s*checklist|pack\s*weight/i;

export function extractFromWorkbook(wb: ReturnType<typeof XLSX.read>): ExtractedItem[] {
  const results: ExtractedItem[] = [];

  // Choose which sheets to process
  let sheetsToProcess = wb.SheetNames.filter(n => !SKIP_SHEET_RE.test(n.trim()));

  // If a preferred sheet exists, process only that one
  const preferred = sheetsToProcess.find(n => PREFER_SHEET_RE.test(n.trim()));
  if (preferred) sheetsToProcess = [preferred];

  for (const sheetName of sheetsToProcess) {
    const sheet = wb.Sheets[sheetName];
    const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    if (rows.length < 2) continue;

    // Detect whether this sheet uses the repeated section-header layout
    const hasSectionHeaders = rows.some(row => isSectionHeaderRow(row as unknown[]));

    if (hasSectionHeaders) {
      results.push(...extractSectionMode(rows));
    } else {
      const generic = extractGenericMode(rows);
      if (generic.length > 0) {
        results.push(...generic);
      } else {
        // Last resort: CSV text parsing
        results.push(...extractFromText(XLSX.utils.sheet_to_csv(sheet)));
      }
    }
  }

  // Final pass: apply type-based canonical routing (Consumables → Shelter → Sleep → section)
  return results.map(applyGearClassification);
}

// ── Route ─────────────────────────────────────────────────────────────────────

importGearRouter.post('/import-gear', upload.single('file'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  const { mimetype, originalname, buffer } = req.file;
  const ext = (originalname.split('.').pop() ?? '').toLowerCase();

  try {
    let items: ExtractedItem[] = [];

    if (ext === 'pdf' || mimetype === 'application/pdf') {
      try {
        const inst = new PDFParse({ data: buffer, verbosity: 0 });
        const result = await inst.getText();
        // Use the structured TrailWeigh PDF parser (page-aware, category-aware).
        // Falls back to the generic text heuristic only if nothing was found,
        // e.g. a plain-text PDF without the TrailWeigh checkbox row format.
        items = extractFromPdfPages(result.pages);
        if (items.length === 0) {
          const flatText = result.pages.map((p: { text: string }) => p.text).join('\n');
          items = extractFromText(flatText);
        }
      } catch (pdfErr: any) {
        console.error('[import-gear] pdf-parse error:', pdfErr?.message);
        res.status(422).json({ error: 'Could not read this PDF. Make sure it is not password-protected and contains selectable text.' });
        return;
      }

    } else if (ext === 'docx' || ext === 'doc' || mimetype?.includes('wordprocessingml')) {
      const result = await mammoth.extractRawText({ buffer });
      items = extractFromText(result.value);

    } else if (['xlsx', 'xls', 'numbers'].includes(ext)) {
      const wb = XLSX.read(buffer, { type: 'buffer' });
      items = extractFromWorkbook(wb);

    } else {
      res.status(400).json({
        error: `Unsupported file type: .${ext}. Accepted formats: PDF, Word (.docx), Excel (.xlsx), or Numbers.`,
      });
      return;
    }

    // Deduplicate exact matches
    const seen = new Set<string>();
    const deduped = items.filter(it => {
      const key = `${it.sub}|${it.desc}|${it.weightOz}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    res.json({ items: deduped.slice(0, 200) });
  } catch (err: any) {
    console.error('[import-gear]', err);
    res.status(500).json({ error: err?.message ?? 'Failed to parse file' });
  }
});
