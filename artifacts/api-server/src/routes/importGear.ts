import { Router } from 'express';
import multer from 'multer';

/* eslint-disable @typescript-eslint/no-require-imports */
const { PDFParse } = require('pdf-parse') as { PDFParse: new (opts: { data: Buffer; verbosity?: number }) => { getText(): Promise<{ pages: { text: string }[]; text: string }>; destroy?(): void } };
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
  expendable?: boolean; // consumable/expendable status (CSV import)
  qty?: number;         // 024O: quantity / count (defaults to 1 when absent)
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

// Category header — two patterns, applied in order (first match wins):
//
// PRIMARY:  "X CategoryName Description …" or "CategoryName Description …"
//   Requires a column-header keyword (description / unit / qty / add) so that
//   summary rows ("Kitchen 0.2 lb") and standalone category words are ignored.
//   The "X" checkbox placeholder is optional because some PDF renderers place
//   it as a separate text element on its own line.
//
// FALLBACK: "X CategoryName" (no column keyword on same line)
//   Used when the PDF splits the header across two lines and only the checkbox
//   and category name appear together (column headers land on the next line).
//   The forward-only index guard still prevents summary-table "X Backpack"
//   lines from overriding a later section.
const PDF_CAT_HDR_RE  = /^(?:x\s+)?(backpack|shelter|sleep|clothing\s+packed|kitchen|electronics|toiletries(?:\s*\+\s*med)?|hydration|clothing\s+worn|miscellaneous|misc)\s+(?:description|unit\b|qty\b|add\b)/i;
const PDF_CAT_HDR_X_RE = /^x\s*(backpack|shelter|sleep|clothing\s+packed|kitchen|electronics|toiletries(?:\s*\+\s*med)?|hydration|clothing\s+worn|miscellaneous|misc)\b/i;

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

// Types that are always Expendables regardless of which PDF section they appear in.
const PDF_EXPENDABLES_TYPES = new Set(['fuel', 'stove fuel', 'canister fuel', 'isobutane', 'alcohol fuel', 'denatured alcohol']);


export function extractFromPdfPages(pages: { text: string }[]): ExtractedItem[] {
  const results: ExtractedItem[] = [];
  let currentCategory = '';
  // Track how far we've advanced through the canonical section order.
  // This prevents the right-side summary table (which also has "X Backpack
  // Description…" header rows) from resetting currentCategory backwards once
  // we've already moved past that section (e.g. Kitchen → Backpack regression).
  let currentCategoryIndex = -1;
  let reachedMealPlanner = false;
  // 024M fix B: tracks a checkbox-only line whose gear data appears on the very
  // next line because the PDF text extractor split the row across two chunks.
  // Always reset at page boundaries and at any line that cannot be a continuation.
  let pendingOrphanedCheckbox = false;

  for (const page of pages) {
    if (reachedMealPlanner) break;
    pendingOrphanedCheckbox = false; // never carry orphan state across page boundaries

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
      const catMatch = PDF_CAT_HDR_RE.exec(line) ?? PDF_CAT_HDR_X_RE.exec(line);
      if (catMatch) {
        pendingOrphanedCheckbox = false; // category boundary is never a split-row continuation
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
      if (PDF_SKIP_RE.test(line))        { pendingOrphanedCheckbox = false; continue; }
      if (PDF_SUMMARY_ROW_RE.test(line)) { pendingOrphanedCheckbox = false; continue; }

      // ── Only process checkbox rows (or continuations of split rows) ────────
      // A checkbox line is either the normal concatenated form ("FALSEPack Liner…")
      // OR a bare "FALSE"/"TRUE" with nothing following — the lookahead in
      // PDF_CHECKBOX_RE requires a character after the keyword, so bare lines
      // need a separate test (024M fix B — root cause of missing Puffy Pants).
      const isCheckboxLine = PDF_CHECKBOX_RE.test(line) || /^(?:true|false)\s*$/i.test(line);
      let gearLine: string;
      if (isCheckboxLine) {
        pendingOrphanedCheckbox = false;
        const stripped = line.replace(/^(?:true|false)\s*/i, '').trim();
        if (stripped.length < 2) {
          // 024M fix B: checkbox with no gear text on the same line — the actual
          // row data appears on the very next PDF text-extraction chunk.
          // Example: "FALSE" alone on P1:31, then "Puffy Pants … 5.5 0" on P1:32.
          pendingOrphanedCheckbox = true;
          continue;
        }
        gearLine = stripped;
      } else if (pendingOrphanedCheckbox) {
        // 024M fix B: this line is the gear-data continuation of a split row.
        pendingOrphanedCheckbox = false;
        if (line.length < 2) continue;
        gearLine = line; // already trimmed by the pre-loop .map(l => l.trim())
      } else {
        continue; // not a checkbox row and no pending split-row continuation
      }

      // ── Parse name + weight ───────────────────────────────────────────────
      const m = PDF_ROW_RE.exec(gearLine);
      let nameText: string;
      let weightOz: number;

      if (m) {
        nameText = m[1].trim().replace(/\s+/g, ' ');
        weightOz = parseFloat(m[2]);
        if (!nameText || weightOz <= 0 || weightOz > 500) continue;
      } else {
        // 024M fix A: weight-less fallback — rows where Weight is blank but
        // Type holds a meaningful item label (e.g. "Headphones 0", "Floss 0").
        // The trailing integer is the Add/qty column value (always 0 here).
        const noWtMatch = /^(.+?)\s+\d+$/.exec(gearLine) ?? /^(.+)$/.exec(gearLine);
        if (!noWtMatch) continue;
        nameText = noWtMatch[1].trim().replace(/\s+/g, ' ');
        if (!nameText || nameText.length < 2) continue;
        weightOz = 0; // item has no weight; allow it through
      }

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

      // ── Explicit overrides (applied after PDF section category) ───────────
      // Fuel is always Expendables regardless of which section it appears in.
      const destination = PDF_EXPENDABLES_TYPES.has(sub.toLowerCase())
        ? 'Expendables'
        : (currentCategory || undefined);

      const item: ExtractedItem = {
        sub:      sub.slice(0, 60),
        desc:     desc.slice(0, 200),
        weightOz: Math.round(weightOz * 100) / 100,
        warning:  false,
        destination,
      };

      results.push(item);
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
  // Bug protection (worn/carried clothing, not shelter structure)
  'bug net', 'head net', 'mosquito net', 'mosquito head net',
]);

/**
 * 024P: Broad apparel/footwear/headwear pattern for worn-routing gate.
 * Used when the item's type is not in CLOTHING_TYPES but is clearly apparel
 * (e.g. "Hiking Shirt" is not in the specific CLOTHING_TYPES set).
 * Only applies when an explicit Worn signal is present.
 */
const APPAREL_WORD_RE = /\b(shirt|tee|t-shirt|shorts|pants|tights|leggings|dress|skirt|socks?|hat|cap|beanie|jacket|hoody|hoodie|sweater|jersey|top|bra|underwear|boots?|shoes?|sneakers?|runners?|sandals?|gaiters?|gloves?|mittens?|vest)\b/i;

/**
 * 024S: Vague/umbrella source-group labels treated as WEAK hints during automatic
 * CSV/XLSX import.  When an item is confidently recognised by a type set, its
 * normal TrailWeigh destination overrides these labels.  Unrecognised items keep
 * the vague group so they are not lost.  Has no effect on saved lists.
 */
export const WEAK_SOURCE_GROUPS = new Set([
  'big three', 'big 3', 'big four', 'big 4',
  'bits', 'misc', 'misc.', 'miscellaneous',
  'stuff', 'odds & ends', 'odds and ends',
]);

/** Pack / carry system — routes to "Backpack". */
export const PACK_TYPES = new Set([
  // Generic / compound backpack phrases (exact phrase match — NOT a substring rule)
  'backpack', 'trail backpack', 'hiking backpack', 'ultralight backpack',
  'main backpack', 'overnight backpack', 'frameless backpack',
  // "Pack" as a standalone item type or with common backpack qualifiers
  'pack', 'trail pack', 'hiking pack', 'ultralight pack',
  'overnight pack', 'frameless pack', 'day pack', 'daypack',
  // Classic synonyms
  'rucksack',
  // Note: 'dog pack' / 'dog backpack' / 'fanny pack' / 'hip pack' / 'battery pack' /
  //       'pack towel' intentionally excluded — those use source category or separate routing.
]);

/** Electronics / navigation — routes to "Electronics". */
export const ELECTRONICS_TYPES = new Set([
  'headlamp', 'lantern', 'flashlight', 'torch',
  'gps', 'gps device', 'gps watch', 'watch',
  'satellite communicator', 'spot messenger', 'emergency beacon', 'epirb', 'plb',
  'power bank', 'battery bank', 'portable charger', 'external battery',
  'solar panel', 'solar charger',
  'camera', 'action camera',
  'two-way radio', 'walkie-talkie',
  'e-reader', 'kindle',
  'usb cable', 'charging cable', 'power adapter', 'wall adapter',
]);

/** Personal care / toiletries (non-consumable) — routes to "Personal". */
export const PERSONAL_TYPES = new Set([
  'toothbrush', 'electric toothbrush',
  'hairbrush', 'hair brush', 'comb',
  'mirror', 'compact mirror',
  'nail clippers', 'nail file',
  'razor', 'disposable razor', 'safety razor',
  'ear plugs', 'earplugs',
  'eye mask', 'sleep mask',
  'trowel', 'cathole trowel',
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
  // No sectionConflict warning here: the type match is definitive (Fuel is always
  // Consumables regardless of which section the spreadsheet placed it in), so a
  // mismatch between the source section and "Consumables" is not actionable for the user.
  if (CONSUMABLES_TYPES.has(typeN)) {
    return { ...item, destination: 'Consumables', warning: item.warning };
  }

  // Priority 2: Wearable sleep/camp clothing → "Clothing Packed".
  // This overrides any source section, including Sleep System sections.
  // 024P exception: if the import path already resolved destination to a Clothing Worn
  // alias (from an explicit Worn column / Status column / Subcategory), preserve it.
  if (CLOTHING_TYPES.has(typeN)) {
    if (CLOTHING_WORN_SECTION_ALIASES.has(destN)) {
      return { ...item, destination: 'Clothing Worn', warning: item.warning };
    }
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

  // Priority 6b: Pack type → "Backpack" (canonical TrailWeigh category label).
  if (PACK_TYPES.has(typeN)) {
    return { ...item, destination: 'Backpack', warning: item.warning || sectionConflict('Backpack') };
  }

  // Priority 6c: Electronics type → "Electronics".
  if (ELECTRONICS_TYPES.has(typeN)) {
    return { ...item, destination: 'Electronics', warning: item.warning || sectionConflict('Electronics') };
  }

  // Priority 6d: Personal-care type → "Personal".
  if (PERSONAL_TYPES.has(typeN)) {
    return { ...item, destination: 'Personal', warning: item.warning || sectionConflict('Personal') };
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

// 024O: expanded column-header aliases for spreadsheet detection
const TYPE_RE       = /^(type|gear type|item type|equipment type|item name|name|gear|item|gear item|equipment|product|product name)$/;
const DESC_RE       = /^(description|notes|details)$/;
const WEIGHT_HDR_RE = /^(weight|item weight|gear weight|wt|mass|ounces|oz|grams|pounds|lbs|kilograms|kg)$/;
const UNIT_RE       = /^(unit|units|weight unit|weightunit)$/;
const QTY_HDR_RE    = /^(quantity|qty|count|#)$/;
const CAT_HDR_RE    = /^(category|section|group|system)$/;
const SUBCAT_HDR_RE = /^(subcategory|sub category|sub-category)$/; // 024P
// 024R: dedicated product-name column headers (separate from TYPE/DESC)
const NAME_HDR_RE   = /^(product|product name|model|item model)$/;
// 024R: obvious status/metadata strings that must NOT become the visible Name field.
// Conservative — only anchored, well-known patterns from the prompt spec.
const STATUS_DESC_RE = /^(?:worn\b|carried\b|consumable\b|reusable\b|pair\s+weight\b|three\s+daily\s+portions?\b|quantity\s*[><=]|quantity\s+\w|generic\s+category\b|metric\s+decimal\b|same\s+mass\b|blank\s+weight\b|true\b|false\b|yes\b|no\b)/i;

// ── 024W: Conservative product-identity fallback ─────────────────────────────
//
// When no dedicated Product/Model column exists, a Description cell may be used
// as NAME only when it strongly resembles a manufacturer/model identity.
// Strategy: prefer false-negatives over false-positives — when uncertain, blank.

/** Measurement unit adjacent to a digit — strong spec/capacity signal. */
const SPEC_UNIT_IN_DESC_RE = /\d\s*(?:oz|g|kg|lb|lbs|ml|mAh|Ah|mm|cm|inch|inches|ft|degree|°|kcal|cal\b)|\d\s*[lL]\b/i;

/** Common generic first-word patterns — product attributes/descriptions, not brand identity. */
const GENERIC_LEAD_DESC_RE = /^(?:single|inflatable|main|three|small|canister|travel|collapsible|folding|lightweight|budget|standard|regular|synthetic|ripstop|rechargeable|expendable|spare|down\b)/i;

/**
 * Alphanumeric model tokens (letters+digits merged, or mixed-case inside a word).
 * Examples accepted: NB10000, inReach, NeoAir, XLite, NXT, pH2O, Kakwa55
 */
const MODEL_TOKEN_RE = /[A-Za-z][A-Za-z]*\d+[A-Za-z0-9]*|[a-z][A-Z][a-zA-Z]*|[A-Z]{2,}[a-z][a-zA-Z]*/;

/**
 * 024W: Returns true when a source Description value is likely a real
 * product/manufacturer/model identity worth placing in the NAME field.
 *
 * Priority: dedicated Product/Model columns always win — this is only called
 * as a fallback when no dedicated product-identity column exists.
 * When uncertain → return false → NAME stays blank.
 */
function isLikelyProductIdentityFallback(desc: string): boolean {
  if (!desc || desc.length < 4) return false;

  // Reject specs starting with a digit: "40 L", "110 g", "10,000 mAh", "1 L bottle"
  if (/^\d/.test(desc)) return false;

  // Reject when a measurement unit appears next to a number inside the string
  if (SPEC_UNIT_IN_DESC_RE.test(desc)) return false;

  // Reject known status/metadata patterns (reusable, worn, carried, pair weight, …)
  if (STATUS_DESC_RE.test(desc)) return false;

  // Reject common generic first-word adjectives/nouns (single-wall, inflatable, main, …)
  if (GENERIC_LEAD_DESC_RE.test(desc)) return false;

  // Accept: contains a model-number token (NB10000, inReach, NeoAir, XLite, NXT)
  if (MODEL_TOKEN_RE.test(desc)) return true;

  // Accept: at least two words both starting with an uppercase letter → "Brand Model"
  // Examples: Zpacks Duplex, Durston Kakwa 55, Altra Lone Peak 8, Sawyer Squeeze
  const tokens = desc.trim().split(/\s+/);
  if (
    tokens.length >= 2 &&
    /^[A-Z]/.test(tokens[0]) &&
    /^[A-Z]/.test(tokens[1])
  ) {
    return true;
  }

  // Conservative default: leave blank when uncertain
  return false;
}

function detectCols(headerRow: unknown[]): {
  typeCol: number; descCol: number; nameCol: number; weightCol: number; unitCol: number;
  qtyCol: number; catCol: number; subcatCol: number;
} {
  let typeCol = -1, descCol = -1, nameCol = -1, weightCol = -1, unitCol = -1;
  let qtyCol = -1, catCol = -1, subcatCol = -1;
  headerRow.forEach((h, i) => {
    const n = norm(h);
    if (typeCol   === -1 && TYPE_RE.test(n))        typeCol   = i;
    if (descCol   === -1 && DESC_RE.test(n))        descCol   = i;
    // 024R: dedicated product-name columns (captured independently of typeCol so
    // a file with both "Type" and "Product" populates typeCol AND nameCol separately)
    if (nameCol   === -1 && NAME_HDR_RE.test(n))    nameCol   = i;
    if (weightCol === -1 && WEIGHT_HDR_RE.test(n))  weightCol = i;
    if (unitCol   === -1 && UNIT_RE.test(n))        unitCol   = i;
    if (qtyCol    === -1 && QTY_HDR_RE.test(n))     qtyCol    = i;
    if (catCol    === -1 && CAT_HDR_RE.test(n))     catCol    = i;
    if (subcatCol === -1 && SUBCAT_HDR_RE.test(n))  subcatCol = i;
  });
  return { typeCol, descCol, nameCol, weightCol, unitCol, qtyCol, catCol, subcatCol };
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
  // 024O: also detect category and quantity columns; 024P: subcategory column
  let typeCol = -1, descCol = -1, nameCol = -1, weightCol = -1, unitCol = -1;
  let qtyCol = -1, catCol = -1, subcatCol = -1;

  for (let r = 0; r < Math.min(rows.length, 10); r++) {
    const detected = detectCols(rows[r]);
    if (detected.weightCol !== -1) {
      headerIdx  = r;
      typeCol    = detected.typeCol;
      descCol    = detected.descCol;
      nameCol    = detected.nameCol;
      weightCol  = detected.weightCol;
      unitCol    = detected.unitCol;
      qtyCol     = detected.qtyCol;
      catCol     = detected.catCol;
      subcatCol  = detected.subcatCol;
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
    } else if (typeCol < 0) {
      // No identity column found — scrape remaining non-key cells for a label
      desc = (row as unknown[])
        .filter((_, i) => i !== weightCol && i !== unitCol && i !== qtyCol && i !== catCol)
        .map(v => String(v ?? '').trim())
        .filter(Boolean)
        .join(' ');
    }
    desc = desc.slice(0, 200);

    if (!desc && !sub) continue;
    if (/^(true|false)$/i.test(sub)) continue;

    // 024O: category and quantity from newly detected columns
    const cat = catCol >= 0 ? String(row[catCol] ?? '').trim() : '';
    const rawQtyCell = qtyCol >= 0 ? row[qtyCol] : null;
    const qty = typeof rawQtyCell === 'number' && rawQtyCell > 0
      ? Math.round(rawQtyCell)
      : Math.max(1, parseInt(String(rawQtyCell ?? ''), 10) || 1);

    // 024P: worn signals for XLSX — Subcategory column and leading "Worn" in description.
    // Signal D uses the raw desc (before any 024R name filtering) so worn routing is preserved.
    const subcatRaw = subcatCol >= 0 ? String(row[subcatCol] ?? '').trim() : '';
    const isExplicitlyWorn =
      CLOTHING_WORN_SECTION_ALIASES.has(norm(subcatRaw)) ||
      /^worn\b/i.test(desc.trim());
    const isClothingType = CLOTHING_TYPES.has(norm(sub)) || APPAREL_WORD_RE.test(sub);
    // 024S: strip vague/umbrella source-group labels before passing as destination hint.
    const effectiveCat = WEAK_SOURCE_GROUPS.has(norm(cat)) ? '' : cat;
    const finalDest = (isExplicitlyWorn && isClothingType) ? 'Clothing Worn' : (effectiveCat || undefined);

    // 024R/024V/024W: prefer dedicated product-name column (nameCol) for the Name field.
    // nameCol is a separate column from typeCol; when both exist the product column wins.
    // 024W: when no dedicated product-identity column exists, apply the conservative
    // Description fallback — accepts brand/model-style values, rejects specs/status/notes.
    if (nameCol >= 0 && nameCol !== typeCol) {
      const nameCell = String(row[nameCol] ?? '').trim();
      desc = (nameCell && !STATUS_DESC_RE.test(nameCell)) ? nameCell : '';
    } else {
      desc = isLikelyProductIdentityFallback(desc) ? desc : '';
    }
    desc = desc.slice(0, 200);

    results.push({ sub, desc, weightOz: oz, warning: warning || oz > 500, destination: finalDest, qty });
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

// ── CSV parsing ───────────────────────────────────────────────────────────────

// 024O: expanded aliases for common external pack-list / spreadsheet headers.
/** Column heading aliases → canonical field name */
const CSV_COL_ALIASES: Record<string, string[]> = {
  category:    ['category', 'section', 'group', 'system'],
  subcategory: ['subcategory', 'sub category'],
  // Item-identity headers map to TrailWeigh "Type" (sub field), not Description
  type:        ['type', 'item name', 'name', 'gear', 'item', 'gear item', 'equipment'],
  // 024R: dedicated product-name headers populate the Name (desc) field, not Type
  productname: ['product', 'product name', 'model', 'item model'],
  description: ['description', 'notes', 'details'],
  qty:         ['quantity', 'qty', 'count', '#'],
  weight:      ['weight', 'wt', 'mass'],
  unit:        ['unit', 'units', 'weight unit', 'weightunit'],
  worn:        ['worn', 'status'],   // 024P: 'status' column covers "status = worn"
  expendable:  ['consumable', 'expendable'],
};

function mapCsvHeader(h: string): string | null {
  const n = h.toLowerCase().trim();
  for (const [field, aliases] of Object.entries(CSV_COL_ALIASES)) {
    if (aliases.includes(n)) return field;
  }
  return null;
}

function parseCsvBool(val: string): boolean | null {
  const v = val.toLowerCase().trim();
  if (['true', 'yes', '1'].includes(v)) return true;
  if (['false', 'no', '0'].includes(v)) return false;
  return null; // unrecognised — don't fail the import
}

/**
 * RFC 4180-compatible CSV parser.
 * Handles: quoted fields, embedded commas, escaped quotes (""), CRLF/LF.
 * Returns an array of rows; blank rows are omitted.
 */
function parseCsvRows(text: string): string[][] {
  const result: string[][] = [];
  const input = text.replace(/\r\n?/g, '\n');
  let pos = 0;

  while (pos < input.length) {
    const row: string[] = [];

    while (pos < input.length && input[pos] !== '\n') {
      let field = '';

      if (input[pos] === '"') {
        // Quoted field
        pos++; // skip opening quote
        while (pos < input.length) {
          if (input[pos] === '"') {
            if (input[pos + 1] === '"') {
              field += '"';     // escaped quote
              pos += 2;
            } else {
              pos++;            // closing quote
              break;
            }
          } else {
            field += input[pos++];
          }
        }
        // Advance past any trailing whitespace to the next delimiter
        while (pos < input.length && input[pos] !== ',' && input[pos] !== '\n') pos++;
      } else {
        // Unquoted field
        while (pos < input.length && input[pos] !== ',' && input[pos] !== '\n') {
          field += input[pos++];
        }
      }

      row.push(field.trim());
      if (pos < input.length && input[pos] === ',') pos++; // consume comma
    }
    if (pos < input.length) pos++; // consume newline

    if (row.some(f => f)) result.push(row); // skip blank rows
  }

  return result;
}

/**
 * 024O: Tabular-path weight parser.
 * Extends parseWeightToOz with support for compound "X lb Y oz" strings
 * (e.g. "1 lb 10 oz" = 26 oz) that appear in real-world spreadsheet lists.
 * All other forms are delegated to parseWeightToOz unchanged.
 */
function parseTabularWeight(raw: string | number, unitHint: string): { oz: number; warning: boolean } {
  if (typeof raw === 'string') {
    const compound = /(\d+(?:\.\d+)?)\s*lbs?\s+(\d+(?:\.\d+)?)\s*oz/i.exec(raw);
    if (compound) {
      const oz = parseFloat(compound[1]) * 16 + parseFloat(compound[2]);
      return { oz: Math.round(oz * 100) / 100, warning: oz <= 0 || oz > 700 };
    }
  }
  return parseWeightToOz(raw, unitHint);
}

/**
 * Parse a CSV buffer into ExtractedItems.
 * Throws a user-facing error (with .statusCode) on unrecoverable problems.
 */
function parseCsvItems(buffer: Buffer): ExtractedItem[] {
  const text = buffer.toString('utf-8');
  const rows = parseCsvRows(text);

  if (rows.length < 1) {
    const err: any = new Error('The CSV file appears to be empty.');
    err.code = 'csv_empty'; err.statusCode = 422;
    throw err;
  }

  // 024O: Scan the first CSV_HDR_SCAN rows to find the best header row.
  // A valid header must contain at least one item-identity field (type or description)
  // plus any other recognised field. This lets a title row above the real table
  // header pass through without failing the import (e.g. "MY 2026 THRU-HIKE PACK LIST").
  const CSV_HDR_SCAN = 20;
  let headerIdx = 0;
  let bestScore  = 0;
  for (let r = 0; r < Math.min(rows.length, CSV_HDR_SCAN); r++) {
    let score = 0;
    let hasIdentity = false;
    for (const cell of rows[r]) {
      const field = mapCsvHeader(cell);
      if (field) {
        score++;
        // 024R: productname also qualifies as an identity field
        if (field === 'type' || field === 'description' || field === 'productname') hasIdentity = true;
      }
    }
    if (hasIdentity && score > bestScore) {
      bestScore = score;
      headerIdx = r;
    }
  }

  // Map header row → column indices
  const headers = rows[headerIdx];
  const colMap: Partial<Record<string, number>> = {};
  headers.forEach((h, i) => {
    const field = mapCsvHeader(h);
    if (field !== null && !(field in colMap)) colMap[field] = i;
  });

  // 024O/024R: Accept files where the identity column maps to 'type', 'description',
  // or the dedicated product-name field ('productname').
  if (colMap['description'] === undefined && colMap['type'] === undefined && colMap['productname'] === undefined) {
    const err: any = new Error(
      'TrailWeigh could not identify an Item / Description / Gear column in this CSV. ' +
      'Make sure the header row includes one of: Type, Name, Item, Description, or Gear.',
    );
    err.code = 'csv_no_description_col'; err.statusCode = 422;
    throw err;
  }

  const items: ExtractedItem[] = [];

  for (let r = headerIdx + 1; r < rows.length; r++) {
    const row = rows[r];
    const get = (field: string): string => {
      const idx = colMap[field];
      return idx !== undefined ? (row[idx] ?? '').trim() : '';
    };

    // 024O: item identity column may be 'type' (Name/Gear/Item) or 'description'.
    const typeRaw    = get('type');
    const descRaw    = get('description');
    const nameRaw    = get('productname'); // 024R: dedicated product/model/name column

    // Skip rows with no identity at all
    if (!typeRaw && !descRaw && !nameRaw) continue;

    // Skip summary / total rows regardless of which column they appear in
    if (/^(total|grand\s*total|sub\s*total)\b/i.test(typeRaw) ||
        /^(total|grand\s*total|sub\s*total)\b/i.test(descRaw)) continue;

    // 024R/024V/024W: Name (desc) priority:
    //   1. Dedicated product-name column (Product / Model / Item Model) if present and not
    //      status text, AND only when typeRaw is also present (if typeRaw is absent, nameRaw
    //      serves as item identity/Type and must not also appear in the Name field).
    //   2. 024W: Description/Notes as conservative fallback — only when it passes
    //      isLikelyProductIdentityFallback (brand/model heuristic). Spec, status, and
    //      generic-description text is still rejected and produces blank NAME.
    //   3. Blank — when no product identity can be detected.
    // descRaw is still used directly for worn Signal D below, independent of this filter.
    const nameDesc = (typeRaw && nameRaw && !STATUS_DESC_RE.test(nameRaw.trim()))
      ? nameRaw
      : isLikelyProductIdentityFallback(descRaw.trim())
        ? descRaw.trim()
        : '';

    const category  = get('category');
    const weightRaw = get('weight');
    const unitRaw   = get('unit');
    const expendRaw = get('expendable');

    // 024O: read quantity; default to 1 when absent, blank, or non-numeric
    const qtyRaw = get('qty');
    const qty    = Math.max(1, parseInt(qtyRaw, 10) || 1);

    // 024P: detect explicit worn signals from the CSV source.
    // Signal A: dedicated Worn column (TRUE / Yes / 1)
    // Signal B: Status column with value "worn" / "WORN"
    //   (both map to the 'worn' field via CSV_COL_ALIASES)
    // Signal C: Subcategory column matches a Clothing Worn alias
    // Signal D: Description/notes begins with "Worn" (tight: "Worn item", "Worn while hiking")
    const wornRaw   = get('worn');      // covers Worn and Status columns via alias
    const subcatRaw = get('subcategory');
    const isExplicitlyWorn =
      parseCsvBool(wornRaw) === true ||
      /^worn$/i.test(wornRaw.trim()) ||
      CLOTHING_WORN_SECTION_ALIASES.has(norm(subcatRaw)) ||
      /^worn\b/i.test(descRaw.trim()); // 024R: use descRaw directly (nameDesc may be filtered out)
    // Only apply worn routing for items recognised as apparel/footwear/headwear.
    // CLOTHING_TYPES covers specific gear names; APPAREL_WORD_RE catches generic
    // terms (e.g. "Hiking Shirt") not individually enumerated in that set.
    const isClothingType = CLOTHING_TYPES.has(norm(typeRaw)) || APPAREL_WORD_RE.test(typeRaw);

    let weightOz = 0;
    let warning  = false;
    let warningMsg: string | undefined;

    if (weightRaw) {
      // 024O: use tabular weight parser to handle compound "X lb Y oz" forms
      const parsed = parseTabularWeight(weightRaw, unitRaw);
      weightOz  = parsed.oz;
      warning   = parsed.warning;
      if (warning) warningMsg = `Unusual weight value: "${weightRaw}"`;
    }

    const expendable = parseCsvBool(expendRaw) ?? false;

    // 024E fix A: preserve the CSV "Type" column as the item's sub/type field.
    // 024E fix B: when Expendable=true, override destination to 'Consumables'.
    // 024P fix:   when item is explicitly worn AND recognised apparel, route to 'Clothing Worn'.
    //   applyGearClassification Priority 2 (CLOTHING_TYPES) is patched to honour this.
    // 024S fix:   vague/umbrella source-group labels are treated as WEAK hints.
    //   Clear them before passing to applyGearClassification so that type-based
    //   Priorities 1–6d can fire and route the item to its normal destination.
    //   Unknown items (no priority matches) will then have undefined destination
    //   rather than the vague group — they are preserved safely for user review.
    const effectiveCategory = WEAK_SOURCE_GROUPS.has(norm(category)) ? '' : category;
    const effectiveDestination = expendable
      ? 'Consumables'
      : (isExplicitlyWorn && isClothingType)
        ? 'Clothing Worn'
        : (effectiveCategory || undefined);

    items.push(applyGearClassification({
      // 024R: when no 'type' column exists, nameRaw serves as the item identity (sub)
      sub:         (typeRaw || nameRaw).slice(0, 60),
      desc:        nameDesc.slice(0, 200), // 024R: filtered product-name value
      weightOz,
      warning,
      warningMsg,
      destination: effectiveDestination,
      expendable,
      qty,
    }));
  }

  return items;
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
      // Hard timeout prevents the request from hanging indefinitely if pdfjs-dist
      // workers stall on a particular PDF structure (which would cause Vite's proxy
      // to return a 502 with an HTML body rather than JSON).
      const PDF_PARSE_TIMEOUT_MS = 30_000;

      const inst = new PDFParse({ data: buffer, verbosity: 0 });
      try {
        const result = await Promise.race<{ pages: { text: string }[] }>([
          inst.getText(),
          new Promise<never>((_, rej) =>
            setTimeout(
              () => rej(Object.assign(new Error('PDF_TIMEOUT'), { code: 'PDF_TIMEOUT' })),
              PDF_PARSE_TIMEOUT_MS,
            ),
          ),
        ]);

        // Detect image-only / scanned PDFs: pdfjs returns no text
        const allText = result.pages.map((p) => p.text).join('\n').trim();
        if (!allText) {
          res.status(422).json({
            error: 'No readable text was found in this PDF. Scanned-image PDFs are not currently supported.',
            code: 'image_only_pdf',
          });
          return;
        }

        // Use the structured TrailWeigh PDF parser (page-aware, category-aware).
        // Falls back to the generic text heuristic only if nothing was found,
        // e.g. a plain-text PDF without the TrailWeigh checkbox row format.
        items = extractFromPdfPages(result.pages);
        if (items.length === 0) {
          items = extractFromText(allText);
        }
      } catch (pdfErr: any) {
        console.error('[import-gear] pdf-parse error:', pdfErr?.message);
        if (pdfErr?.code === 'PDF_TIMEOUT') {
          res.status(422).json({
            error: 'PDF processing timed out. The file may be too complex or too large to process.',
            code: 'pdf_timeout',
          });
        } else if (/password/i.test(pdfErr?.message ?? '')) {
          res.status(422).json({
            error: 'This PDF is password-protected. Please remove the password and try again.',
            code: 'pdf_password_protected',
          });
        } else {
          res.status(422).json({
            error: 'Could not read this PDF. Make sure it is not password-protected and contains selectable text.',
            code: 'pdf_parse_error',
          });
        }
        return;
      } finally {
        // Always release pdfjs-dist worker resources regardless of success/failure
        try { inst.destroy?.(); } catch (_) { /* ignore cleanup errors */ }
      }

    } else if (ext === 'docx' || ext === 'doc' || mimetype?.includes('wordprocessingml')) {
      const result = await mammoth.extractRawText({ buffer });
      items = extractFromText(result.value);

    } else if (['xlsx', 'xls', 'numbers'].includes(ext)) {
      const wb = XLSX.read(buffer, { type: 'buffer' });
      items = extractFromWorkbook(wb);

    } else if (ext === 'csv' || mimetype === 'text/csv' || mimetype === 'application/csv') {
      try {
        items = parseCsvItems(buffer);
      } catch (csvErr: any) {
        res.status(csvErr.statusCode ?? 422).json({
          error: csvErr.message ?? 'Could not parse this CSV file.',
          code:  csvErr.code  ?? 'csv_parse_error',
        });
        return;
      }

    } else {
      res.status(400).json({
        error: `Unsupported file type: .${ext}. Accepted formats: PDF, Word (.docx), Excel (.xlsx), Numbers, or CSV.`,
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
