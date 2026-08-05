/**
 * Shared category-alias utilities used by both the import review table and the
 * final import callback so the two cannot disagree about which category a
 * destination resolves to.
 */

/**
 * Normalise a category name for comparison:
 *   - trim leading/trailing whitespace
 *   - collapse internal runs of whitespace to a single space
 *   - lowercase for case-insensitive checks
 */
export function normCat(s: string): string {
  return s.trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Maps canonical role names to all accepted aliases (including the canonical
 * name itself).  Used for resolving imported destination names to the user's
 * actual category names regardless of what they called the tab.
 *
 * Rules:
 *   - The first entry in each array is the default/canonical name.
 *   - All entries are compared case-insensitively and whitespace-normalised.
 *   - Aliases must not appear in more than one group.
 */
export const CATEGORY_ROLE_ALIASES: Record<string, string[]> = {
  Shelter:           ['Shelter', 'Shelter System', 'Tent System', 'Tarp System',
                      'Hammock System', 'Camp Shelter'],
  Sleep:             ['Sleep', 'Sleep System', 'Sleeping System', 'Sleeping Gear',
                      'Sleep Gear', 'Bedding'],
  Consumables:       ['Consumables', 'Expendables', 'Consumable Weight', 'Expendable Weight',
                      'Trip Consumables', 'Used Up Items', 'Used-Up Items', 'Perishables',
                      'Food and Fuel', 'Consumable', 'Expendable'],
  Backpack:          ['Backpack', 'Pack'],
  Kitchen:           ['Kitchen', 'Kitchen Gear', 'Kitchen System', 'Cooking',
                      'Cooking System', 'Cook System', 'Cook Gear'],
  Hydration:         ['Hydration', 'Water', 'Water System'],
  Electronics:       ['Electronics', 'Electronics System', 'Electronic Gear'],
  'Clothing Packed': ['Clothing Packed', 'Clothing', 'Clothing System', 'Packed Clothing'],
  'Clothing Worn':   ['Clothing Worn', 'Worn Clothing', 'Worn Items', 'Worn Weight', 'Worn'],
  'Dog Pack':        ['Dog Pack', 'Dog Gear', 'Pet Gear'],
  'Med Kit':         ['Med Kit', 'First Aid', 'First Aid Kit', 'Medical Kit'],
  'Repair Kit':      ['Repair Kit', 'Repair', 'Repair and Tools'],
  Toiletries:        ['Toiletries', 'Hygiene', 'Personal Care', 'Toiletry Kit'],
};

/**
 * Resolve an imported `destination` string to an actual category in the user's
 * current list.
 *
 * Strategy (in order):
 *   1. Exact match (after trimming)
 *   2. Case-insensitive + whitespace-normalised match against categoryOrder
 *   3. Alias lookup: find which alias group the destination belongs to, then
 *      scan those aliases (case-insensitively) against categoryOrder
 *
 * If no match is found we return the normalised destination as-is so the row
 * gets a validation error rather than silently landing in Backpack.  The user
 * can then pick the right category from the dropdown.
 */
export function resolveDestination(destination: string, categoryOrder: string[]): string {
  const norm = destination.trim().replace(/\s+/g, ' ');
  if (!norm) return categoryOrder[0] ?? '';

  // 1. Exact match
  if (categoryOrder.includes(norm)) return norm;

  // 2. Case-insensitive / whitespace-normalised match against the live list
  const normLower = normCat(norm);
  const ci = categoryOrder.find(c => normCat(c) === normLower);
  if (ci) return ci;

  // 3. Alias lookup — compare everything case-insensitively
  for (const aliases of Object.values(CATEGORY_ROLE_ALIASES)) {
    if (aliases.some(a => normCat(a) === normLower)) {
      for (const alias of aliases) {
        const match = categoryOrder.find(c => normCat(c) === normCat(alias));
        if (match) return match;
      }
    }
  }

  // No match — return the supplied value so the user can see and correct it.
  // Do NOT fall back to categoryOrder[0] (Backpack) for a non-empty destination.
  return norm;
}
