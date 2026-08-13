---
name: Built-in theme architecture — permanent theme parity
description: How the 5 permanent TrailWeigh background themes are structured so all of them work in Share/Review.
---

## Rule
Permanent built-in themes (Landscape, Psychedelic, Retro-Outdoors, Topo, Trails US) MUST be stored as `{ type: 'preset', id: 'stable-id' }`, not `{ type: 'custom', photoId }`. Only preset-type backgrounds pass through `ReviewPage.seedFromLiveFiles` (line 358: `if (bg?.type === 'preset')`).

**Why:** ReviewPage explicitly discards `type: 'custom'` backgrounds to prevent exposing owner-only IndexedDB blobs to reviewers. A custom-type background can only render in the owner's own browser — it cannot be forwarded to any viewer.

## How to apply
- All built-in theme photo grids call `onBackgroundChange({ type: 'preset', id: p.id })`.
- Custom user-uploaded themes continue to use `{ type: 'custom', photoId }` and correctly do NOT appear in Share/Review.
- New permanent themes belong in `BUILTIN_THEMES` in `BackgroundPicker.tsx`, not in user `collections`.

## Key symbols (BackgroundPicker.tsx)
- `BUILTIN_THEMES` — ordered registry of all 5 built-in themes, each with `{ id, label, presets[] }`.
- `ALL_BUILTIN_PRESETS` — flat array of every built-in preset across all themes. Export this for cross-theme preset resolution.
- `PRESETS` — still exported for backwards-compat; it is the Landscape presets array and is included in `ALL_BUILTIN_PRESETS`.

## Key symbol (Checklist.tsx)
- `bgImageUrl` resolver: `ALL_BUILTIN_PRESETS.find(p => p.id === background.id)?.photoId` — searches all 5 theme preset arrays.
- Do NOT use `PRESETS.find(...)` here — that only covers the 10 Landscape photos and will silently return empty for other themes.

## Unsplash photo IDs
- Each theme has 6 photos. Photo IDs were chosen to be thematically appropriate but should be user-verified in the browser (broken images show as empty thumbnails with no functional impact on the architecture).
- The photoId format is the Unsplash photo URL timestamp segment: `https://images.unsplash.com/photo-{photoId}?...`
