# PRE_020_MASTER_BACKUP

Generated before any Prompt 020 changes.
Starting state: Prompt 019 = USER-TESTED PASS.
All prior working TrailWeigh features protected.

## Files to be Changed

### 1. artifacts/pack-checklist/src/pages/Checklist.tsx — handleNew (lines 528–566)

```typescript
  const handleNew = useCallback(() => {
    // Opening a new tab creates a separate unsaved file — detach from the
    // current Locker entry so this tab's Save button starts a fresh workflow.
    writeActiveLockerFileToSS(null);
    setActiveLockerFile(null);
    const uuid = crypto.randomUUID();

    // 1. Deep-clone the complete store — same structure that Save writes to Locker.
    //    JSON round-trip guarantees no shared object references with the original.
    const clonedStore: typeof store = JSON.parse(JSON.stringify(store));

    // 2. Traverse every copied item and set checked: false.
    //    We iterate store.order (not a separate categoryOrder ref) so the loop
    //    always uses the cloned object's own key list.
    for (const cat of clonedStore.order) {
      const items = clonedStore.items[cat];
      if (Array.isArray(items)) {
        clonedStore.items[cat] = items.map((item) => ({ ...item, checked: false }));
      }
    }

    // 3. Write gear data newseed.
    localStorage.setItem(`tw-newseed-${uuid}`, JSON.stringify({ __v: 5, ...clonedStore }));

    // 4. Write background settings alongside so the new tab opens with the same
    //    background, fill/fit mode, tone, and fade as the current tab.
    //    chartPaletteKey is bundled here so the new tab inherits the same
    //    Weight Distribution palette as the source file.
    localStorage.setItem(`tw-newseed-bg-${uuid}`, JSON.stringify({
      background: background ?? null,
      bgFade,
      bgTone,
      bgSize,
      chartPaletteKey,
    }));

    const base = (import.meta.env.BASE_URL as string).replace(/\/$/, '');
    window.open(`${window.location.origin}${base}/checklist?newseed=${uuid}`, '_blank');
  }, [store, background, bgFade, bgTone, bgSize]);
```

### 2. artifacts/pack-checklist/src/hooks/usePackData.ts — parseV5 (lines 211–237)

```typescript
function parseV5(p: any): Store | null {
  if (!p || p.__v !== 5 || !Array.isArray(p.order)) return null;

  // Step 1: Remove duplicate alias categories created by previous migrations
  // (e.g. both 'Shelter' and 'Shelter System' → keep only 'Shelter System').
  const deduped = deduplicateCategoryAliases({
    items: p.items ?? {},
    order: p.order,
    meta:  p.meta  ?? {},
  });

  // Step 2: Forward-migrate — alias-aware, so 'Shelter' is not re-inserted
  // when 'Shelter System' is already present.
  const order: string[] = mergeDefaultCategories(deduped.order);
  const items: PackState = {};
  order.forEach(cat => { items[cat] = sanitizeItems(deduped.items?.[cat], cat); });
  const meta: Record<string, CategoryMeta> = {};
  order.forEach(cat => {
    const m = deduped.meta?.[cat];
    meta[cat] = {
      countsToBase: m?.countsToBase ?? !DEFAULT_EXCLUDES_BASE.has(cat),
      subLabel:  m?.subLabel  ?? undefined,
      descLabel: m?.descLabel ?? undefined,
    };
  });
  return { items, order, meta };
}
```

## Root Cause of "New" Bug

`handleNew()` clones the full current store (all categories + items, `checked` set to false).
The new tab therefore opens with all categories from the current file.

Additionally, `parseV5()` calls `mergeDefaultCategories()` unconditionally — this would re-insert
all 13 DEFAULT_CATEGORY_ORDER entries even if an empty `order: []` were written to the newseed.
Both layers must be fixed together.

## Fix (Prompt 020)

**handleNew()**: Write an empty store bundle (`{ __v: 5, __blank: true, items: {}, order: [], meta: {} }`)
instead of cloning the current store. Background bundle unchanged.

**parseV5()**: When `p.__blank === true`, skip `mergeDefaultCategories` so the empty order is preserved.
The flag is only present in the newseed; it is not written to persistent storage.

## State of Test Chain (before 020)

961 passed / 0 failed
