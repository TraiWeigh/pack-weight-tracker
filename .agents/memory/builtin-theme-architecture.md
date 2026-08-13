---
name: Built-in theme architecture
description: How the 5 permanent TrailWeigh themes are defined, stored, and resolved — after 026D repair.
---

# Built-in theme architecture (post-026D)

## Rule

ALL 5 permanent themes use `{ type: 'preset', id }` as the Background value. This is the only form that passes the ReviewPage guard (`bg?.type === 'preset'`). Custom-type backgrounds are discarded for privacy in Review/Share.

## Theme structure

Defined in `BackgroundPicker.tsx`:

```ts
export const BUILTIN_THEMES = [
  { id: 'landscapes',     label: 'Landscape',      presets: PRESETS              },
  { id: 'psychedelic',    label: 'Psychedelic',    presets: PSYCHEDELIC_PRESETS  },
  { id: 'retro-outdoors', label: 'Retro-Outdoors', presets: RETRO_PRESETS        },
  { id: 'topo',           label: 'Topo',           presets: TOPO_PRESETS         },
  { id: 'trails-us',      label: 'Trails US',      presets: TRAILS_PRESETS       },
];
```

Use `ALL_BUILTIN_PRESETS` (not `PRESETS`) for cross-theme ID resolution.

## Preset types

`BuiltinPreset` interface allows optional `photoId` (Unsplash) OR `photoPath` (static):

```ts
interface BuiltinPreset {
  id: string;
  label?: string;
  photoId?: string;   // Landscape (Unsplash)
  photoPath?: string; // 026D static assets
}
```

- **Landscape** (10 presets): `{ id, label, photoId }` → Unsplash via `getFullUrl(photoId)`
- **Psychedelic / Retro-Outdoors / Topo / Trails US** (10 presets each): `{ id, photoPath }` → Vite static asset at `/themes/<slug>/01.png`…`10.png`

## Static assets

Installed at `artifacts/pack-checklist/public/themes/`:
- `psychedelic/01.png`…`10.png` — exact recovered original PNGs (from `TrailWeigh-Original-Themes-Recovery-Package.zip`)
- `retro-outdoors/01.png`…`10.png`
- `topo/01.png`…`10.png`
- `trails-us/01.png`…`10.png`

Canonical preset IDs: `psychedelic-01`…`psychedelic-10`, `retro-outdoors-01`…`10`, `topo-01`…`10`, `trails-us-01`…`10`.

## URL resolution

```ts
getPresetFullUrl(preset) // → photoPath if present, else getFullUrl(photoId)
resolvePresetUrl(id)     // → looks up in ALL_BUILTIN_PRESETS, calls getPresetFullUrl
```

Checklist.tsx uses `resolvePresetUrl(background.id)` for the bgImageUrl.

## Duplicate suppression

Four original browser-local collections (same names as built-ins) are filtered from the dropdown by exact UUID (`SUPPRESSED_LEGACY_COLLECTION_IDS`). The underlying localStorage/IndexedDB data is NOT deleted.

Original collection UUIDs:
- Psychedelic: `d79067cd-baff-4945-ad0e-d0e9d76ecd77`
- Retro-Outdoors: `13ed57b7-c050-43b6-bd85-05a7c0fe102a`
- Topo: `0452da5c-3bbe-4255-994d-02065c67bbec`
- Trails US: `77d40288-102c-41e6-8927-184eb55b073d`

## Legacy photo ID compatibility (ReviewPage)

`LEGACY_PHOTO_ID_MAP` (40 entries) in `BackgroundPicker.tsx` maps original `photoId` UUIDs → canonical preset IDs. `ReviewPage.seedFromLiveFiles` uses this to normalize old `{ type:'custom', photoId }` saves from the original browser collections into `{ type:'preset', id }` so the correct static image is displayed in Review/Share.

**Why:** The four non-Landscape themes were originally stored as user custom collections (browser-local, `{ type:'custom', photoId }`). After 026D they are permanent built-ins (`{ type:'preset', id }`). Saved pack files created before 026D need the mapping to resolve correctly in Review.

## 026B warning (superseded)

026B introduced invented Unsplash photo IDs for these 4 themes. All 026B-invented arrays have been replaced by the static-path arrays above. Do not re-introduce Unsplash IDs for Psychedelic/Retro-Outdoors/Topo/Trails US.
